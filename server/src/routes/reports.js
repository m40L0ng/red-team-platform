const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');

// POST /api/reports/generate
router.post('/generate', authMiddleware, requireRole('manager', 'lead'), async (req, res) => {
  const { engagementId, format } = req.body; // format: 'pdf' | 'markdown'
  res.json({ message: 'Report generation queued', engagementId, format });
});

// GET /api/reports/:engagementId
router.get('/:engagementId', authMiddleware, async (req, res) => {
  res.json({ reports: [] });
});

module.exports = router;
