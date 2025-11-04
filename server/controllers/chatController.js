// d:\PLP Academy\JULY 2025 COHORT\Module Assignments\Full Stack With MERN\Week 5 Assignment\server\controllers\chatController.js

const { users, typingUsers, addUser, removeUser } = require('../utils/storage');
const Message = require('../models/Message');

// Helper function to save a message
const saveMessage = async (messageData) => {
  const message = new Message(messageData);
  await message.save();
  return message;
};

const handleConnection = (io, socket) => {
  console.log(`User connected: ${socket.id}`);

  // All users join the 'global' room by default
  socket.join('global');

  const handleUserJoin = (userData) => {
    const user = addUser(io, socket.id, userData); // Pass io, socket.id, and the actual user data
    io.emit('user_list', Object.values(users));
    io.to('global').emit('user_joined', { username: user.username, id: socket.id });
    console.log(`${user.username} joined the chat`);
  };

  const handleSendMessage = async (messageData, ack) => {
    try {
      const messagePayload = {
        ...messageData,
        sender: users[socket.id]?.username || 'Anonymous',
        senderId: socket.id,
        senderClerkId: users[socket.id]?.clerkId,
      };
      const savedMessage = await saveMessage(messagePayload);
      // Broadcast to other clients in the global room
      socket.broadcast.to('global').emit('receive_message', savedMessage);
      // Acknowledge to the sender with the final message object
      if (ack) ack({ status: 'ok', message: savedMessage });
    } catch (error) {
      console.error("Failed to send message:", error);
      if (ack) ack({ status: 'error' });
    }
  };

  const handleTyping = ({ isTyping, recipientId }) => {
    const typingUser = users[socket.id];
    if (!typingUser) return;

    const room = recipientId
      ? [socket.id, recipientId].sort().join('-')
      : 'global';

    // For private chats, ensure both users join the room upon the first typing event
    if (recipientId) {
      const recipientSocket = io.sockets.sockets.get(recipientId);
      socket.join(room);
      recipientSocket?.join(room);
    }

    // Emit to all other clients in the specific room
    socket.to(room).emit('typing_users', {
      username: typingUser.username,
      isTyping,
    });
  };

  const handlePrivateMessage = async (messageData, ack) => {
    try {
      // Create a unique, consistent room name for the two users
      const recipientSocketId = messageData.to;
      const senderSocketId = socket.id;
      const roomName = [senderSocketId, recipientSocketId].sort().join('-');

      // Have both users join the private room
      socket.join(roomName);
      io.sockets.sockets.get(recipientSocketId)?.join(roomName);

      const messagePayload = {
        ...messageData,
        sender: users[socket.id]?.username || 'Anonymous',
        senderId: socket.id,
        senderClerkId: users[socket.id]?.clerkId,
        isPrivate: true,
        recipientId: recipientSocketId, // Add recipient ID
        recipientClerkId: users[recipientSocketId]?.clerkId,
        recipientName: users[recipientSocketId]?.username || 'Unknown', // Add recipient name
      };
      const savedMessage = await saveMessage(messagePayload);
      // Emit the private message to other clients in this specific room
      socket.broadcast.to(roomName).emit('private_message', savedMessage);
      if (ack) ack({ status: 'ok', message: savedMessage });
    } catch (error) {
      console.error("Failed to send private message:", error);
      if (ack) ack({ status: 'error' });
    }
  };

  const handleReactToMessage = async ({ messageId, emoji }) => {
    const reactingUser = users[socket.id];
    if (!reactingUser) return;

    const message = await Message.findById(messageId);
    if (!message) return;

    const existingReactionIndex = message.reactions.findIndex(
      (reaction) => reaction.by === reactingUser.clerkId && reaction.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      // User is removing their reaction (toggle off)
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // User is adding a new, distinct reaction
      message.reactions.push({ emoji, by: reactingUser.clerkId, });
    }

    await message.save();

    // Determine which room to notify
    const roomToNotify = message.isPrivate
      ? [message.senderId, message.recipientId].sort().join('-')
      : 'global';

    io.to(roomToNotify).emit('message_updated', message);
  };

  const handleMessageRead = async ({ messageId }) => {
    const readingUser = users[socket.id];
    if (!readingUser || !readingUser.clerkId) return;

    const message = await Message.findById(messageId);
    if (!message || !message.isPrivate) return;

    // Add the user to readBy if they haven't read it yet
    if (!message.readBy.includes(readingUser.clerkId)) {
      message.readBy.push(readingUser.clerkId);
      await message.save();

      // Notify the room that the message has been updated
      const roomToNotify = [message.senderId, message.recipientId].sort().join('-');

      // We can reuse the 'message_updated' event
      io.to(roomToNotify).emit('message_updated', message);
    }
  };

  const handleEditMessage = async ({ messageId, newContent }) => {
    const editingUser = users[socket.id];
    if (!editingUser || !editingUser.clerkId) return;

    const message = await Message.findById(messageId);
    if (!message) return;

    // Security Check: Only the original sender can edit the message.
    if (message.senderClerkId !== editingUser.clerkId) {
      // Optionally, emit an error back to the user. For now, we'll just ignore.
      return;
    }

    message.message = newContent;
    message.isEdited = true;
    const updatedMessage = await message.save();

    const roomToNotify = message.isPrivate
      ? [message.senderId, message.recipientId].sort().join('-')
      : 'global';
    io.to(roomToNotify).emit('message_updated', updatedMessage);
  };

  const handleDeleteMessage = async ({ messageId }) => {
    const deletingUser = users[socket.id];
    if (!deletingUser || !deletingUser.clerkId) return;

    const message = await Message.findById(messageId);
    if (!message) return;

    // Security Check: Only the original sender can delete the message.
    if (message.senderClerkId !== deletingUser.clerkId) {
      return; // Silently ignore if not the owner
    }

    await Message.findByIdAndDelete(messageId);

    const roomToNotify = message.isPrivate
      ? [message.senderId, message.recipientId].sort().join('-')
      : 'global';

    // Notify clients to remove the message
    io.to(roomToNotify).emit('message_deleted', { messageId });
  };

  const handleDisconnect = () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to('global').emit('user_left', { username: user.username, id: socket.id });
      console.log(`${user.username} left the chat`);
    }
  };

  socket.on('user_join', handleUserJoin);
  socket.on('send_message', handleSendMessage);
  socket.on('typing', handleTyping);
  socket.on('private_message', handlePrivateMessage);
  socket.on('react_to_message', handleReactToMessage);
  socket.on('message_read', handleMessageRead);
  socket.on('edit_message', handleEditMessage);
  socket.on('delete_message', handleDeleteMessage);
  socket.on('disconnect', handleDisconnect);
};

module.exports = { handleConnection };
