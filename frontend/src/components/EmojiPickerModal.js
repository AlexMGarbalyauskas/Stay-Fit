import React, { useEffect } from 'react';
import Picker from 'emoji-picker-react';
import { ArrowLeft } from 'lucide-react';

export default function EmojiPickerModal({ open, onSelect, onClose, showDelete = false, onDelete }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // emoji-picker-react's onEmojiClick signature is (emojiData, event)
  // support several possible properties (emoji, native) to extract the unicode emoji
  const handleClick = (emojiData, event) => {
    const emoji = emojiData?.emoji || emojiData?.native || emojiData?.unified || null;
    if (emoji) onSelect(emoji);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDelete();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop covering entire screen (blocks interactions including navbar) */}
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full max-w-md mx-auto rounded-lg shadow-lg p-2" style={{ maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 p-3 border-b">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-medium">Add Reaction</h3>
          </div>
          {showDelete && (
            <button onClick={handleDelete} className="p-2 text-red-600 rounded hover:bg-gray-100">Delete</button>
          )}
        </div>
        <div className="overflow-auto">
          <div className="p-2" style={{ transform: 'scale(0.82)', transformOrigin: 'top center' }}>
            <Picker onEmojiClick={handleClick} />
          </div>
        </div>
      </div>
    </div>
  );
}
