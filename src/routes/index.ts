import express from 'express';
export const router = express.Router();

router.get('/', async (req, res) => {
  console.log('Root request.');
  res.send('Ok\n');
});
