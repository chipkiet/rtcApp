import { useState, useEffect, useRef } from 'react';

const ChatInterface = ({ 
  currentUser, 
  currentRoom,
  onlineUsers, 
  messages, 
  connectionStatus, 
  onLogout,
  onSendMessage 
}) => {
  const [messageInput, setMessageInput] = useState('');
  const messageEndRef = useRef(null);

  // Tự động cuộn tin nhắn xuống khi có tin nhắn mới xuất hiện 
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // xử lý gửi tin nhắn 
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  //Trạng thái status (UI)
  const ConnectionStatus = () => (
    <div className={`text-xs px-2 py-1 rounded-full ${
      connectionStatus === 'connected' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {connectionStatus === 'connected' ? '● Đã kết nối' : '● Mất kết nối'}
    </div>
  );

  // Hiển thị thông tin room hiện tại
  const RoomInfo = () => {
    if (!currentRoom) return null;
    
    return (
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <h2 className="font-semibold text-gray-800">
          {currentRoom.display_name || currentRoom.name || 'Chat với Admin'}
        </h2>
        <span className="text-sm text-gray-500">
          • Room ID: {currentRoom.id}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* phần Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl px-4 py-3 mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-800">Chat Room - User</h1>
              </div>
              <ConnectionStatus />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                <span className="hidden sm:inline">Xin chào, </span>
                <span className="font-medium text-blue-600">{currentUser?.username}</span>
              </span>
              <button
                onClick={onLogout}
                className="px-3 py-1 text-sm text-red-600 transition-colors border border-red-300 rounded hover:text-red-800 hover:border-red-400"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl p-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
          {/* Sidebar - Online Users */}
          <div className="p-4 bg-white rounded-lg shadow-sm lg:col-span-1">
            <div className="mb-4">
              <h3 className="flex items-center mb-3 font-semibold text-gray-800">
                <div className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></div>
                Admin đang online ({onlineUsers.filter(user => user.user_type === 'admin').length})
              </h3>
              <div className="space-y-2 overflow-y-auto max-h-96">
                {onlineUsers
                  .filter(user => user.user_type === 'admin') // User chỉ thấy admin
                  .map((user, index) => (
                    <div key={user.id || index} className="flex items-center p-2 space-x-3 transition-colors rounded hover:bg-gray-50">
                      <div className="relative">
                        <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-purple-500 rounded-full">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {user.username}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                            Admin
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Hiển thị thông tin Room */}
            {currentRoom && (
              <div className="p-3 mt-4 rounded-lg bg-blue-50">
                <h4 className="mb-2 text-sm font-medium text-blue-800">Thông tin phòng</h4>
                <div className="space-y-1 text-xs text-blue-600">
                  <div>ID: {currentRoom.id}</div>
                  <div>Tên: {currentRoom.display_name || currentRoom.name}</div>
                  <div>Loại: {currentRoom.room_type}</div>
                </div>
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="flex flex-col bg-white rounded-lg shadow-sm lg:col-span-3">
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <RoomInfo />
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">Chào mừng đến với Chat!</h3>
                    <p className="text-gray-500">Chưa có tin nhắn nào. Admin sẽ liên hệ với bạn sớm!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    // Xác định người gửi
                    const isCurrentUser = message.sender_id === currentUser?.id;
                    const senderName = message.sender_username || message.sender?.username || 'Unknown';
                    const senderType = message.sender_user_type || message.sender?.user_type || 'user';
                    
                    return (
                      <div key={message.id || index} className={`flex space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className="flex-shrink-0">
                          <div className={`flex items-center justify-center w-8 h-8 text-sm font-medium text-white rounded-full ${
                            senderType === 'admin' ? 'bg-purple-500' : 'bg-blue-500'
                          }`}>
                            {senderName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className={`flex-1 min-w-0 ${isCurrentUser ? 'text-right' : ''}`}>
                          <div className={`flex items-center mb-1 space-x-2 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <span className="font-medium text-gray-800">{senderName}</span>
                            {senderType === 'admin' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                                Admin
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {message.created_at 
                                ? new Date(message.created_at).toLocaleTimeString() 
                                : (message.timestamp || 'Vừa xong')
                              }
                            </span>
                          </div>
                          <div className={`p-2 rounded-lg max-w-xs lg:max-w-md ${
                            isCurrentUser 
                              ? 'bg-blue-500 text-white ml-auto' 
                              : 'bg-gray-50'
                          }`}>
                            <p className={isCurrentUser ? 'text-white' : 'text-gray-700'}>
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-gray-50">
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={currentRoom ? "Nhập tin nhắn của bạn..." : "Chưa có phòng chat..."}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={connectionStatus !== 'connected' || !currentRoom}
                  />
                </div>
                <button 
                  type="submit"
                  className="px-6 py-2 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={connectionStatus !== 'connected' || !messageInput.trim() || !currentRoom}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
              {connectionStatus !== 'connected' && (
                <p className="mt-2 text-xs text-red-600">Mất kết nối - Không thể gửi tin nhắn</p>
              )}
              {!currentRoom && connectionStatus === 'connected' && (
                <p className="mt-2 text-xs text-orange-600">Chưa có phòng chat - Đang chờ admin tạo phòng</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;