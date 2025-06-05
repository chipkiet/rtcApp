import { useState, useEffect, useRef } from 'react';

const AdminChatInterface = ({ 
  currentUser, 
  onlineUsers, 
  messages, 
  connectionStatus, 
  onLogout,
  onSendMessage,
  onKickUser,
  onDeleteMessage,
  onSendAnnouncement 
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [announcementInput, setAnnouncementInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  // const [selectedUser, setSelectedUser] = useState(null);
  const messageEndRef = useRef(null);

  // Stats calculation
  const stats = {
    totalUsers: onlineUsers.length,
    totalMessages: messages.length,
    adminUsers: onlineUsers.filter(u => u.user_type === 'admin').length,
    regularUsers: onlineUsers.filter(u => u.user_type === 'user').length
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handleSendAnnouncement = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (announcementInput.trim()) {
      onSendAnnouncement(announcementInput.trim());
      setAnnouncementInput('');
    }
  };

  const ConnectionStatus = () => (
    <div className={`text-xs px-3 py-1 rounded-full font-medium ${
      connectionStatus === 'connected' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {connectionStatus === 'connected' ? '● Kết nối ổn định' : '● Mất kết nối'}
    </div>
  );

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`p-4 rounded-lg border-l-4 ${color} bg-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${color.replace('border', 'bg').replace('500', '100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Header */}
      <div className="bg-white border-b-2 border-red-500 shadow-lg">
        <div className="px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg shadow-lg bg-gradient-to-r from-red-500 to-red-600">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Admin Control Panel</h1>
                  <p className="text-sm text-gray-500">Quản lý hệ thống chat</p>
                </div>
              </div>
              <ConnectionStatus />
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Quản trị viên</p>
                <p className="font-semibold text-red-600">{currentUser?.username}</p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 transition-all border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
          <StatCard 
            title="Tổng Users Online" 
            value={stats.totalUsers} 
            color="border-blue-500"
            icon={<svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>}
          />
          <StatCard 
            title="Tin nhắn hôm nay" 
            value={stats.totalMessages} 
            color="border-green-500"
            icon={<svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd"/></svg>}
          />
          <StatCard 
            title="Users thường" 
            value={stats.regularUsers} 
            color="border-yellow-500"
            icon={<svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>}
          />
          <StatCard 
            title="Admins" 
            value={stats.adminUsers} 
            color="border-red-500"
            icon={<svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1z" clipRule="evenodd"/></svg>}
          />
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              {[
                { id: 'chat', label: 'Chat & Messages', icon: '💬' },
                { id: 'users', label: 'Quản lý Users', icon: '👥' },
                { id: 'announce', label: 'Thông báo', icon: '📢' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)]">
          <div className="space-y-4 lg:col-span-1">
            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <h3 className="flex items-center mb-4 font-semibold text-gray-800">
                <div className="w-3 h-3 mr-2 bg-green-500 rounded-full animate-pulse"></div>
                Online Users ({onlineUsers.length})
              </h3>
              <div className="space-y-2 overflow-y-auto max-h-64">
                {onlineUsers.map((user, index) => (
                  <div key={user.id || index} className="flex items-center justify-between p-2 space-x-2 transition-colors rounded hover:bg-gray-50">
                    <div className="flex items-center flex-1 min-w-0 space-x-2">
                      <div className="relative">
                        <div className={`flex items-center justify-center w-8 h-8 text-xs font-medium text-white rounded-full ${
                          user.user_type === 'admin' ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {user.username}
                          </span>
                          {user.user_type === 'admin' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {user.user_type !== 'admin' && (
                      <button
                        onClick={() => onKickUser && onKickUser(user.id)}
                        className="p-1 text-red-600 rounded hover:bg-red-100"
                        title="Kick user"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm">
                <div className="p-4 border-b bg-gradient-to-r from-red-50 to-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <h2 className="font-semibold text-gray-800">Admin Chat Monitor</h2>
                      <span className="text-sm text-gray-500">• {onlineUsers.length} người online</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Bạn có thể xóa tin nhắn không phù hợp
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex items-center justify-center w-16 h-16 mb-4 bg-red-100 rounded-full">
                          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-gray-900">Admin Chat Monitor</h3>
                        <p className="text-gray-500">Chưa có tin nhắn nào. Theo dõi cuộc trò chuyện tại đây.</p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div key={index} className="flex space-x-3 group">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-blue-500 rounded-full">
                              {message.sender?.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-1 space-x-2">
                              <span className="font-medium text-gray-800">{message.sender}</span>
                              <span className="text-xs text-gray-500">{message.timestamp}</span>
                            </div>
                            <div className="relative p-3 rounded-lg bg-gray-50 group">
                              <p className="text-gray-700">{message.content}</p>
                              <button
                                onClick={() => onDeleteMessage && onDeleteMessage(index)}
                                className="absolute p-1 text-red-600 transition-opacity rounded opacity-0 top-1 right-1 group-hover:opacity-100 hover:bg-red-100"
                                title="Xóa tin nhắn"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messageEndRef} />
                  </div>
                </div>

                <div className="p-4 border-t bg-red-50">
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Gửi tin nhắn với tư cách Admin..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        disabled={connectionStatus !== 'connected'}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
                      />
                    </div>
                    <button 
                      onClick={handleSendMessage}
                      className="px-6 py-2 text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={connectionStatus !== 'connected' || !messageInput.trim()}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'announce' && (
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Gửi Thông Báo Hệ Thống</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Nội dung thông báo
                    </label>
                    <textarea
                      placeholder="Nhập thông báo gửi tới tất cả users..."
                      value={announcementInput}
                      onChange={(e) => setAnnouncementInput(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      rows={4}
                      disabled={connectionStatus !== 'connected'}
                    />
                  </div>
                  <button 
                    onClick={handleSendAnnouncement}
                    className="w-full py-3 font-medium text-white transition-colors rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={connectionStatus !== 'connected' || !announcementInput.trim()}
                  >
                    📢 Gửi Thông Báo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatInterface;