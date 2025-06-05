import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';

import * as userModel from './models/User.js';
import * as chatRoomModel from './models/chatRoom.js';
import * as messageModel from './models/Message.js';
import { Socket } from 'dgram';

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

            //neu user da ton tai email
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
                //cap nhat lai lan xem cuoi cung 
                user = await userModel.updateLastSeen(user.id);
                console.log('Updated existing user:', user);
            }

            socket.userId = user.id;
            socket.userData = user;

            onlineUsers.set(user.id, {
                socketId: socket.id,
                userData: user
            });
            userSockets.set(socket.id, user.id);

            //gui respond thanh cong 
            socket.emit('user_authenticated', user);

            //phat song cap nhat nguoi dung truc tuyen
            broadcastOnlineUsers();

            //gui phong tro chuyen cho user neu la quan tri vien
            if (user.user_type === 'admin') {
                await sendAdminChatRooms(socket);
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
});

function broadcastOnlineUsers() {
    const users = Array.from(onlineUsers.values()).map(user => ({
        id: user.userData.id,
        username: user.userData.username,
        user_type: user.userData.user_type
    }));

    io.emit('online_users_update', users);
}

async function sendAdminChatRooms(socket) {
    try {
        const rooms = await chatRoomModel.getAllChatRooms();
        socket.emit('chat_rooms_update', rooms);
    } catch (error) {
        console.error('Error sending chat rooms:', error);
    }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend should connect to: http://localhost:${PORT}`);
});