var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var questionsRouter = require('./routes/questions');

var app = express();

console.log('Current FRONTEND_URL:', process.env.FRONTEND_URL);

// Enable CORS for frontend development and production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Use env var or default to Vite local port
  credentials: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const isProduction = !!process.env.FRONTEND_URL;

app.use(session({
  secret: 'justask-secret-key',
  resave: false,
  saveUninitialized: true,
  proxy: true,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    secure: isProduction, // true in production (HTTPS), false in dev (HTTP)
    sameSite: isProduction ? 'none' : 'lax' // 'none' for cross-origin prod, 'lax' for local
  }
}));

// Make user session available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use('/users', usersRouter);
app.use('/questions', questionsRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
