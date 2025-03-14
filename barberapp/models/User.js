const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor informe seu nome']
  },
  email: {
    type: String,
    required: [true, 'Por favor informe seu email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor informe um email válido']
  },
  password: {
    type: String,
    required: [true, 'Por favor informe uma senha'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Por favor informe seu telefone']
  },
  role: {
    type: String,
    enum: ['cliente', 'barbeiro', 'admin'],
    default: 'cliente'
  },
  haircuts: {
    type: Number,
    default: 0
  },
  freeHaircuts: {
    type: Number,
    default: 0
  },
  haircutHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    wasFree: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para criptografar senha antes de salvar
userSchema.pre('save', async function(next) {
  // Só executa se a senha foi modificada
  if (!this.isModified('password')) return next();
  
  // Criptografa a senha com custo 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para verificar senha
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Método para incrementar cortes e verificar fidelidade
userSchema.methods.addHaircut = function(wasFree = false) {
  if (wasFree) {
    // Se foi um corte gratuito, decrementa o contador de cortes gratuitos
    if (this.freeHaircuts > 0) {
      this.freeHaircuts--;
    }
  } else {
    // Incrementa o contador de cortes pagos
    this.haircuts++;
    
    // Verifica se atingiu 10 cortes para ganhar um grátis
    if (this.haircuts % 10 === 0) {
      this.freeHaircuts++;
    }
  }
  
  // Adiciona ao histórico
  this.haircutHistory.push({
    date: Date.now(),
    wasFree
  });
};

const User = mongoose.model('User', userSchema);
module.exports = User;