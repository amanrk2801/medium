import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import smartUpload from '../middleware/smartUpload.js';
import { uploadImage, deleteImage } from '../services/uploadService.js';

const router = express.Router();

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

// Register
router.post('/register', [
  body('name').isLength({ min: 2, max: 50 }).trim().withMessage('Name must be between 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers.length,
        following: user.following.length
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required'),
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

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers.length,
        following: user.following.length
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'name email avatar')
      .populate('following', 'name email avatar');

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        isVerified: user.isVerified,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Update profile
router.put('/profile', authenticateToken, [
  body('name').optional().isLength({ min: 2, max: 50 }).trim(),
  body('bio').optional().isLength({ max: 200 }).trim(),
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

    const { name, bio } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers.length,
        following: user.following.length
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during profile update' 
    });
  }
});

// Upload avatar
router.post('/avatar', authenticateToken, smartUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Please upload an image file' 
      });
    }

    // Delete old avatar if exists
    if (req.user.avatar && req.user.avatar.public_id) {
      await deleteImage(req.user.avatar.public_id);
    }

    // Upload avatar
    const uploadResult = await uploadImage(req.file, {
      folder: 'medium-clone/avatars',
      width: 300,
      height: 300,
      crop: 'fill'
    });

    // Update user avatar
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: {
          public_id: uploadResult.public_id,
          url: uploadResult.url
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during avatar upload' 
    });
  }
});

// Follow/Unfollow user
router.post('/follow/:userId', validateUserId, authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false,
        message: 'You cannot follow yourself' 
      });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(userId);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(userId);
      userToFollow.followers.pull(req.user._id);
    } else {
      // Follow
      currentUser.following.push(userId);
      userToFollow.followers.push(req.user._id);
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({
      success: true,
      message: isFollowing ? 'User unfollowed' : 'User followed',
      isFollowing: !isFollowing
    });
  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

export default router;