import { useState, useEffect, useRef } from 'react';

const ChatInterface = ({ 
  currentUser, 
  onlineUsers, 
  chatRooms, 
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* phần Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl px-4 py-3 mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-800">Chat App</h1>
              <ConnectionStatus />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Xin chào, {currentUser?.username}
                {currentUser?.user_type === 'admin' && (
                  <span className="px-2 py-1 ml-2 text-xs text-purple-700 bg-purple-100 rounded-full">
                    Admin
                  </span>
                )}
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
          {/* Sidebar - Online Users & Chat Rooms */}
          <div className="p-4 bg-white rounded-lg shadow-sm lg:col-span-1">
            <div className="mb-4">
              <h3 className="mb-2 font-semibold text-gray-800">
                Người dùng online ({onlineUsers.length})
              </h3>
              <div className="space-y-2 overflow-y-auto max-h-32">
                {onlineUsers.map((user, index) => (
                  <div key={user.id || index} className="flex items-center p-2 space-x-2 rounded hover:bg-gray-50">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{user.username}</span>
                    {user.user_type === 'admin' && (
                      <span className="text-xs text-purple-600">Admin</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {currentUser?.user_type === 'admin' && (
              <div>
                <h3 className="mb-2 font-semibold text-gray-800">
                  Phòng chat ({chatRooms.length})
                </h3>
                <div className="space-y-2 overflow-y-auto max-h-40">
                  {chatRooms.map((room, index) => (
                    <div key={room.id || index} className="p-2 rounded cursor-pointer hover:bg-gray-50">
                      <span className="text-sm text-gray-700">Room #{room.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="flex flex-col bg-white rounded-lg shadow-sm lg:col-span-3">
            {/* Chat Header */}
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">General Chat</h2>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-blue-500 rounded-full">
                          {message.sender?.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-1 space-x-2">
                          <span className="font-medium text-gray-800">{message.sender}</span>
                          <span className="text-xs text-gray-500">{message.timestamp}</span>
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messageEndRef} />
              </div>
            </div>

            {/* Khung nhập tin nhắn */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  disabled={connectionStatus !== 'connected'}
                />
                <button 
                  type="submit"
                  className="px-6 py-2 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={connectionStatus !== 'connected' || !messageInput.trim()}
                >
                  Gửi
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;