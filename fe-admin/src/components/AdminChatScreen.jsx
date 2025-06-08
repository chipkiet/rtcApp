import { useState, useEffect, useRef } from 'react';

const AdminChatInterface = ({ 
  currentUser,
  onlineUsers,
  chatRooms,
  messages,
  connectionStatus,
  onLogout,
  onSendMessage,
  onDeleteMessage,
  onSendAnnouncement,
  onJoinRoom
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [announcementInput, setAnnouncementInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [currentRoom, setCurrentRoom] = useState(null);
  const messageEndRef = useRef(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentRoom && !chatRooms.find(r => r.id === currentRoom.id)) {
      setCurrentRoom(null);
    }
  }, [chatRooms]);

  const handleUserClick = (userId) => {
    const room = chatRooms.find(room => room.owner_id === userId);
    if (room) {
      setCurrentRoom(room);
      onJoinRoom(room.id);
    } else {
      alert("Không tìm thấy phòng của user này.");
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!currentRoom) return alert("Chưa chọn phòng chat");
    if (!messageInput.trim()) return;
    onSendMessage(messageInput.trim());
    setMessageInput('');
  };

  const handleSendAnnouncement = (e) => {
    e?.preventDefault();
    if (!announcementInput.trim()) return;
    onSendAnnouncement(announcementInput.trim());
    setAnnouncementInput('');
  };

  const ConnectionStatus = () => (
    <div className={`text-xs px-3 py-1 rounded-full font-medium ${
      connectionStatus === 'connected' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      ● {connectionStatus === 'connected' ? 'Kết nối ổn định' : 'Mất kết nối'}
    </div>
  );

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`p-4 rounded-lg border-l-4 ${color} bg-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${color.replace('border', 'bg').replace('500', '100')}`}>{icon}</div>
      </div>
    </div>
  );

  // const status = {
  //   totalUsers: onlineUsers.length,
  //   totalMessages: messages.length,
  //   adminUsers: onlineUsers.filter(u => u.user_type === 'admin').length,
  //   regularUsers: onlineUsers.filter(u => u.user_type === 'user').length
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
        {/* Add stat cards here if needed */}

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              {['chat', 'users', 'announce'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab === 'chat' ? '💬' : tab === 'users' ? '👥' : '📢'}</span>
                  <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)]">
          {/* Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <h3 className="mb-4 font-semibold">Online Users</h3>
              <div className="space-y-2 overflow-y-auto max-h-64">
                {onlineUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-gray-400">{user.user_type}</p>
                    </div>
                    {user.user_type === 'user' && (
                      <button
                        onClick={() => handleUserClick(user.id)}
                        className="px-2 py-1 text-xs text-blue-600 border rounded hover:bg-blue-50"
                      >
                        Chat
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-3">
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm">
                <div className="p-4 border-b bg-gradient-to-r from-red-50 to-red-100">
                  <h2 className="font-semibold text-gray-800">
                    {currentRoom ? currentRoom.display_name : 'Chưa chọn phòng'}
                  </h2>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-500">Không có tin nhắn.</p>
                  ) : (
                    messages.map((message, index) => (
                      <div key={index} className="relative group">
                        <div className="font-semibold text-gray-800">{message.sender_username || message.sender}</div>
                        <div className="text-sm text-gray-600">{message.content}</div>
                        <div className="text-xs text-gray-400">{new Date(message.created_at || message.timestamp).toLocaleTimeString()}</div>
                        <button
                          className="absolute top-0 right-0 p-1 text-red-500 opacity-0 group-hover:opacity-100"
                          onClick={() => onDeleteMessage(index)}
                          title="Xóa"
                        >✖</button>
                      </div>
                    ))
                  )}
                  <div ref={messageEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex p-4 border-t">
                  <input
                    className="flex-1 p-2 border rounded-l focus:outline-none"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                  />
                  <button type="submit" className="px-4 text-white bg-red-500 rounded-r hover:bg-red-600">
                    Gửi
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'announce' && (
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">📢 Gửi thông báo</h3>
                <textarea
                  value={announcementInput}
                  onChange={(e) => setAnnouncementInput(e.target.value)}
                  placeholder="Nhập nội dung thông báo..."
                  className="w-full h-32 p-3 mb-4 border rounded"
                />
                <button
                  onClick={handleSendAnnouncement}
                  className="px-6 py-2 text-white bg-red-500 rounded hover:bg-red-600"
                >
                  Gửi thông báo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatInterface;
