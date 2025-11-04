// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { initializeSocket } = require('./socket/socket');
const multer = require('multer');
const { users } = require('./utils/storage'); // messages will now come from DB
const connectDB = require('./config/db');
const Message = require('./models/Message');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

// API routes
app.get('/api/messages', async (req, res) => {
  // Fetch last 50 messages from the database
  const messages = await Message.find().sort({ createdAt: -1 }).limit(50).exec();
  res.json(messages.reverse());
});

app.get('/api/messages/history', async (req, res) => {
  const { before, limit = 20 } = req.query;

  if (!before) {
    return res.status(400).json({ error: 'A "before" timestamp is required.' });
  }

  try {
    const messages = await Message.find({ createdAt: { $lt: new Date(before) } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .exec();
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch message history.' });
  }
});

app.get('/api/users', (req, res) => {
  // We send back the values of the users object
  res.json(Object.values(users)); 
});

app.get('/api/messages/search', async (req, res) => {
  const { term, clerkId } = req.query;

  if (!term || !clerkId) {
    return res.status(400).json({ error: 'A search term and clerkId are required.' });
  }

  try {
    const searchResults = await Message.find(
      {
        $text: { $search: term },
        // Security: Ensure user can only search public messages or their own private ones
        $or: [
          { isPrivate: false },
          { isPrivate: true, senderClerkId: clerkId },
          { isPrivate: true, recipientClerkId: clerkId },
        ],
      },
      { score: { $meta: 'textScore' } } // Add a score for relevance
    )
    .sort({ score: { $meta: 'textScore' } }) // Sort by relevance
    .limit(50); // Limit results
    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search messages.' });
  }
});

app.get('/api/users/chatted', async (req, res) => {
  const { clerkId } = req.query;
  if (!clerkId) {
    return res.status(400).json({ error: 'clerkId is required' });
  }

  try {
    const messages = await Message.find({
      $or: [{ senderClerkId: clerkId }, { recipientClerkId: clerkId }],
      isPrivate: true,
    }).select('sender senderClerkId recipientName recipientClerkId');

    const chattedUsers = new Map();

    messages.forEach(msg => {
      if (msg.senderClerkId !== clerkId) {
        if (!chattedUsers.has(msg.senderClerkId)) {
          chattedUsers.set(msg.senderClerkId, { username: msg.sender, clerkId: msg.senderClerkId });
        }
      }
      if (msg.recipientClerkId !== clerkId) {
        if (!chattedUsers.has(msg.recipientClerkId)) {
          chattedUsers.set(msg.recipientClerkId, { username: msg.recipientName, clerkId: msg.recipientClerkId });
        }
      }
    });

    res.json(Array.from(chattedUsers.values()));

  } catch (error) {
    console.error("Failed to fetch chatted users:", error);
    res.status(500).json({ error: 'Failed to fetch chatted users' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();

module.exports = { app, server, io };