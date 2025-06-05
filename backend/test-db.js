// test-db.js
import pool from './config/database.js';

async function testDatabaseConnection() {
    console.log('🔄 Testing database connection...');
    
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully!');
        
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('📅 Current time:', result.rows[0].current_time);
        console.log('🐘 PostgreSQL version:', result.rows[0].postgres_version);
        
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `;
        
        const tablesResult = await client.query(tablesQuery);
        console.log('\n📋 Available tables:');
        if (tablesResult.rows.length > 0) {
            tablesResult.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        } else {
            console.log('  No tables found in public schema');
        }
        
        // Test specific tables from your schema
        const expectedTables = ['users', 'chat_rooms', 'members', 'messages'];
        console.log('\n🔍 Checking required tables:');
        
        for (const tableName of expectedTables) {
            try {
                const checkQuery = `
                    SELECT COUNT(*) as count 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = $1
                `;
                const checkResult = await client.query(checkQuery, [tableName]);
                
                if (checkResult.rows[0].count > 0) {
                    // Get column info
                    const columnsQuery = `
                        SELECT column_name, data_type, is_nullable
                        FROM information_schema.columns 
                        WHERE table_schema = 'public' AND table_name = $1
                        ORDER BY ordinal_position;
                    `;
                    const columnsResult = await client.query(columnsQuery, [tableName]);
                    
                    console.log(`  ✅ ${tableName} - ${columnsResult.rows.length} columns`);
                    columnsResult.rows.forEach(col => {
                        console.log(`     - ${col.column_name} (${col.data_type})`);
                    });
                } else {
                    console.log(`  ❌ ${tableName} - Table not found`);
                }
            } catch (err) {
                console.log(`  ❌ ${tableName} - Error: ${err.message}`);
            }
        }
        
        // Test insert/select (optional)
        console.log('\n🧪 Testing basic operations...');
        try {
            // This is just a test query, adjust based on your actual schema
            const testQuery = 'SELECT 1 as test_value';
            const testResult = await client.query(testQuery);
            console.log('✅ Basic query operations working');
        } catch (err) {
            console.log('❌ Basic query test failed:', err.message);
        }
        
        client.release();
        console.log('\n🎉 Database connection test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error details:', error.message);
        console.error('Error code:', error.code);
        
        // Common error suggestions
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Suggestions:');
            console.log('  - Make sure PostgreSQL is running');
            console.log('  - Check if the port 5432 is correct');
            console.log('  - Verify the host is accessible');
        } else if (error.code === '28P01') {
            console.log('\n💡 Suggestions:');
            console.log('  - Check your username and password');
            console.log('  - Verify database user permissions');
        } else if (error.code === '3D000') {
            console.log('\n💡 Suggestions:');
            console.log('  - Check if database "rtcapp" exists');
            console.log('  - Create the database if it doesn\'t exist');
        }
    } finally {
        // Close the pool
        console.log('\n🔄 Closing database connection pool...');
        await pool.end();
        console.log('✅ Connection pool closed');
        process.exit(0);
    }
}

// Run the test
testDatabaseConnection();