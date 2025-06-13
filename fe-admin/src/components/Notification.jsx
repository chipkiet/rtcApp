import React from 'react';

const Notification = ({ 
  announcementInput, 
  onAnnouncementInputChange, 
  onSendAnnouncement 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (announcementInput.trim()) {
      onSendAnnouncement();
    }
  };

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center mb-4 space-x-2">
        <span className="text-2xl">📢</span>
        <h3 className="text-lg font-semibold">Gửi thông báo</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={announcementInput}
          onChange={(e) => onAnnouncementInputChange(e.target.value)}
          placeholder="Nhập nội dung thông báo..."
          className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={4}
        />
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Thông báo sẽ được gửi đến tất cả người dùng online
          </p>
          <button
            type="submit"
            disabled={!announcementInput.trim()}
            className="px-6 py-2 text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Gửi thông báo
          </button>
        </div>
      </form>
    </div>
  );
};

export default Notification;