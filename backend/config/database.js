import {Pool} from 'pg';
import dotenv from 'dotenv';

dotenv.config(); //load moi truong tu .env

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 20,  //so ket noi toi da trong pool
    idleTimeoutMillis : 30000, // thoi gian khach hang duoc phep hoat dong
    connectionTimeoutMillis: 200 // thoi gian doi de ket noi 
});

//test connection 
pool.on('connect', () => {
    console.log('Ket noi toi postgresql')
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;