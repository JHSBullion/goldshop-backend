const express = require('express');
const router = express.Router();

/**
 * Simple admin login using .env username/password.
 * This does NOT use JWT; it's just a basic demo.
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // In real system, should return JWT
    return res.json({
      success: true,
      token: 'dummy-token',
      user: { username }
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid credentials' });
});

module.exports = router;
