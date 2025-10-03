import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import Article from '../models/Article.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import smartUpload from '../middleware/smartUpload.js';
import { uploadImage, deleteImage } from '../services/uploadService.js';

const router = express.Router();

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid article ID format' 
    });
  }
  next();
};

// Middleware to validate comment ObjectId
const validateCommentId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid comment ID format' 
    });
  }
  next();
};

// Middleware to validate user ObjectId
const validateUserId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid user ID format' 
    });
  }
  next();
};

// Get all published articles (public feed)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { tag, category, search, author } = req.query;

    let query = { published: true };
    
    if (tag && tag.trim()) {
      query.tags = { $in: [tag.trim()] };
    }
    
    if (category && category.trim() && category !== 'All') {
      query.category = category.trim();
    }
    
    if (author && author.trim()) {
      query.author = author.trim();
    }
    
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ];
    }



    const articles = await Article.find(query)
      .populate('author', 'name email avatar bio')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Article.countDocuments(query);

    // Add user-specific data if authenticated
    const articlesWithUserData = articles.map(article => {
      const articleData = {
        id: article._id,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        author: article.author,
        tags: article.tags,
        category: article.category,
        featuredImage: article.featuredImage,
        readTime: article.readTime,
        likesCount: article.likes.length,
        commentsCount: article.comments.length,
        views: article.views,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt
      };

      if (req.user) {
        articleData.isLiked = article.likes.some(like => like.user.toString() === req.user._id.toString());
        articleData.isBookmarked = article.bookmarks.includes(req.user._id);
      }

      return articleData;
    });

    res.json({
      success: true,
      articles: articlesWithUserData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get single article by ID
router.get('/:id', validateObjectId, optionalAuth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', 'name email avatar bio followers following')
      .populate('comments.user', 'name email avatar');

    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: 'Article not found' 
      });
    }

    // Check if article is published or if user is the author (for editing drafts)
    const isAuthor = req.user && article.author._id.toString() === req.user._id.toString();
    if (!article.published && !isAuthor) {
      return res.status(404).json({ 
        success: false,
        message: 'Article not found' 
      });
    }

    // Increment view count
    await Article.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    const articleData = {
      id: article._id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      author: article.author,
      tags: article.tags,
      category: article.category,
      featuredImage: article.featuredImage,
      readTime: article.readTime,
      likes: article.likes,
      comments: article.comments.map(comment => ({
        id: comment._id,
        content: comment.content,
        user: comment.user,
        createdAt: comment.createdAt
      })),
      views: article.views + 1,
      published: article.published,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt
    };

    if (req.user) {
      articleData.isLiked = article.likes.some(like => like.user.toString() === req.user._id.toString());
      articleData.isBookmarked = article.bookmarks.includes(req.user._id);
      articleData.isFollowingAuthor = article.author.followers.includes(req.user._id);
    }

    res.json({
      success: true,
      article: articleData
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Create new article
router.post('/', authenticateToken, [
  body('title').isLength({ min: 1, max: 200 }).trim().withMessage('Title is required and must be less than 200 characters'),
  body('content').isLength({ min: 1 }).withMessage('Content is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('category').optional().isIn(['Technology', 'Health', 'Business', 'Science', 'Politics', 'Sports', 'Entertainment', 'Other']),
  body('published').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { title, content, tags, category, published, excerpt } = req.body;

    const article = new Article({
      title,
      content,
      excerpt,
      author: req.user._id,
      tags: tags || [],
      category: category || 'Other',
      published: published || false
    });

    await article.save();
    await article.populate('author', 'name email avatar bio');

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      article: {
        id: article._id,
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        author: article.author,
        tags: article.tags,
        category: article.category,
        readTime: article.readTime,
        published: article.published,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt
      }
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Update article
router.put('/:id', validateObjectId, authenticateToken, [
  body('title').optional().isLength({ min: 1, max: 200 }).trim(),
  body('content').optional().isLength({ min: 1 }),
  body('tags').optional().isArray(),
  body('category').optional().isIn(['Technology', 'Health', 'Business', 'Science', 'Politics', 'Sports', 'Entertainment', 'Other']),
  body('published').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: 'Article not found' 
      });
    }

    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this article' 
      });
    }

    const updates = req.body;
    Object.assign(article, updates);
    
    await article.save();
    await article.populate('author', 'name email avatar bio');

    res.json({
      success: true,
      message: 'Article updated successfully',
      article: {
        id: article._id,
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        author: article.author,
        tags: article.tags,
        category: article.category,
        featuredImage: article.featuredImage,
        readTime: article.readTime,
        published: article.published,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt
      }
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Delete article
router.delete('/:id', validateObjectId, authenticateToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: 'Article not found' 
      });
    }

    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this article' 
      });
    }

    // Delete featured image if exists
    if (article.featuredImage && article.featuredImage.public_id) {
      await deleteImage(article.featuredImage.public_id);
    }

    await Article.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true,
      message: 'Article deleted successfully' 
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Debug middleware to log raw request
const debugRequest = (req, res, next) => {
  console.log('Raw request info:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length']
  });
  next();
};

// Upload featured image
router.post('/:id/image', validateObjectId, authenticateToken, debugRequest, smartUpload.single('image'), async (req, res) => {
  try {
    console.log('Image upload request received for article:', req.params.id);
    console.log('Request headers:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    });
    console.log('File info:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferExists: !!req.file.buffer,
      bufferLength: req.file.buffer ? req.file.buffer.length : 'no buffer',
      filename: req.file.filename || 'no filename'
    } : 'No file');

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Please upload an image file' 
      });
    }

    // Additional validation for file content
    if (req.file.buffer && req.file.buffer.length === 0) {
      console.log('File buffer is empty');
      return res.status(400).json({ 
        success: false,
        message: 'Uploaded file is empty' 
      });
    }

    if (req.file.size === 0) {
      console.log('File size is 0');
      return res.status(400).json({ 
        success: false,
        message: 'Uploaded file has no content' 
      });
    }

    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: 'Article not found' 
      });
    }

    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this article' 
      });
    }

    // Delete old image if exists
    if (article.featuredImage && article.featuredImage.public_id) {
      await deleteImage(article.featuredImage.public_id);
    }

    // Upload image with fallback
    let uploadResult;
    try {
      uploadResult = await uploadImage(req.file, {
        folder: 'medium-clone/articles',
        width: 800,
        height: 400,
        crop: 'fill'
      });
    } catch (uploadError) {
      console.error('Primary upload failed, trying fallback:', uploadError.message);
      
      // If Cloudinary fails, try local storage as fallback
      if (uploadError.message.includes('Cloudinary')) {
        console.log('Attempting local storage fallback...');
        
        // Temporarily disable Cloudinary for this upload
        const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;
        process.env.CLOUDINARY_CLOUD_NAME = '';
        
        try {
          uploadResult = await uploadImage(req.file, {
            folder: 'medium-clone/articles'
          });
          console.log('Local storage fallback successful');
        } finally {
          // Restore Cloudinary config
          process.env.CLOUDINARY_CLOUD_NAME = originalCloudName;
        }
      } else {
        throw uploadError;
      }
    }

    // Update article image
    article.featuredImage = {
      public_id: uploadResult.public_id,
      url: uploadResult.url
    };

    await article.save();

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      featuredImage: article.featuredImage
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}` 
    });
  }
});

// Like/Unlike article
router.post('/:id/like', validateObjectId, authenticateToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: 'Article not found' 
      });
    }

    const existingLike = article.likes.find(
      like => like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike
      article.likes = article.likes.filter(
        like => like.user.toString() !== req.user._id.toString()
      );
    } else {
      // Like
      article.likes.push({ user: req.user._id });
    }

    await article.save();

    res.json({
      success: true,
      message: existingLike ? 'Article unliked' : 'Article liked',
      likesCount: article.likes.length,
      isLiked: !existingLike
    });
  } catch (error) {
    console.error('Like article error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Bookmark/Unbookmark article
router.post('/:id/bookmark', validateObjectId, authenticateToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: 'Article not found' 
      });
    }

    const isBookmarked = article.bookmarks.includes(req.user._id);

    if (isBookmarked) {
      // Remove bookmark
      article.bookmarks.pull(req.user._id);
    } else {
      // Add bookmark
      article.bookmarks.push(req.user._id);
    }

    await article.save();

    res.json({
      success: true,
      message: isBookmarked ? 'Bookmark removed' : 'Article bookmarked',
      isBookmarked: !isBookmarked
    });
  } catch (error) {
    console.error('Bookmark article error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Add comment to article
router.post('/:id/comments', validateObjectId, authenticateToken, [
  body('content').isLength({ min: 1, max: 1000 }).trim().withMessage('Comment must be between 1-1000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: 'Article not found' 
      });
    }

    const comment = {
      user: req.user._id,
      content: req.body.content
    };

    article.comments.push(comment);
    await article.save();
    
    await article.populate('comments.user', 'name email avatar');
    
    const newComment = article.comments[article.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        id: newComment._id,
        content: newComment.content,
        user: newComment.user,
        createdAt: newComment.createdAt
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get user's articles
router.get('/user/my-articles', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const articles = await Article.find({ author: req.user._id })
      .populate('author', 'name email avatar bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Article.countDocuments({ author: req.user._id });

    const articlesWithData = articles.map(article => ({
      id: article._id,
      title: article.title,
      excerpt: article.excerpt,
      author: article.author,
      tags: article.tags,
      category: article.category,
      featuredImage: article.featuredImage,
      readTime: article.readTime,
      likesCount: article.likes.length,
      commentsCount: article.comments.length,
      views: article.views,
      published: article.published,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt
    }));

    res.json({
      success: true,
      articles: articlesWithData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user articles error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get bookmarked articles
router.get('/user/bookmarks', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const articles = await Article.find({ 
      bookmarks: req.user._id,
      published: true 
    })
      .populate('author', 'name email avatar bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Article.countDocuments({ 
      bookmarks: req.user._id,
      published: true 
    });

    const articlesWithData = articles.map(article => ({
      id: article._id,
      title: article.title,
      excerpt: article.excerpt,
      author: article.author,
      tags: article.tags,
      category: article.category,
      featuredImage: article.featuredImage,
      readTime: article.readTime,
      likesCount: article.likes.length,
      commentsCount: article.comments.length,
      views: article.views,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      isBookmarked: true
    }));

    res.json({
      success: true,
      articles: articlesWithData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get bookmarked articles error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get articles by specific user (public profile)
router.get('/user/:userId', validateUserId, optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const articles = await Article.find({ 
      author: req.params.userId,
      published: true 
    })
      .populate('author', 'name email avatar bio')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Article.countDocuments({ 
      author: req.params.userId,
      published: true 
    });

    const articlesWithUserData = articles.map(article => {
      const articleData = {
        id: article._id,
        title: article.title,
        excerpt: article.excerpt,
        author: article.author,
        tags: article.tags,
        category: article.category,
        featuredImage: article.featuredImage,
        readTime: article.readTime,
        likesCount: article.likes.length,
        commentsCount: article.comments.length,
        views: article.views,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt
      };

      if (req.user) {
        articleData.isLiked = article.likes.some(like => like.user.toString() === req.user._id.toString());
        articleData.isBookmarked = article.bookmarks.includes(req.user._id);
      }

      return articleData;
    });

    res.json({
      success: true,
      articles: articlesWithUserData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user articles error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Update comment
router.put('/:id/comments/:commentId', validateObjectId, validateCommentId, authenticateToken, [
  body('content').isLength({ min: 1, max: 1000 }).trim().withMessage('Comment must be between 1-1000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: 'Article not found' 
      });
    }

    const comment = article.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ 
        success: false,
        message: 'Comment not found' 
      });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this comment' 
      });
    }

    comment.content = req.body.content;
    await article.save();
    
    await article.populate('comments.user', 'name email avatar');
    
    const updatedComment = article.comments.id(req.params.commentId);

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment: {
        id: updatedComment._id,
        content: updatedComment.content,
        user: updatedComment.user,
        createdAt: updatedComment.createdAt
      }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Delete comment
router.delete('/:id/comments/:commentId', validateObjectId, validateCommentId, authenticateToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: 'Article not found' 
      });
    }

    const comment = article.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ 
        success: false,
        message: 'Comment not found' 
      });
    }

    // Allow comment deletion by comment author or article author
    if (comment.user.toString() !== req.user._id.toString() && 
        article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this comment' 
      });
    }

    article.comments.pull(req.params.commentId);
    await article.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Bulk delete articles
router.delete('/bulk/delete', authenticateToken, [
  body('articleIds').isArray({ min: 1 }).withMessage('Article IDs array is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { articleIds } = req.body;

    // Find articles and verify ownership
    const articles = await Article.find({
      _id: { $in: articleIds },
      author: req.user._id
    });

    if (articles.length !== articleIds.length) {
      return res.status(403).json({ 
        success: false,
        message: 'Some articles not found or not authorized' 
      });
    }

    // Delete featured images
    for (const article of articles) {
      if (article.featuredImage && article.featuredImage.public_id) {
        try {
          await deleteImage(article.featuredImage.public_id);
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }
    }

    // Delete articles
    await Article.deleteMany({
      _id: { $in: articleIds },
      author: req.user._id
    });

    res.json({
      success: true,
      message: `${articles.length} articles deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Bulk update articles (publish/unpublish)
router.put('/bulk/update', authenticateToken, [
  body('articleIds').isArray({ min: 1 }).withMessage('Article IDs array is required'),
  body('updates').isObject().withMessage('Updates object is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { articleIds, updates } = req.body;

    // Only allow certain fields to be bulk updated
    const allowedUpdates = ['published', 'category'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No valid updates provided' 
      });
    }

    // Set publishedAt if publishing
    if (filteredUpdates.published === true) {
      filteredUpdates.publishedAt = new Date();
    }

    const result = await Article.updateMany(
      {
        _id: { $in: articleIds },
        author: req.user._id
      },
      filteredUpdates
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} articles updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get article statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      totalViews,
      totalLikes,
      totalComments,
      totalBookmarks
    ] = await Promise.all([
      Article.countDocuments({ author: userId }),
      Article.countDocuments({ author: userId, published: true }),
      Article.countDocuments({ author: userId, published: false }),
      Article.aggregate([
        { $match: { author: userId } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]),
      Article.aggregate([
        { $match: { author: userId } },
        { $group: { _id: null, total: { $sum: { $size: '$likes' } } } }
      ]),
      Article.aggregate([
        { $match: { author: userId } },
        { $group: { _id: null, total: { $sum: { $size: '$comments' } } } }
      ]),
      Article.aggregate([
        { $match: { author: userId } },
        { $group: { _id: null, total: { $sum: { $size: '$bookmarks' } } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalArticles,
        publishedArticles,
        draftArticles,
        totalViews: totalViews[0]?.total || 0,
        totalLikes: totalLikes[0]?.total || 0,
        totalComments: totalComments[0]?.total || 0,
        totalBookmarks: totalBookmarks[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get trending articles
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const days = parseInt(req.query.days) || 7; // Default to last 7 days

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const articles = await Article.find({
      published: true,
      publishedAt: { $gte: dateThreshold }
    })
      .populate('author', 'name email avatar bio')
      .sort({ 
        views: -1,
        'likes.length': -1,
        publishedAt: -1 
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Article.countDocuments({
      published: true,
      publishedAt: { $gte: dateThreshold }
    });

    const articlesWithUserData = articles.map(article => {
      const articleData = {
        id: article._id,
        title: article.title,
        excerpt: article.excerpt,
        author: article.author,
        tags: article.tags,
        category: article.category,
        featuredImage: article.featuredImage,
        readTime: article.readTime,
        likesCount: article.likes.length,
        commentsCount: article.comments.length,
        views: article.views,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt
      };

      if (req.user) {
        articleData.isLiked = article.likes.some(like => like.user.toString() === req.user._id.toString());
        articleData.isBookmarked = article.bookmarks.includes(req.user._id);
      }

      return articleData;
    });

    res.json({
      success: true,
      articles: articlesWithUserData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get trending articles error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Test image upload endpoint (for debugging)
router.post('/test/upload', authenticateToken, smartUpload.single('image'), async (req, res) => {
  try {
    console.log('Test upload - File received:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer ? req.file.buffer.length : 'no buffer'
    } : 'No file');

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file received' 
      });
    }

    res.json({
      success: true,
      message: 'File received successfully',
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer ? req.file.buffer.length : 0
      }
    });
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

export default router;