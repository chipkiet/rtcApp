import { useState } from 'react';

const LoginForm = ({ 
  onLogin, 
  isLoading, 
  error, 
  connectionStatus, 
  onClearError 
}) => {
  const [loginForm, setLoginForm] = useState({
    username: '',
    email: '',
    userType: 'user'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginForm.username.trim() && loginForm.email.trim()) {
      onLogin({
        username: loginForm.username.trim(),
        email: loginForm.email.trim(),
        user_type: loginForm.userType
      });
    }
  };

  const ConnectionStatus = () => (
    <div className={`text-xs px-2 py-1 rounded-full ${
      connectionStatus === 'connected' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {connectionStatus === 'connected' ? '● Đã kết nối' : '● Mất kết nối'}
    </div>
  );

  const ErrorDisplay = () => {
    if (!error) return null;
    
    return (
      <div className="p-3 mb-4 border border-red-200 rounded-lg bg-red-50">
        <div className="text-sm text-red-800">{error}</div>
        <button 
          onClick={onClearError}
          className="mt-2 text-xs text-red-600 hover:text-red-800"
        >
          Đóng
        </button>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-3xl font-bold text-gray-800">REAL TIME CHAT APP</h2>
          <p className="text-gray-600">Realtime Chat Application</p>
        </div>

        <div className="flex justify-center mb-4">
          <ConnectionStatus />
        </div>

        <ErrorDisplay />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Tên người dùng"
              value={loginForm.username}
              onChange={(e) => setLoginForm(prev => ({...prev, username: e.target.value}))}
              className="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:shadow-sm"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="Email người dùng"
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({...prev, email: e.target.value}))}
              className="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:shadow-sm"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block mb-3 text-sm font-medium text-gray-700">Loại tài khoản:</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="user"
                  checked={loginForm.userType === 'user'}
                  onChange={(e) => setLoginForm(prev => ({...prev, userType: e.target.value}))}
                  className="mr-2 text-blue-500"
                  disabled={isLoading}
                />
                <span className="select-none">Người dùng</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="admin"
                  checked={loginForm.userType === 'admin'}
                  onChange={(e) => setLoginForm(prev => ({...prev, userType: e.target.value}))}
                  className="mr-2 text-blue-500"
                  disabled={isLoading}
                />
                <span className="select-none">Admin</span>
              </label>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || connectionStatus !== 'connected'}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;