// Comments used to be in PostModal, 
// so I moved it here. It's a bit hacky but it works fine for now. 
// If we add more features to comments later we can refactor 
// it into a proper separate page.

//modal used for comments, similar to post modal but simpler. 
// It fetches comments for a post and allows adding new comments. 
// It also handles loading and error states. The modal is responsive 
// and adapts to mobile screens.


//imports and component definition
import { useEffect, useState } from 'react';
import { getComments, createComment } from '../api';
//imports end 


// The CommentsModal component displays a modal with comments for a specific post and allows users to add new comments.
export default function CommentsModal({ postId, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Fetch comments when the component mounts
  useEffect(() => { fetch(); }, []);


  // Handle window resize to determine if the screen is mobile-sized
  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth < 640);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);


  //const 1
  // Fetch comments for the given post ID and handle loading state and errors
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
  //const 1 end 


  //const 2
  // Handle submitting a new comment. It validates the input, sends the comment to the server, updates the comments list, and handles loading state and errors.
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
  //const 2 end



  //html box 
  // The component renders a modal overlay with a list of comments and a textarea for adding new comments. It handles loading states, displays existing comments, and provides a form for submitting new comments. The modal is responsive and adapts to different screen sizes.
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white ${isMobile ? 'rounded-t-2xl' : 'rounded'} p-4 w-full sm:max-w-md max-h-[92vh] flex flex-col overflow-hidden`}>
        <div className="flex justify-between items-center mb-2 gap-3">
          <h3 className="font-semibold">Comments</h3>
          <button onClick={onClose} className="text-sm text-gray-600 px-2 py-1 rounded hover:bg-gray-100">Close</button>
        </div>

        {loading ? <div className="text-gray-600">Loading…</div> : (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {comments.length === 0 && <div className="text-sm text-gray-500">No comments yet</div>}
            {comments.map(c => (
              <div key={c.id} className="border-b pb-2">
                <div className="text-sm font-medium">{c.username}</div>
                <div className="text-sm text-gray-700 break-words">{c.content}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(c.created_at).toLocaleString()}</div>
              </div>
            ))}

            <div className="mt-3 pt-3 border-t bg-white sticky bottom-0">
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write a comment..." className="w-full border rounded p-3 text-sm min-h-24" rows={3}></textarea>
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={handleSubmit} disabled={submitting} className="bg-blue-500 text-white px-4 py-2 rounded text-sm min-w-20">{submitting ? 'Posting…' : 'Post'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  //html box end
}
