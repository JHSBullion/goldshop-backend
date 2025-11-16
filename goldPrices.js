const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/gold-prices/latest
 * Returns latest price per karat (999/916/750...)
 */
router.get('/latest', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT gp.*
       FROM gold_price gp
       INNER JOIN (
         SELECT karat, MAX(created_at) AS max_created
         FROM gold_price
         GROUP BY karat
       ) latest
       ON gp.karat = latest.karat AND gp.created_at = latest.max_created
       ORDER BY gp.karat`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gold-prices
 * Body: { karat, buy_price, sell_price, source }
 */
router.post('/', async (req, res, next) => {
  try {
    const { karat, buy_price, sell_price, source } = req.body || {};
    if (!karat || buy_price == null || sell_price == null) {
      return res.status(400).json({ error: 'karat, buy_price and sell_price are required' });
    }

    const [result] = await db.execute(
      `INSERT INTO gold_price (karat, buy_price, sell_price, source)
       VALUES (?, ?, ?, ?)`,
      [karat, buy_price, sell_price, source || 'manual']
    );

    const [rows] = await db.query('SELECT * FROM gold_price WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
