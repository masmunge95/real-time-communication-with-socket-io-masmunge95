import React, { useState } from 'react';
import ReactionListModal from './ReactionListModal';

const ReactionsDisplay = ({ reactions }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmojiUsers, setSelectedEmojiUsers] = useState([]);

  if (!reactions || reactions.length === 0) {
    return null;
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction.by);
    return acc;
  }, {});

  const handleBadgeClick = (userClerkIds) => {
    setSelectedEmojiUsers(userClerkIds);
    setModalOpen(true);
  };

  return (
    <>
      <div className="reactions-display">
        {Object.entries(groupedReactions).map(([emoji, userClerkIds]) => {
          return (
            <div key={emoji} className="reaction-badge-container" onClick={() => handleBadgeClick(userClerkIds)}>
            <span className="reaction-badge">
              {emoji} {userClerkIds.length > 1 && <span className="reaction-count">{userClerkIds.length}</span>}
            </span>
          </div>
          );
        })}
      </div>
      {modalOpen && (
        <ReactionListModal userClerkIds={selectedEmojiUsers} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
};

export default ReactionsDisplay;