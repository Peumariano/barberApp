const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('../routes/authRoutes.js');
const loyaltyRoutes = require('../routes/loyaltyRoutes');
const userRoutes = require('../routes/userRoutes');
require('events').EventEmitter.defaultMaxListeners = 20;


// Inicializar app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Logging em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/users', userRoutes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
});

module.exports = app;
