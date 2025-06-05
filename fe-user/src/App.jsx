import { useState, useEffect } from "react";
import LoginForm from "./components/LoginForm";
import ChatInterface from "./components/ChatScreen";
import socket from "../../fe-admin/src/socket/socket";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);

  // socket ev
  // ent handlers
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
      setCurrentUser(userData);
      setIsLoggedIn(true);
      setIsLoading(false);
      setError('');
    };

    const handleAuthenticationError = (error) => {
      console.error('Authentication error:', error);
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

    // Add message handlers here when implementing
    const handleNewMessage = (message) => {
      console.log('New message received:', message);
      setMessages(prev => [...prev, message]);
    };

    // Đăng ký lắng nghe sự kiện
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('user_authenticated', handleUserAuthenticated);
    socket.on('authentication_error', handleAuthenticationError);
    socket.on('online_users_update', handleOnlineUserUpdate);
    socket.on('chat_rooms_update', handleChatRoomsUpdate);
    socket.on('new_message', handleNewMessage); // For future message handling

    // Dọn sạch sự kiện 
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

  // Login handler
  const handleLogin = (loginData) => {
    setIsLoading(true);
    setError('');
    socket.emit('authenticate', loginData);
  };

  // Logout handler
  const handleLogout = () => {
    socket.disconnect();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setOnlineUsers([]);
    setChatRooms([]);
    setMessages([]);
    setError('');
    socket.connect(); // Reconnect for next login
  };

  
  const handleSendMessage = (messageContent) => {
    // TODO: Implement message sending to server
    console.log('Sending message:', messageContent);
    // socket.emit('send_message', { content: messageContent, room: 'general' });
    
    // Temporary: Add message to local state for testing
    const newMessage = {
      sender: currentUser?.username,
      content: messageContent,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Clear error handler
  const handleClearError = () => {
    setError('');
  };

  // Render appropriate component based on login status
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
    <ChatInterface
      currentUser={currentUser}
      onlineUsers={onlineUsers}
      chatRooms={chatRooms}
      messages={messages}
      connectionStatus={connectionStatus}
      onLogout={handleLogout}
      onSendMessage={handleSendMessage}
    />
  );
};

export default App;