const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/team — list members with capacity data
router.get('/', authMiddleware, async (req, res) => {
  const members = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      _count: { select: { findings: true } },
      engagements: {
        where: { status: { in: ['planning', 'active'] } },
        select: { id: true, name: true, status: true, endDate: true },
      },
    },
  });

  res.json({ members });
});

// GET /api/team/:id
router.get('/:id', authMiddleware, async (req, res) => {
  const member = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      _count: { select: { findings: true } },
      engagements: {
        select: { id: true, name: true, client: true, status: true, startDate: true, endDate: true },
      },
    },
  });
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json({ member });
});

// POST /api/team — invite/create member (manager only)
router.post('/', authMiddleware, requireRole('manager'), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const hashed = await bcrypt.hash(password, 12);
  const member = await prisma.user.create({
    data: { name, email, password: hashed, role: role || 'operator' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.status(201).json({ member });
});

// PATCH /api/team/:id — update name, email or role (manager only)
router.patch('/:id', authMiddleware, requireRole('manager'), async (req, res) => {
  const { name, email, role, password } = req.body;

  if (req.params.id === req.user.id && role && role !== req.user.role) {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }

  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Member not found' });

  if (email && email !== existing.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) return res.status(409).json({ error: 'Email already in use' });
  }

  const member = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(password && { password: await bcrypt.hash(password, 12) }),
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.json({ member });
});

// DELETE /api/team/:id (manager only, cannot delete self)
router.delete('/:id', authMiddleware, requireRole('manager'), async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot remove yourself' });
  }
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Member not found' });

  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'Member removed' });
});

module.exports = router;
