import React, { useEffect } from 'react';

const ChatWindow = ({ 
  currentRoom, 
  messages, 
  messageInput, 
  onMessageInputChange, 
  onSendMessage, 
  onDeleteMessage ,
  messageEndRef
}) => {

    useEffect(() => {
        if (messageEndRef?.current) {
          setTimeout(() => {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }, 50); 
        }
      }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage();
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm">
      <div className="p-4 border-b bg-gradient-to-r from-red-50 to-red-100">
        <h2 className="font-semibold text-gray-800">
          {currentRoom ? currentRoom.display_name : 'Chưa chọn phòng'}
        </h2>
        {currentRoom && (
          <p className="text-sm text-gray-600">
            Room ID: {currentRoom.id}
          </p>
        )}
      </div>
      
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-gray-500">
              {currentRoom ? 'Không có tin nhắn.' : 'Chọn một phòng để bắt đầu chat'}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={message.id || index} className="relative p-3 rounded-lg group hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1 space-x-2">
                    <span className="font-semibold text-gray-800">
                      {message.sender_username || message.sender}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(message.created_at || message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">{message.content}</div>
                </div>
                <button
                  className="p-1 text-red-500 transition-all rounded opacity-0 group-hover:opacity-100 hover:bg-red-100"
                  onClick={() => onDeleteMessage(index)}
                  title="Xóa tin nhắn"
                >
                  ✖
                </button>
              </div>
            </div>
          ))
        )}
        <div ref={messageEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="flex p-4 border-t bg-gray-50">
        <input
          className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          value={messageInput}
          onChange={(e) => onMessageInputChange(e.target.value)}
          placeholder="Nhập tin nhắn..."
          disabled={!currentRoom}
        />
        <button 
          type="submit" 
          disabled={!currentRoom || !messageInput.trim()}
          className="px-6 text-white transition-colors bg-red-500 rounded-r-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Gửi
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;