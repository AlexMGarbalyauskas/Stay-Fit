import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, getComments, createComment, toggleLike, toggleSave, deleteComment, toggleCommentLike } from '../api';
import { Heart, Bookmark, ArrowLeft, User as UserIcon } from 'lucide-react';
import { API_BASE } from '../api';

export default function PostComments() {
  const { id } = useParams();
  const postId = Number(id);
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, commentId: null });

  useEffect(() => {
    // Get current user
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      setCurrentUser(user);
    } catch {}
  }, []);

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
          // notify other pages so they can remove the stale post
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
    if (!newComment.trim()) return;
    try {
      const res = await createComment(postId, newComment.trim());
      // backend now returns comments_count
      const created = res.data.comment;
      const commentsCount = res.data.comments_count;
      setComments(prev => [...prev, { ...created, likes_count: 0, liked_by_me: false }]);
      setNewComment('');
      setPost(prev => ({ ...prev, comments_count: commentsCount }));
      // notify other pages
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

  const handleLikeComment = async (commentId) => {
    try {
      const res = await toggleCommentLike(postId, commentId);
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, liked_by_me: res.data.liked, likes_count: res.data.likes_count }
          : c
      ));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Failed to like comment');
    }
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
                <div 
                  key={c.id} 
                  className="flex gap-3 items-start bg-gray-50 p-3 rounded"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (currentUser?.id === c.user_id) {
                      setContextMenu({ open: true, x: e.clientX, y: e.clientY, commentId: c.id });
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {c.profile_picture ? (
                      <img src={`${c.profile_picture.startsWith('http') ? '' : API_BASE}${c.profile_picture}`} alt="u" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{c.nickname || c.username}</div>
                      {c.nickname && <span className="text-xs text-gray-400">@{c.username}</span>}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{c.content}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleLikeComment(c.id)}
                        className={`flex items-center gap-1 text-xs ${c.liked_by_me ? 'text-red-500' : 'text-gray-400'}`}
                      >
                        <Heart className="w-3 h-3" />
                        <span>{c.likes_count || 0}</span>
                      </button>
                      <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Context Menu for Comments */}
            {contextMenu.open && (
              <div
                className="fixed bg-white border rounded shadow-lg z-50"
                style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
                onMouseLeave={() => setContextMenu({ ...contextMenu, open: false })}
              >
                <button
                  onClick={() => {
                    handleDeleteComment(contextMenu.commentId);
                    setContextMenu({ ...contextMenu, open: false });
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <input value={newComment} onChange={e => setNewComment(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Write a comment..." />
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Post</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
