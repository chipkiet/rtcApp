import pool from "../config/database.js";

/* tạo 1 phòng chat mới cho user và mời các admin vào 
    không kiểm tra liệu phòng đã tồn tại hay chưa (luôn tạo mới khi được gọi)
*/

export async function createChatRoomForUser(userId) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Lấy thông tin user để tạo room name có ý nghĩa
        const userResult = await client.query(`
            SELECT username, email FROM users WHERE id = $1
        `, [userId]);
        
        const user = userResult.rows[0];
        if (!user) {
            throw new Error('User not found');
        }

        // Tạo room name có ý nghĩa hơn
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_');
        const roomName = `chat_${user.username}_${timestamp}`.toLowerCase();
        
        // Display name cho admin dễ đọc
        const displayName = `💬 ${user.username} - Support Chat`;

        const roomResult = await client.query(`
            INSERT INTO chat_rooms (display_name, room_type, owner_id, created_at, updated_at)
            VALUES($1, $2, $3, NOW(), NOW())
            RETURNING *
        `, [displayName, 'support', userId]);

        const room = roomResult.rows[0];

        // Get admin list (user_type = admin)
        const adminResult = await client.query(`
                SELECT id FROM users
                WHERE user_type = 'admin'
                ORDER BY created_at ASC
        `);

        // Tất cả các admin sẽ được thêm vào các phòng => ai cũng có thể nhắn
        for (const admin of adminResult.rows) {
            await client.query(`
                INSERT INTO members(user_id, room_id, joined_at, role)
                VALUES ($1, $2, NOW(), 'admin')
            `, [admin.id, room.id]);
        }
         
        // Add user to room
        await client.query(`
            INSERT INTO members (user_id, room_id, joined_at, role)
            VALUES($1, $2, NOW(), 'member')
        `, [userId, room.id]);

        await client.query('COMMIT');
        return room;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Truy vấn tất cả các phòng mà user đang tham gia 
// => trả về (nhiều) phòng mới nhất kèm danh sách member (user + admin)
export async function findChatRoomByUserId(userId) {
    const query = `
        SELECT 
            cr.*,

            -- Danh sách members (subquery)
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'user_id', m.user_id,
                        'username', u.username,
                        'email', u.email,
                        'avatar', u.avatar,
                        'user_type', u.user_type,
                        'role', m.role,
                        'joined_at', m.joined_at
                    )
                )
                FROM members m
                JOIN users u ON m.user_id = u.id
                WHERE m.room_id = cr.id
            ) AS members,

            -- Tin nhắn cuối cùng
            (
                SELECT JSON_BUILD_OBJECT(
                    'content', msg.content,
                    'created_at', msg.created_at,
                    'sender_username', sender.username,
                    'sender_user_type', sender.user_type
                )
                FROM messages msg 
                JOIN users sender ON msg.sender_id = sender.id
                WHERE msg.room_id = cr.id
                ORDER BY msg.created_at DESC
                LIMIT 1
            ) AS last_message

        FROM chat_rooms cr
        WHERE cr.id IN (
            SELECT room_id
            FROM members 
            WHERE user_id = $1
        )
        ORDER BY cr.updated_at DESC
        LIMIT 1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
}

/* kiểm tra xem user đã có phòng chưa, nếu có thì dùng lại phòng đó
    nếu chưa thì dùng createChatRoomForUser(userId) để tạo 
*/
export async function getOrCreateChatRoomForUser(userId) {
    const existingRoom = await findChatRoomByUserId(userId);

    if(existingRoom) {
        return existingRoom;
    }

    return await createChatRoomForUser(userId);
}

// FIXED: Lấy tất cả các phòng cho admin - Approach đơn giản hơn
export async function getAllChatRoomsForAdmin() {
    try {
        // Bước 1: Lấy thông tin cơ bản của rooms
        const roomsQuery = `
            SELECT 
                cr.id,
                cr.display_name,
                cr.room_type,
                cr.owner_id,
                cr.created_at,
                cr.updated_at,
                owner.id as owner_user_id,
                owner.username as owner_username,
                owner.email as owner_email,
                owner.avatar as owner_avatar,
                owner.user_type as owner_user_type,
                owner.last_seen_at as owner_last_seen_at
            FROM chat_rooms cr
            LEFT JOIN users owner ON cr.owner_id = owner.id
            ORDER BY cr.updated_at DESC
        `;
        
        const roomsResult = await pool.query(roomsQuery);
        const rooms = roomsResult.rows;
        
        // Bước 2: Lấy members cho từng room
        const roomsWithDetails = await Promise.all(rooms.map(async (room) => {
            // Lấy members
            const membersQuery = `
                SELECT 
                    u.id as user_id,
                    u.username,
                    u.email,
                    u.avatar,
                    u.user_type,
                    u.last_seen_at,
                    m.role,
                    m.joined_at
                FROM members m
                JOIN users u ON m.user_id = u.id
                WHERE m.room_id = $1
                ORDER BY m.joined_at ASC
            `;
            
            const membersResult = await pool.query(membersQuery, [room.id]);
            
            // Lấy message count
            const messageCountQuery = `
                SELECT COUNT(*) as count FROM messages WHERE room_id = $1
            `;
            const messageCountResult = await pool.query(messageCountQuery, [room.id]);
            
            // Lấy last message
            const lastMessageQuery = `
                SELECT 
                    msg.content,
                    msg.created_at,
                    sender.username as sender_username,
                    sender.user_type as sender_user_type,
                    sender.avatar as sender_avatar
                FROM messages msg 
                JOIN users sender ON msg.sender_id = sender.id
                WHERE msg.room_id = $1
                ORDER BY msg.created_at DESC
                LIMIT 1
            `;
            const lastMessageResult = await pool.query(lastMessageQuery, [room.id]);
            
            return {
                id: room.id,
                display_name: room.display_name,
                room_type: room.room_type,
                owner_id: room.owner_id,
                created_at: room.created_at,
                updated_at: room.updated_at,
                owner_info: room.owner_user_id ? {
                    id: room.owner_user_id,
                    username: room.owner_username,
                    email: room.owner_email,
                    avatar: room.owner_avatar,
                    user_type: room.owner_user_type,
                    last_seen_at: room.owner_last_seen_at
                } : null,
                members: membersResult.rows.map(member => ({
                    user_id: member.user_id,
                    username: member.username,
                    email: member.email,
                    avatar: member.avatar,
                    user_type: member.user_type,
                    role: member.role,
                    joined_at: member.joined_at,
                    last_seen_at: member.last_seen_at
                })),
                message_count: parseInt(messageCountResult.rows[0].count),
                last_message: lastMessageResult.rows[0] ? {
                    content: lastMessageResult.rows[0].content,
                    created_at: lastMessageResult.rows[0].created_at,
                    sender_username: lastMessageResult.rows[0].sender_username,
                    sender_user_type: lastMessageResult.rows[0].sender_user_type,
                    sender_avatar: lastMessageResult.rows[0].sender_avatar
                } : null
            };
        }));
        
        return roomsWithDetails;
        
    } catch (error) {
        console.error('Error in getAllChatRoomsForAdmin:', error);
        throw error;
    }
}

// FIXED: Lấy phòng chat theo id với thông tin của members
export async function getRoomById(roomId) {
    const query = `
        WITH room_members AS (
            SELECT 
                m.room_id,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'user_id', u.id,
                        'username', u.username,
                        'email', u.email,
                        'avatar', u.avatar,
                        'user_type', u.user_type,
                        'role', m.role,
                        'joined_at', m.joined_at
                    )
                ) as members
            FROM members m
            JOIN users u ON m.user_id = u.id
            WHERE m.room_id = $1
            GROUP BY m.room_id
        )
        SELECT 
            cr.*,
            -- Thông tin owner
            JSON_BUILD_OBJECT(
                'id', owner.id,
                'username', owner.username,
                'email', owner.email,
                'avatar', owner.avatar,
                'user_type', owner.user_type
            ) as owner_info,
            
            -- Danh sách members từ CTE
            rm.members
            
        FROM chat_rooms cr
        LEFT JOIN users owner ON cr.owner_id = owner.id
        LEFT JOIN room_members rm ON cr.id = rm.room_id
        WHERE cr.id = $1
    `;
    
    const result = await pool.query(query, [roomId]);
    return result.rows[0];
}

// BACKUP: Version siêu đơn giản để test
export async function getAllChatRoomsForAdminSimple() {
    const query = `
        SELECT 
            cr.id,
            cr.display_name,
            cr.room_type,
            cr.owner_id,
            cr.created_at,
            cr.updated_at
        FROM chat_rooms cr
        ORDER BY cr.updated_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
}
export async function updateRoomActivity(roomId) {
    const query = `
        UPDATE chat_rooms 
        SET updated_at = NOW() 
        WHERE id = $1 
        RETURNING *
    `;
    
    const result = await pool.query(query, [roomId]);
    return result.rows[0];
}

// Kiểm tra user có phải member của room không
export async function isUserMemberOfRoom(userId, roomId) {
    const query = `
        SELECT EXISTS(
            SELECT 1 FROM members 
            WHERE user_id = $1 AND room_id = $2
        ) as is_member
    `;
    
    const result = await pool.query(query, [userId, roomId]);
    return result.rows[0].is_member;
}

// FIXED: Lấy danh sách phòng của một user cụ thể
export async function getUserRooms(userId) {
    const query = `
        SELECT 
            cr.*, 
            m.role, 
            m.joined_at,
            -- Thông tin owner
            CASE 
                WHEN owner.id IS NOT NULL THEN 
                    JSON_BUILD_OBJECT(
                        'username', owner.username,
                        'avatar', owner.avatar
                    )
                ELSE NULL
            END as owner_info,
            -- Số lượng tin nhắn chưa đọc (có thể implement sau)
            0 as unread_count
        FROM chat_rooms cr
        LEFT JOIN users owner ON cr.owner_id = owner.id
        JOIN members m ON cr.id = m.room_id
        WHERE m.user_id = $1
        ORDER BY cr.updated_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
}

// Cập nhật display name của phòng
export async function updateRoomDisplayName(roomId, displayName) {
    const query = `
        UPDATE chat_rooms 
        SET display_name = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `;
    
    const result = await pool.query(query, [displayName, roomId]);
    return result.rows[0];
}

// FIXED: Tìm phòng theo tên hoặc display name
export async function searchRoomsByName(searchTerm) {
    const query = `
        SELECT 
            cr.*, 
            CASE 
                WHEN owner.id IS NOT NULL THEN 
                    JSON_BUILD_OBJECT(
                        'username', owar.avatar
                    )
                ELSE NULL
            END as owner_info
        FROM chat_rooms cr
        LEFT JOIN users owner ON cr.owner_id = owner.id
        WHERE cr.display_name ILIKE $1
        ORDER BY cr.updated_at DESC
    `;
    
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
}