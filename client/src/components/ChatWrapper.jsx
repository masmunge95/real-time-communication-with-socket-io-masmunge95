import React, { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useChat } from '../context/ChatContext';
import { socket } from '../socket/socket';
import { useChatSocket } from '../hooks/useChat';
import ChatPage from '../pages/ChatPage';
import API_URL from '../config';

const ChatWrapper = () => {
  const { user, isLoaded } = useUser();
  const { setUsername, setMessages, setEmitters, setChattedUsers } = useChat();
  const hasJoined = useRef(false);

  // This is now the ONLY place where useChatSocket is called.
  const chatEmitters = useChatSocket();

  // Provide the emitter functions to the context once they are created.
  useEffect(() => {
    setEmitters(chatEmitters);
  }, [chatEmitters, setEmitters]);

  useEffect(() => {
    // Ensure this effect only runs once per user session
    const connectAndFetch = async () => {
        const newUsername = user.username || user.firstName || user.emailAddresses[0].emailAddress;
        setUsername(newUsername);
  
        // Connect to socket and join chat
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit('user_join', { username: newUsername, clerkId: user.id });
        hasJoined.current = true;
  
        // Request notification permission after user joins
        if ('Notification' in window && Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
  
        // Fetch initial message history
        try {
          const response = await fetch(`${API_URL}/api/messages`);
          const messageData = await response.json();
          setMessages(messageData);

          // Fetch users this person has chatted with
          const chattedUsersResponse = await fetch(`${API_URL}/api/users/chatted?clerkId=${user.id}`);
          const chattedUsersData = await chattedUsersResponse.json();
          setChattedUsers(chattedUsersData);

        } catch (error) {
          console.error("Failed to fetch messages:", error);
        }
    };
    
    if (isLoaded && user && !hasJoined.current) {
        connectAndFetch();
      }
  }, [isLoaded, user, setUsername, setMessages, setChattedUsers]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return <ChatPage />;
};

export default ChatWrapper;