const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeEngagements,
    openFindings,
    teamMembers,
    completedThisMonth,
    findingsBySeverity,
    engagementsByStatus,
    recentFindings,
    recentEngagements,
  ] = await Promise.all([
    prisma.engagement.count({ where: { status: 'active' } }),

    prisma.finding.count({ where: { status: 'open' } }),

    prisma.user.count(),

    prisma.engagement.count({
      where: { status: 'completed', updatedAt: { gte: startOfMonth } },
    }),

    prisma.finding.groupBy({
      by: ['severity'],
      _count: { severity: true },
    }),

    prisma.engagement.groupBy({
      by: ['status'],
      _count: { status: true },
    }),

    prisma.finding.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        engagement: { select: { name: true } },
        reportedBy: { select: { name: true } },
      },
    }),

    prisma.engagement.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, client: true, status: true, updatedAt: true },
    }),
  ]);

  // Normalise severity order for chart
  const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'informational'];
  const severityMap = Object.fromEntries(
    findingsBySeverity.map((r) => [r.severity, r._count.severity])
  );
  const findingsChart = SEVERITY_ORDER.map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: severityMap[s] || 0,
  }));

  const statusMap = Object.fromEntries(
    engagementsByStatus.map((r) => [r.status, r._count.status])
  );

  res.json({
    stats: { activeEngagements, openFindings, teamMembers, completedThisMonth },
    findingsChart,
    statusMap,
    recentFindings,
    recentEngagements,
  });
});

module.exports = router;
