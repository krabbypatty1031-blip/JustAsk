var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const { connectToDB } = require('../utils/db');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} = require('../utils/jwt');

// Store for invalidated refresh tokens (in production, use Redis or database)
const invalidatedTokens = new Set();

// POST /api/auth/register - Register new user (mobile)
router.post('/register', async function(req, res) {
  const { username, phone, password } = req.body;
  
  // Validate inputs
  if (!username || !phone || !password) {
    return res.status(400).json({ success: false, message: '請填寫所有欄位' });
  }

  // Validate phone number (8 digits)
  if (!/^\d{8}$/.test(phone)) {
    return res.status(400).json({ success: false, message: '手機號必須是8位數字' });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密碼至少需要6位' });
  }

  let db;
  try {
    db = await connectToDB();
    
    // Check if username or phone already exists
    const existingUser = await db.collection('Users').findOne({ 
      $or: [{ username: username }, { phone: phone }] 
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ success: false, message: '這個名字已經被佔用了' });
      } else {
        return res.status(400).json({ success: false, message: '這個手機號已經註冊過了' });
      }
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('Users').insertOne({
      username,
      phone,
      password: hashedPassword,
      createdAt: new Date()
    });

    // Get the created user
    const newUser = await db.collection('Users').findOne({ _id: result.insertedId });

    // Generate tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.json({ 
      success: true, 
      message: '註冊成功！',
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: newUser._id.toString(),
          username: newUser.username,
          phone: newUser.phone,
          createdAt: newUser.createdAt
        }
      }
    });
  } catch (err) {
    console.error('Error in POST /api/auth/register:', err);
    res.status(500).json({ success: false, message: '註冊時出了問題，請稍後再試' });
  } finally {
    if (db) await db.client.close();
  }
});

// POST /api/auth/login - Login (mobile)
router.post('/login', async function(req, res) {
  const { username, phone, password } = req.body;
  
  // Validate inputs
  if (!username || !phone || !password) {
    return res.status(400).json({ success: false, message: '請填寫所有欄位' });
  }

  let db;
  try {
    db = await connectToDB();
    
    // Find user by username AND phone
    const user = await db.collection('Users').findOne({ username, phone });
    if (!user) {
      return res.status(401).json({ success: false, message: '用戶名或手機號不正確' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '密碼不正確' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({ 
      success: true, 
      message: '登入成功！',
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id.toString(),
          username: user.username,
          phone: user.phone,
          createdAt: user.createdAt
        }
      }
    });
  } catch (err) {
    console.error('Error in POST /api/auth/login:', err);
    res.status(500).json({ success: false, message: '登入時出了問題，請稍後再試' });
  } finally {
    if (db) await db.client.close();
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async function(req, res) {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: '缺少刷新令牌' });
  }

  // Check if token has been invalidated
  if (invalidatedTokens.has(refreshToken)) {
    return res.status(401).json({ success: false, message: '令牌已失效，請重新登入' });
  }

  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return res.status(401).json({ success: false, message: '令牌無效或已過期，請重新登入' });
  }

  let db;
  try {
    db = await connectToDB();
    const { ObjectId } = require('mongodb');
    
    // Get user from database
    const user = await db.collection('Users').findOne({ _id: new ObjectId(payload.id) });
    if (!user) {
      return res.status(401).json({ success: false, message: '用戶不存在' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({ 
      success: true,
      data: {
        accessToken
      }
    });
  } catch (err) {
    console.error('Error in POST /api/auth/refresh:', err);
    res.status(500).json({ success: false, message: '刷新令牌時出錯' });
  } finally {
    if (db) await db.client.close();
  }
});

// POST /api/auth/logout - Logout (invalidate refresh token)
router.post('/logout', function(req, res) {
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    // Add to invalidated tokens set
    invalidatedTokens.add(refreshToken);
    
    // Clean up old invalidated tokens periodically (in production, use TTL in Redis)
    if (invalidatedTokens.size > 10000) {
      // Simple cleanup - remove oldest entries
      const tokens = Array.from(invalidatedTokens);
      invalidatedTokens.clear();
      tokens.slice(-5000).forEach(t => invalidatedTokens.add(t));
    }
  }

  res.json({ success: true, message: '已成功登出' });
});

module.exports = router;
