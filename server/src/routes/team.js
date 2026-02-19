const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/team — list operators and capacity
router.get('/', authMiddleware, async (req, res) => {
  res.json({ members: [] });
});

// GET /api/team/capacity — dashboard capacity overview
router.get('/capacity', authMiddleware, async (req, res) => {
  res.json({ capacity: [] });
});

module.exports = router;
