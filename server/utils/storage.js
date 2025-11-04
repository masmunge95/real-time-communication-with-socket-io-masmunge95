// d:\PLP Academy\JULY 2025 COHORT\Module Assignments\Full Stack With MERN\Week 5 Assignment\server\utils\storage.js

const users = {};
const typingUsers = {};

const addUser = (io, socketId, { username, clerkId }) => {
  // Remove any existing user with the same username to prevent duplicates on refresh
  const existingSocketId = Object.keys(users).find(
    (key) => users[key].username === username
  );
  if (existingSocketId) {
    const oldUser = users[existingSocketId];
    delete users[existingSocketId];
    // Announce that the old socket for this user has left
    io.to('global').emit('user_left', { username: oldUser.username, id: oldUser.id });
  }
  
  users[socketId] = { username, id: socketId, clerkId };
  return users[socketId];
};

const removeUser = (socketId) => {
  const user = users[socketId];
  delete users[socketId];
  return user;
};

module.exports = {
  users,
  typingUsers,
  addUser,
  removeUser,
};
