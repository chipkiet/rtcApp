import pool from "../config/database";

// tao moi 1 user
export async function createUser({username, email, user_type = 'user', avatar}) {
    const query =  `
        INSERT INTO users (username, email, user_type, avatar, created_at, updated_at) 
        values ($1, $2, $3, NOW(), NOW())
        returning *;
    `;
    const values = [username, email, user_type, avatar];
    const result = await pool.query(query, values);
    return result.rows[0];
}

//lay user theo id 

export async function getUserById(id) {
    const query = `select * from users where id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
}

//lay user theo email (co the se can trong tuong lai)

export async function getUserByEmail(email) {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await pool.query(query, [email]);
    return result.rows[0];
}

// cap nhat trang thai last_seen_at 
export async function updateLastSeen(userId) {
    const query =  `
        update users set last_seen_at = now(), updated_at = now()
        where id = $1
        returning *;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
}
