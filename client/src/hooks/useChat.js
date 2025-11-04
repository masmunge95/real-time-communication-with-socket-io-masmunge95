import { useCallback, useEffect, useMemo, useRef } from 'react';
import { socket } from '../socket/socket';
import { useChat } from '../context/ChatContext';

export const useChatSocket = () => {
  const {
    setMessages,
    setUsers,
    setTypingUsers,
    username,
    selectedUser,
    setUnreadCounts,
  } = useChat();

  const systemMessageCounter = useRef(0);

  useEffect(() => {
    if (!username) return;

    // --- Event Listeners ---
    // A single handler for all incoming messages to prevent duplicates
    const handleNewMessage = (newMessage) => {
      setMessages((prevMessages) => {
        // Check if the message already exists by its unique _id
        if (prevMessages.some((msg) => msg._id === newMessage._id)) {
          return prevMessages;
        }

        // Increment unread count for private messages if the chat is not active
        if (
          newMessage.isPrivate &&
          newMessage.sender !== username &&
          (!selectedUser || newMessage.senderClerkId !== selectedUser.clerkId)
        ) {
          setUnreadCounts((prevCounts) => ({
            ...prevCounts,
            [newMessage.senderClerkId]: (prevCounts[newMessage.senderClerkId] || 0) + 1,
          }));
        } else if (
          !newMessage.isPrivate &&
          !newMessage.system &&
          newMessage.sender !== username &&
          selectedUser // Only count if user is in a private chat
        ) {
          setUnreadCounts((prevCounts) => ({
            ...prevCounts,
            global: (prevCounts.global || 0) + 1,
          }));
        }

        // Play sound notification for new messages
        if (newMessage.sender !== username && !newMessage.system) {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.error("Failed to play notification sound:", e));
        }

        // Show browser notification for new messages
        if (
          'Notification' in window &&
          Notification.permission === 'granted' &&
          !document.hasFocus() && // Only notify if window is not focused
          newMessage.sender !== username && // Don't notify for own messages
          !newMessage.system // Don't notify for system messages
        ) {
          new Notification(`New message from ${newMessage.sender}`, {
            body: newMessage.message,
          });
        }

        return [...prevMessages, newMessage];
      });
    };

    const handleUserList = (userList) => {
      // Only update the users, not the messages
      setUsers(userList);
    };

    const handleTypingUsers = ({ username, isTyping }) => {
      setTypingUsers((prev) => {
        const newTypingUsers = new Set(prev);
        if (isTyping) {
          newTypingUsers.add(username);
        } else {
          newTypingUsers.delete(username);
        }
        return Array.from(newTypingUsers);
      });
    };

    const handleUserJoined = ({ username }) => {
      const newMessage = {
        _id: `system-${Date.now()}-${systemMessageCounter.current++}`,
        system: true,
        message: `${username} has joined the chat.`,
      };
      handleNewMessage(newMessage);
    };

    const handleUserLeft = ({ username }) => {
      const newMessage = {
        _id: `system-${Date.now()}-${systemMessageCounter.current++}`,
        system: true,
        message: `${username} has left the chat.`,
      };
      handleNewMessage(newMessage);
    };

    const handleMessageUpdated = (updatedMessage) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('private_message', handleNewMessage);
    socket.on('user_list', handleUserList);
    socket.on('typing_users', handleTypingUsers);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('message_deleted', handleMessageDeleted);

    // --- Cleanup on component unmount ---
    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('private_message', handleNewMessage);
      socket.off('user_list', handleUserList);
      socket.off('typing_users', handleTypingUsers);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [username, setMessages, setUsers, setTypingUsers, selectedUser, setUnreadCounts]);

  // --- Event Emitters ---
  const sendMessage = useCallback((messageContent, file = null) => {
      const tempId = `temp-${Date.now()}`;
      const message = {
        _id: tempId,
        message: messageContent,
        ...file,
        sender: username,
        status: 'sending',
        createdAt: new Date().toISOString(),
        readBy: [], // Add default value
      };
      setMessages(prev => [...prev, message]);

      socket.emit('send_message', { message: messageContent, ...file }, (response) => {
        if (response.status === 'ok') {
          setMessages(prev => prev.map(m => m._id === tempId ? { ...response.message, status: 'sent' } : m));
        }
      });
    }, [username, setMessages]);

  const sendPrivateMessage = useCallback((to, messageContent, file = null) => {
      const tempId = `temp-${Date.now()}`;
      const message = {
        _id: tempId,
        message: messageContent,
        ...file,
        sender: username,
        status: 'sending',
        createdAt: new Date().toISOString(),
        readBy: [], // Add default value
      };
      setMessages(prev => [...prev, message]);

      socket.emit('private_message', { to, message: messageContent, ...file }, (response) => {
        if (response.status === 'ok') {
          setMessages(prev => prev.map(m => m._id === tempId ? { ...response.message, status: 'sent' } : m));
        }
      });
    }, [username, setMessages]);

  const sendTyping = useCallback((isTyping, recipientId) => {
    socket.emit('typing', { isTyping, recipientId });
  }, []);

  const reactToMessage = useCallback((messageId, emoji) => {
    socket.emit('react_to_message', { messageId, emoji });
  }, []);

  const markMessageAsRead = useCallback((messageId) => {
    socket.emit('message_read', { messageId });
  }, []);

  const editMessage = useCallback((messageId, newContent) => {
    socket.emit('edit_message', { messageId, newContent });
  }, []);

  const deleteMessage = useCallback((messageId) => {
    socket.emit('delete_message', { messageId });
  }, []);

  // Note: joinChat is handled in LoginPage, but we can keep it here if needed elsewhere
  const joinChat = useCallback((user) => {
    socket.connect();
    socket.emit('user_join', user);
  }, []);

  const disconnect = useCallback(() => {
    socket.disconnect();
  }, []);

  return useMemo(() => ({
      sendMessage,
      sendPrivateMessage,
      sendTyping,
      reactToMessage,
      markMessageAsRead,
      editMessage,
      deleteMessage,
      joinChat,
      disconnect,
    }),
    // Now we list the stable functions as dependencies.
    [sendMessage, sendPrivateMessage, sendTyping, reactToMessage, markMessageAsRead, editMessage, deleteMessage, joinChat, disconnect]
  );
};
