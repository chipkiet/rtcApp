const UserList = ({ onlineUsers, onUserClick }) => {
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h3 className="mb-4 font-semibold">Online Users ({onlineUsers.length})</h3>
        <div className="space-y-2 overflow-y-auto max-h-64">
          {onlineUsers.length === 0 ? (
            <p className="text-sm text-gray-500">Không có user online</p>
          ) : (
            onlineUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.user_type}</p>
                </div>
                {user.user_type === 'user' && (
                    <button
                        onClick={() => onUserClick(user.id)}
                        className="px-2 py-1 text-xs text-blue-600 transition-colors border border-blue-300 rounded hover:bg-blue-50"
                    >
                    CHAT
                    </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };
  
  export default UserList;
  