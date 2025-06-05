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
            console.log('User authenticated : ', userData);
            setCurrentUser(userData);
            setIsLoggedIn(true);
            setIsLoading(false);
            setError('');
        };

        const handleAuthenticationError = (error) => {
            console.log('Authentication error: ', error);
            setError(error.message || 'Lỗi xác thực' );
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

        const handleNewMessage = (message) => {
            console.log('Chat rooms updated:', message);
            setMessages(prev => [...prev, message]);
        };

        //dang ky lang nghe su kien ... 
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('user_authenticated', handleUserAuthenticated);
        socket.on('authentication_error', handleAuthenticationError);
        socket.on('online_users_update', handleOnlineUserUpdate);
        socket.on('chat_rooms_update', handleChatRoomsUpdate);
        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('user_authenticated', handleUserAuthenticated);
            socket.off('authentication_error', handleAuthenticationError);
            socket.off('online_users_update', handleOnlineUserUpdate);
            socket.off('chat_rooms_update', handleChatRoomsUpdate);
            socket.off('new_message', handleNewMessage);
          };

    }, []);


    const handleLogin = (loginData) => {
        setIsLoading(true);
        setError('');
        socket.emit('authenticate', loginData);
    };
    const handleLogout = () => {
        socket.disconnect();
        setIsLoggedIn(false);
        setCurrentUser(null);
        setOnlineUsers([]);
        setChatRooms([]);
        setMessages([]);
        setError('');
        socket.connect(); // reconnect when next login 
      };

    const handleClearError = () => {
        setError('');
    };

    const handleSendMessage = (messageContent) => {
        console.log('Sending message:', messageContent);
        socket.emit('send_message', { content: messageContent, room: 'general' });
        
        const newMessage = {
          sender: currentUser?.username,
          content: messageContent,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, newMessage]);
      };

    if(!isLoggedIn) {
        return ( 
            <LoginForm
                onLogin={handleLogin}
                isLoading={isLoading} //luc nay isLoading = true
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
        />
    )
    
}

export default App
