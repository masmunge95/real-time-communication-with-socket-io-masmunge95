import React, { useEffect, useRef } from 'react';
import UserList from '../components/UserList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { useChat } from '../context/ChatContext';

const ChatPage = () => {
  const { isUserListVisible, setIsUserListVisible } = useChat();
  const userListRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserListVisible && userListRef.current && !userListRef.current.contains(event.target)) {
        // Check if the click is on the toggle button itself to prevent immediate closing
        if (!event.target.closest('.users-toggle-btn')) {
          setIsUserListVisible(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserListVisible, setIsUserListVisible]);

  return (
    <div className="chat-container">
      <UserList ref={userListRef} className={isUserListVisible ? 'visible' : ''} />
      <div className="chat-main">
        <MessageList />
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatPage;
