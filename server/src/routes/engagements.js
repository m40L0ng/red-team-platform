const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/engagements?search=&status=&page=&limit=
router.get('/', authMiddleware, async (req, res) => {
  const { search, status, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { client: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(status && { status }),
  };

  const [engagements, total] = await Promise.all([
    prisma.engagement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        operators: { select: { id: true, name: true } },
        _count: { select: { findings: true } },
      },
    }),
    prisma.engagement.count({ where }),
  ]);

  res.json({ engagements, total, page: parseInt(page), totalPages: Math.ceil(total / take) || 1 });
});

// GET /api/engagements/:id
router.get('/:id', authMiddleware, async (req, res) => {
  const engagement = await prisma.engagement.findUnique({
    where: { id: req.params.id },
    include: {
      operators: { select: { id: true, name: true, email: true, role: true } },
      findings: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!engagement) return res.status(404).json({ error: 'Engagement not found' });
  res.json({ engagement });
});

// POST /api/engagements
router.post('/', authMiddleware, requireRole('manager', 'lead'), async (req, res) => {
  const { name, client, scope, status, startDate, endDate, operatorIds } = req.body;

  if (!name || !client || !scope || !startDate || !endDate) {
    return res.status(400).json({ error: 'name, client, scope, startDate and endDate are required' });
  }

  const engagement = await prisma.engagement.create({
    data: {
      name,
      client,
      scope,
      status: status || 'planning',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      operators: operatorIds?.length
        ? { connect: operatorIds.map((id) => ({ id })) }
        : undefined,
    },
    include: {
      operators: { select: { id: true, name: true } },
      _count: { select: { findings: true } },
    },
  });

  res.status(201).json({ engagement });
});

// PATCH /api/engagements/:id
router.patch('/:id', authMiddleware, requireRole('manager', 'lead'), async (req, res) => {
  const { name, client, scope, status, startDate, endDate, operatorIds } = req.body;

  const existing = await prisma.engagement.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Engagement not found' });

  const engagement = await prisma.engagement.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(client && { client }),
      ...(scope && { scope }),
      ...(status && { status }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(operatorIds && {
        operators: { set: operatorIds.map((id) => ({ id })) },
      }),
    },
    include: {
      operators: { select: { id: true, name: true } },
      _count: { select: { findings: true } },
    },
  });

  res.json({ engagement });
});

// DELETE /api/engagements/:id
router.delete('/:id', authMiddleware, requireRole('manager'), async (req, res) => {
  const existing = await prisma.engagement.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Engagement not found' });

  await prisma.engagement.delete({ where: { id: req.params.id } });
  res.json({ message: 'Engagement deleted' });
});

module.exports = router;
