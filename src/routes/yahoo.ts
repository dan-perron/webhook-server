import express from 'express';
const router = express.Router();

import * as fantasy from '../clients/fantasy.js';

router.get('/redirect', (req, res) => {
  console.log('Redirect request.');
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
