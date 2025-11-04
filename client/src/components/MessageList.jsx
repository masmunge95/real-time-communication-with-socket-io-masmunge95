import React, { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useUser } from '@clerk/clerk-react';
import MessageItem from './MessageItem';
import API_URL from '../config';

const MessageList = () => {
  const { messages, setMessages, typingUsers, selectedUser, hasMoreMessages, setHasMoreMessages, isFetchingMore, setIsFetchingMore, isSearchActive, searchResults, setIsSearchActive, setSearchResults, setSearchTerm } = useChat();
  const { user: currentUser } = useUser(); // Get current user from Clerk
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, typingUsers]);

  const handleLoadMore = async () => {
    if (isFetchingMore || !hasMoreMessages || messages.length === 0) return;

    setIsFetchingMore(true);
    const oldestMessage = messages[0];
    const limit = 20;

    try {
      const response = await fetch(`${API_URL}/api/messages/history?before=${oldestMessage.createdAt}&limit=${limit}`);
      const olderMessages = await response.json();

      if (olderMessages.length < limit) {
        setHasMoreMessages(false);
      }

      // Prepend older messages to the existing messages
      setMessages(prevMessages => [...olderMessages, ...prevMessages]);

    } catch (error) {
      console.error("Failed to fetch older messages:", error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleClearSearch = () => {
    setIsSearchActive(false);
    setSearchResults([]);
    setSearchTerm('');
  };

  const messagesToDisplay = isSearchActive ? searchResults : messages;

  const filteredMessages = isSearchActive
    ? messagesToDisplay // Search results are already filtered by the backend
    : messagesToDisplay.filter((msg) => {
        if (selectedUser) {
          // If a user is selected, show only private messages between current user and selected user
          if (msg.system) return false; // Don't show system messages in private chats
          return (
            msg.isPrivate &&
            ((msg.senderClerkId === selectedUser.clerkId && msg.recipientClerkId === currentUser.id) ||
             (msg.senderClerkId === currentUser.id && msg.recipientClerkId === selectedUser.clerkId))
          );
        } else {
          // If no user is selected (global chat), show only public messages
          // or system messages
          return !msg.isPrivate || msg.system;
        }
      });

  return (
    <div ref={scrollContainerRef} className="message-list">
      {isSearchActive ? (
        <div className="search-results-header">
          <span>Showing search results</span>
          <button onClick={handleClearSearch} className="clear-search-btn">Clear Search</button>
        </div>
      ) : hasMoreMessages && (
        <div className="load-more-container">
          <button onClick={handleLoadMore} disabled={isFetchingMore}>
            {isFetchingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
      {isSearchActive && filteredMessages.length === 0 && (
        <div className="system-message">No messages found matching your search.</div>
      )}
      {filteredMessages.map((msg) => <MessageItem key={msg._id} msg={msg} selectedUser={selectedUser} />)}
      {typingUsers.length > 0 && <div className="typing-indicator">{typingUsers.join(', ')} is typing...</div>}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
