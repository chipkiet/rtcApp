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
    userType: 'user' // Fixed to user only
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginForm.username.trim() && loginForm.email.trim()) {
      onLogin({
        username: loginForm.username.trim(),
        email: loginForm.email.trim(),
        user_type: 'user' // Always user
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
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a3 3 0 01-3-3V4a3 3 0 013-3h4a3 3 0 013 3v4z" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Người dùng</h2>
          <p className="text-gray-600">Tham gia chat cùng mọi người</p>
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
              placeholder="Email người dưng"
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({...prev, email: e.target.value}))}
              className="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:shadow-sm"
              required
              disabled={isLoading}
            />
          </div>

          {/* User type is hidden and fixed to 'user' */}
          <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6 mr-3 bg-blue-600 rounded-full">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-blue-800">Đăng nhập với tư cách người dùng</span>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || connectionStatus !== 'connected'}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Tham gia Chat'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Bạn là quản trị viên? 
            <a href="/admin" className="ml-1 text-blue-600 hover:text-blue-800">
              Đăng nhập Admin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;