import {useState , useEffect, useRef} from "react"
import io from "socket.io-client"

const socket = io("http://localhost:5000", {
    autoConnect: true,
    transports: ["websocket"]
})

const ChatApp = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);

    const [loginForm, setLoginForm] = useState({
        username: '',
        email: '',
        userType: 'user' // Hoặc có thể là admin
    });

    const messageEndRef = useRef(null);

    //auto cuon xuong khi message den
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, [messages]);


    //noi socket lang nghe cac su kien gui tu backend ve
    useEffect(() => { 

        const handleConnect = () => {
            console.log('Connected to server');
            setConnectionStatus('connected');
            setError('');
        }

        const handleDisconnect = () => {
            console.log('Disconnected from server');
            setConnectionStatus('disconnect');
            setError('Mất kết nối với server');
            setIsLoggedIn(false);
            setCurrentUser(null);
        }

        const handleUserAuthenticated = (userData) => {
            console.log('User authenticated:', userData);
            setCurrentUser(userData);
            setIsLoggedIn(true);
            setIsLoading(false);
            setError('');
        }

        const handleAuthenticationError = (error) => {
            console.error('Authentication error:', error);
            setError(error.message || 'Lỗi xác thực');
            setIsLoading(false);
        }

        const handleOnlineUserUpdate = (users) => {
            console.log('Online users updated:', users);
            setOnlineUsers(users);
        }

        const handleChatRoomsUpdate = (rooms) => {
            console.log('Chat rooms updated:', rooms);
            setChatRooms(rooms);
          };


        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('user_authenticated', handleUserAuthenticated);
        socket.on('authentication_error', handleAuthenticationError);
        socket.on('online_users_update', handleOnlineUserUpdate);
        socket.on('chat_rooms_update', handleChatRoomsUpdate);



        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('user_authenticated', handleUserAuthenticated);
            socket.off('authentication_error', handleAuthenticationError);
            socket.off('online_users_update', handleOnlineUserUpdate);
            socket.off('chat_rooms_update', handleChatRoomsUpdate);
          };

    }, []);


    //status có hay không sự tồn tại 
    const ConnectionStatus = () => (
        <div className={`text-xs px-2 py-1 rounded-full ${
          connectionStatus === 'connected' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {connectionStatus === 'connected' ? '● Đã kết nối' : '● Mất kết nối'}
        </div>
      );

      // hiển thị các lỗi
    const ErrorDisplay = () => {
        if (!error) return null;
        
        return (
          <div className="p-3 mb-4 border border-red-200 rounded-lg bg-red-50">
            <div className="text-sm text-red-800">{error}</div>
            <button 
              onClick={() => setError('')}
              className="mt-2 text-xs text-red-600 hover:text-red-800"
            >
              Đóng
            </button>
          </div>
        );
    };

    const handleLogin =(e) => {
        e.preventDefault();
        if(loginForm.username.trim() && loginForm.email.trim()){
            setIsLoading(true);
            setError('');

            socket.emit('authenticate', {
                username: loginForm.username.trim(),
                email: loginForm.email.trim(),
                user_type:  loginForm.userType
            });
        }
        else {
            setError('Vui lòng nhập đầy đủ thông tin');
          }
    };

    const handleLogout = () => {
        socket.disconnect();
        setIsLoggedIn(false);
        setCurrentUser(null);
        setOnlineUsers([]);
        setChatRooms([]);
        setMessages([]);
        setLoginForm({ username: '', email: '', userType: 'user' });
        socket.connect(); // reconnect socket for next login
    }
    
    if(!isLoggedIn) {
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
                    <form onSubmit={handleLogin} className="space-y-4">

                        <div>
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
                                    type="text"
                                    placeholder="Email nguoi dung"
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
                                disabled={isLoading || connectionStatus !== 'connected'} // vo hieu hoa nut hay khong deu dua vao isLoading va connected 
                                >
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }


    //chat interface sau khi dang nhap thanh cong

    return (
        <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl px-4 py-3 mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-800">Chat App</h1>
              <ConnectionStatus />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Xin chào, {currentUser?.username}
                {currentUser?.user_type === 'admin' && (
                  <span className="px-2 py-1 ml-2 text-xs text-purple-700 bg-purple-100 rounded-full">
                    Admin
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm text-red-600 transition-colors border border-red-300 rounded hover:text-red-800 hover:border-red-400"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl p-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
          {/* Sidebar - Online Users & Chat Rooms */}
          <div className="p-4 bg-white rounded-lg shadow-sm lg:col-span-1">
            <div className="mb-4">
              <h3 className="mb-2 font-semibold text-gray-800">
                Người dùng online ({onlineUsers.length})
              </h3>
              <div className="space-y-2 overflow-y-auto max-h-32">
                {onlineUsers.map((user, index) => (
                  <div key={user.id || index} className="flex items-center p-2 space-x-2 rounded hover:bg-gray-50">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{user.username}</span>
                    {user.user_type === 'admin' && (
                      <span className="text-xs text-purple-600">Admin</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {currentUser?.user_type === 'admin' && (
              <div>
                <h3 className="mb-2 font-semibold text-gray-800">
                  Phòng chat ({chatRooms.length})
                </h3>
                <div className="space-y-2 overflow-y-auto max-h-40">
                  {chatRooms.map((room, index) => (
                    <div key={room.id || index} className="p-2 rounded cursor-pointer hover:bg-gray-50">
                      <span className="text-sm text-gray-700">Room #{room.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="flex flex-col bg-white rounded-lg shadow-sm lg:col-span-3">
            {/* Chat Header */}
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">General Chat</h2>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-blue-500 rounded-full">
                          {message.sender?.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-1 space-x-2">
                          <span className="font-medium text-gray-800">{message.sender}</span>
                          <span className="text-xs text-gray-500">{message.timestamp}</span>
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messageEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button className="px-6 py-2 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600">
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );

}

export default ChatApp;