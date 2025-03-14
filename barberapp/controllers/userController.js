const User = require('../models/User');

// Obter todos os usuários (apenas para admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Obter um usuário específico
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Usuário não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Obter perfil do usuário atual
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Atualizar perfil do usuário atual
exports.updateMe = async (req, res) => {
  try {
    // Não permitir atualizações de senha aqui
    if (req.body.password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Esta rota não é para atualizações de senha. Use /updatePassword.'
      });
    }
    
    // Filtrar campos não permitidos
    const filteredBody = filterObj(req.body, 'name', 'email', 'phone');
    
    // Atualizar usuário
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Desativar conta do usuário atual
exports.deleteMe = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Criar um novo usuário (admin)
exports.createUser = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      role: req.body.role || 'cliente'
    });
    
    // Remover a senha da resposta
    newUser.password = undefined;
    
    res.status(201).json({
      status: 'success',
      data: {
        user: newUser
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Atualizar usuário (admin)
exports.updateUser = async (req, res) => {
  try {
    // Não permitir atualizações de senha
    if (req.body.password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Use as rotas de atualização de senha apropriadas.'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Usuário não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Excluir usuário (admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Usuário não encontrado'
      });
    }
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Obter barbeiros (para listagem de agendamentos)
exports.getBarbers = async (req, res) => {
  try {
    const barbers = await User.find({ role: 'barbeiro' }).select('name');
    
    res.status(200).json({
      status: 'success',
      results: barbers.length,
      data: {
        barbers
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Função auxiliar para filtrar objetos
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
