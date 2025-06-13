// server.js (Redis-enhanced version using your updated structure)

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';
import { createClient } from 'redis';

import * as userModel from './models/User.js';
import * as chatRoomModel from './models/ChatRoom.js';
import * as messageModel from './models/Message.js';
import { Socket } from 'dgram';
import socket from '../fe-admin/src/socket/socket.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
cors: {
origin: [
"http://localhost:5173",
"http://localhost:5174"
],
methods: ["GET", "POST"]
}
});

const redisClient = createClient();
await redisClient.connect();

app.use(cors({
origin: [
"http://localhost:5173",
"http://localhost:5174"
]
}));
app.use(express.json());

io.on('connection', (socket) => {
console.log('User connected:', socket.id);
socket.on('authenticate', async (data) => {
    try {
        const { username, email, user_type } = data;
        if (!username || !email) {
            socket.emit('authentication_error', { message: 'Username và email là bắt buộc' });
            return;
        }

        let user = await userModel.getUserByEmail(email);
        if (!user) {
            user = await userModel.createUser({
                username: username.trim(),
                email: email.trim(),
                user_type: user_type || 'user'
            });
            console.log('Created new user:', user);
        } else {
            user = await userModel.updateLastSeen(user.id);
            console.log('Updated existing user:', user);
        }

        socket.userId = user.id;
        socket.userData = user;

        await redisClient.set(`online:${user.id}`, JSON.stringify({
            socketId: socket.id,
            userData: user
        }));

        const room = await chatRoomModel.getOrCreateChatRoomForUser(user.id);
        socket.join(`room_${room.id}`);

        socket.emit('user_authenticated', {
            user,
            room: {
                id: room.id,
                name: room.name,
                display_name: room.display_name,
                room_type: room.room_type,
                owner_info: room.owner_info
            }
        });

        await broadcastOnlineUsers();

        if (user.user_type === 'admin') {
            await sendAdminChatRooms(socket);
            broadcastToAdmins('new_user_online', { user, room });
        }

        console.log(`User ${user.username} authenticated successfully`);

    } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('authentication_error', { message: 'Lỗi xác thực: ' + error.message });
    }
});

socket.on('send_message', async (data) => {
    try {
        const { roomId, content } = data;
        const userId = socket.userId;

        if (!userId) {
            socket.emit('error', { message: 'Bạn chưa đăng nhập' });
            return;
        }

        const isMember = await chatRoomModel.isUserMemberOfRoom(userId, roomId);
        if (!isMember) {
            socket.emit('error', { message: 'Bạn không có quyền gửi tin nhắn trong phòng này' });
            return;
        }

        const message = await messageModel.createMessage({
            room_id: roomId,
            sender_id: userId,
            content: content.trim()
        });

        await chatRoomModel.updateRoomActivity(roomId);
        const fullMessage = await messageModel.getMessageById(message.id);

        const messageToSend = {
            id: fullMessage.id,
            room_id: fullMessage.room_id,
            sender_id: fullMessage.sender_id,
            content: fullMessage.content,
            created_at: fullMessage.created_at,
            sender_username: fullMessage.sender?.username || 'Unknown',
            sender_user_type: fullMessage.sender?.user_type || 'user',
            sender: fullMessage.sender
        };

        io.to(`room_${roomId}`).emit('new_message', messageToSend);
        broadcastAdminChatRoomsUpdate();

    } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Lỗi gửi tin nhắn: ' + error.message });
    }
});

socket.on('admin_join_room', async (data) => {
    try {
        const { roomId } = data;
        const userId = socket.userId;

        if (!userId) {
            socket.emit('error', { message: 'Bạn chưa đăng nhập' });
            return;
        }

        const user = socket.userData;
        if (user.user_type !== 'admin') {
            socket.emit('error', { message: 'Bạn không có quyền admin' });
            return;
        }

        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
            if (room.startsWith('room_') && room !== `room_${roomId}`) {
                socket.leave(room);
            }
        });

        socket.join(`room_${roomId}`);

        const room = await chatRoomModel.getRoomById(roomId);
        const messages = await messageModel.getMessagesByRoomId(roomId);

        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            room_id: msg.room_id,
            sender_id: msg.sender_id,
            content: msg.content,
            created_at: msg.created_at,
            sender_username: msg.sender?.username || 'Unknown',
            sender_user_type: msg.sender?.user_type || 'user',
            sender: msg.sender
        }));

        socket.emit('room_joined', { room, messages: formattedMessages });
        console.log(`Admin ${user.username} joined room ${roomId}, got ${formattedMessages.length} messages`);

    } catch (error) {
        console.error('Admin join room error:', error);
        socket.emit('error', { message: 'Lỗi tham gia phòng: ' + error.message });
    }
});

socket.on('admin_leave_room', (data) => {
    const { roomId } = data;
    socket.leave(`room_${roomId}`);
    console.log(`Admin left room ${roomId}`);
});

socket.on('disconnect', async () => {
    const userId = socket.userId;
    if (userId) {
        await redisClient.del(`online:${userId}`);
        await broadcastOnlineUsers();
        console.log(`User ${userId} disconnected`);
    }
});
});

async function broadcastOnlineUsers() {
const keys = await redisClient.keys('online:*');
const users = [];
for (const key of keys) {
const data = await redisClient.get(key);
if (data) {
try {
const parsed = JSON.parse(data);
users.push({
id: parsed.userData.id,
username: parsed.userData.username,
user_type: parsed.userData.user_type,
last_seen_at: parsed.userData.last_seen_at
});
} catch (err) {
console.warn('Could not parse data for key ${key}:, err');
}
}
}
io.emit('online_users_update', users);
}

async function sendAdminChatRooms(socket) {
try {
const rooms = await chatRoomModel.getAllChatRoomsForAdmin();
socket.emit('chat_rooms_update', rooms);
} catch (error) {
console.error('Error sending chat rooms:', error);
}
}

async function broadcastAdminChatRoomsUpdate() {
try {
const rooms = await chatRoomModel.getAllChatRoomsForAdmin();
const keys = await redisClient.keys('online:*');
for (const key of keys) {
const data = await redisClient.get(key);
if (data) {
const userInfo = JSON.parse(data);
if (userInfo.userData.user_type === 'admin') {
io.to(userInfo.socketId).emit('chat_rooms_update', rooms);
}
}
}
} catch (error) {
console.error('Error broadcasting chat rooms update:', error);
}
}

function broadcastToAdmins(event, data) {
redisClient.keys('online:*').then(async (keys) => {
for (const key of keys) {
const info = await redisClient.get(key);
if (info) {
const userInfo = JSON.parse(info);
if (userInfo.userData.user_type === 'admin') {
io.to(userInfo.socketId).emit(event, data);
}
}
}
});
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
console.log('Server running on port ${PORT}');
console.log('Frontend should connect to: http://localhost:${PORT}');
});