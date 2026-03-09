import express from 'express';
import { httpLogger } from '../utils/logging/index.js';
const router = express.Router();

router.get('/', async (req, res) => {
  httpLogger.debug('Root request');
  res.send('Ok\n');
});

export default router;
