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
    userType: 'admin' // admin only
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginForm.username.trim() && loginForm.email.trim()) {
      onLogin({
        username: loginForm.username.trim(),
        email: loginForm.email.trim(),
        user_type: 'admin' // always admin
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
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Quản trị viên</h2>
          <p className="text-gray-600">Truy cập bảng điều khiển admin</p>
        </div>

        <div className="flex justify-center mb-4">
          <ConnectionStatus />
        </div>

        <ErrorDisplay />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Tên quản trị viên"
              value={loginForm.username}
              onChange={(e) => setLoginForm(prev => ({...prev, username: e.target.value}))}
              className="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:shadow-sm"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="Email quản trị viên"
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({...prev, email: e.target.value}))}
              className="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:shadow-sm"
              required
              disabled={isLoading}
            />
          </div>

          {/* Admin type is shown and fixed */}
          <div className="p-3 border border-purple-200 rounded-lg bg-purple-50">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6 mr-3 bg-purple-600 rounded-full">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99.23-.132a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l.23.132 1.734.99A.996.996 0 0118 6v2a1 1 0 11-2 0v-.277l-1.254.145a1 1 0 11-.992-1.736L14.984 6l-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.723V12a1 1 0 11-2 0v-1.277l-1.246-.855a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.277l1.254.855a1 1 0 11-.992 1.736L3.5 15.132A.996.996 0 013 14.5V12a1 1 0 011-1zm14 0a1 1 0 011 1v2.5a.996.996 0 01-.504.868l-.762.436a1 1 0 11-.992-1.736L16.5 14.277V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-purple-800">Đăng nhập với quyền quản trị viên</span>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || connectionStatus !== 'connected'}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Truy cập Admin'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Bạn là người dùng thông thường? 
            <a href="/user" className="ml-1 text-purple-600 hover:text-purple-800">
              Tham gia Chat User
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;