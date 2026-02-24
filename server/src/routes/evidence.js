const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

const UPLOADS_DIR = path.join(__dirname, '../../uploads/evidence');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain',
  'application/zip', 'application/x-zip-compressed', 'application/x-7z-compressed',
]);

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) return cb(null, true);
    cb(new Error(`File type not allowed: ${file.mimetype}`));
  },
});

function handleUpload(req, res, next) {
  upload.array('files', 10)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

// GET /api/evidence/finding/:findingId — list files
router.get('/finding/:findingId', authMiddleware, async (req, res) => {
  const finding = await prisma.finding.findUnique({ where: { id: req.params.findingId } });
  if (!finding) return res.status(404).json({ error: 'Finding not found' });

  const files = await prisma.evidenceFile.findMany({
    where: { findingId: req.params.findingId },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ files });
});

// POST /api/evidence/finding/:findingId — upload files
router.post('/finding/:findingId', authMiddleware, handleUpload, async (req, res) => {
  const finding = await prisma.finding.findUnique({ where: { id: req.params.findingId } });
  if (!finding) return res.status(404).json({ error: 'Finding not found' });

  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });

  const files = await Promise.all(
    req.files.map((f) =>
      prisma.evidenceFile.create({
        data: {
          findingId: req.params.findingId,
          filename:     f.filename,
          originalName: f.originalname,
          mimetype:     f.mimetype,
          size:         f.size,
        },
      })
    )
  );

  res.status(201).json({ files });
});

// GET /api/evidence/:id — serve / download file
router.get('/:id', authMiddleware, async (req, res) => {
  const file = await prisma.evidenceFile.findUnique({ where: { id: req.params.id } });
  if (!file) return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(UPLOADS_DIR, file.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

  const inline = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
  res.setHeader('Content-Type', file.mimetype);
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.originalName)}"`
  );
  res.sendFile(filePath);
});

// DELETE /api/evidence/:id — remove file
router.delete('/:id', authMiddleware, requireRole('lead', 'manager'), async (req, res) => {
  const file = await prisma.evidenceFile.findUnique({ where: { id: req.params.id } });
  if (!file) return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(UPLOADS_DIR, file.filename);
  try { fs.unlinkSync(filePath); } catch (_) { /* already gone */ }

  await prisma.evidenceFile.delete({ where: { id: req.params.id } });
  res.json({ message: 'Evidence deleted' });
});

module.exports = router;
