var express = require('express');
var router = express.Router();
const { connectToDB, ObjectId } = require('../utils/db');

// Middleware to check if user is logged in
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: '請先登錄' });
  }
  next();
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
    res.json({ success: true, questions });
  } catch (err) {
    console.error('Error in GET /questions:', err);
    res.status(500).json({ success: false, message: '獲取問題列表失敗: ' + err.message });
  } finally {
    if (db) await db.client.close();
  }
});

// POST /questions - Create a new question
router.post('/', requireLogin, async function(req, res) {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: '標題和內容不能為空' });
  }

  let db;
  try {
    db = await connectToDB();
    const newQuestion = {
      title,
      content,
      author: {
        id: req.session.user.id,
        username: req.session.user.username
      },
      createdAt: new Date(),
      answers: [] // Array to store answers
    };
    
    const result = await db.collection('Questions').insertOne(newQuestion);
    res.json({ success: true, message: '問題發布成功', questionId: result.insertedId });
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
    const currentUserId = req.session.user ? req.session.user.id : null;

    // Increment view count
    await db.collection('Questions').updateOne(
      { _id: questionId },
      { $inc: { views: 1 } }
    );

    const question = await db.collection('Questions').findOne({ _id: questionId });
    if (!question) {
      return res.status(404).json({ success: false, message: '找不到該問題' });
    }

    // Process answers to add 'hasThanked' flag and remove sensitive 'thankedBy' array
    if (question.answers) {
      question.answers.forEach(answer => {
        answer.hasThanked = false;
        if (answer.thankedBy && currentUserId) {
          // Check if current user ID is in the list
          answer.hasThanked = answer.thankedBy.includes(currentUserId);
        }
        // Remove the list from response for privacy
        delete answer.thankedBy;
      });
    }

    res.json({ success: true, question });
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
    const userId = req.session.user.id;

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
    const newAnswer = {
      _id: new ObjectId(),
      content,
      author: {
        id: req.session.user.id,
        username: req.session.user.username
      },
      createdAt: new Date()
    };

    await db.collection('Questions').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $push: { answers: newAnswer } }
    );

    res.json({ success: true, message: '回答提交成功', answer: newAnswer });
  } catch (err) {
    console.error('Error in POST /questions/:id/answers:', err);
    res.status(500).json({ success: false, message: '提交回答失敗' });
  } finally {
    if (db) await db.client.close();
  }
});

module.exports = router;
