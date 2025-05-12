/**
 * Simplified Project Model for SelfCast Dynamic MVP
 * 
 * This model maintains the key-value structure for backward compatibility
 * while using MongoDB's document-based storage.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Simple key-value content item schema
const contentItemSchema = new Schema({
  key: {
    type: String,
    required: true
  },
  value: {
    type: String,
    default: ''
  }
});

// Simplified project schema
const projectSchema = new Schema({
  // Project ID - the critical field preserved from the current system
  projectId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Content array - direct key-value pairs for compatibility
  content: [contentItemSchema],
  
  // Basic timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to ensure key uniqueness within a project
projectSchema.index({ projectId: 1, 'content.key': 1 }, { unique: true });

// Pre-save middleware to update the updatedAt timestamp
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
