const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/findings?engagementId=&severity=&status=
router.get('/', authMiddleware, async (req, res) => {
  const { engagementId, severity, status } = req.query;

  const findings = await prisma.finding.findMany({
    where: {
      ...(engagementId && { engagementId }),
      ...(severity && { severity }),
      ...(status && { status }),
    },
    orderBy: [
      { severity: 'asc' },
      { createdAt: 'desc' },
    ],
    include: {
      engagement: { select: { id: true, name: true, client: true } },
      reportedBy: { select: { id: true, name: true } },
    },
  });

  res.json({ findings });
});

// GET /api/findings/:id
router.get('/:id', authMiddleware, async (req, res) => {
  const finding = await prisma.finding.findUnique({
    where: { id: req.params.id },
    include: {
      engagement: { select: { id: true, name: true, client: true } },
      reportedBy: { select: { id: true, name: true } },
    },
  });
  if (!finding) return res.status(404).json({ error: 'Finding not found' });
  res.json({ finding });
});

// POST /api/findings
router.post('/', authMiddleware, async (req, res) => {
  const { engagementId, title, severity, description, evidence, cvss } = req.body;

  if (!engagementId || !title || !severity || !description) {
    return res.status(400).json({ error: 'engagementId, title, severity and description are required' });
  }

  const engagement = await prisma.engagement.findUnique({ where: { id: engagementId } });
  if (!engagement) return res.status(404).json({ error: 'Engagement not found' });

  const finding = await prisma.finding.create({
    data: {
      title,
      severity,
      description,
      evidence: evidence || null,
      cvss: cvss != null ? parseFloat(cvss) : null,
      engagementId,
      userId: req.user.id,
    },
    include: {
      engagement: { select: { id: true, name: true, client: true } },
      reportedBy: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({ finding });
});

// PATCH /api/findings/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  const { title, severity, description, evidence, cvss, status } = req.body;

  const existing = await prisma.finding.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Finding not found' });

  // Only the reporter or a lead/manager can edit
  if (existing.userId !== req.user.id && !['lead', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const finding = await prisma.finding.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(severity && { severity }),
      ...(description && { description }),
      ...(evidence !== undefined && { evidence }),
      ...(cvss !== undefined && { cvss: cvss != null ? parseFloat(cvss) : null }),
      ...(status && { status }),
    },
    include: {
      engagement: { select: { id: true, name: true, client: true } },
      reportedBy: { select: { id: true, name: true } },
    },
  });

  res.json({ finding });
});

// DELETE /api/findings/:id
router.delete('/:id', authMiddleware, requireRole('lead', 'manager'), async (req, res) => {
  const existing = await prisma.finding.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Finding not found' });

  await prisma.finding.delete({ where: { id: req.params.id } });
  res.json({ message: 'Finding deleted' });
});

module.exports = router;
