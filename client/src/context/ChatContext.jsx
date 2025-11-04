import React, { createContext, useState, useContext } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [emitters, setEmitters] = useState({});
  const [isUserListVisible, setIsUserListVisible] = useState(false);
  const [chattedUsers, setChattedUsers] = useState([]);
  // New state for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const value = {
    username,
    setUsername,
    messages,
    setMessages,
    users,
    setUsers,
    typingUsers,
    setTypingUsers,
    selectedUser,
    setSelectedUser,
    unreadCounts,
    setUnreadCounts,
    hasMoreMessages,
    setHasMoreMessages,
    isFetchingMore,
    setIsFetchingMore,
    ...emitters, // Spread the emitter functions into the context value
    setEmitters,
    isUserListVisible,
    setIsUserListVisible,
    chattedUsers,
    setChattedUsers,
    searchTerm,
    setSearchTerm,
    searchResults,
    setSearchResults,
    isSearchActive,
    setIsSearchActive,
    isSearching,
    setIsSearching,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
