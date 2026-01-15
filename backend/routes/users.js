var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const { connectToDB } = require('../utils/db');
const { verifyAccessToken } = require('../utils/jwt');

// Middleware to check if user is logged in (supports both session and JWT)
function requireLogin(req, res, next) {
  // First try JWT from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = payload;
      return next();
    }
    return res.status(401).json({ success: false, message: '認證失敗，請重新登入' });
  }

  // Fall back to session (for web app)
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  return res.status(401).json({ success: false, message: '請先登錄' });
}

// GET register page
router.get('/register', function(req, res) {
  res.render('register', { error: null });
});

// POST register
router.post('/register', async function(req, res) {
  const { username, phone, password, confirmPassword } = req.body;
  
  // Validate phone number (8 digits)
  if (!/^\d{8}$/.test(phone)) {
    return res.status(400).json({ success: false, message: '手機號必須是8位數字，請重新輸入。' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: '兩次輸入的密碼不一致，請重新輸入。' });
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
        return res.status(400).json({ success: false, message: '這個名字已經被佔用了，請換一個。' });
      } else {
        return res.status(400).json({ success: false, message: '這個手機號已經註冊過了。' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection('Users').insertOne({
      username,
      phone,
      password: hashedPassword,
      createdAt: new Date()
    });

    res.json({ success: true, message: '註冊成功！現在您可以登錄了。' });
  } catch (err) {
    console.error('Error in POST /register:', err);
    res.status(500).json({ success: false, message: '註冊時出了一點小問題，請稍後再試。' });
  } finally {
    if (db) await db.client.close();
  }
});

// POST login
router.post('/login', async function(req, res) {
  const { username, phone, password } = req.body;
  let db;
  
  try {
    db = await connectToDB();
    // Find user by username AND phone
    const user = await db.collection('Users').findOne({ username, phone });
    if (!user) {
      return res.status(401).json({ success: false, message: '名字或手機號不正確，請檢查後重新輸入。' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '密碼不正確，請重新輸入。' });
    }

    // Set session
    req.session.user = {
      id: user._id,
      username: user.username,
      phone: user.phone
    };

    res.json({ success: true, message: '登錄成功！', user: req.session.user });
  } catch (err) {
    console.error('Error in POST /login:', err);
    res.status(500).json({ success: false, message: '登錄時出了一點小問題，請稍後再試。' });
  } finally {
    if (db) await db.client.close();
  }
});

// GET logout
router.get('/logout', function(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: '登出失敗' });
    }
    res.json({ success: true, message: '已成功登出' });
  });
});

// POST reset-password
router.post('/reset-password', async function(req, res) {
  const { username, phone, newPassword } = req.body;
  
  if (!newPassword) {
     return res.status(400).json({ success: false, message: '請輸入新密碼' });
  }

  let db;
  try {
    db = await connectToDB();
    // Verify user exists with matching username AND phone
    const user = await db.collection('Users').findOne({ username, phone });
    
    if (!user) {
      return res.status(404).json({ success: false, message: '驗證失敗：用戶名與手機號不匹配。' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.collection('Users').updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    res.json({ success: true, message: '密碼重置成功！請使用新密碼登入。' });

  } catch (err) {
    console.error('Error in POST /reset-password:', err);
    res.status(500).json({ success: false, message: '重置密碼時出錯，請稍後再試。' });
  } finally {
    if (db) await db.client.close();
  }
});

// GET /users/profile - Get current user profile
router.get('/profile', requireLogin, async function(req, res) {
  let db;
  try {
    db = await connectToDB();
    const { ObjectId } = require('mongodb');
    
    const user = await db.collection('Users').findOne({ 
      _id: new ObjectId(req.user.id) 
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用戶不存在' });
    }

    res.json({ 
      success: true, 
      data: {
        _id: user._id.toString(),
        username: user.username,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Error in GET /users/profile:', err);
    res.status(500).json({ success: false, message: '獲取用戶資料失敗' });
  } finally {
    if (db) await db.client.close();
  }
});

module.exports = router;
