chức năng đầu tiên : login đăng nhập

ở frontend, sẽ có form để đăng nhập, khi ta nhập username, email và user_type vào. React sẽ gửi authenticate qua socket.io 
server lúc này sẽ nhận event , kiểm tra email trong database. 
            Nếu email hoặc username chưa tồn tai = > tạo mới trong database.
            Nếu đã tồn tại, sẽ cập nhật last_seen_at.
    Sau đó lưu thông tin vào userOnlineListApp.
điều hướng

backend sau khi nhận thông tin user đăng nhập, gửi user_Authenticated về fe
fe sẽ cập nhật isLogged  = true
broadcast online_users_updated cho tất cả clients
    
                    