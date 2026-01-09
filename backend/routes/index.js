var express = require('express');
var router = express.Router();
const { connectToDB, ObjectId } = require('../utils/db');

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.render('index', { title: 'JustAsk 繁體中文問答社區' });
});

/* API: Get status */
router.get('/api/status', function(req, res) {
  res.json({ 
    success: true, 
    message: 'Backend API is working!',
    user: req.session.user || null 
  });
});

module.exports = router;
