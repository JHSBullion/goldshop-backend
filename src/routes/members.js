const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /api/members
 * Body: { name, phone, email }
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email } = req.body || {};
    if (!phone) {
      return res.status(400).json({ error: 'phone is required' });
    }

    const [result] = await db.execute(
      `INSERT INTO members (name, phone, email)
       VALUES (?, ?, ?)`,
      [name || null, phone, email || null]
    );

    const [rows] = await db.query('SELECT * FROM members WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    // Handle duplicate phone
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Phone already registered' });
    }
    next(err);
  }
});

/**
 * GET /api/members/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM members WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/members/by-phone/:phone
 */
router.get('/by-phone/:phone', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM members WHERE phone = ?', [req.params.phone]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/members/:id/points-history
 */
router.get('/:id/points-history', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM points_history
       WHERE member_id = ?
       ORDER BY created_at DESC, id DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/members/:id/points
 * Body: { change_amount, reason, related_sale_id }
 */
router.patch('/:id/points', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const memberId = req.params.id;
    const { change_amount, reason, related_sale_id } = req.body || {};

    if (!change_amount || Number.isNaN(Number(change_amount))) {
      conn.release();
      return res.status(400).json({ error: 'change_amount must be a number and not zero' });
    }

    await conn.beginTransaction();

    const [members] = await conn.query('SELECT * FROM members WHERE id = ? FOR UPDATE', [memberId]);
    if (!members.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Member not found' });
    }

    const currentPoints = members[0].points || 0;
    const newBalance = currentPoints + Number(change_amount);

    await conn.execute(
      'UPDATE members SET points = ? WHERE id = ?',
      [newBalance, memberId]
    );

    await conn.execute(
      `INSERT INTO points_history (member_id, change_amount, balance_after, reason, related_sale_id)
       VALUES (?, ?, ?, ?, ?)`,
      [memberId, change_amount, newBalance, reason || null, related_sale_id || null]
    );

    await conn.commit();

    const [updatedMembers] = await conn.query('SELECT * FROM members WHERE id = ?', [memberId]);
    conn.release();
    res.json(updatedMembers[0]);
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
});

module.exports = router;
