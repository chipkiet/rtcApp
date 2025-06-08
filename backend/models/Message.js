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
export async function getMessagesByRoomId(roomId, limit = 50, offset = 0) {
    const query = `
        SELECT 
            m.id,
            m.room_id,
            m.sender_id,
            m.content,
            m.created_at,
            m.updated_at,

            -- Thông tin sender

            JSON_BUILD_OBJECT(
                'id', u.id,
                'username', u.username,
                'user_type', u.user_type,
                'avatar', u.avatar
            ) as sender,

            -- Thông tin room

            JSON_BUILD_OBJECT(
                'id', cr.id,
                'display_name', cr.display_name,
                'room_type', cr.room_type
            ) as room_info
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        JOIN chat_rooms cr ON m.room_id = cr.id
        WHERE m.room_id = $1
        ORDER BY m.created_at ASC
        LIMIT $2 OFFSET $3;
    `;
    const result = await pool.query(query, [roomId, limit, offset]);
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
            JSON_BUILD_OBJECT(
                'id', u.id,
                'username', u.username,
                'user_type', u.user_type,
                'avatar', u.avatar
            ) as sender,
            JSON_BUILD_OBJECT(
                'id', cr.id,
                'display_name', cr.display_name
            ) as room_info
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        JOIN chat_rooms cr ON m.room_id = cr.id
        WHERE m.room_id = $1
        ORDER BY m.created_at DESC
        LIMIT 1;
    `;
    const result = await pool.query(query, [roomId]);
    return result.rows[0];
}


//Lấy tin nhắn theo id hoặc có thể highlight một tin nhắn cụ thể
export async function getMessageById(messageId) {
    const query = `
        SELECT 
            m.*,
            JSON_BUILD_OBJECT(
                'id', u.id,
                'username', u.username,
                'user_type', u.user_type,
                'avatar', u.avatar
            ) as sender,
            JSON_BUILD_OBJECT(
                'id', cr.id,
                'display_name', cr.display_name,
                'room_type', cr.room_type
            ) as room_info
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        JOIN chat_rooms cr ON m.room_id = cr.id
        WHERE m.id = $1;
    `;
    const result = await pool.query(query, [messageId]);
    return result.rows[0];
}


// Đếm số tin nhắn trong phòng(hiển thị tổng số tin nhắn, tính số trang)
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
            JSON_BUILD_OBJECT(
                'id', cr.id,
                'display_name', cr.display_name,
                'owner_id', cr.owner_id
            ) as room_info
        FROM messages m
        JOIN chat_rooms cr ON m.room_id = cr.id
        WHERE m.sender_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2;
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
}


// Lấy lịch sử chat giữa user và admin
export async function getChatHistory(roomId, limit = 100, beforeMessageId = null) {
    let query = `
        SELECT 
            m.id,
            m.content,
            m.created_at,
            JSON_BUILD_OBJECT(
                'id', u.id,
                'username', u.username,
                'user_type', u.user_type,
                'avatar', u.avatar
            ) as sender
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.room_id = $1
    `;
    
    const params = [roomId];
    
    if (beforeMessageId) {
        query += ` AND m.id < $${params.length + 1}`;
        params.push(beforeMessageId);
    }
    
    query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await pool.query(query, params);
    return result.rows.reverse(); // Reverse để có thứ tự thời gian tăng dần
}

// Xóa tin nhắn (soft delete)
export async function deleteMessage(messageId, deletedBy) {
    const query = `
        UPDATE messages 
        SET deleted_at = NOW(), deleted_by = $2
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *
    `;
    
    const result = await pool.query(query, [messageId, deletedBy]);
    return result.rows[0];
}
// Tìm kiếm tin nhắn trong room
export async function searchMessagesInRoom(roomId, searchTerm, limit = 20) {
    const query = `
        SELECT 
            m.id,
            m.content,
            m.created_at,
            JSON_BUILD_OBJECT(
                'id', u.id,
                'username', u.username,
                'user_type', u.user_type,
                'avatar', u.avatar
            ) as sender
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.room_id = $1 
        AND m.deleted_at IS NULL
        AND m.content ILIKE $2
        ORDER BY m.created_at DESC
        LIMIT $3
    `;
    
    const result = await pool.query(query, [roomId, `%${searchTerm}%`, limit]);
    return result.rows;
}