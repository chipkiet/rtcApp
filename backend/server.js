import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);


// thiet lap cors cho socket.io

const io = new Server(server, {
    cors : {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

//middleware
app.use(cors());
app.use(express.json());

//noi luu tru use va messages, ve sau co the thay the bang database
const users = {};
const chatMessages = [];

//ket noi socket.io
io.on('connection', (socket) => {
    console.log(`User đã đăng nhập: ${socket.id} `);

    //xu ly khi user tham gia doan chat
    socket.on('user_join', (username) => {
        users[socket.id]= username;

        //luu thong bao tham gia
        const joinMessage = {
            id: Date.now(),
            sender: 'system',
            text: ` quý ngài ${username} đã tham gia phòng chat`,
            timestamp: new Date()
        };
        chatMessages.push(joinMessage);

        //socket - gui danh sach tin nhan hen tai cho client moi
        socket.emit('chat_history', chatMessages);

        //io - thong bao cho tat ca nguoi dung ve nguoi moi tham gia doan chat
        io.emit('user_joined', {message: joinMessage, users: Object.values(users)});
    });

    //xu ly khi nhan tin nhan tu client
    socket.on('send_message', (messageData) => {
        const newMessage = {
            id: Date.now(),
            sender: users[socket.id],
            text: messageData.text,
            timeStamp: new Date()
        };

        //luu tin nhan 
        chatMessages.push(newMessage);

        io.emit('received_message', newMessage);
    });

    //xu ly khi user dang nhap tin nhan .........
    socket.on('typing', () => {
        socket.broadcast.emit('user_typing', {username: users[socket.id]});
    });

    //xu ly khi user ngung nhap tin nhan (stop)
    socket.on('stop_typing', () => {
        socket.broadcast.emit('user_stop_typing');
    });

    // xu ly khi user ngat ket noi 
    socket.on('disconnect', () => {
        if(users[socket.id]) {
            const leaveMessage = {
                id: Date.now(),
                sender: 'system',
                text: `${users[socket.id]} đã rời khỏi phòng chat mất rồi anh em ơi !!!`,
                timestamp: new Date()
            };

            chatMessages.push(leaveMessage);
            //gui thong bao den tat ca moi nguoi
            io.emit('user_left', {message: leaveMessage, userId: socket.id});
            // xoa user
            delete users[socket.id];
        }
        console.log(`User đã ngắt kết nối rồi:  ${socket.id}`);
    });
});


// api routes nhe cac con vo 
app.get('/api/status', (req, res) => {
    res.json({status: 'Server đang chạy', users: Object.values(users).length});
});

//khoi dong server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running in ${PORT}`);
})

