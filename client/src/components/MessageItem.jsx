import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useChat } from '../context/ChatContext';
import ReactionPicker from './ReactionPicker';
import ReactionsDisplay from './ReactionsDisplay';
import { SmilePlus, CheckCheck, Check, Clock, Pencil, Trash2, File, FileText, FileImage, FileVideo, FileAudio } from 'lucide-react';
import API_URL from '../config';

const MessageItem = ({ msg, selectedUser }) => {
  const { user: currentUser } = useUser();
  const { reactToMessage, markMessageAsRead, editMessage, deleteMessage } = useChat();
  const msgRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  // Bug fix: Ensure editedContent is updated if msg.message changes from props
  const [editedContent, setEditedContent] = useState(msg.message);
  const [pickerMessageId, setPickerMessageId] = useState(null);
  const reactionButtonRef = useRef(null);

  // Keep the edited content in sync with the message prop
  useEffect(() => {
    setEditedContent(msg.message);
  }, [msg.message]);

  const getFileIcon = (fileType) => {
    if (!fileType) return <File size={24} />;
    if (fileType.startsWith('image/')) return <FileImage size={24} />;
    if (fileType.startsWith('video/')) return <FileVideo size={24} />;
    if (fileType.startsWith('audio/')) return <FileAudio size={24} />;
    if (fileType.includes('pdf')) return <FileText size={24} />;
    return <File size={24} />;
  };

  const renderFile = () => {
    const isImage = msg.fileType?.startsWith('image/');
    const isVideo = msg.fileType?.startsWith('video/');
    const isAudio = msg.fileType?.startsWith('audio/');
    const fileUrl = `${API_URL}${msg.fileUrl}`;
    const fileName = msg.fileUrl ? msg.fileUrl.split('-').slice(1).join('-') : 'file';
    
    // If it's playable media, show the name above the player/image
    if (isImage || isVideo || isAudio) {
      return (
        <div className="media-attachment">
          <div className="file-name-display">{fileName}</div>
          {isImage && <img src={fileUrl} alt={fileName} className="message-image" />}
          {isVideo && <video src={fileUrl} controls className="message-video" />}
          {isAudio && <audio src={fileUrl} controls className="message-audio" />}
        </div>
      );
    }
    
    // Fallback for other file types (the downloadable link)
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="message-file-link">{getFileIcon(msg.fileType)}<span className="file-name-display">{fileName}</span></a>
    )
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // If message is from another user and not yet read by current user
          if (
            !String(msg._id).startsWith('temp-') && // Safeguard: Only mark real messages as read
            msg.senderClerkId !== currentUser.id && 
            !msg.readBy.includes(currentUser.id)
          ) {
            markMessageAsRead(msg._id);
          }
          observer.disconnect(); // We only need to fire this once
        }
      },
      { threshold: 1.0 }
    );

    if (msgRef.current) {
      observer.observe(msgRef.current);
    }

    return () => observer.disconnect();
  }, [msg, currentUser, markMessageAsRead]);

  const handleSelectReaction = (messageId, emoji) => {
    reactToMessage(messageId, emoji);
    setPickerMessageId(null);
  };

  const handleSaveEdit = () => {
    if (editedContent.trim() !== msg.message) {
      editMessage(msg._id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message? This cannot be undone.')) {
      deleteMessage(msg._id);
    }
  };

  const isRead = msg.isPrivate && msg.readBy.includes(selectedUser?.clerkId);
  const isSentByMe = msg.senderClerkId === currentUser.id;

  const getStatusIcon = () => {
    if (msg.status === 'sending') {
      return <Clock size={16} className="status-icon sending" />;
    }
    if (isRead) {
      return <CheckCheck size={16} className="read-receipt" />;
    }
    return <Check size={16} className="status-icon sent" />;
  };

  if (msg.system) {
    return (
      <div key={msg._id} className="message system-message">
        {msg.message}
      </div>
    );
  }

  return (
    <div ref={msgRef} key={msg._id} className={`message-container ${isSentByMe ? 'sent' : 'received'}`}>
      <div className={`message ${msg.isPrivate ? 'private-message' : ''} `}>
        <div className="message-content">
          <div className="message-header">
            <strong>{msg.sender}</strong>
            <span className="message-timestamp">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {isEditing ? (
            <div className="edit-message-container">
              <input
                type="text"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                className="edit-message-input"
              />
              <button onClick={handleSaveEdit} className="edit-action-btn">Save</button>
              <button onClick={() => setIsEditing(false)} className="edit-action-btn">Cancel</button>
            </div>
          ) : (
            <>
              {msg.fileUrl && renderFile()}
              {msg.message && <div>{msg.message}</div>}
              {msg.isEdited && <span className="edited-tag">(edited)</span>}
            </>
          )}
        </div>
        <div className="message-actions">
          <button
            className="react-button"
            ref={pickerMessageId === msg._id ? reactionButtonRef : null}
            onClick={(e) => {
              reactionButtonRef.current = e.currentTarget;
              setPickerMessageId(msg._id);
            }}
          >
            <SmilePlus size={16} />
          </button>
          {isSentByMe && !isEditing && (
            <>
              <button className="react-button edit-button" onClick={() => setIsEditing(true)}>
                <Pencil size={16} />
              </button>
              <button className="react-button delete-button" onClick={handleDelete}>
                <Trash2 size={16} />
              </button>
            </>
          )}
          {pickerMessageId === msg._id && (
            <ReactionPicker onSelect={(emoji) => handleSelectReaction(msg._id, emoji)} targetRef={reactionButtonRef} />
          )}
        </div>
      </div>
      <div className="message-footer">
        <ReactionsDisplay reactions={msg.reactions} />
        {isSentByMe && <div className="status-container">{getStatusIcon()}</div>}
      </div>
    </div>
  );
};

export default MessageItem;