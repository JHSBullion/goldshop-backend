const express = require('express');
const cors = require('cors');

const goldPricesRouter = require('./routes/goldPrices');
const membersRouter = require('./routes/members');
const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const authRouter = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GoldShop backend is running' });
});

app.use('/api/auth', authRouter);
app.use('/api/gold-prices', goldPricesRouter);
app.use('/api/members', membersRouter);
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);

// Global error handler (simple)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
