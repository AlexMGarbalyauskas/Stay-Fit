import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, getComments, createComment, toggleLike, toggleSave, deleteComment, toggleCommentLike } from '../api';
import { Heart, Bookmark, ArrowLeft, User as UserIcon, ChevronDown, ChevronUp, Smile, Image as ImageIcon } from 'lucide-react';
import { API_BASE } from '../api';
import EmojiPickerModal from '../components/EmojiPickerModal';

export default function PostComments() {
  const { id } = useParams();
  const postId = Number(id);
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedGif, setSelectedGif] = useState(null); // { url, id }
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [lastGifQuery, setLastGifQuery] = useState('');
  const [gifPanelOpen, setGifPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, commentId: null, isReply: false });
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const gifSearchTimeoutRef = useRef(null);

  useEffect(() => {
    // Get current user
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      setCurrentUser(user);
    } catch {}
  }, []);

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

  const selectGif = (url, id) => {
    setSelectedGif({ url, id });
    setGifPanelOpen(false);
    setGifQuery('');
    setGifResults([]);
    // Register share with Tenor (optional but recommended)
    if (id) {
      const tenorKey = process.env.REACT_APP_TENOR_KEY || 'LIVDSRZULELA';
      const clientKey = 'stayfit-web';
      fetch(`https://tenor.googleapis.com/v2/registershare?id=${id}&key=${tenorKey}&client_key=${clientKey}&q=${encodeURIComponent(lastGifQuery)}`)
        .catch(e => console.error('Failed to register Tenor share', e));
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const p = await getPost(postId);
        setPost(p.data.post);
        const c = await getComments(postId);
        setComments(c.data.comments || []);
      } catch (err) {
        console.error(err);
        if (err?.response?.status === 404) {
          try { window.dispatchEvent(new CustomEvent('post:deleted', { detail: { postId } })); } catch (e) {}
          alert('Post not found (it may have been deleted)');
          navigate('/home');
        } else {
          alert(err?.response?.data?.error || 'Failed to load post');
          navigate('/home');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [postId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasText = newComment.trim().length > 0;
    const hasGif = selectedGif !== null;
    if (!hasText && !hasGif) return;
    
    try {
      // Combine text and GIF URL if both present
      let content = newComment.trim();
      if (selectedGif) {
        content = content ? `${content}\n[GIF: ${selectedGif.url}]` : `[GIF: ${selectedGif.url}]`;
      }
      
      const res = await createComment(postId, content, replyingTo);
      const created = res.data.comment;
      const commentsCount = res.data.comments_count;
      
      if (replyingTo) {
        // Add reply to parent comment
        setComments(prev => prev.map(c => {
          if (c.id === replyingTo) {
            return {
              ...c,
              replies: [...(c.replies || []), { ...created, likes_count: 0, liked_by_me: false }]
            };
          }
          return c;
        }));
        setReplyingTo(null);
      } else {
        // Add top-level comment
        setComments(prev => [...prev, { ...created, replies: [], likes_count: 0, liked_by_me: false, replies_count: 0 }]);
      }
      
      setNewComment('');
      setSelectedGif(null);
      setPost(prev => ({ ...prev, comments_count: commentsCount }));
      window.dispatchEvent(new CustomEvent('post:commentsUpdated', { detail: { postId, commentsCount } }));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Failed to create comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await deleteComment(postId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPost(prev => ({ ...prev, comments_count: res.data.comments_count }));
      window.dispatchEvent(new CustomEvent('post:commentsUpdated', { detail: { postId, commentsCount: res.data.comments_count } }));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Failed to delete comment');
    }
  };

  const handleDeleteReply = async (parentId, replyId) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      const res = await deleteComment(postId, replyId);
      setComments(prev => prev.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: c.replies.filter(r => r.id !== replyId)
          };
        }
        return c;
      }));
      setPost(prev => ({ ...prev, comments_count: res.data.comments_count }));
      window.dispatchEvent(new CustomEvent('post:commentsUpdated', { detail: { postId, commentsCount: res.data.comments_count } }));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Failed to delete reply');
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await toggleCommentLike(postId, commentId);
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, liked_by_me: res.data.liked, likes_count: res.data.likes_count };
        }
        if (c.replies && c.replies.length > 0) {
          return {
            ...c,
            replies: c.replies.map(r => 
              r.id === commentId 
                ? { ...r, liked_by_me: res.data.liked, likes_count: res.data.likes_count }
                : r
            )
          };
        }
        return c;
      }));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Failed to like comment');
    }
  };

  const toggleRepliesExpanded = (commentId) => {
    const newSet = new Set(expandedReplies);
    if (newSet.has(commentId)) {
      newSet.delete(commentId);
    } else {
      newSet.add(commentId);
    }
    setExpandedReplies(newSet);
  };

  const CommentItem = ({ comment, isReply = false, parentId = null }) => {
    // Extract GIF URL from comment content if present
    const gifMatch = comment.content.match(/\[GIF: (https?[^\]]+)\]/);
    const gifUrl = gifMatch ? gifMatch[1] : null;
    const textContent = comment.content.replace(/\[GIF: https?[^\]]+\]/g, '').trim();
    
    return (
    <div 
      key={comment.id} 
      className={`flex gap-3 items-start ${isReply ? 'ml-8 bg-gray-25 border-l-2 border-gray-200' : 'bg-gray-50'} p-3 rounded`}
      onContextMenu={(e) => {
        e.preventDefault();
        if (currentUser?.id === comment.user_id) {
          setContextMenu({ open: true, x: e.clientX, y: e.clientY, commentId: comment.id, isReply });
        }
      }}
    >
      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
        {comment.profile_picture ? (
          <img src={`${comment.profile_picture.startsWith('http') ? '' : API_BASE}${comment.profile_picture}`} alt="u" className="w-full h-full object-cover" />
        ) : (
          <UserIcon className="w-4 h-4 text-gray-500" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{comment.nickname || comment.username}</div>
          {comment.nickname && <span className="text-xs text-gray-400">@{comment.username}</span>}
          {isReply && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">reply</span>}
        </div>
        <div className="text-sm text-gray-700 mt-1">
          {textContent && <p>{textContent}</p>}
          {gifUrl && <img src={gifUrl} alt="GIF" className="max-h-48 rounded-lg object-contain mt-2" />}
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <button
            onClick={() => handleLikeComment(comment.id)}
            className={`flex items-center gap-1 text-xs ${comment.liked_by_me ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
          >
            <Heart className="w-3 h-3" />
            <span>{comment.likes_count || 0}</span>
          </button>
          {!isReply && (
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-xs text-gray-400 hover:text-blue-600"
            >
              Reply
            </button>
          )}
          <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
    );
  };

  if (loading) return <p className="text-center mt-20 text-gray-500">Loading…</p>;
  if (!post) return <p className="text-center mt-20 text-gray-500">Post not found</p>;

  return (
    <div className="min-h-screen bg-gray-100 pt-16 pb-16">
      <div className="max-w-2xl mx-auto p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-700 mb-4 hover:text-blue-600">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </button>

        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {post.profile_picture ? (
                <img src={`${post.profile_picture.startsWith('http') ? '' : API_BASE}${post.profile_picture}`} alt="pf" className="w-full h-full object-cover" />
              ) : (
                <div className="w-8 h-8 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium">{post.nickname || post.username}</div>
                {post.nickname && <span className="text-xs text-gray-500">@{post.username}</span>}
              </div>
              <div className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</div>
            </div>
          </div>

          {post.title ? <div className="font-semibold mb-1">{post.title}</div> : null}
          {post.caption ? <div className="mb-2 text-gray-800">{post.caption}</div> : null}

          {post.media_path ? (
            post.media_type && post.media_type.startsWith('image/') ? (
              <img src={`${API_BASE}${post.media_path}`} className="w-full rounded object-cover mb-2" alt="post" />
            ) : (
              <video controls className="w-full rounded mb-2" src={`${API_BASE}${post.media_path}`} />
            )
          ) : null}

          <div className="flex gap-4 items-center my-2">
            <button onClick={() => toggleLike(postId).then(res => setPost(prev => ({ ...prev, liked: res.data.liked, likes_count: res.data.count }))).catch(err => {
              console.error(err);
              if (err?.response?.status === 404) {
                try { window.dispatchEvent(new CustomEvent('post:deleted', { detail: { postId } })); } catch(e) {}
                alert('Post not found (it may have been deleted)');
                navigate('/home');
              } else alert(err?.response?.data?.error || 'Failed to like');
            })} className={`flex items-center gap-1 text-sm ${post.liked ? 'text-red-500' : 'text-gray-600'}`}><Heart className="w-4 h-4"/> {post.likes_count || 0}</button>
            <button className="flex items-center gap-1 text-sm text-gray-600"><Bookmark className="w-4 h-4"/> {post.saves_count || 0}</button>
          </div>

          <div className="border-t pt-2">
            <h3 className="font-medium mb-2">Comments ({post.comments_count || 0})</h3>

            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id}>
                  <CommentItem comment={c} />
                  
                  {/* Replies section */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleRepliesExpanded(c.id)}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 ml-8 mb-2"
                      >
                        {expandedReplies.has(c.id) ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide replies ({c.replies.length})
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Show {c.replies.length} {c.replies.length === 1 ? 'reply' : 'replies'}
                          </>
                        )}
                      </button>
                      
                      {expandedReplies.has(c.id) && (
                        <div className="space-y-2">
                          {c.replies.map(reply => (
                            <CommentItem key={reply.id} comment={reply} isReply={true} parentId={c.id} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Context Menu */}
            {contextMenu.open && (
              <div
                className="fixed bg-white border rounded shadow-lg z-50"
                style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
                onMouseLeave={() => setContextMenu({ ...contextMenu, open: false })}
              >
                {!contextMenu.isReply && (
                  <button
                    onClick={() => {
                      setReplyingTo(contextMenu.commentId);
                      setContextMenu({ ...contextMenu, open: false });
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                  >
                    Reply
                  </button>
                )}
                <button
                  onClick={() => {
                    if (contextMenu.isReply) {
                      const parentId = comments.find(c => c.replies && c.replies.some(r => r.id === contextMenu.commentId))?.id;
                      handleDeleteReply(parentId, contextMenu.commentId);
                    } else {
                      handleDeleteComment(contextMenu.commentId);
                    }
                    setContextMenu({ ...contextMenu, open: false });
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}

            {/* Reply indicator */}
            {replyingTo && (
              <div className="mt-3 p-2 bg-blue-50 border-l-4 border-blue-500 text-sm text-blue-800 flex justify-between items-center">
                <span>Replying to: <strong>{comments.find(c => c.id === replyingTo)?.nickname || comments.find(c => c.id === replyingTo)?.username}</strong></span>
                <button onClick={() => setReplyingTo(null)} className="text-blue-600 hover:text-blue-800 font-semibold">×</button>
              </div>
            )}

            {/* Selected GIF preview */}
            {selectedGif && (
              <div className="mt-3 relative inline-block">
                <img src={selectedGif.url} alt="Selected GIF" className="max-h-32 rounded-lg" />
                <button
                  onClick={() => setSelectedGif(null)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}

            {/* GIF search panel */}
            {gifPanelOpen && (
              <div className="mt-3 p-3 bg-gray-50 rounded border">
                <input
                  type="text"
                  value={gifQuery}
                  onChange={handleGifQueryChange}
                  placeholder="Search GIFs..."
                  className="w-full p-2 border rounded mb-2"
                />
                {gifLoading && <p className="text-sm text-gray-500">Searching...</p>}
                {gifResults.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {gifResults.map((gif) => (
                      <button
                        key={gif.id}
                        onClick={() => selectGif(gif.url, gif.id)}
                        className="hover:opacity-75"
                      >
                        <img src={gif.url} alt="GIF" className="w-full rounded object-cover h-20" />
                      </button>
                    ))}
                  </div>
                )}
                {!gifLoading && gifResults.length === 0 && gifQuery && (
                  <p className="text-sm text-gray-500">No GIFs found</p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <input 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)} 
                  className="flex-1 p-2 border rounded" 
                  placeholder={replyingTo ? "Write your reply..." : "Write a comment..."} 
                />
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="p-2 border rounded hover:bg-gray-100"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setGifPanelOpen(!gifPanelOpen)}
                  className="p-2 border rounded hover:bg-gray-100"
                  title="Add GIF"
                >
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                </button>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Post</button>
              </div>
            </form>

            {/* Emoji picker modal */}
            <EmojiPickerModal
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              onSelect={(emoji) => {
                setNewComment(prev => prev + emoji);
                setPickerOpen(false);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
