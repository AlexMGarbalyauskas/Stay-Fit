import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api, { API_BASE } from '../api';
import Navbar from '../components/Navbar';
import dayjs from 'dayjs';
import { User } from 'lucide-react';

export default function ChatPage() {
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('user'));
  } catch {}
  const token = localStorage.getItem('token');

  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!token) return;
    socketRef.current = io(API_BASE.replace('/api',''), { auth: { token } });
    const s = socketRef.current;

    s.on('connect_error', (err) => console.error('Socket connect error:', err));

    s.on('receive_message', (msg) => {
      if (activeFriend && (msg.sender_id === activeFriend.id || msg.receiver_id === activeFriend.id)) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => s.disconnect();
  }, [token, activeFriend]);

  useEffect(() => {
    api.get('/api/friends')
      .then(res => setFriends(res.data.friends || []))
      .catch(err => console.error('Friends load error', err));
  }, []);

  useEffect(() => {
    if (!activeFriend) return;
    api.get(`/api/messages/${activeFriend.id}`)
      .then(res => setMessages(res.data.messages || []))
      .catch(err => console.error('Messages load error', err));
  }, [activeFriend]);

  const sendMessage = () => {
    if (!text.trim() || !activeFriend || !socketRef.current) return;
    socketRef.current.emit('send_message', { receiverId: activeFriend.id, content: text });
    setText('');
  };

  if (!currentUser || !token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg">Please log in to access chat.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-56px)] pt-2 bg-gray-50">
        <div className="w-1/3 border-r overflow-y-auto bg-white">
          {friends.map(friend => (
            <button
              key={friend.id}
              onClick={() => setActiveFriend(friend)}
              className={`w-full text-left px-4 py-3 border-b hover:bg-gray-100 flex items-center gap-3 ${activeFriend?.id === friend.id ? 'bg-gray-100' : ''}`}
            >
              {friend.profile_picture ? (
                <img
                  src={friend.profile_picture.startsWith('http') ? friend.profile_picture : `${API_BASE}${friend.profile_picture}`}
                  alt={friend.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <span className="font-medium">{friend.username}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          {!activeFriend ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a friend to start chatting
            </div>
          ) : (
            <>
              <div className="p-4 border-b bg-white font-semibold text-lg">{activeFriend.username}</div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg, idx) => {
                  const isMine = Number(msg.sender_id) === Number(currentUser.id);
                  return (
                    <div key={msg.id + '-' + idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-4 py-2 rounded-lg max-w-xs break-words shadow ${isMine ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}`}>
                        <p>{msg.content}</p>
                        <span className="text-xs text-gray-100 mt-1 block text-right">
                          {dayjs(msg.created_at).format('HH:mm, DD MMM')}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t bg-white flex gap-2">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                />
                <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <Navbar />
    </>
  );
}
