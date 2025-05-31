import pool from "../config/database.js";
// Tạo mới 1 users
export async function createUser({ username, email, user_type }) {
    const query = `
        INSERT INTO users (username, email, user_type, created_at, updated_at, last_seen_at) 
        VALUES ($1, $2, $3, NOW(), NOW(), NOW())
        RETURNING *;
    `;
    const values = [username, email, user_type];
    const result = await pool.query(query, values);
    return result.rows[0];
}


// Tìm user theo ID
export async function getUserById(id) {
    const query = `SELECT * FROM users WHERE id = $1 LIMIT 1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
}


//Tìm user theo email, có thể sẽ cần trong tương lai:

export async function getUserByEmail(email) {
    const query = `SELECT * FROM users WHERE email = $1 LIMIT 1`;
    const result = await pool.query(query, [email]);
    return result.rows[0];
}

// Cập nhật lần xem cuối cùng
export async function updateLastSeen(userId) {
    const query = `
        UPDATE users 
        SET last_seen_at = NOW(), updated_at = NOW() 
        WHERE id = $1 
        RETURNING *;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
}

//Lấy tất cả các user: 
export async function getAllUsers() {
    const query = `
        SELECT id, username, email, user_type, avatar, created_at, updated_at, last_seen_at 
        FROM users 
        ORDER BY created_at DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
}

//Lấy các users đang online, dựa trên last_seen trong vòng 5 phút trở lại :

export async function getActiveUsers(minutesAgo = 5) {
    const query = `
        select id, username, email, user_type, avatar, last_seen_at 
        from users
        where last_seen_at >= now() - interval '${minutesAgo}minutes'
        ORDER BY last_seen_at DESC;
    `
    const result = await pool.query(query);
    return result.rows;
}
// Cập nhật avatar user
export async function updateUserAvatar(userId, avatarUrl) {
    const query = `
        UPDATE users 
        SET avatar = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING *;
    `;
    const result = await pool.query(query, [avatarUrl, userId]);
    return result.rows[0];
}