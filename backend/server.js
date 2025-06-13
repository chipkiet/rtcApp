import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';

import * as userModel from './models/User.js';
import * as chatRoomModel from './models/ChatRoom.js';
import * as messageModel from './models/Message.js';
import { Socket } from 'dgram';
import socket from '../fe-admin/src/socket/socket.js';
import { createClient } from 'redis';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin:[ 
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

// ket noi toi socket
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

            if(!user ) {
                user = await userModel.createUser({
                    username: username.trim(),
                    email: email.trim(),
                    user_type: user_type || 'user'
                });
                console.log('Created new user:', user);
            }
            else {
                // cập nhật lại lần xem cuối cùng 
                user = await userModel.updateLastSeen(user.id);
                console.log('Updated existing user:', user);
            }

            //lưu thông tin đăng nhập vào socket
            socket.userId = user.id;
            socket.userData = user;

            await redisClient.set(`online:${user.id}`, JSON.stringify({
                socketId: socket.id,
                userData: user
            }));

            const room = await chatRoomModel.getOrCreateChatRoomForUser(user.id);
            socket.join(`room_${room.id}`);

            //Xac thuc thanh cong
            socket.emit('user_authenticated', {
                user : user, 
                room : {
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
                broadcastToAdmins('new_user_online', {
                    user,
                    room
                });
            }
            console.log(`User ${user.username} authenticated successfully`);

        }
        catch (error) {
            console.error('Authentication error:', error);
            socket.emit('authentication_error', { message: 'Lỗi xác thực: ' + error.message });
        }
    })


    socket.on('send_message', async (data) => {
        try {
            const {roomId, content} = data;
            const userId = socket.userId;

            if(!userId) {
                socket.emit('error', {message: 'Bạn chưa đăng nhập'});
                return;
            }

            //Kiểm tra xem user này có phải là member của room không ?
            const isMember = await chatRoomModel.isUserMemberOfRoom(userId, roomId);
            if(!isMember) {
                socket.emit('error',{ message: 'Bạn không có quyền gửi tin nhắn trong phòng này' });
                return;
            }
            const message = await messageModel.createMessage({
                room_id: roomId,
                sender_id: userId,
                content: content.trim()
            });

            //cập nhật thời gian hoạt động của phòng 
            await chatRoomModel.updateRoomActivity(roomId);
            //Lấy thông tin tin nhắn đầy đủ  
            const fullMessage = await messageModel.getMessageById(message.id);

            const messageToSend = {
                id: fullMessage.id,
                room_id: fullMessage.room_id,
                sender_id: fullMessage.sender_id,
                content: fullMessage.content,
                created_at: fullMessage.created_at,
                sender_username : fullMessage.sender?.username || 'Unknown',
                sender_user_type : fullMessage.sender?.user_type || 'user',
                sender: fullMessage.sender
            }

            io.to(`room_${roomId}`).emit('new_message', messageToSend);
            broadcastAdminChatRoomsUpdate() ;
        }
        catch (error) {
            console.error('Send message error:', error);
            socket.emit('error', { message: 'Lỗi gửi tin nhắn: ' + error.message });
        }
    });

    socket.on('admin_join_room', async(data) => {
        try {
            const {roomId} = data;
            const userId = socket.userId;
            
            if(!userId) {
                socket.emit('error', {message: 'Bạn chưa đăng nhập'});
                return;
            }

            const user = socket.userData;
            if(user.user_type !== 'admin') {
                socket.emit('error', { message: 'Bạn không có quyền admin' });
                return;
            }

            const rooms = Array.from(socket.rooms);
            rooms.forEach(room => {
                if (room.startsWith('room_') && room !== `room_${roomId}`) {
                    socket.leave(room);
                }
            });

            //join vao phong
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

        }catch (error) {
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

/* Trong socket , broadcast được dùng để gửi một thông điệp (Event)
 từ socket đến nhiều client cùng lúc, thường là các client đang online */

//Broadcasr danh sách online users
async function broadcastOnlineUsers() {
    try {
        const keys = await redisClient.keys('online:*');
        const users = [];

        for (const key of keys) {
            const data = await redisClient.get(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    // Kiểm tra xem parsed có đúng cấu trúc không
                    if (parsed && parsed.userData && parsed.userData.id) {
                        users.push({
                            id: parsed.userData.id,
                            username: parsed.userData.username,
                            user_type: parsed.userData.user_type,
                            last_seen_at: parsed.userData.last_seen_at
                        });
                    } else {
                        console.warn(`Invalid data structure for key ${key}:`, data);
                        // Xóa key có dữ liệu không hợp lệ
                        await redisClient.del(key);
                    }
                } catch (parseError) {
                    console.error(`Error parsing JSON for key ${key}:`, parseError);
                    console.error(`Data content:`, data);
                    // Xóa key có dữ liệu corrupt
                    await redisClient.del(key);
                }
            }
        }
        io.emit('online_users_update', users);
    } catch (error) {
        console.error('Error in broadcastOnlineUsers:', error);
    }
}
//Gửi lại danh sách phòng chat cho admin
async function sendAdminChatRooms(socket) {
    try {
        const rooms = await chatRoomModel.getAllChatRoomsForAdmin();
        socket.emit('chat_rooms_update', rooms);
    } catch (error) {
        console.error('Error sending chat rooms:', error);
    }a
}

//Broadcast cập nhật danh sách phòng cho các admin
async function broadcastAdminChatRoomsUpdate() {
    try {
        const rooms = await chatRoomModel.getAllChatRoomsForAdmin();
        const keys = await redisClient.keys('online:*');
        for(const key of keys) {
            const data = await redisClient.get(key);
            if(data) {
                try {
                    const userInfo = JSON.parse(data);
                    if(userInfo && userInfo.userData && userInfo.userData.user_type === 'admin') {
                        io.to(userInfo.socketId).emit('chat_rooms_update', rooms);
                    }
                } catch (parseError) {
                    console.error(`Error parsing JSON for key ${key}:`, parseError);
                    await redisClient.del(key);
                }
            }
        }
    }catch(error) {
        console.error('Error broadcasting chat rooms update:', error);
    }
}
function broadcastToAdmins(event, data) {
    redisClient.keys('online:*').then(async (keys) => {
        for(const key of keys) {
            const info = await redisClient.get(key);
            if(info) {
                try {
                    const userInfo = JSON.parse(info);
                    if(userInfo && userInfo.userData && userInfo.userData.user_type === 'admin') {
                        io.to(userInfo.socketId).emit(event, data);
                    }
                } catch (parseError) {
                    console.error(`Error parsing JSON for key ${key}:`, parseError);
                    await redisClient.del(key);
                }
            }
        }
    }).catch(error => {
        console.error('Error in broadcastToAdmins:', error);
    });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend should connect to: http://localhost:${PORT}`);
});