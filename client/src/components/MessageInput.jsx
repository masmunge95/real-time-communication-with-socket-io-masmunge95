import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Paperclip, X } from 'lucide-react';
import API_URL from '../config';

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { selectedUser, sendMessage, sendPrivateMessage, sendTyping } = useChat();
  const fileInputRef = useRef(null);

  const handleTyping = () => {
    const recipientId = selectedUser ? selectedUser.id : null;
    sendTyping(true, recipientId);
    setTimeout(() => sendTyping(false, recipientId), 2000); // Typing indicator lasts 2 seconds
  };

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      // Free memory when the component is unmounted
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [file]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() || file) {
      if (file) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        })
        .then(res => res.json())
        .then(data => {
          const fileAttachment = { fileUrl: data.filePath, fileType: file.type };
          if (selectedUser) {
            sendPrivateMessage(selectedUser.id, message.trim(), fileAttachment);
          } else {
            sendMessage(message.trim(), fileAttachment);
          }
        })
        .catch(err => console.error("File upload failed:", err))
        .finally(() => {
          setIsUploading(false);
          setFile(null);
          fileInputRef.current.value = null; // Reset file input
        });

      } else { // Text-only message
        if (selectedUser) {
          sendPrivateMessage(selectedUser.id, message);
        } else {
          sendMessage(message);
        }
      }
      setMessage('');
      sendTyping(false, selectedUser ? selectedUser.id : null);
    }
  };

  const placeholder = selectedUser
    ? `Message ${selectedUser.username} (private)`
    : 'Type a message...';

  return (
    <form onSubmit={handleSubmit} className="message-input">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => setFile(e.target.files[0] || null)}
      />
      <button type="button" className="attach-btn" onClick={() => fileInputRef.current.click()}>
        <Paperclip size={20} />
      </button>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={handleTyping} placeholder={placeholder} />
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Send'}
      </button>
      {file && (
        <div className="file-preview-container">
          <div className="file-info">
            {previewUrl && <img src={previewUrl} alt="preview" className="file-thumbnail-preview" />}
            <span className="file-name-preview">{file.name}</span>
          </div>
          <button type="button" className="remove-file-btn" onClick={() => { setFile(null); fileInputRef.current.value = null; }} aria-label="Remove file">
            <X size={18} />
          </button>        
        </div>
      )}
    </form>
  );
};

export default MessageInput;
