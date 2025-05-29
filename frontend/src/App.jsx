import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const ChatApp = () => {
  // User states
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({
    username: '',
    email: '',
    userType: 'user' // 'user' hoặc 'admin'
  });

  // Chat states
  const [chatRooms, setChatRooms] = useState([]);
  const [currentChatRoom, setCurrentChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  const messageEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    // Connection events
    socket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
      setError('');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
      setError('Mất kết nối với server');
    });

    // Authentication events
    socket.on('user_authenticated', (userData) => {
      console.log('User authenticated:', userData);
      setCurrentUser(userData);
      setIsLoggedIn(true);
      setIsLoading(false);
    });

    socket.on('authentication_error', (error) => {
      console.error('Authentication error:', error);
      setError(error.message);
      setIsLoading(false);
    });

    // Chat room events
    socket.on('chat_rooms_list', (rooms) => {
      console.log('Chat rooms received:', rooms);
      setChatRooms(rooms);
    });

    socket.on('chat_room_created', (roomData) => {
      console.log('New chat room created:', roomData);
      setChatRooms(prev => [...prev, roomData]);
    });

    socket.on('chat_room_joined', (data) => {
      console.log('Joined chat room:', data);
      setCurrentChatRoom(data.room);
      setMessages(data.messages || []);
    });

    // Message events
    socket.on('new_message', (message) => {
      console.log('New message received:', message);
      setMessages(prev => [...prev, message]);
      
      // Mark message as seen if in current room
      if (currentChatRoom && message.room_id === currentChatRoom.id) {
        setTimeout(() => {
          socket.emit('mark_message_seen', { 
            roomId: currentChatRoom.id,
            messageId: message.id 
          });
        }, 500);
      }
    });

    socket.on('message_sent', (message) => {
      console.log('Message sent successfully:', message);
      setMessages(prev => [...prev, message]);
    });

    socket.on('message_error', (error) => {
      console.error('Message error:', error);
      setError(error.message);
    });

    // Typing events
    socket.on('user_typing', (data) => {
      if (data.userId !== currentUser?.id) {
        setIsTyping(true);
        setTypingUser(data.username);
      }
    });

    socket.on('user_stop_typing', (data) => {
      if (data.userId !== currentUser?.id) {
        setIsTyping(false);
        setTypingUser('');
      }
    });

    // Online users events
    socket.on('online_users_updated', (users) => {
      console.log('Online users updated:', users);
      setOnlineUsers(users);
    });

    socket.on('user_online', (userData) => {
      console.log('User came online:', userData);
      setOnlineUsers(prev => {
        const filtered = prev.filter(u => u.id !== userData.id);
        return [...filtered, userData];
      });
    });

    socket.on('user_offline', (userData) => {
      console.log('User went offline:', userData);
      setOnlineUsers(prev => prev.filter(u => u.id !== userData.id));
    });

    // Error handling
    socket.on('error', (errorData) => {
      console.error('Socket error:', errorData);
      setError(errorData.message);
      setIsLoading(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('user_authenticated');
      socket.off('authentication_error');
      socket.off('chat_rooms_list');
      socket.off('chat_room_created');
      socket.off('chat_room_joined');
      socket.off('new_message');
      socket.off('message_sent');
      socket.off('message_error');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('online_users_updated');
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('error');
    };
  }, [currentChatRoom, currentUser]);

  // Handlers
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username.trim() && loginForm.email.trim()) {
      setIsLoading(true);
      setError('');
      
      socket.emit('authenticate', {
        username: loginForm.username.trim(),
        email: loginForm.email.trim(),
        user_type: loginForm.userType
      });
    }
  };

  const handleCreateOrJoinRoom = (targetUserId, targetUsername) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError('');
    
    socket.emit('create_or_join_room', {
      targetUserId: targetUserId,
      targetUsername: targetUsername
    });
  };

  const handleJoinExistingRoom = (roomId) => {
    setIsLoading(false);
    socket.emit('join_room', { roomId });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChatRoom) return;

    const messageText = newMessage.trim();
    
    socket.emit('send_message', {
      roomId: currentChatRoom.id,
      content: messageText
    });
    
    setNewMessage('');
    
    // Stop typing
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    socket.emit('stop_typing', { roomId: currentChatRoom.id });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (currentChatRoom && currentUser) {
      socket.emit('typing', { 
        roomId: currentChatRoom.id,
        userId: currentUser.id,
        username: currentUser.username
      });
      
      if (typingTimeout) clearTimeout(typingTimeout);
      
      const timeout = setTimeout(() => {
        socket.emit('stop_typing', { 
          roomId: currentChatRoom.id,
          userId: currentUser.id
        });
      }, 1000);
      
      setTypingTimeout(timeout);
    }
  };

  const handleBackToRooms = () => {
    setCurrentChatRoom(null);
    setMessages([]);
    setIsTyping(false);
    setTypingUser('');
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      socket.emit('logout');
      socket.disconnect();
      
      // Reset all states
      setIsLoggedIn(false);
      setCurrentUser(null);
      setChatRooms([]);
      setCurrentChatRoom(null);
      setMessages([]);
      setOnlineUsers([]);
      setLoginForm({ username: '', email: '', userType: 'user' });
      
      socket.connect();
    }
  };

  // Utility functions
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };

  // Components
  const ConnectionStatus = () => (
    <div className={`text-xs px-2 py-1 rounded-full ${
      connectionStatus === 'connected' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {connectionStatus === 'connected' ? '● Đã kết nối' : '● Mất kết nối'}
    </div>
  );

  const ErrorDisplay = () => {
    if (!error) return null;
    
    return (
      <div className="p-3 mb-4 border border-red-200 rounded-lg bg-red-50">
        <div className="text-sm text-red-800">{error}</div>
        <button 
          onClick={() => setError('')}
          className="mt-2 text-xs text-red-600 hover:text-red-800"
        >
          Đóng
        </button>
      </div>
    );
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
      <div className="w-6 h-6 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
    </div>
  );

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-purple-100">
        <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-xl">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-3xl font-bold text-gray-800"> Chat App</h2>
            <p className="text-gray-600">Realtime Chat Application</p>
          </div>
          
          <div className="flex justify-center mb-4">
            <ConnectionStatus />
          </div>
          
          <ErrorDisplay />
          
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Tên người dùng"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({...prev, username: e.target.value}))}
                className="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:shadow-sm"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({...prev, email: e.target.value}))}
                className="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:shadow-sm"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block mb-3 text-sm font-medium text-gray-700">Loại tài khoản:</label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="user"
                    checked={loginForm.userType === 'user'}
                    onChange={(e) => setLoginForm(prev => ({...prev, userType: e.target.value}))}
                    className="mr-2 text-blue-500"
                    disabled={isLoading}
                  />
                  <span className="select-none"> Người dùng</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="admin"
                    checked={loginForm.userType === 'admin'}
                    onChange={(e) => setLoginForm(prev => ({...prev, userType: e.target.value}))}
                    className="mr-2 text-blue-500"
                    disabled={isLoading}
                  />
                  <span className="select-none"> Admin</span>
                </label>
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full py-3 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || connectionStatus !== 'connected'}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat Rooms List Screen
  if (!currentChatRoom) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="px-6 py-4 text-white shadow-md bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">💬 Chat Rooms</h2>
              <p className="text-sm text-blue-100">
                Xin chào, {currentUser?.username} ({currentUser?.user_type})
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ConnectionStatus />
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm transition-colors rounded-lg bg-white/20 hover:bg-white/30"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <ErrorDisplay />
          
          {isLoading && <LoadingSpinner />}
          
          {/* Existing Chat Rooms */}
          {chatRooms.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">
                Cuộc trò chuyện của bạn ({chatRooms.length})
              </h3>
              <div className="grid gap-3">
                {chatRooms.map((room) => (
                  <div 
                    key={room.id} 
                    className="p-4 transition-shadow bg-white border rounded-lg shadow-sm cursor-pointer hover:shadow-md"
                    onClick={() => handleJoinExistingRoom(room.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          Room #{room.id} - {room.partner_name || 'Unknown'}
                        </span>
                        <div className="text-sm text-gray-600">
                          Tạo lúc: {formatDate(room.created_at)}
                        </div>
                        {room.last_message && (
                          <div className="mt-1 text-sm text-gray-500">
                            Tin nhắn cuối: {room.last_message.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                      {room.unread_count > 0 && (
                        <span className="px-2 py-1 text-xs text-white bg-red-500 rounded-full">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Online Users */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              Người dùng đang online ({onlineUsers.length})
            </h3>
            
            {onlineUsers.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mb-2 text-lg text-gray-400">👥</div>
                <p className="text-gray-600">Không có ai online</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {onlineUsers
                  .filter(user => user.id !== currentUser?.id)
                  .map((user) => (
                  <div 
                    key={user.id} 
                    className="p-4 transition-all bg-white border rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300"
                    onClick={() => handleCreateOrJoinRoom(user.id, user.username)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 mr-3 font-bold text-white rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium">{user.username}</span>
                          <div className="text-xs text-gray-600">
                            {user.user_type === 'admin' ? '👑 Admin' : '👤 User'}
                          </div>
                          <div className="flex items-center text-xs text-green-600">
                            <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                            Online
                          </div>
                        </div>
                      </div>
                      <div className="text-blue-500">💬</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Chat Screen
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <div className="px-6 py-4 text-white shadow-md bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={handleBackToRooms}
              className="p-2 mr-4 transition-colors rounded-lg bg-white/20 hover:bg-white/30"
              title="Quay lại danh sách"
            >
              ←
            </button>
            <div>
              <h3 className="text-lg font-semibold">
                💬 Room #{currentChatRoom.id}
              </h3>
              <div className="text-sm text-blue-100">
                <ConnectionStatus />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ErrorDisplay />
      
      {isLoading && <LoadingSpinner />}

      {/* Messages Area */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mb-4 text-4xl">💬</div>
            <p className="text-gray-600">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl shadow-sm ${
                  message.sender_id === currentUser?.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white text-gray-800 border'
                }`}
              >
                {message.sender_id !== currentUser?.id && (
                  <div className="mb-1 text-xs font-medium text-gray-600">
                    {message.sender_username || 'Unknown'}
                  </div>
                )}
                <div className="break-words">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.sender_id === currentUser?.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {isTyping && typingUser && (
          <div className="flex justify-start">
            <div className="max-w-xs px-4 py-2 bg-gray-200 rounded-2xl">
              <div className="text-sm text-gray-600">
                {typingUser} đang nhập...
              </div>
            </div>
          </div>
        )}
        
        <div ref={messageEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:border-blue-500 focus:outline-none"
            disabled={!currentChatRoom}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !currentChatRoom}
            className="px-6 py-2 text-white transition-all rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;