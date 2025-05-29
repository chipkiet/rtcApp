import pool from "../config/database";

//tao tin nhan moi 
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
//lay tat ca tin nhna
export async function getRoomMessages(roomId, limit = 50) {
    const query = `
        SELECT 
            m.*,
            u.username as sender_username,
            u.user_type as sender_user_type
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.room_id = $1
        ORDER BY m.created_at ASC
        LIMIT $2;
    `;
    const result = await pool.query(query, [roomId, limit]);
    return result.rows;
}