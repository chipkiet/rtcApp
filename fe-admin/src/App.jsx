// Fixed App component - paste-3.txt
import { useEffect, useState } from "react"
import LoginForm from "./components/LoginForm";
import AdminChatInterface from "../../fe-admin/src/components/AdminChatScreen";
import socket from "../../fe-admin/src/socket/socket";

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [currentUser, setCurrentUser] = useState(null);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);
    
    useEffect(() => {
        const handleConnect = () => {
            console.log('Connected to server');
            setConnectionStatus('connected');
            setError('');
        };

        const handleDisconnect = () => {
            console.log('Disconnected from server');
            setConnectionStatus('disconnected');
            setError('Mất kết nối với server');
            setIsLoggedIn(false);
            setCurrentUser(null);
        };

        const handleUserAuthenticated = (userData) => {
            console.log('User authenticated:', userData);
            setCurrentUser(userData.user);
            setIsLoggedIn(true);
            setIsLoading(false);
            setError('');
            
            if (userData.user.user_type === 'user' && userData.room) {
                setCurrentRoom(userData.room);
            }
        };

        const handleAuthenticationError = (error) => {
            console.log('Authentication error:', error);
            setError(error.message || 'Lỗi xác thực');
            setIsLoading(false);
        };

        const handleOnlineUserUpdate = (users) => {
            console.log('Online users updated:', users);
            setOnlineUsers(users);
        };

        const handleChatRoomsUpdate = (rooms) => {
            console.log('Chat rooms updated:', rooms);
            setChatRooms(rooms);
        };

        // FIXED: Improved message handling
        const handleNewMessage = (message) => {
            console.log('New message received:', message);
            console.log('Current room:', currentRoom);
            
            // Always add message if we have a current room and it matches
            if (currentRoom && message.room_id === currentRoom.id) {
                setMessages(prev => {
                    // Avoid duplicates
                    const exists = prev.some(msg => msg.id === message.id);
                    if (exists) return prev;
                    
                    return [...prev, message];
                });
            }
        };

        const handleRoomJoined = (data) => {
            console.log('Room joined:', data);
            setCurrentRoom(data.room);
            setMessages(data.messages || []);
        };

        const handleError = (error) => {
            console.error('Socket error:', error);
            setError(error.message || 'Có lỗi xảy ra');
        };

        // Register event listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('user_authenticated', handleUserAuthenticated);
        socket.on('authentication_error', handleAuthenticationError);
        socket.on('online_users_update', handleOnlineUserUpdate);
        socket.on('chat_rooms_update', handleChatRoomsUpdate);
        socket.on('new_message', handleNewMessage);
        socket.on('room_joined', handleRoomJoined);
        socket.on('error', handleError);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('user_authenticated', handleUserAuthenticated);
            socket.off('authentication_error', handleAuthenticationError);
            socket.off('online_users_update', handleOnlineUserUpdate);
            socket.off('chat_rooms_update', handleChatRoomsUpdate);
            socket.off('new_message', handleNewMessage);
            socket.off('room_joined', handleRoomJoined);
            socket.off('error', handleError);
        };
    }, [currentRoom]); // Keep currentRoom in dependency

    // FIXED: Handle join room for admin
    const handleJoinRoom = (roomId) => {
        console.log('Joining room:', roomId);
        
        // Clear current messages first
        setMessages([]);
        
        // Leave current room if exists
        if (currentRoom) {
            socket.emit('admin_leave_room', { roomId: currentRoom.id });
        }
        
        // Join new room
        socket.emit('admin_join_room', { roomId });
    };

    const handleLogin = (loginData) => {
        setIsLoading(true);
        setError('');
        socket.emit('authenticate', loginData);
    };

    const handleLogout = () => {
        if (currentRoom) {
            socket.emit('admin_leave_room', { roomId: currentRoom.id });
        }
        
        socket.disconnect();
        setIsLoggedIn(false);
        setCurrentUser(null);
        setCurrentRoom(null);
        setOnlineUsers([]);
        setChatRooms([]);
        setMessages([]);
        setError('');
        socket.connect();
    };

    const handleClearError = () => {
        setError('');
    };

    // FIXED: Send message with proper room ID and validation
    const handleSendMessage = (messageContent) => {
        if (!currentRoom) {
            alert("Bạn cần chọn phòng chat trước");
            return;
        }

        if (!messageContent.trim()) {
            alert("Tin nhắn không được để trống");
            return;
        }

        console.log('Sending message:', {
            content: messageContent,
            roomId: currentRoom.id,
            currentRoom: currentRoom
        });

        socket.emit('send_message', {
            content: messageContent.trim(),
            roomId: currentRoom.id
        });
    };

    const handleKickUser = (userId) => {
        if (window.confirm('Bạn có chắc muốn kick user này?')) {
            socket.emit('kick_user', { userId });
        }
    };

    const handleDeleteMessage = (messageIndex) => {
        if (window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) {
            setMessages(prev => prev.filter((_, index) => index !== messageIndex));
        }
    };

    const handleSendAnnouncement = (content) => {
        socket.emit('send_announcement', { content });
        alert('Thông báo đã được gửi!');
    };

    if (!isLoggedIn) {
        return (
            <LoginForm
                onLogin={handleLogin}
                isLoading={isLoading}
                error={error}
                connectionStatus={connectionStatus}
                onClearError={handleClearError}
            />
        );
    }

    return (
        <AdminChatInterface
            currentUser={currentUser}
            onlineUsers={onlineUsers}
            chatRooms={chatRooms}
            messages={messages}
            connectionStatus={connectionStatus}
            onLogout={handleLogout}
            onSendMessage={handleSendMessage}
            onJoinRoom={handleJoinRoom}
            onKickUser={handleKickUser}
            onDeleteMessage={handleDeleteMessage}
            onSendAnnouncement={handleSendAnnouncement}
        />
    );
};

export default App;