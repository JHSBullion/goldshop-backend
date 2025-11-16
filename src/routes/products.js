const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/products
 */
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY created_at DESC, id DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/products
 * Body: { sku, name, weight_gram, workmanship_fee, karat, stock, image_url }
 */
router.post('/', async (req, res, next) => {
  try {
    const { sku, name, weight_gram, workmanship_fee, karat, stock, image_url } = req.body || {};
    if (!name || !weight_gram) {
      return res.status(400).json({ error: 'name and weight_gram are required' });
    }

    const [result] = await db.execute(
      `INSERT INTO products (sku, name, weight_gram, workmanship_fee, karat, stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sku || null,
        name,
        weight_gram,
        workmanship_fee || 0,
        karat || '999',
        stock != null ? stock : 0,
        image_url || null
      ]
    );

    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/products/:id
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { sku, name, weight_gram, workmanship_fee, karat, stock, image_url } = req.body || {};
    const [result] = await db.execute(
      `UPDATE products
       SET sku = ?, name = ?, weight_gram = ?, workmanship_fee = ?, karat = ?, stock = ?, image_url = ?
       WHERE id = ?`,
      [
        sku || null,
        name || null,
        weight_gram || 0,
        workmanship_fee || 0,
        karat || '999',
        stock != null ? stock : 0,
        image_url || null,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/products/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
