const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');

// GET /api/findings
router.get('/', authMiddleware, async (req, res) => {
  res.json({ findings: [] });
});

// POST /api/findings
router.post('/', authMiddleware, async (req, res) => {
  const { engagementId, title, severity, description, evidence, cvss } = req.body;
  res.json({ message: 'Finding logged', data: req.body });
});

// PATCH /api/findings/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  res.json({ message: 'Finding status updated' });
});

module.exports = router;
