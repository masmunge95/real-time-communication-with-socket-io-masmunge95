// d:\PLP Academy\JULY 2025 COHORT\Module Assignments\Full Stack With MERN\Week 5 Assignment\server\socket\socket.js

const { Server } = require('socket.io');
const { handleConnection } = require('../controllers/chatController');

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => handleConnection(io, socket));

  return io;
};

module.exports = { initializeSocket };