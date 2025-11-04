const mongoose = require('mongoose');

const ReactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  by: { type: String, required: true } // This will be the clerkId
}, { _id: false });

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderClerkId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: function() { return !this.fileUrl; }, // Required only if no file
    },
    fileUrl: String,
    fileType: String,
    isPrivate: {
      type: Boolean,
      default: false,
    },
    recipientId: {
      type: String,
      required: function() { return this.isPrivate; }, // Required only if isPrivate is true
    },
    recipientClerkId: {
      type: String,
      required: function() { return this.isPrivate; }, // Required only if isPrivate is true
    },
    recipientName: {
      type: String,
      required: function() { return this.isPrivate; }, // Required only if isPrivate is true
    },
    reactions: [ReactionSchema],
    readBy: { type: [String], default: [] }, // Array of clerkIds
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Add a text index to the message field for efficient searching
MessageSchema.index({ message: 'text' });

module.exports = mongoose.model('Message', MessageSchema);
