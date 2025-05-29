import pool from "../config/database";

export async function findByUserId(userId) {
    const query = `select * from chat_rooms where user_id = $1 limit 1`;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
}

export async function create(userId) {
    const query = `
        insert into chat_rooms(user_id) 
        values ($1)
        returning *;
    `;
    const result = await pool.query(query, [userId])
    return  result.rows[0];
}

export async function findOrCreatme(userId) {
    const existing = await this.findByUserId(userId);
    if(existing) return existing;

    return await this.create(userId);
} 

export async function getUserChatRoom(userId) {
    const query = `
        select cr.*, u.username as user_name
        from chat_rooms cr
        join users u on cr.user_id = u.id
        where cd.user_id = $1 
    `;
    const result = await pool.query(query, [userId]);
}

export async function endRoom(roomid) {
    const query = `UPDATE chat_rooms SET status = 'ended' WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [roomId]);
    return result.rows[0];
}