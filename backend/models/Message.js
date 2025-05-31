import pool from "../config/database.js";


//Tạo tin nhắn mới :
export async function createMessage({ room_id, sender_id, content }) {
    const query = `
        INSERT INTO messages (room_id, sender_id, content, created_at) 
        VALUES ($1, $2, $3, NOW())
        RETURNING *;
    `;
    const values = [room_id, sender_id, content];
    const result = await pool.query(query, values);
    return result.rows[0];
}

//Lưu tất cả tin nhắn của 1 phòng với thông tin sender :
export async function getRoomMessages(roomId, limit = 50) {
    const query = `
        SELECT 
            m.id,
            m.room_id,
            m.sender_id,
            m.content,
            m.created_at,
            u.username as sender_username,
            u.user_type as sender_user_type,
            u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.room_id = $1
        ORDER BY m.created_at ASC
        LIMIT $2;
    `;
    const result = await pool.query(query, [roomId, limit]);
    return result.rows;
}

//Lấy tin nhắn cuối cùng của phòng :
export async function getLastRoomMessage(roomId) {
    const query = `
        SELECT 
            m.id,
            m.room_id,
            m.sender_id,
            m.content,
            m.created_at,
            u.username as sender_username,
            u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.room_id = $1
        ORDER BY m.created_at DESC
        LIMIT 1;
    `;
    const result = await pool.query(query, [roomId]);
    return result.rows[0];
}

//Lấy tin nhắn theo id : 
export async function getMessageById(messageId) {
    const query = `
        SELECT 
            m.*,
            u.username as sender_username,
            u.user_type as sender_user_type,
            u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = $1;
    `;
    const result = await pool.query(query, [messageId]);
    return result.rows[0];
}

// Đếm số tin nhắn trong phòng
export async function countRoomMessages(roomId) {
    const query = `SELECT COUNT(*) as total FROM messages WHERE room_id = $1`;
    const result = await pool.query(query, [roomId]);
    return parseInt(result.rows[0].total);
}

// Lấy tin nhắn mới nhất của user (có thể dùng để track activity)
export async function getUserLatestMessages(userId, limit = 10) {
    const query = `
        SELECT 
            m.*,
            cr.user_id as room_owner_id
        FROM messages m
        JOIN chat_rooms cr ON m.room_id = cr.id
        WHERE m.sender_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2;
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
}