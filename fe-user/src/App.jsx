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
  const [currentRoom, setCurrentRoom] = useState(null); // Thêm currentRoom
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);

  // Socket event handlers
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
      setCurrentRoom(null);
    };

    const handleUserAuthenticated = (userData) => {
      console.log('User authenticated:', userData);
      setCurrentUser(userData.user);
      setCurrentRoom(userData.room); // Lưu thông tin room
      setIsLoggedIn(true);
      setIsLoading(false);
      setError('');
      
      // Load tin nhắn cũ của room (nếu có)
      if (userData.room) {
        console.log('User joined room:', userData.room);
      }
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

    // FIXED: Xử lý tin nhắn mới
    const handleNewMessage = (message) => {
      console.log('New message received:', message);
      console.log('Current room ID:', currentRoom?.id);
      console.log('Message room ID:', message.room_id);
      
      // Chỉ thêm tin nhắn nếu nó thuộc về room hiện tại
      if (currentRoom && message.room_id === currentRoom.id) {
        setMessages(prev => {
          // Tránh duplicate messages
          const exists = prev.some(msg => msg.id === message.id);
          if (exists) return prev;
          
          return [...prev, message];
        });
      }
    };

    // Xử lý khi admin join room (để load tin nhắn cũ)
    const handleRoomJoined = (data) => {
      console.log('Room data received:', data);
      if (data.messages) {
        setMessages(data.messages);
      }
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setError(error.message || 'Có lỗi xảy ra');
    };

    // Đăng ký lắng nghe sự kiện
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('user_authenticated', handleUserAuthenticated);
    socket.on('authentication_error', handleAuthenticationError);
    socket.on('online_users_update', handleOnlineUserUpdate);
    socket.on('chat_rooms_update', handleChatRoomsUpdate);
    socket.on('new_message', handleNewMessage);
    socket.on('room_joined', handleRoomJoined);
    socket.on('error', handleError);

    // Dọn sạch sự kiện 
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
  }, [currentRoom]); // Thêm currentRoom vào dependency

  // Login handler
  const handleLogin = (loginData) => {
    setIsLoading(true);
    setError('');
    socket.emit('authenticate', loginData);
  };

  // Logout handler
  const handleLogout = () => {
    // Leave room trước khi logout
    if (currentRoom) {
      socket.emit('user_leave_room', { roomId: currentRoom.id });
    }
    
    socket.disconnect();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentRoom(null);
    setOnlineUsers([]);
    setChatRooms([]);
    setMessages([]);
    setError('');
    socket.connect(); // Reconnect for next login
  };

  // FIXED: Sửa logic gửi tin nhắn
  const handleSendMessage = (messageContent) => {
    if (!currentRoom) {
      alert("Chưa có phòng chat để gửi tin nhắn");
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

    // Gửi tin nhắn với roomId đúng
    socket.emit('send_message', {
      content: messageContent.trim(),
      roomId: currentRoom.id
    });
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
      currentRoom={currentRoom}
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