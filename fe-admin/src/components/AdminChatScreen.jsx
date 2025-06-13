import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import QuickSeen from "./QuickSeen";
import TabChange from "./TabChange";
import Notification from "./Notification";
import UserList from "./UserList";
import ChatWindow from "./ChatWindow";

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
    if (currentRoom && !chatRooms.find(r => r.id === currentRoom.id)) {
      setCurrentRoom(null);
    }
  }, [chatRooms, currentRoom]);

  const handleUserClick = (userId) => {
    const room = chatRooms.find(room => room.owner_id === userId);
    if (room) {
      setCurrentRoom(room);
      onJoinRoom(room.id);
    } else {
      alert("Không tìm thấy phòng của user này.");
    }
  };

  const handleSendMessage = () => {
    if (!currentRoom) {
      alert("Chưa chọn phòng chat");
      return;
    }
    if (!messageInput.trim()) return;
    
    onSendMessage(messageInput.trim());
    setMessageInput('');
  };

  const handleSendAnnouncement = () => {
    if (!announcementInput.trim()) return;
    
    onSendAnnouncement(announcementInput.trim());
    setAnnouncementInput('');
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleMessageInputChange = (value) => {
    setMessageInput(value);
  };

  const handleAnnouncementInputChange = (value) => {
    setAnnouncementInput(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header 
        currentUser={currentUser}
        connectionStatus={connectionStatus}
        onLogout={onLogout}
      />

      <div className="p-6 mx-auto max-w-7xl">
        <QuickSeen 
          onlineUsers={onlineUsers}
          messages={messages}
        />

        <TabChange 
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)]">
          <div className="space-y-4 lg:col-span-1">
            <UserList 
              onlineUsers={onlineUsers}
              onUserClick={handleUserClick}
            />
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'chat' && (
              <ChatWindow
                currentRoom={currentRoom}
                messages={messages}
                messageInput={messageInput}
                onMessageInputChange={handleMessageInputChange}
                onSendMessage={handleSendMessage}
                onDeleteMessage={onDeleteMessage}
                messageEndRef={messageEndRef}
              />
            )}

            {activeTab === 'users' && (
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">👥 Quản lý người dùng</h3>
                <div className="space-y-4">
                  {onlineUsers.length === 0 ? (
                    <p className="text-gray-500">Không có người dùng online</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {onlineUsers.map(user => (
                        <div key={user.id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{user.username}</h4>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                user.user_type === 'admin' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.user_type}
                              </span>
                            </div>
                            {user.user_type === 'user' && (
                              <div className="space-x-2">
                                <button
                                  onClick={() => handleUserClick(user.id)}
                                  className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                                >
                                  Chat
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Bạn có chắc muốn kick user này?')) {
                                      console.log('Kick user:', user.id);
                                    }
                                  }}
                                  className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                                >
                                  Kick
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'announce' && (
              <Notification
                announcementInput={announcementInput}
                onAnnouncementInputChange={handleAnnouncementInputChange}
                onSendAnnouncement={handleSendAnnouncement}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatInterface;