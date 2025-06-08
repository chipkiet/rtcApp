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

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174"
    ]
}));
app.use(express.json());

const onlineUsers = new Map(); // userId -> {socketId, userData}
const userSockets = new Map(); //socket ==> userId
const roomSockets = new Map(); // roomId => set of sockets
 
// ket noi toi socket
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    //1 Authentication dang nhap ... 
    socket.on('authenticate', async (data) => {
        try {
            const { username, email, user_type } = data;

            // validation input
            if (!username || !email) {
                socket.emit('authentication_error', { 
                    message: 'Username và email là bắt buộc' 
                });
                return;
            }

            //Kiểm tra user đã tồn tại chưa bằng email
            let user = await userModel.getUserByEmail(email);

            if(!user ) {

                //tạo user mới
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

            //cập nhật danh sách online users
            onlineUsers.set(user.id, {
                socketId: socket.id,
                userData: user
            });
            userSockets.set(socket.id, user.id);

            //tìm hoặc tạo phòng chat cho user
            const room = await chatRoomModel.getOrCreateChatRoomForUser(user.id);
            
            socket.join(`room_${room.id}`);
            console.log(`User ${user.username} joined room: room_${room.id}`);
            

            if(!roomSockets.has(room.id)) {
                roomSockets.set(room.id, new Set());
            }

            roomSockets.get(room.id).add(socket.id);

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

            broadcastOnlineUsers();

            //Gửi danh sách cuộc trò chuyện cho admin
            if (user.user_type === 'admin') {
                await sendAdminChatRooms(socket);

                //thông báo cho các user mới về user mới online
                broadcastToAdmins('new_user_online', {
                    user: user,
                    room: room
                });
            }

            console.log(`User ${user.username} authenticated successfully`);

        }
        catch (error) {
            console.error('Authentication error:', error);
            socket.emit('authentication_error', { 
                message: 'Lỗi xác thực: ' + error.message 
            });
        }
    })


    //Logic gửi tin nhắn :
    socket.on('send_message', async (data) => {
        try {
            const {roomId, content} = data;
            const userId = socket.userId;

            console.log('Send message request:', { roomId, content, userId });


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
            console.log('Full message with sender info:', fullMessage);

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
            console.log(`Message sent in room ${roomId} by user ${userId}`);

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
                    const oldRoomId = room.replace('room_', '');
                    if(roomSockets.has(parseInt(oldRoomId))) {
                        roomSockets.get(parseInt(oldRoomId)).delete(socket.id);
                    }
                }
            })

            //join vao phong
            socket.join(`room_${roomId}`);

            if (!roomSockets.has(roomId)) {
                roomSockets.set(roomId, new Set());
            }
            roomSockets.get(roomId).add(socket.id);

            // Lấy thông tin phòng và tin nhắn
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

            socket.emit('room_joined', {
                room: room,
                messages: formattedMessages
            });

            console.log(`Admin ${user.username} joined room ${roomId}, got ${formattedMessages.length} messages`);

        }catch (error) {
                console.error('Admin join room error:', error);
                socket.emit('error', { message: 'Lỗi tham gia phòng: ' + error.message });
            }

    });

    // Admin leave room
    socket.on('admin_leave_room', (data) => {
        const { roomId } = data;
        socket.leave(`room_${roomId}`);
        
        if (roomSockets.has(roomId)) {
            roomSockets.get(roomId).delete(socket.id);
        }
        
        console.log(`Admin left room ${roomId}`);
    });

    // Xử lý disconnect
    socket.on('disconnect', () => {
        const userId = userSockets.get(socket.id);
        
        if (userId) {
            // Xóa khỏi online users
            onlineUsers.delete(userId);
            userSockets.delete(socket.id);
            
            // Xóa khỏi room sockets
            roomSockets.forEach((sockets, roomId) => {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    roomSockets.delete(roomId);
                }
            });
            
            // Broadcast online users update
            broadcastOnlineUsers();
            
            console.log(`User ${userId} disconnected`);
        }
    });

});





/* Trong socket , broadcast được dùng để gửi một thông điệp (Event)
 từ socket đến nhiều client cùng lúc, thường là các client đang online */

//Broadcasr danh sách online users
function broadcastOnlineUsers() {
    const users = Array.from(onlineUsers.values()).map(user => ({
        id: user.userData.id,
        username: user.userData.username,
        user_type: user.userData.user_type,
        last_seen_at: user.userData.last_seen_at
    }));

    io.emit('online_users_update', users);
}

//Gửi lại danh sách phòng chat cho admin
async function sendAdminChatRooms(socket) {
    try {
        const rooms = await chatRoomModel.getAllChatRoomsForAdmin();
        socket.emit('chat_rooms_update', rooms);
    } catch (error) {
        console.error('Error sending chat rooms:', error);
    }
}

//Broadcast cập nhật danh sách phòng cho các admin
async function broadcastAdminChatRoomsUpdate() {
    try {
        const rooms = await chatRoomModel.getAllChatRoomsForAdmin();

        for(const [userId, userInfo] of onlineUsers) {
            if(userInfo.userData.user_type === 'admin') {
                io.to(userInfo.socketId).emit('chat_rooms_update', rooms);
            }
        }
    }catch(error) {
        console.error('Error broadcasting chat rooms update:', error);
    }
}

//User mới đăng ký, cảnh bảo hay message sẽ được sử dụng
function broadcastToAdmins(event, data) {
    for(const [userId, userInfo] of onlineUsers) {
        if(userInfo.userData.user_type === 'admin') {
            io.to(userInfo.socketId).emit(event, data);
        }
    }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend should connect to: http://localhost:${PORT}`);
});