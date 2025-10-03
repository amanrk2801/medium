import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  excerpt: {
    type: String,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  category: {
    type: String,
    enum: ['Technology', 'Health', 'Business', 'Science', 'Politics', 'Sports', 'Entertainment', 'Other'],
    default: 'Other'
  },
  featuredImage: {
    public_id: String,
    url: String
  },
  readTime: {
    type: Number,
    default: 1
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  published: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  views: {
    type: Number,
    default: 0
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Calculate read time based on content length
articleSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / wordsPerMinute);
  }
  
  // Generate excerpt if not provided
  if (this.isModified('content') && !this.excerpt) {
    const plainText = this.content.replace(/[#*`]/g, '').substring(0, 300);
    this.excerpt = plainText + (plainText.length === 300 ? '...' : '');
  }
  
  // Set published date
  if (this.isModified('published') && this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Indexes for better performance
articleSchema.index({ author: 1, createdAt: -1 });
articleSchema.index({ published: 1, publishedAt: -1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ category: 1 });
articleSchema.index({ title: 'text', content: 'text' });

export default mongoose.model('Article', articleSchema);