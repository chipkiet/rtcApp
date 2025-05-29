import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {Pool} = pkg;
const app = express();
const server = createServer(app);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

pool.connect((err, client, release) => {
    if(err) {
        console.error('Error connecting to database: ', err);
    }else {
        console.log('Connected to PostgreSql database');
        release();
    }
})

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
const activeUsers = {};    // socket : {username, userType, status}
const userSockets = {};    // userId: socketId

const dbHelpers = {

    //tao hoac lay user
    async createOrGetUser(username, userType, email = null) {
        try {

            // kiem tra thu xem user da ton tai hay chua ? 
              let result = await pool.query(
                    `SELECT * from users where username = $1`,
                    [username]
              );

              if(result.rows.length > 0) {
                //update  online status 
                await pool.query(
                    `update users set is_online = true, last_seen = current_timestamp where id = $1`,
                    [result.rows[0].id]
                );
                return result.rows[0];
              }

              //tao user moi neu chua co 
              result = await pool.query(
                    `insert into users (username, user_type, email, is_online) values ($1, $2, $3, true) returning *`,
                    [username, userType, email]
              );
            return result.rows[0];
        } catch (error) {
            console.log('Error creating/getting user : ', error);
            throw error;
        }
    },

    // tao hoac lay chatroom giua customer va seller
    async createOrGetChatroom(customerId, sellerId) {
        try {
            //kiem tra xem phong da ton tai hay chua ? 
            let result = await pool.query(
                `Select * from chat_rooms where customer_id = $1 and seller_id = $2 and status = $3`,
                [customerId, sellerId, 'active']
            );
            return result.rows[0];
        }catch(error) {
            console.log('Error creating/getting chat room: ', error);
            throw error;
        }
    },

    //lay lich su doan chat
    async getChatHistory(roomId) {
        try {
            const result= await pool.query(
                `select m.*, u.username as sender_name
                 from messages m
                 join users u on m.sender_id = u.id
                 where m.room_id = $1
                 order by m.created_at asc
                 limit 50
                `
            , [roomId]);
            return result.rows;
        }catch (error) {
            console.error("Error getting chat history: ", error);
            throw error;
        }
    }, 

    //luu tin nhan doan chat
    async saveMessage(roomId, senderId, messageText, messageType = 'text') {
        try{ 
            const result = await pool.query(
                'insert into messages (room_id, sender_id, message_text, message_type) values ($1, $2, $3, $4) returning *',
                [roomId, senderId, messageText, messageType]
            );
            return result.rows[0];
        }catch(error) {
            console.log('Error saving message : ', error);
            throw error;
        }
    }
}

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

