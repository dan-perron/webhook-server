import express from 'express';
const router = express.Router();

router.get('/', async (req, res) => {
  console.log('Root request.');
  res.send('Ok\n');
});

export default router;
