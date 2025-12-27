import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getUser } from '../api';
import { io } from 'socket.io-client';
import api, { API_BASE, toggleMessageReaction, deleteMessage as apiDeleteMessage } from '../api';
import Navbar from '../components/Navbar';
import EmojiPickerModal from '../components/EmojiPickerModal';
import dayjs from 'dayjs';
import { User, Image as ImageIcon, Search, ChevronDown } from 'lucide-react';

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
    if (!token) return;
    socketRef.current = io(API_BASE.replace('/api',''), { auth: { token } });
    const s = socketRef.current;

    s.on('connect_error', (err) => console.error('Socket connect error:', err));

    s.on('receive_message', (msg) => {
      if (activeFriend && (msg.sender_id === activeFriend.id || msg.receiver_id === activeFriend.id)) {
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
    api.get('/api/friends')
      .then(res => setFriends(res.data.friends || []))
      .catch(err => console.error('Friends load error', err));
  }, []);

  const params = useParams();

  useEffect(() => {
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
    if (!activeFriend) return;
    api.get(`/api/messages/${activeFriend.id}`)
      .then(async res => {
        const msgs = res.data.messages || [];
        setMessages(msgs);
        // fetch reactions for each message
        const map = {};
        await Promise.all(msgs.map(m =>
          api.get(`/api/messages/${m.id}/reactions`).then(r => { map[m.id] = r.data.reactions; }).catch(() => { map[m.id] = []; })
        ));
        setReactionsMap(map);
      })
      .catch(err => console.error('Messages load error', err));
  }, [activeFriend]);

  const sendMessage = () => {
    const hasText = text.trim().length > 0;
    if (!activeFriend || !socketRef.current || !hasText) return;
    socketRef.current.emit('send_message', {
      receiverId: activeFriend.id,
      content: text.trim(),
      messageType: 'text',
      mediaUrl: null,
    });
    setText('');
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
        <p className="text-gray-500 text-lg">Please log in to access chat.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-56px)] pt-2 bg-gray-50 relative" onClick={() => { if (pickerOpenFor) setPickerOpenFor(null); if (contextMenu.open) setContextMenu({ open: false, x: 0, y: 0, messageId: null, isMine: false }); }}>
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
                  const isGif = msg.message_type === 'gif' || msg.media_url;
                  const reactions = reactionsMap[msg.id] || [];
                  const bubbleBase = 'max-w-xs break-words rounded-lg shadow';
                  const bubbleStyle = isGif
                    ? 'bg-white text-gray-800 border border-gray-200 p-2'
                    : `${isMine ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'} px-4 py-2`;
                  const timeColor = isGif ? 'text-gray-500' : 'text-gray-100';

                  return (
                    <div key={msg.id + '-' + idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ open: true, x: e.clientX, y: e.clientY, messageId: msg.id, isMine: Number(msg.sender_id) === Number(currentUser.id) });
                        }}
                        className={`${bubbleBase} ${bubbleStyle}`}
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
                          <p>{msg.content}</p>
                        )}
                        <span className={`text-xs mt-1 block text-right ${timeColor}`}>
                          {dayjs(msg.created_at).format('HH:mm, DD MMM')}
                        </span>

                        {/* Reactions row */}
                        <div className="flex gap-2 mt-2">
                          {reactions.map(r => (
                            <button
                              key={r.emoji}
                              onClick={() => toggleMessageReaction(msg.id, r.emoji).catch(() => alert('Failed to toggle reaction'))}
                              className={`px-2 py-0.5 rounded-full border ${r.reacted_by_me ? 'bg-white text-black' : 'bg-white text-gray-700'}`}
                            >
                              {r.emoji} <span className="ml-1 text-xs">{r.count}</span>
                            </button>
                          ))}

                        </div>

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

              {/* GIF Toggle Button */}
              <div className="p-2 border-t bg-white flex items-center justify-between">
                <button
                  onClick={() => setGifPanelOpen(!gifPanelOpen)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition text-gray-700"
                  title="Toggle GIF search"
                >
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">GIFs</span>
                </button>
              </div>

              {/* GIF Search Panel */}
              {gifPanelOpen && (
                <div className="p-3 border-t bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      value={gifQuery}
                      onChange={handleGifQueryChange}
                      placeholder="Search GIFs..."
                      autoFocus
                      className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                    />
                    <button
                      onClick={() => {
                        setGifPanelOpen(false);
                        setGifQuery('');
                        setGifResults([]);
                      }}
                      className="p-2 hover:bg-gray-200 rounded transition text-gray-700"
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
                  className="absolute z-50 bg-white rounded shadow-md border p-2 text-sm"
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
