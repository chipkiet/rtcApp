
import Image from '../assests/image.png';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [userType, setUserType] = useState(''); // customer or seller
  const [chatPartner, setChatPartner] = useState('');
  const [availablePartner, setAvailablePartner] = useState([]);
  const [currentChatRoom, setCurrenChatRoom] = useState('');
  const [chatRequests, setChatRequests] =useState([]);
  const messageEndRef = useRef(null);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  //thiet lap cac event listener tu socker.io

  useEffect(() => {
    //nhan duoc lich su chat khi moi tham gia : 
    socket.on('chat_history', (chatHistory) => {
        setMessages(chatHistory);
    });

    // nhan thong bao khi co nguoi tham gia
    socket.on('user_joined', (data) => {
        setMessages(prev => [...prev, data.message]);
    });
    //nhan them tin nhan moi 
    socket.on('received_message', (message) => {
        setMessages(prev => [...prev, message]);
    });

    // nhan thong bao khi co nguoi nhap : 
    socket.on('user_typing', (data) => {
        setIsTyping(true);
        setTypingUser(data.username);
    });

    //thong bao khi nguoi dung ngung nhap 
    socket.on('user_stop_typing', () => {
        setIsTyping(false);
        setTypingUser('');
    });


    // danh sach cac doi tac (partner) co the chat
    socket.on('')

    // nhan thong bao khi co nguoi ngat ket noi (roi di)
    socket.on('user_left', (data) => {
        setMessages(prev => [...prev, data.message]);

    });



    return () => {
        socket.off('chat_history');
        socket.off('user_joined');
        socket.off('received_message');
        socket.off('user_typing');
        socket.off('user_stop_typing');
        socket.off('user_left');

    }

  }, []);

  // Xu ly dang nhap
  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()){
        setIsLoggedIn(true);
        socket.emit('user_join', username);
    }
  };

  // xu ly gui tin nhan
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
        // gui tin nhan den server
        socket.emit('send_message', {text: newMessage});
        setNewMessage('');
    }
  };

  //xu ly qua trinh nhap (typing)
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    //thong bao dang nhap 
    socket.emit('typing');

    //clear timeout hien taij (neu co)
    if(typingTimeout) clearTimeout(typingTimeout);

    //dat timeout moi 
    const timeout = setTimeout(() => {
        socket.emit('stop_typing');
    }, 1000);

    setTypingTimeout(timeout);
  }

  // Format thời gian
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // hien thi man hinh de dang nhap
  if (!isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Đăng nhập vào Phòng Chat</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Nhập tên của bạn"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mb-4 w-full rounded-md border border-gray-300 px-4 py-3 focus:border-green-500 focus:outline-none"
              required
            />
            <button 
              type="submit"
              className="w-full rounded-md bg-green-500 py-3 text-white transition-colors hover:bg-green-600 focus:outline-none"
            >
              Vào chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* header */}
      <div className="flex items-center justify-between bg-pink-300 px-4 py-4 text-white">
        <h2 className="text-xl font-bold">Phòng Chat</h2>
        <div className="text-sm">Xin chào, {username}</div>
      </div>
      
      {/* tin nhan */}
      <div
        className="flex-1 overflow-y-auto bg-cover bg-center p-4"
        style={{ backgroundImage: `url(${Image})` }}
        >
        
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`mb-4 max-w-[70%] break-words rounded-lg px-4 py-2 ${
              message.sender === username 
                ? 'ml-auto rounded-tr-none bg-green-100 text-gray-800' 
                : message.sender === 'system' 
                  ? 'mx-auto bg-gray-200 italic text-gray-600' 
                  : 'mr-auto rounded-tl-none bg-white text-gray-800'
            }`}
          >
            {message.sender !== 'system' && message.sender !== username && (
              <div className="mb-1 text-xs font-bold text-gray-600">{message.sender}</div>
            )}
            <div>{message.text}</div>
            <div className="mt-1 text-right text-xs text-gray-500">{formatTime(message.timestamp)}</div>
          </div>
        ))}

        {/* thong bao dang login */}
        {isTyping && (
            <div className='text-xs italic text-gray-500'> ngài {typingUser} đang nhập ..... </div>
        )}

        <div ref={messageEndRef} />
      </div>
      
      {/* form dang nhap*/}
      <form 
        className="flex border-t border-gray-300 bg-white p-4" 
        onSubmit={handleSendMessage}
      >
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={newMessage}
          onChange={handleTyping}
          className="mr-2 flex-1 rounded-md border border-gray-300 px-4 py-2 mr-2 focus:border-green-500 focus:outline-none"
        />
        <button 
          type="submit"
          className="rounded-md bg-pink-300 px-6 py-2 text-white transition-colors hover:bg-green-600 focus:outline-none"
        >
          Gửi
        </button>
      </form>
    </div>
  );
};

export default ChatApp;