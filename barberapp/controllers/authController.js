const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

// Gerar token JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Enviar token como resposta
const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Opções para o cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  
  // Cookie seguro em produção
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  
  // Remover a senha da saída
  user.password = undefined;
  
  // Enviar cookie e resposta
  res.cookie('jwt', token, cookieOptions)
    .status(statusCode)
    .json({
      status: 'success',
      token,
      data: {
        user
      }
    });
};

// Registro de usuário
exports.register = async (req, res, next) => {
  try {
    // Criar novo usuário
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      role: req.body.role || 'cliente'
    });
    
    // Enviar token
    sendToken(newUser, 201, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Login de usuário
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Verificar se email e senha foram fornecidos
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Por favor, forneça email e senha'
      });
    }
    
    // Verificar se o usuário existe e a senha está correta
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Email ou senha incorretos'
      });
    }
    
    // Se tudo estiver ok, enviar token
    sendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Middleware para proteger rotas
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Verificar se o token existe
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
        message: 'Você não está logado. Por favor, faça login para ter acesso'
      });
    }
    
    // Verificar token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Verificar se o usuário ainda existe
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'O usuário deste token não existe mais'
      });
    }
    
    // Conceder acesso à rota protegida
    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Token inválido ou expirado'
    });
  }
};

// Middleware para restringir acesso por função
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Você não tem permissão para realizar esta ação'
      });
    }
    next();
  };
};

// Verificar estado de autenticação
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // Verificar token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      
      // Verificar se o usuário ainda existe
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return res.status(200).json({
          status: 'success',
          loggedIn: false
        });
      }
      
      // Usuário está logado
      return res.status(200).json({
        status: 'success',
        loggedIn: true,
        data: {
          user: currentUser
        }
      });
    }
    
    res.status(200).json({
      status: 'success',
      loggedIn: false
    });
  } catch (error) {
    res.status(200).json({
      status: 'success',
      loggedIn: false
    });
  }
};

// Logout
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  }).status(200).json({
    status: 'success'
  });
};