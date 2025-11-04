import React from 'react';
import ReactDOM from 'react-dom';
import { useChat } from '../context/ChatContext';
import { X } from 'lucide-react';

const ReactionListModal = ({ userClerkIds, onClose }) => {
  const { users } = useChat();

  const userNames = userClerkIds.map(clerkId => {
    const user = users.find(u => u.clerkId === clerkId);
    return user ? user.username : 'Unknown User';
  });

  return ReactDOM.createPortal(
    <div className="reaction-modal-overlay" onClick={onClose}>
      <div className="reaction-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="reaction-modal-header">
          <h3>Reactions</h3>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        <ul>
          {userNames.map((name, index) => (
            <li key={index}>{name}</li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
};

export default ReactionListModal;