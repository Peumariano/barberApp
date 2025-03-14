const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');

// Middleware para verificar autenticação
exports.authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Verificar token no header ou cookie
    if (
      req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Por favor, faça login para acessar'
      });
    }
    
    // Verificar token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Verificar se o usuário existe
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Este usuário não existe mais'
      });
    }
    
    // Tudo ok, adicionar usuário ao request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Não autorizado'
    });
  }
};

// Middleware para verificar permissões
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Você não tem permissão para esta operação'
      });
    }
    next();
  };
};