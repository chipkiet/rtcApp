import React from 'react';

const QuickSeen = ({ onlineUsers, messages }) => {
  const stats = [
    {
      title: 'Total Users Online',
      value: onlineUsers.length,
      icon: '👥',
      color: 'border-blue-500 bg-blue-50'
    },
    {
      title: 'Admin Users',
      value: onlineUsers.filter(u => u.user_type === 'admin').length,
      icon: '🛡️',
      color: 'border-red-500 bg-red-50'
    },
    {
      title: 'Regular Users',
      value: onlineUsers.filter(u => u.user_type === 'user').length,
      icon: '👤',
      color: 'border-green-500 bg-green-50'
    },
    {
      title: 'Total Messages',
      value: messages.length,
      icon: '💬',
      color: 'border-purple-500 bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div key={index} className={`p-4 rounded-lg border-l-4 ${stat.color} bg-white shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className="text-2xl">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickSeen;
