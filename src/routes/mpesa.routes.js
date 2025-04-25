const express = require('express');
const router = express.Router();
const tokenMiddleware = require('../middleware/token.middleware');
const { initiatePayment, handleCallback } = require('../controllers/mpesa.controller');

// Payment endpoint
router.post('/pay', tokenMiddleware, initiatePayment);

// Callback endpoint
router.post('/callback', handleCallback);

module.exports = router;