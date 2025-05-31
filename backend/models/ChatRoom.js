import pool from "../config/database.js";

//Tìm phòng chat theo id user
export async function findByUserId(userId) {
    const query = `SELECT * FROM chat_rooms WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
}

//Tạo phòng chat mới :
export async function create(userId) {
    const query = `
        INSERT INTO chat_rooms(user_id, created_at, updated_at) 
        VALUES ($1, NOW(), NOW())
        RETURNING *;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
}

//Tìm hoặc tạo phòng chat 
export async function findOrCreate(userId) {
    const existing = await findByUserId(userId);
    if (existing) return existing;

    return await create(userId);
}
//Lấy thông tin phòng chat với thông tin user: 
export async function getUserChatRoom(userId) {
    const query = `
        SELECT 
            cr.*,
            u.username as user_name,
            u.email as user_email,
            u.avatar as user_avatar
        FROM chat_rooms cr
        JOIN users u ON cr.user_id = u.id
        WHERE cr.user_id = $1 
        ORDER BY cr.created_at DESC
        LIMIT 1;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
}

//Lấy phòng chat theo id 
export async function getRoomById(roomId) {
    const query = `
        SELECT 
            cr.*,
            u.username as user_name,
            u.email as user_email,
            u.avatar as user_avatar,
            u.user_type
        FROM chat_rooms cr
        JOIN users u ON cr.user_id = u.id
        WHERE cr.id = $1;
    `;
    const result = await pool.query(query, [roomId]);
    return result.rows[0];
}

//Cập nhật thời gian updated_at của phòng chat :
export async function updateRoomActivity(roomId) {
    const query = `
        UPDATE chat_rooms 
        SET updated_at = NOW() 
        WHERE id = $1 
        RETURNING *;
    `;
    const result = await pool.query(query, [roomId]);
    return result.rows[0];
}

//Lấy toàn bộ phòng chat (admin)
export async function getAllChatRooms() {
    const query = `
        SELECT 
            cr.id,
            cr.user_id,
            cr.created_at,
            cr.updated_at,
            u.username as user_name,
            u.email as user_email,
            u.avatar as user_avatar,
            u.user_type,
            (SELECT COUNT(*) FROM messages m WHERE m.room_id = cr.id) as message_count,
            (SELECT content FROM messages m WHERE m.room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM chat_rooms cr
        JOIN users u ON cr.user_id = u.id
        ORDER BY cr.updated_at DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
}