const router = require('express').Router();
const PDFDocument = require('pdfkit');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'informational'];

const SEVERITY_COLORS = {
  critical:      [239, 68,  68],
  high:          [249, 115, 22],
  medium:        [234, 179, 8],
  low:           [59,  130, 246],
  informational: [107, 114, 128],
};

function fmt(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function countBySeverity(findings) {
  const counts = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
  findings.forEach((f) => { if (counts[f.severity] !== undefined) counts[f.severity]++; });
  return counts;
}

async function fetchEngagement(id) {
  return prisma.engagement.findUnique({
    where: { id },
    include: {
      operators: { select: { name: true, email: true, role: true } },
      findings: {
        orderBy: [{ severity: 'asc' }, { createdAt: 'asc' }],
        include: { reportedBy: { select: { name: true } } },
      },
    },
  });
}

// ── Markdown generator ─────────────────────────────────────────────────────
function generateMarkdown(eng) {
  const counts = countBySeverity(eng.findings);
  const lines = [];

  lines.push(`# Red Team Report — ${eng.name}`);
  lines.push('');
  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(`| **Client** | ${eng.client} |`);
  lines.push(`| **Period** | ${fmt(eng.startDate)} – ${fmt(eng.endDate)} |`);
  lines.push(`| **Status** | ${eng.status.charAt(0).toUpperCase() + eng.status.slice(1)} |`);
  lines.push(`| **Generated** | ${fmt(new Date())} |`);
  lines.push('');
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`This report documents **${eng.findings.length} finding${eng.findings.length !== 1 ? 's' : ''}** identified during the assessment.`);
  lines.push('');
  lines.push('| Severity | Count |');
  lines.push('|---|---|');
  SEVERITY_ORDER.forEach((s) => {
    if (counts[s] > 0) lines.push(`| ${s.charAt(0).toUpperCase() + s.slice(1)} | ${counts[s]} |`);
  });
  lines.push('');

  lines.push('## Scope');
  lines.push('');
  lines.push(eng.scope);
  lines.push('');

  if (eng.operators.length > 0) {
    lines.push('## Assessment Team');
    lines.push('');
    eng.operators.forEach((o) => lines.push(`- **${o.name}** (${o.role}) — ${o.email}`));
    lines.push('');
  }

  lines.push('## Findings');
  lines.push('');

  if (eng.findings.length === 0) {
    lines.push('_No findings were logged for this engagement._');
  } else {
    eng.findings.forEach((f, i) => {
      lines.push(`### ${i + 1}. [${f.severity.toUpperCase()}] ${f.title}`);
      lines.push('');
      lines.push(`| | |`);
      lines.push(`|---|---|`);
      lines.push(`| **Severity** | ${f.severity.charAt(0).toUpperCase() + f.severity.slice(1)} |`);
      if (f.cvss != null) lines.push(`| **CVSS** | ${f.cvss.toFixed(1)} |`);
      lines.push(`| **Status** | ${f.status.replace('_', ' ')} |`);
      lines.push(`| **Reporter** | ${f.reportedBy.name} |`);
      lines.push('');
      lines.push('**Description**');
      lines.push('');
      lines.push(f.description);
      if (f.evidence) {
        lines.push('');
        lines.push('**Evidence**');
        lines.push('');
        lines.push('```');
        lines.push(f.evidence);
        lines.push('```');
      }
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  }

  return lines.join('\n');
}

// ── PDF generator ──────────────────────────────────────────────────────────
function generatePDF(eng, res) {
  const counts = countBySeverity(eng.findings);
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${eng.id}.pdf"`);
  doc.pipe(res);

  const W = doc.page.width - 100;

  // ── Title block
  doc.rect(0, 0, doc.page.width, 90).fill('#111827');
  doc.fillColor('#ef4444').fontSize(10).font('Helvetica-Bold')
     .text('RED TEAM PLATFORM', 50, 28, { characterSpacing: 3 });
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
     .text(eng.name, 50, 45);
  doc.fillColor('#9ca3af').fontSize(9).font('Helvetica')
     .text(`${eng.client}  ·  ${fmt(eng.startDate)} – ${fmt(eng.endDate)}  ·  Generated ${fmt(new Date())}`, 50, 72);

  doc.fillColor('#111111').moveDown(3);

  // ── Severity summary boxes
  const boxW = W / SEVERITY_ORDER.length - 6;
  let bx = 50;
  SEVERITY_ORDER.forEach((s) => {
    const [r, g, b] = SEVERITY_COLORS[s];
    doc.roundedRect(bx, doc.y, boxW, 52, 4)
       .fillAndStroke(`rgb(${r},${g},${b})`, `rgb(${r},${g},${b})`);
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
       .text(String(counts[s]), bx, doc.y - 44, { width: boxW, align: 'center' });
    doc.fontSize(8).font('Helvetica')
       .text(s.toUpperCase(), bx, doc.y - 20, { width: boxW, align: 'center', characterSpacing: 1 });
    bx += boxW + 7;
  });

  doc.moveDown(4.5);

  // ── Scope
  doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text('Scope');
  doc.moveTo(50, doc.y + 3).lineTo(50 + W, doc.y + 3).stroke('#e5e7eb');
  doc.moveDown(0.6);
  doc.fillColor('#374151').fontSize(10).font('Helvetica').text(eng.scope, { width: W });
  doc.moveDown(1.2);

  // ── Operators
  if (eng.operators.length > 0) {
    doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text('Assessment Team');
    doc.moveTo(50, doc.y + 3).lineTo(50 + W, doc.y + 3).stroke('#e5e7eb');
    doc.moveDown(0.6);
    eng.operators.forEach((o) => {
      doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold').text(`${o.name} `, { continued: true });
      doc.font('Helvetica').fillColor('#6b7280').text(`${o.role} — ${o.email}`);
    });
    doc.moveDown(1.2);
  }

  // ── Findings
  doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text('Findings');
  doc.moveTo(50, doc.y + 3).lineTo(50 + W, doc.y + 3).stroke('#e5e7eb');
  doc.moveDown(0.8);

  if (eng.findings.length === 0) {
    doc.fillColor('#6b7280').fontSize(10).font('Helvetica').text('No findings were logged for this engagement.');
  } else {
    eng.findings.forEach((f, i) => {
      if (doc.y > doc.page.height - 180) doc.addPage();

      const [r, g, b] = SEVERITY_COLORS[f.severity] || [107, 114, 128];

      // Finding header bar
      doc.rect(50, doc.y, W, 26).fill(`rgb(${r},${g},${b})`);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
         .text(`${i + 1}. ${f.title}`, 58, doc.y - 18, { width: W - 16 });
      doc.moveDown(0.4);

      // Meta row
      doc.fillColor('#6b7280').fontSize(8.5).font('Helvetica')
         .text(
           [
             `Severity: ${f.severity}`,
             f.cvss != null ? `CVSS: ${f.cvss.toFixed(1)}` : null,
             `Status: ${f.status.replace('_', ' ')}`,
             `Reporter: ${f.reportedBy.name}`,
           ].filter(Boolean).join('   ·   '),
           { width: W }
         );
      doc.moveDown(0.5);

      // Description
      doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text('Description');
      doc.font('Helvetica').fillColor('#374151').fontSize(9.5)
         .text(f.description, { width: W });

      if (f.evidence) {
        doc.moveDown(0.4);
        doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text('Evidence');
        doc.rect(50, doc.y + 3, W, 1).fill('#e5e7eb');
        doc.moveDown(0.3);
        doc.font('Courier').fillColor('#374151').fontSize(8.5)
           .text(f.evidence, { width: W });
      }
      doc.moveDown(1.2);
    });
  }

  doc.end();
}

// ── Routes ──────────────────────────────────────────────────────────────────

// GET /api/reports/engagements — list engagements available for reporting
router.get('/engagements', authMiddleware, async (req, res) => {
  const engagements = await prisma.engagement.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, name: true, client: true, status: true, startDate: true, endDate: true,
      _count: { select: { findings: true } },
    },
  });
  res.json({ engagements });
});

// POST /api/reports/generate
router.post('/generate', authMiddleware, requireRole('manager', 'lead'), async (req, res) => {
  const { engagementId, format } = req.body;

  if (!engagementId || !['markdown', 'pdf'].includes(format)) {
    return res.status(400).json({ error: 'engagementId and format (markdown|pdf) are required' });
  }

  const eng = await fetchEngagement(engagementId);
  if (!eng) return res.status(404).json({ error: 'Engagement not found' });

  if (format === 'markdown') {
    const md = generateMarkdown(eng);
    const filename = `report-${eng.name.toLowerCase().replace(/\s+/g, '-')}.md`;
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(md);
  }

  generatePDF(eng, res);
});

module.exports = router;
