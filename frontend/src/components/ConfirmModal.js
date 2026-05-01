// confirm modal component that can be used to confirm actions such as 
// deleting a post or comment. It takes in props for the title,
// message, and callback functions for confirming or canceling the action. 
// The modal is styled with Tailwind CSS classes for a clean and modern look.


//import 
import React from 'react';


// A reusable confirmation modal component that can be used throughout the application.
export default function ConfirmModal({ open, title = 'Confirm', message, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'No' }) {
  if (!open) return null;


  //main html structure of the modal, with a dark 
  // background and a centered white box containing the title, message, and buttons
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel}></div>
      <div className="bg-white rounded p-6 shadow-lg z-10 max-w-sm w-full">
        <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: message }} />}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 bg-gray-200 rounded">{cancelText}</button>
          <button onClick={onConfirm} className="px-3 py-1 bg-red-500 text-white rounded">{confirmText}</button>
        </div>
      </div>
    </div>
  );
  //end of modal structure
}
