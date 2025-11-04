import React, { forwardRef } from 'react';
import { useChat } from '../context/ChatContext';
import SearchInput from './SearchInput';

const UserList = forwardRef(({ className }, ref) => {
  const { users, chattedUsers, setSelectedUser, selectedUser, username, unreadCounts, setUnreadCounts } = useChat();

  // Create a combined list of online users and users from chat history
  const combinedUsersMap = new Map();

  // Add online users first, marking them as online
  users.forEach(user => {
    if (user.username !== username) {
      combinedUsersMap.set(user.clerkId, { ...user, isOnline: true });
    }
  });

  // Add chatted users who are not already in the list (they will be offline)
  chattedUsers.forEach(user => {
    if (!combinedUsersMap.has(user.clerkId)) {
      combinedUsersMap.set(user.clerkId, { ...user, isOnline: false });
    }
  });

  const displayUsers = Array.from(combinedUsersMap.values());

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    if (user && unreadCounts[user.clerkId]) {
      // Clear unread count for a private user
      setUnreadCounts(prevCounts => {
        const newCounts = { ...prevCounts };
        delete newCounts[user.clerkId];
        return newCounts;
      });
    } else if (!user && unreadCounts.global) {
      // Clear unread count for global chat
      setUnreadCounts(prevCounts => {
        const newCounts = { ...prevCounts };
        delete newCounts.global;
        return newCounts;
      });
    }
  };

  return (
    <div ref={ref} className={`user-list ${className || ''}`}>
      <SearchInput />
      <h3>Users</h3>
      <ul>
        {/* Add an option to return to the main public chat */}
        <li
          key="global-chat"
          className={!selectedUser ? 'selected' : ''}
          onClick={() => handleSelectUser(null)}
        >
          <span className="username-text">Global Chat</span>
          {unreadCounts.global > 0 && (
            <span className="unread-badge">{unreadCounts.global}</span>
          )}
        </li>
        {displayUsers.map((user) => (
          <li
            key={user.clerkId}
            className={selectedUser?.clerkId === user.clerkId ? 'selected' : ''}
            onClick={() => handleSelectUser(user)}
          >
            <span className={`online-indicator ${user.isOnline ? 'online' : 'offline'}`}></span>
            <span className="username-text">{user.username}</span>
            {unreadCounts[user.clerkId] > 0 && (
              <span className="unread-badge">{unreadCounts[user.clerkId]}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
});

export default UserList;
