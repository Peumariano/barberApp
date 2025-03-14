const app = require('./app');  // Isso vai buscar o arquivo app.js na pasta config
const connectDB = require('./db');  // Conectar ao banco de dados
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
require('events').EventEmitter.defaultMaxListeners = 20;
const dotenv = require('dotenv');



// Carregar variáveis de ambiente
dotenv.config();

// Conectar banco de dados
connectDB();

// Configuração do servidor
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando em modo ${process.env.NODE_ENV} na porta ${PORT}`);
});

// Tratamento de exceções não capturadas
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Encerrando...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
