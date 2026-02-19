const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/engagements
router.get('/', authMiddleware, async (req, res) => {
  res.json({ engagements: [] });
});

// POST /api/engagements
router.post('/', authMiddleware, requireRole('manager', 'lead'), async (req, res) => {
  const { name, client, scope, startDate, endDate, operators } = req.body;
  res.json({ message: 'Engagement created', data: req.body });
});

// GET /api/engagements/:id
router.get('/:id', authMiddleware, async (req, res) => {
  res.json({ engagement: null });
});

// PATCH /api/engagements/:id
router.patch('/:id', authMiddleware, requireRole('manager', 'lead'), async (req, res) => {
  res.json({ message: 'Engagement updated' });
});

module.exports = router;
