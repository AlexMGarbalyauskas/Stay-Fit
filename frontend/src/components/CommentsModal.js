import { useEffect, useState } from 'react';
import { getComments, createComment } from '../api';

export default function CommentsModal({ postId, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getComments(postId);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error('Failed to load comments', err);
      alert(err?.response?.data?.error || 'Failed to load comments');
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await createComment(postId, text.trim());
      setComments(prev => [...prev, res.data.comment]);
      setText('');
    } catch (err) {
      console.error('Failed to post comment', err);
      alert(err?.response?.data?.error || 'Failed to post comment');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded p-4 w-full max-w-md max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Comments</h3>
          <button onClick={onClose} className="text-sm text-gray-600">Close</button>
        </div>

        {loading ? <div className="text-gray-600">Loading…</div> : (
          <div className="space-y-3">
            {comments.length === 0 && <div className="text-sm text-gray-500">No comments yet</div>}
            {comments.map(c => (
              <div key={c.id} className="border-b pb-2">
                <div className="text-sm font-medium">{c.username}</div>
                <div className="text-sm text-gray-700">{c.content}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(c.created_at).toLocaleString()}</div>
              </div>
            ))}

            <div className="mt-3">
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write a comment..." className="w-full border rounded p-2 text-sm" rows={3}></textarea>
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={handleSubmit} disabled={submitting} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">{submitting ? 'Posting…' : 'Post'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
