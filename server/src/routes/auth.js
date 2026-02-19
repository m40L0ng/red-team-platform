const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // TODO: query user from database via Prisma
  res.json({ message: 'Login endpoint — connect to database' });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  // TODO: create user in database via Prisma
  res.json({ message: 'Register endpoint — connect to database' });
});

module.exports = router;
