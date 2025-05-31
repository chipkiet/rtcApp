import pool from "../config/database.js";


// Thêm member vào phòng
export async function addMemberToRoom({ user_id, room_id, role = 'member' }) {
    const query = `
        INSERT INTO members (user_id, room_id, joined_at, role) 
        VALUES ($1, $2, NOW(), $3)
        ON CONFLICT (user_id, room_id) DO UPDATE SET
            joined_at = NOW(),
            role = $3
        RETURNING *;
    `;
    const values = [user_id, room_id, role];
    const result = await pool.query(query, values);
    return result.rows[0];
}


// Lấy tất cả members của một phòng
export async function getRoomMembers(roomId) {
    const query = `
        SELECT 
            m.id,
            m.user_id,
            m.room_id,
            m.joined_at,
            m.role,
            m.last_seen_message_id,
            u.username,
            u.email,
            u.avatar,
            u.user_type,
            u.last_seen_at
        FROM members m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = $1
        ORDER BY m.joined_at ASC;
    `;
    const result = await pool.query(query, [roomId]);
    return result.rows;
}

// Lấy tất cả phòng của một user
export async function getUserRooms(userId) {
    const query = `
        SELECT 
            m.id as member_id,
            m.room_id,
            m.joined_at,
            m.role,
            m.last_seen_message_id,
            cr.user_id as room_owner_id,
            cr.created_at as room_created_at,
            u.username as room_owner_name
        FROM members m
        JOIN chat_rooms cr ON m.room_id = cr.id
        JOIN users u ON cr.user_id = u.id
        WHERE m.user_id = $1
        ORDER BY m.joined_at DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}


// Kiểm tra user có phải member của phòng không
export async function isUserMemberOfRoom(userId, roomId) {
    const query = `
        SELECT COUNT(*) as count 
        FROM members 
        WHERE user_id = $1 AND room_id = $2;
    `;
    const result = await pool.query(query, [userId, roomId]);
    return parseInt(result.rows[0].count) > 0;
}

// Xóa member khỏi phòng
export async function removeMemberFromRoom(userId, roomId) {
    const query = `
        DELETE FROM members 
        WHERE user_id = $1 AND room_id = $2 
        RETURNING *;
    `;
    const result = await pool.query(query, [userId, roomId]);
    return result.rows[0];
}

// Cập nhật last_seen_message_id cho member
export async function updateMemberLastSeenMessage(userId, roomId, messageId) {
    const query = `
        UPDATE members 
        SET last_seen_message_id = $1 
        WHERE user_id = $2 AND room_id = $3 
        RETURNING *;
    `;
    const result = await pool.query(query, [messageId, userId, roomId]);
    return result.rows[0];
}

// Cập nhật role của member
export async function updateMemberRole(userId, roomId, newRole) {
    const query = `
        UPDATE members 
        SET role = $1 
        WHERE user_id = $2 AND room_id = $3 
        RETURNING *;
    `;
    const result = await pool.query(query, [newRole, userId, roomId]);
    return result.rows[0];
}


// Lấy thông tin member cụ thể
export async function getMemberInfo(userId, roomId) {
    const query = `
        SELECT 
            m.*,
            u.username,
            u.email,
            u.avatar,
            u.user_type
        FROM members m
        JOIN users u ON m.user_id = u.id
        WHERE m.user_id = $1 AND m.room_id = $2;
    `;
    const result = await pool.query(query, [userId, roomId]);
    return result.rows[0];
}