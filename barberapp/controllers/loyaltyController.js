const User = require('../models/User');
const Loyalty = require('../models/Loyalty');
const HaircutRecord = require('../models/HaircutRecord');

// Criar ou recuperar perfil de fidelidade
exports.getLoyaltyProfile = async (req, res) => {
  try {
    let loyalty = await Loyalty.findOne({ user: req.user.id });
    
    // Se não existir, cria um novo
    if (!loyalty) {
      loyalty = await Loyalty.create({
        user: req.user.id,
        currentPoints: 0,
        totalHaircuts: 0,
        freeHaircutsEarned: 0,
        freeHaircutsUsed: 0,
        pointsToNextFree: 10
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        loyalty
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Registrar um novo corte de cabelo
exports.registerHaircut = async (req, res) => {
  try {
    const { barberId, service, price, appointmentId, useFreeHaircut } = req.body;
    
    // Verificar se o usuário existe
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar se o barbeiro existe
    const barber = await User.findById(barberId);
    if (!barber || barber.role !== 'barbeiro') {
      return res.status(404).json({
        status: 'fail',
        message: 'Barbeiro não encontrado'
      });
    }
    
    // Buscar ou criar perfil de fidelidade
    let loyalty = await Loyalty.findOne({ user: user._id });
    if (!loyalty) {
      loyalty = await Loyalty.create({
        user: user._id,
        currentPoints: 0,
        totalHaircuts: 0,
        freeHaircutsEarned: 0,
        freeHaircutsUsed: 0,
        pointsToNextFree: 10
      });
    }
    
    // Verificar se o usuário quer usar um corte grátis
    const isFree = useFreeHaircut && (loyalty.freeHaircutsEarned - loyalty.freeHaircutsUsed) > 0;
    
    // Criar registro de corte
    const haircutRecord = await HaircutRecord.create({
      user: user._id,
      barber: barberId,
      service,
      price,
      isFree,
      pointsEarned: isFree ? 0 : 1,
      appointmentId
    });
    
    // Atualizar perfil de fidelidade
    if (isFree) {
      // Se for corte grátis, incrementa freeHaircutsUsed
      loyalty.freeHaircutsUsed += 1;
    } else {
      // Se for corte pago, incrementa pontos e total de cortes
      loyalty.currentPoints += 1;
      loyalty.totalHaircuts += 1;
      
      // Verificar se atingiu 10 cortes
      if (loyalty.currentPoints >= 10) {
        loyalty.freeHaircutsEarned += 1;
        loyalty.currentPoints -= 10;
      }
    }
    
    // Calcular pontos para o próximo corte grátis
    loyalty.pointsToNextFree = 10 - loyalty.currentPoints;
    
    // Atualizar data de modificação
    loyalty.updatedAt = Date.now();
    
    // Salvar alterações
    await loyalty.save();
    
    res.status(201).json({
      status: 'success',
      data: {
        haircut: haircutRecord,
        loyalty
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Obter histórico de cortes do usuário
exports.getHaircutHistory = async (req, res) => {
  try {
    const haircuts = await HaircutRecord.find({ user: req.params.userId })
      .sort('-date')
      .populate('barber', 'name');
    
    res.status(200).json({
      status: 'success',
      results: haircuts.length,
      data: {
        haircuts
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Verificar se o usuário tem direito a corte grátis
exports.checkFreeHaircut = async (req, res) => {
  try {
    const loyalty = await Loyalty.findOne({ user: req.user.id });
    
    if (!loyalty) {
      return res.status(404).json({
        status: 'fail',
        message: 'Perfil de fidelidade não encontrado'
      });
    }
    
    const freeHaircutsAvailable = loyalty.freeHaircutsEarned - loyalty.freeHaircutsUsed;
    
    res.status(200).json({
      status: 'success',
      data: {
        freeHaircutsAvailable,
        currentPoints: loyalty.currentPoints,
        pointsToNextFree: loyalty.pointsToNextFree
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Para administradores: obter estatísticas de fidelidade
exports.getLoyaltyStats = async (req, res) => {
  try {
    // Verificar se o usuário é admin
    if (req.user.role !== 'admin' && req.user.role !== 'barbeiro') {
      return res.status(403).json({
        status: 'fail',
        message: 'Acesso não autorizado'
      });
    }
    
    const stats = await HaircutRecord.aggregate([
      {
        $group: {
          _id: null,
          totalHaircuts: { $sum: 1 },
          totalFreeHaircuts: { $sum: { $cond: [{ $eq: ['$isFree', true] }, 1, 0] } },
          totalPaidHaircuts: { $sum: { $cond: [{ $eq: ['$isFree', false] }, 1, 0] } },
          averagePrice: { $avg: '$price' },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$isFree', false] }, '$price', 0] } }
        }
      }
    ]);
    
    const userStats = await Loyalty.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalFreeEarned: { $sum: '$freeHaircutsEarned' },
          totalFreeUsed: { $sum: '$freeHaircutsUsed' },
          avgHaircutsPerUser: { $avg: '$totalHaircuts' }
        }
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: {
        haircutStats: stats[0] || {},
        userStats: userStats[0] || {}
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};
