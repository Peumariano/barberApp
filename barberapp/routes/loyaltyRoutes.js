const express = require('express');
const loyaltyController = require('../controllers/loyaltyController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Proteger todas as rotas
router.use(authMiddleware.authenticate);

// Rotas para clientes
router.get('/profile', loyaltyController.getLoyaltyProfile);
router.get('/free-haircut', loyaltyController.checkFreeHaircut);
router.get('/history/:userId', loyaltyController.getHaircutHistory);

// Rotas para barbeiros/admin
router.post(
  '/register-haircut/:userId',
  authMiddleware.authorize('barbeiro', 'admin'),
  loyaltyController.registerHaircut
);

// Rotas apenas para admin
router.get(
  '/stats',
  authMiddleware.authorize('admin', 'barbeiro'),
  loyaltyController.getLoyaltyStats
);

module.exports = router;