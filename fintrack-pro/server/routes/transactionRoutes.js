import express from 'express';
import Transaction from '../models/Transaction.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Middleware to verify token
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Add new transaction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { description, amount, date, category } = req.body; // ✅ include category
    const newTx = new Transaction({
      userId: req.userId,
      description,
      amount,
      date,
      category, // ✅ include category here too
    });
    await newTx.save();
    res.status(201).json(newTx);
  } catch (err) {
    console.error(err); // Helpful for debugging
    res.status(500).json({ message: 'Failed to add transaction' });
  }
});


// Get all transactions for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const txs = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});
// PUT - Edit a transaction
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { description, amount, date, category } = req.body;
    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },  // <-- corrected here
      { description, amount, date, category },     // also include category update
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Transaction not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE - Remove a transaction
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });  // <-- corrected here
    if (!deleted) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



export default router;
