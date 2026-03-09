import express from 'express';
const router = express.Router();

import * as fantasy from '../clients/fantasy.js';
import { httpLogger } from '../utils/logging/index.js';

router.get('/redirect', (req, res) => {
  httpLogger.debug('Yahoo redirect request');
  fantasy.auth(res);
});

router.get('/callback', (req, res) => {
  fantasy.authCallback(req, (err) => {
    if (err) {
      return res.redirect('/error');
    }

    return res.redirect('/');
  });
});

export default router;
