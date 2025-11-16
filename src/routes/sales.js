const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /api/sales
 * Body: {
 *   member_id, // optional
 *   total_amount,
 *   items: [
 *     { product_id, description, weight_gram, price_each, quantity }
 *   ]
 * }
 */
router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { member_id, total_amount, items } = req.body || {};
    if (!total_amount || Number.isNaN(Number(total_amount))) {
      conn.release();
      return res.status(400).json({ error: 'total_amount is required and must be a number' });
    }

    const saleItems = Array.isArray(items) ? items : [];

    const pointsRate = Number(process.env.POINTS_RATE || 100);
    const points_earned = Math.floor(Number(total_amount) / pointsRate);

    await conn.beginTransaction();

    const invoiceNo = 'INV' + Date.now();

    const [saleResult] = await conn.execute(
      `INSERT INTO sales (invoice_no, member_id, total_amount, points_earned, processed_by)
       VALUES (?, ?, ?, ?, ?)`,
      [invoiceNo, member_id || null, total_amount, points_earned, null]
    );

    const saleId = saleResult.insertId;

    for (const item of saleItems) {
      await conn.execute(
        `INSERT INTO sale_items
          (sale_id, product_id, description, weight_gram, price_each, quantity)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          item.product_id || null,
          item.description || null,
          item.weight_gram || null,
          item.price_each || null,
          item.quantity != null ? item.quantity : 1
        ]
      );

      // Decrease stock if product_id provided
      if (item.product_id) {
        await conn.execute(
          `UPDATE products SET stock = stock - ? WHERE id = ?`,
          [item.quantity != null ? item.quantity : 1, item.product_id]
        );
      }
    }

    // Handle member points
    if (member_id && points_earned > 0) {
      const [members] = await conn.query('SELECT * FROM members WHERE id = ? FOR UPDATE', [member_id]);
      if (members.length) {
        const currentPoints = members[0].points || 0;
        const newBalance = currentPoints + points_earned;

        await conn.execute(
          'UPDATE members SET points = ? WHERE id = ?',
          [newBalance, member_id]
        );

        await conn.execute(
          `INSERT INTO points_history (member_id, change_amount, balance_after, reason, related_sale_id)
           VALUES (?, ?, ?, ?, ?)`,
          [member_id, points_earned, newBalance, 'Sale points', saleId]
        );
      }
    }

    await conn.commit();

    const [saleRows] = await conn.query('SELECT * FROM sales WHERE id = ?', [saleId]);
    conn.release();
    res.status(201).json({ sale: saleRows[0], points_earned });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
});

/**
 * GET /api/sales/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const saleId = req.params.id;
    const [[sale]] = await db.query('SELECT * FROM sales WHERE id = ?', [saleId]);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const [items] = await db.query('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

    res.json({ sale, items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
