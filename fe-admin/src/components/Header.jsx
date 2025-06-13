const Header = ({ currentUser, connectionStatus, onLogout }) => {
    const ConnectionStatus = () => (
      <div className={`text-xs px-3 py-1 rounded-full font-medium ${
        connectionStatus === 'connected' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        ● {connectionStatus === 'connected' ? 'Kết nối ổn định' : 'Mất kết nối'}
      </div>
    );
  
    return (
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
                  <h1 className="text-xl font-bold text-gray-800">ADMIN</h1>
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
    );
  };
  
  export default Header;
  