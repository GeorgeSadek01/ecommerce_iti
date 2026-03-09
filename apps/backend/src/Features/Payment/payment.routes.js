const express = require('express');

const router = express.Router();

const paymentController = require('./payment.controller');

router.post(
  '/checkout',
  // [TODO] : this will be deleted later after authentication
  (req, res, next) => {
    req.user = {
      id: '69aed580cd7b0eaf31af3c25',
    };

    next();
  },
  paymentController.checkout
);

router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

module.exports = router;
