var express = require('express');
var router = express.Router();
const { connectToDB, ObjectId } = require('../utils/db');
const { verifyAccessToken } = require('../utils/jwt');

// Available tags for questions
const AVAILABLE_TAGS = [
  { id: 'tech', name: '科技', color: '#007bff' },
  { id: 'life', name: '生活', color: '#28a745' },
  { id: 'health', name: '健康', color: '#dc3545' },
  { id: 'education', name: '教育', color: '#ffc107' },
  { id: 'entertainment', name: '娛樂', color: '#6f42c1' },
  { id: 'other', name: '其他', color: '#6c757d' }
];

// GET /questions/tags - Get all available tags
router.get('/tags', function(req, res) {
  res.json({ success: true, data: AVAILABLE_TAGS });
});

// Middleware to check if user is logged in (supports both session and JWT)
function requireLogin(req, res, next) {
  // First try JWT from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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

// Helper to get current user ID from request (session or JWT)
function getCurrentUserId(req) {
  if (req.user) {
    return req.user.id;
  }
  if (req.session && req.session.user) {
    return req.session.user.id;
  }
  return null;
}

// GET /questions - Get all questions (newest first)
router.get('/', async function(req, res) {
  let db;
  try {
    db = await connectToDB();
    const questions = await db.collection('Questions')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Transform questions for API response
    const transformedQuestions = questions.map(q => ({
      _id: q._id.toString(),
      title: q.title,
      content: q.content,
      tags: q.tags || [],
      authorId: q.author?.id,
      authorName: q.author?.username || '匿名用戶',
      createdAt: q.createdAt,
      views: q.views || 0,
      answers: (q.answers || []).map(a => ({
        _id: a._id.toString(),
        content: a.content,
        authorId: a.author?.id,
        authorName: a.author?.username || '匿名用戶',
        createdAt: a.createdAt,
        thanks: a.thanks || 0
      }))
    }));
    
    // Support both old (questions) and new (data) response formats for backward compatibility
    res.json({ success: true, questions: transformedQuestions, data: transformedQuestions });
  } catch (err) {
    console.error('Error in GET /questions:', err);
    res.status(500).json({ success: false, message: '獲取問題列表失敗: ' + err.message });
  } finally {
    if (db) await db.client.close();
  }
});

// POST /questions - Create a new question
router.post('/', requireLogin, async function(req, res) {
  const { title, content, tags } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: '標題不能為空' });
  }

  // Validate tags (optional, must be valid tag IDs if provided)
  let validTags = [];
  if (tags && Array.isArray(tags)) {
    const validTagIds = AVAILABLE_TAGS.map(t => t.id);
    validTags = tags.filter(t => validTagIds.includes(t));
  }

  let db;
  try {
    db = await connectToDB();
    const newQuestion = {
      title: title.trim(),
      content: content ? content.trim() : '',  // 詳細內容為可選
      tags: validTags,  // 標籤為可選
      author: {
        id: req.user.id,
        username: req.user.username
      },
      createdAt: new Date(),
      views: 0,
      answers: [] // Array to store answers
    };
    
    const result = await db.collection('Questions').insertOne(newQuestion);
    
    // Return the created question in API format
    const createdQuestion = {
      _id: result.insertedId.toString(),
      title: newQuestion.title,
      content: newQuestion.content,
      tags: newQuestion.tags,
      authorId: newQuestion.author.id,
      authorName: newQuestion.author.username,
      createdAt: newQuestion.createdAt,
      views: 0,
      answers: []
    };
    
    res.json({ success: true, message: '問題發布成功', data: createdQuestion });
  } catch (err) {
    console.error('Error in POST /questions:', err);
    res.status(500).json({ success: false, message: '發布問題失敗' });
  } finally {
    if (db) await db.client.close();
  }
});

// GET /questions/:id - Get a single question details
router.get('/:id', async function(req, res) {
  let db;
  try {
    db = await connectToDB();
    const questionId = new ObjectId(req.params.id);
    const currentUserId = getCurrentUserId(req);

    // Increment view count
    await db.collection('Questions').updateOne(
      { _id: questionId },
      { $inc: { views: 1 } }
    );

    const question = await db.collection('Questions').findOne({ _id: questionId });
    if (!question) {
      return res.status(404).json({ success: false, message: '找不到該問題' });
    }

    // Transform question for API response
    const transformedQuestion = {
      _id: question._id.toString(),
      title: question.title,
      content: question.content,
      tags: question.tags || [],
      authorId: question.author?.id,
      authorName: question.author?.username || '匿名用戶',
      createdAt: question.createdAt,
      views: (question.views || 0) + 1, // Include the current view
      answers: (question.answers || []).map(answer => ({
        _id: answer._id.toString(),
        content: answer.content,
        authorId: answer.author?.id,
        authorName: answer.author?.username || '匿名用戶',
        createdAt: answer.createdAt,
        thanks: answer.thanks || 0,
        hasThanked: currentUserId && answer.thankedBy ? answer.thankedBy.includes(currentUserId) : false
      }))
    };

    // Support both old (question) and new (data) response formats for backward compatibility
    res.json({ success: true, question: transformedQuestion, data: transformedQuestion });
  } catch (err) {
    console.error('Error in GET /questions/:id:', err);
    res.status(500).json({ success: false, message: '獲取問題詳情失敗' });
  } finally {
    if (db) await db.client.close();
  }
});

// POST /questions/:id/answers/:answerId/thank - Increment thanks count for an answer
router.post('/:id/answers/:answerId/thank', requireLogin, async function(req, res) {
  let db;
  try {
    db = await connectToDB();
    const questionId = new ObjectId(req.params.id);
    const answerId = new ObjectId(req.params.answerId);
    const userId = req.user.id;

    // Use query to ensure user hasn't thanked yet
    const result = await db.collection('Questions').updateOne(
      { 
        _id: questionId, 
        "answers._id": answerId,
        "answers.thankedBy": { $ne: userId } // Condition: User NOT in thankedBy array
      },
      { 
        $inc: { "answers.$.thanks": 1 },
        $push: { "answers.$.thankedBy": userId }
      }
    );

    if (result.matchedCount === 0) {
      // Check if it failed because it was already thanked or because the answer doesn't exist
      const check = await db.collection('Questions').findOne({
        _id: questionId,
        "answers._id": answerId
      });
      
      if (!check) {
        return res.status(404).json({ success: false, message: '找不到該回答' });
      } else {
        return res.status(400).json({ success: false, message: '您已經感謝過了' });
      }
    }

    res.json({ success: true, message: '感谢成功' });
  } catch (err) {
    console.error('Error in POST /thank:', err);
    res.status(500).json({ success: false, message: '操作失敗' });
  } finally {
    if (db) await db.client.close();
  }
});

// POST /questions/:id/answers - Add an answer
router.post('/:id/answers', requireLogin, async function(req, res) {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, message: '回答內容不能為空' });
  }

  let db;
  try {
    db = await connectToDB();
    const questionId = new ObjectId(req.params.id);
    const newAnswer = {
      _id: new ObjectId(),
      content,
      author: {
        id: req.user.id,
        username: req.user.username
      },
      createdAt: new Date(),
      thanks: 0,
      thankedBy: []
    };

    await db.collection('Questions').updateOne(
      { _id: questionId },
      { $push: { answers: newAnswer } }
    );

    // Prepare the new answer for backward compatibility (web app expects this)
    const answerResponse = {
      _id: newAnswer._id,
      content: newAnswer.content,
      author: newAnswer.author,
      createdAt: newAnswer.createdAt
    };

    // Fetch and return the updated question for mobile app
    const updatedQuestion = await db.collection('Questions').findOne({ _id: questionId });
    const currentUserId = req.user.id;
    
    const transformedQuestion = {
      _id: updatedQuestion._id.toString(),
      title: updatedQuestion.title,
      content: updatedQuestion.content,
      tags: updatedQuestion.tags || [],
      authorId: updatedQuestion.author?.id,
      authorName: updatedQuestion.author?.username || '匿名用戶',
      createdAt: updatedQuestion.createdAt,
      views: updatedQuestion.views || 0,
      answers: (updatedQuestion.answers || []).map(answer => ({
        _id: answer._id.toString(),
        content: answer.content,
        authorId: answer.author?.id,
        authorName: answer.author?.username || '匿名用戶',
        createdAt: answer.createdAt,
        thanks: answer.thanks || 0,
        hasThanked: currentUserId && answer.thankedBy ? answer.thankedBy.includes(currentUserId) : false
      }))
    };

    // Support both old (answer) and new (data) response formats for backward compatibility
    res.json({ success: true, message: '回答提交成功', answer: answerResponse, data: transformedQuestion });
  } catch (err) {
    console.error('Error in POST /questions/:id/answers:', err);
    res.status(500).json({ success: false, message: '提交回答失敗' });
  } finally {
    if (db) await db.client.close();
  }
});

module.exports = router;
