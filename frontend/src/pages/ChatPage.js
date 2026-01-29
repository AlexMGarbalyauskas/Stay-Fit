import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser } from '../api';
import { io } from 'socket.io-client';
import api, { API_BASE, toggleMessageReaction, deleteMessage as apiDeleteMessage } from '../api';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import EmojiPickerModal from '../components/EmojiPickerModal';
import dayjs from 'dayjs';
import { User, Image as ImageIcon, Search, ChevronDown, Lock, MessageCircle, Dumbbell } from 'lucide-react';
import { encryptMessage, decryptMessage, isEncryptionReady } from '../utils/crypto';
import { useLanguage } from '../context/LanguageContext';

export default function ChatPage() {
  const { t } = useLanguage();
  const isDark = document.documentElement.classList.contains('dark');
  const navigate = useNavigate();
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('user'));
  } catch {}
  const token = localStorage.getItem('token');
  const isAuthenticated = !!(token && currentUser);

  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [selectedGifId, setSelectedGifId] = useState(null);
  const [lastGifQuery, setLastGifQuery] = useState('');
  const [gifPanelOpen, setGifPanelOpen] = useState(false);
  const [reactionsMap, setReactionsMap] = useState({}); // { messageId: [{emoji,count,reacted_by_me}] }
  const gifSearchTimeoutRef = useRef(null);
  const [pickerOpenFor, setPickerOpenFor] = useState(null);
  const [pickerContextIsMine, setPickerContextIsMine] = useState(false);
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, messageId: null, isMine: false });
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) return;
    socketRef.current = io(API_BASE.replace('/api',''), { auth: { token } });
    const s = socketRef.current;

    s.on('connect_error', (err) => console.error('Socket connect error:', err));

    s.on('receive_message', async (msg) => {
      if (activeFriend && (msg.sender_id === activeFriend.id || msg.receiver_id === activeFriend.id)) {
        // Decrypt message if encrypted
        if (msg.is_encrypted && msg.encrypted_content && msg.iv) {
          try {
            const decrypted = await decryptMessage(
              msg.encrypted_content,
              msg.iv,
              msg.sender_id,
              msg.receiver_id
            );
            msg.content = decrypted;
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            msg.content = '[Encrypted message - unable to decrypt]';
          }
        }
        
        setMessages(prev => [...prev, msg]);
        // fetch reactions for new message
        api.get(`/api/messages/${msg.id}/reactions`).then(r => {
          setReactionsMap(prev => ({ ...prev, [msg.id]: r.data.reactions }));
        }).catch(() => {});
      }
    });

    // listen for reaction updates
    s.on('reaction:update', ({ messageId, reactions }) => {
      setReactionsMap(prev => ({ ...prev, [messageId]: reactions }));
    });

    s.on('message:deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setReactionsMap(prev => { const copy = { ...prev }; delete copy[messageId]; return copy; });
    });

    return () => s.disconnect();
  }, [token, activeFriend]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/api/friends')
      .then(res => setFriends(res.data.friends || []))
      .catch(err => console.error('Friends load error', err));
  }, []);

  const params = useParams();

  useEffect(() => {
    if (!isAuthenticated) return;
    // If route param present, fetch and set active friend
    const userIdFromParams = params?.id;
    if (userIdFromParams) {
      // try to find in friends list first
      const found = friends.find(f => Number(f.id) === Number(userIdFromParams));
      if (found) setActiveFriend(found);
      else {
        getUser(userIdFromParams).then(r => setActiveFriend(r.data.user)).catch(() => {});
      }
    }
  }, [params?.id, friends]);

  useEffect(() => {
    if (!isAuthenticated || !activeFriend) return;
    api.get(`/api/messages/${activeFriend.id}`)
      .then(async res => {
        const msgs = res.data.messages || [];
        
        // Decrypt encrypted messages
        const decryptedMsgs = await Promise.all(
          msgs.map(async (msg) => {
            if (msg.is_encrypted && msg.encrypted_content && msg.iv) {
              try {
                const decrypted = await decryptMessage(
                  msg.encrypted_content,
                  msg.iv,
                  msg.sender_id,
                  msg.receiver_id
                );
                return { ...msg, content: decrypted };
              } catch (error) {
                console.error('Failed to decrypt message:', error);
                return { ...msg, content: '[Encrypted message - unable to decrypt]' };
              }
            }
            return msg;
          })
        );
        
        setMessages(decryptedMsgs);
        // fetch reactions for each message
        const map = {};
        await Promise.all(msgs.map(m =>
          api.get(`/api/messages/${m.id}/reactions`).then(r => { map[m.id] = r.data.reactions; }).catch(() => { map[m.id] = []; })
        ));
        setReactionsMap(map);
      })
      .catch(err => console.error('Messages load error', err));
  }, [activeFriend]);

  // Auth guard render
  if (!isAuthenticated) {
    return (
      <>
        <Header disableNotifications />
        <div className={`min-h-screen bg-gradient-to-br pb-24 pt-20 ${isDark ? 'from-gray-950 via-gray-900 to-gray-800' : 'from-slate-50 via-white to-slate-100'}`}>
          <div className="px-4 max-w-md mx-auto text-center mt-20">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-400 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                <MessageCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Chat with Friends</h1>
              <p className={`text-lg px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Please login to start chatting with your friends and share your fitness journey.</p>
            </div>
            
            <div className="flex flex-col gap-4 mt-12">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-blue-500 to-green-400 text-white py-4 rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-green-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className={`w-full border-2 py-4 rounded-2xl font-semibold text-lg transition-all shadow-md ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300'}`}
              >
                Create an Account
              </button>
            </div>

            <p className={`text-xs mt-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
        <Navbar />
      </>
    );
  }

  const sendMessage = async () => {
    const hasText = text.trim().length > 0;
    if (!activeFriend || !socketRef.current || !hasText) return;
    
    try {
      // Always encrypt messages if encryption is ready
      if (isEncryptionReady()) {
        const encrypted = await encryptMessage(
          text.trim(),
          currentUser.id,
          activeFriend.id
        );
        const messageData = {
          receiverId: activeFriend.id,
          content: '[Encrypted]', // Placeholder for non-encrypted viewers
          messageType: 'text',
          mediaUrl: null,
          encrypted: encrypted.encrypted,
          iv: encrypted.iv,
          isEncrypted: true
        };
        socketRef.current.emit('send_message', messageData);
      } else {
        // Fallback if encryption not ready (shouldn't happen)
        console.warn('Encryption not ready, sending unencrypted');
        socketRef.current.emit('send_message', {
          receiverId: activeFriend.id,
          content: text.trim(),
          messageType: 'text',
          mediaUrl: null,
          isEncrypted: false
        });
      }
      setText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  const sendGif = (url, gifId) => {
    if (!activeFriend || !socketRef.current || !url) return;
    socketRef.current.emit('send_message', {
      receiverId: activeFriend.id,
      content: '',
      messageType: 'gif',
      mediaUrl: url,
    });
    // Register share with Tenor (optional but recommended)
    if (gifId) {
      const tenorKey = process.env.REACT_APP_TENOR_KEY || 'LIVDSRZULELA';
      const clientKey = 'stayfit-web';
      console.log('Using Tenor key:', tenorKey); // verify env key is used
      fetch(`https://tenor.googleapis.com/v2/registershare?id=${gifId}&key=${tenorKey}&client_key=${clientKey}&q=${encodeURIComponent(lastGifQuery)}`)
        .catch(e => console.error('Failed to register Tenor share', e));
    }
    // Close GIF panel after send
    setGifPanelOpen(false);
    setGifQuery('');
    setGifResults([]);
  };

  const searchGifs = async (query) => {
    const q = (query || gifQuery).trim();
    if (!q) {
      setGifResults([]);
      return;
    }
    setGifLoading(true);
    try {
      const tenorKey = process.env.REACT_APP_TENOR_KEY || 'LIVDSRZULELA';
      const clientKey = 'stayfit-web';
      const resp = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${tenorKey}&client_key=${clientKey}&limit=12&contentfilter=medium`);
      const data = await resp.json();
      const urls = (data.results || []).map(item => ({ url: item.media_formats?.tinygif?.url, id: item.id })).filter(item => item.url);
      setGifResults(urls);
      setLastGifQuery(q);
    } catch (e) {
      console.error('GIF search failed', e);
      setGifResults([]);
    } finally {
      setGifLoading(false);
    }
  };

  const handleGifQueryChange = (e) => {
    const val = e.target.value;
    setGifQuery(val);
    clearTimeout(gifSearchTimeoutRef.current);
    if (val.trim()) {
      gifSearchTimeoutRef.current = setTimeout(() => searchGifs(val), 300);
    } else {
      setGifResults([]);
    }
  };

  if (!currentUser || !token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg">{t('pleaseLogin')}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`flex h-[calc(100vh-56px)] pt-2 bg-gradient-to-br relative ${isDark ? 'from-gray-950 via-gray-900 to-gray-800 text-gray-200' : 'from-slate-50 via-white to-slate-100 text-slate-800'}`} onClick={() => { if (pickerOpenFor) setPickerOpenFor(null); if (contextMenu.open) setContextMenu({ open: false, x: 0, y: 0, messageId: null, isMine: false }); }}>
        <div className={`w-1/3 border-r overflow-y-auto ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}>
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
              <div>
                <span className="font-medium">{friend.nickname || friend.username}</span>
                {friend.nickname && <span className="text-xs text-gray-500 block">@{friend.username}</span>}
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          {!activeFriend ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              {t('selectFriendToChat')}
            </div>
          ) : (
            <>
              <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}>
                <div>
                  <div className="font-semibold text-lg">{activeFriend.nickname || activeFriend.username}</div>
                  <div className="text-xs text-gray-500">@{activeFriend.username}</div>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                    isDark
                      ? 'bg-green-900/30 text-green-400 border border-green-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                  title="End-to-end encrypted - Messages are secure"
                >
                  <Lock className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('encrypted')}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, idx) => {
                  const isMine = Number(msg.sender_id) === Number(currentUser.id);
                  const isGif = msg.message_type === 'gif' || msg.media_url;
                  const reactions = reactionsMap[msg.id] || [];
                  const senderProfilePic = isMine ? currentUser.profile_picture : activeFriend.profile_picture;
                  const profilePicSrc = senderProfilePic?.startsWith('http') ? senderProfilePic : senderProfilePic ? `${API_BASE}${senderProfilePic}` : null;

                  return (
                    <div key={msg.id + '-' + idx} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Profile Picture */}
                      <div className="flex-shrink-0 self-end">
                        {profilePicSrc ? (
                          <img
                            src={profilePicSrc}
                            alt={isMine ? 'You' : activeFriend.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className="max-w-xs">
                        <div
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ open: true, x: e.clientX, y: e.clientY, messageId: msg.id, isMine: Number(msg.sender_id) === Number(currentUser.id) });
                          }}
                          className={`rounded-2xl px-4 py-2 shadow-sm break-words inline-block ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : isDark
                              ? 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
                              : 'bg-gray-100 text-gray-900 rounded-bl-none'
                          }`}
                        >
                          {isGif ? (
                            <div className="space-y-2">
                              {msg.content && msg.content !== '[gif]' && <p>{msg.content}</p>}
                              {msg.media_url && (
                                <img
                                  src={msg.media_url}
                                  alt="GIF"
                                  className="max-h-72 rounded-lg object-contain"
                                />
                              )}
                            </div>
                          ) : (
                            <p className="text-sm">{msg.content}</p>
                          )}
                          <span className={`text-xs mt-1 block text-right opacity-70`}>
                            {dayjs(msg.created_at).format('HH:mm')}
                          </span>

                          {/* Reactions row */}
                          {reactions.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {reactions.map(r => (
                                <button
                                  key={r.emoji}
                                  onClick={() => toggleMessageReaction(msg.id, r.emoji).catch(() => alert('Failed to toggle reaction'))}
                                  className={`px-2 py-0.5 rounded-full text-xs border transition ${
                                    r.reacted_by_me
                                      ? 'bg-white/30 border-white/50'
                                      : isMine
                                      ? 'bg-blue-700/50 border-blue-500/50'
                                      : isDark
                                      ? 'bg-gray-700 border-gray-600'
                                      : 'bg-gray-200 border-gray-300'
                                  }`}
                                >
                                  {r.emoji} {r.count}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className={`p-3 border-t flex gap-2 items-center flex-wrap ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder={t('typeMessage')}
                  className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300 min-w-[150px]"
                />
                <button
                  onClick={() => setGifPanelOpen(!gifPanelOpen)}
                  className={`inline-flex items-center gap-1 p-2 rounded transition ${isDark ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
                  title="Toggle GIF search"
                >
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                </button>
                <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  {t('send')}
                </button>
              </div>

              {/* GIF Search Panel */}
              {gifPanelOpen && (
                <div className={`p-3 border-t ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      value={gifQuery}
                      onChange={handleGifQueryChange}
                      placeholder={t('searchGif')}
                      autoFocus
                      className={`flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300 ${isDark ? 'bg-gray-900 border-gray-700 text-gray-200' : ''}`}
                    />
                    <button
                      onClick={() => {
                        setGifPanelOpen(false);
                        setGifQuery('');
                        setGifResults([]);
                      }}
                      className={`p-2 rounded transition ${isDark ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-200 text-gray-700'}`}
                      title="Close GIF search"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>

                  {gifLoading && <p className="text-sm text-gray-500">Searching...</p>}
                  {!gifLoading && gifResults.length > 0 && (
                    <div className="max-h-72 overflow-y-auto pr-1">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {gifResults.map((item, idx) => (
                          <button key={idx} onClick={() => { setSelectedGifId(item.id); sendGif(item.url, item.id); }} className="relative group">
                            <img src={item.url} alt="GIF" className="w-full h-28 object-cover rounded" />
                            <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition text-white text-xs flex items-center justify-center">Send</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {!gifLoading && gifResults.length === 0 && gifQuery && (
                    <p className="text-xs text-gray-500 mt-1">No GIFs found.</p>
                  )}
                </div>
              )}

              {/* Emoji picker modal for reactions */}
              {pickerOpenFor && (
                <EmojiPickerModal
                  open={!!pickerOpenFor}
                  showDelete={pickerContextIsMine}
                  onClose={() => setPickerOpenFor(null)}
                  onSelect={(emoji) => {
                    toggleMessageReaction(pickerOpenFor, emoji)
                      .catch(() => alert('Failed to add reaction'))
                      .finally(() => setPickerOpenFor(null));
                  }}
                  onDelete={async () => {
                    try {
                      await apiDeleteMessage(pickerOpenFor);
                      setMessages(prev => prev.filter(m => m.id !== pickerOpenFor));
                    } catch (err) {
                      alert('Failed to delete message');
                    } finally {
                      setPickerOpenFor(null);
                    }
                  }}
                />
              )}


              {/* Context menu for message actions */}
              {contextMenu.open && (
                <div
                  className={`absolute z-50 rounded shadow-md border p-2 text-sm ${isDark ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white'}`}
                  style={{ left: contextMenu.x, top: contextMenu.y }}
                  onMouseLeave={() => setContextMenu({ open: false, x: 0, y: 0, messageId: null, isMine: false })}
                >
                  <button
                    className="block px-3 py-1 hover:bg-gray-100 w-full text-left"
                    onClick={() => { setPickerOpenFor(contextMenu.messageId); setPickerContextIsMine(contextMenu.isMine); setContextMenu({ open: false, x: 0, y: 0, messageId: null, isMine: false }); }}
                  >
                    React
                  </button>
                  {contextMenu.isMine && (
                    <button
                      className="block px-3 py-1 hover:bg-gray-100 w-full text-left text-red-600"
                      onClick={async () => {
                        try {
                          await apiDeleteMessage(contextMenu.messageId);
                          setMessages(prev => prev.filter(m => m.id !== contextMenu.messageId));
                          setContextMenu({ open: false, x: 0, y: 0, messageId: null, isMine: false });
                        } catch (err) {
                          alert('Failed to delete message');
                        }
                      }}
                    >
                      Delete Message
                    </button>
                  )}
                </div>
              )}


            </>
          )}
        </div>
      </div>
      <Navbar />
    </>
  );
}
