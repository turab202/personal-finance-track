import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables specifically for this file
dotenv.config({ path: '.env' });

// Debug: Verify JWT_SECRET is loaded
console.log('[authRoutes] JWT_SECRET:', process.env.JWT_SECRET ? '*****' : 'MISSING');

const router = express.Router();

// Get JWT_SECRET with validation
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not configured');
  throw new Error('JWT_SECRET is not configured');
}

// Enhanced Register Route
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt for:', req.body.email);
    const { name, email, password } = req.body;

    // Validate input with detailed error messages
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'All fields are required',
        missingFields: {
          name: !name,
          email: !email,
          password: !password
        }
      });
    }

    // Check if user exists with case-insensitive email
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(email, 'i') } 
    });
    
    if (existingUser) {
      console.log('Registration failed: Email already exists', email);
      return res.status(400).json({ 
        message: 'Email already registered',
        suggestion: 'Try logging in or use a different email'
      });
    }

    // Create and save new user
    const newUser = new User({ 
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    await newUser.save();
    console.log('New user registered:', newUser.email);

    // Generate JWT token with enhanced options
    const token = jwt.sign(
      { 
        id: newUser._id,
        email: newUser.email
      }, 
      JWT_SECRET, 
      { 
        expiresIn: '1d',
        algorithm: 'HS256'
      }
    );

    // Secure response
    return res.status(201).json({
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt
      },
      token,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced Login Route
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required',
        missingFields: {
          email: !email,
          password: !password
        }
      });
    }

    // Find user with case-insensitive email
    const user = await User.findOne({ 
      email: { $regex: new RegExp(email, 'i') } 
    });

    if (!user) {
      console.log('Login failed: User not found', email);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        suggestion: 'Check your email or register first'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Login failed: Invalid password for', email);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        suggestion: 'Check your password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email
      }, 
      JWT_SECRET, 
      { 
        expiresIn: '1d',
        algorithm: 'HS256'
      }
    );

    // Secure response
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin
      },
      token,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced Token Refresh Route
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('Refresh failed: No authorization header');
      return res.status(401).json({ 
        message: 'Authorization header missing' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Refresh failed: Malformed authorization header');
      return res.status(401).json({ 
        message: 'Malformed authorization header',
        expectedFormat: 'Bearer <token>'
      });
    }

    // Verify token (ignore expiration but verify signature)
    const decoded = jwt.verify(token, JWT_SECRET, { 
      ignoreExpiration: true,
      algorithms: ['HS256']
    });
    
    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('Refresh failed: User not found for token');
      return res.status(401).json({ 
        message: 'User account not found',
        suggestion: 'Register again or contact support'
      });
    }

    // Issue new token
    const newToken = jwt.sign(
      { 
        id: user._id,
        email: user.email
      }, 
      JWT_SECRET, 
      { 
        expiresIn: '1d',
        algorithm: 'HS256'
      }
    );

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    return res.json({ 
      token: newToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ 
      message: 'Invalid token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestion: 'Try logging in again'
    });
  }
});

export default router;