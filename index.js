require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Token storage
let accessToken = null;
let tokenExpiry = null;

// Utility functions
const generateTimestamp = () => {
    return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
};

const generatePassword = (timestamp) => {
    const { BUSINESS_SHORT_CODE, PASSKEY } = process.env;
    const str = `${BUSINESS_SHORT_CODE}${PASSKEY}${timestamp}`;
    return Buffer.from(str).toString('base64');
};

// Token middleware
const tokenMiddleware = async (req, res, next) => {
    try {
        const now = Date.now();
        if (!accessToken || !tokenExpiry || now >= tokenExpiry) {
            const auth = Buffer.from(`${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`).toString('base64');
            const response = await axios.get(process.env.TOKEN_URL, {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            });

            accessToken = response.data.access_token;
            tokenExpiry = now + (response.data.expires_in * 1000) - 60000; // Subtract 1 minute for safety
        }

        req.mpesaToken = accessToken;
        next();
    } catch (error) {
        console.error('Token Generation Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to generate access token'
        });
    }
};

// Payment endpoint
app.post('/pay', tokenMiddleware, async (req, res) => {
    try {
        const { phone, amount } = req.body;

        // Validate input
        if (!phone || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and amount are required'
            });
        }

        // Format phone number (remove leading zero or +254)
        const formattedPhone = phone.toString().replace(/^(?:254|\+254|0)/, '254');

        const timestamp = generateTimestamp();
        const password = generatePassword(timestamp);

        const requestBody = {
            BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: formattedPhone,
            PartyB: process.env.BUSINESS_SHORT_CODE,
            PhoneNumber: formattedPhone,
            CallBackURL: process.env.CALLBACK_URL,
            AccountReference: 'Test',
            TransactionDesc: 'Test Payment'
        };

        const response = await axios.post(process.env.STK_URL, requestBody, {
            headers: {
                Authorization: `Bearer ${req.mpesaToken}`
            }
        });

        res.json({
            success: true,
            requestId: response.data.CheckoutRequestID,
            message: 'Payment request initiated'
        });

    } catch (error) {
        console.error('Payment Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to initiate payment'
        });
    }
});

// Callback endpoint
app.post('/callback', (req, res) => {
    try {
        const { Body } = req.body;
        
        if (Body.stkCallback.ResultCode === 0) {
            const { CallbackMetadata } = Body.stkCallback;
            
            // Extract payment details
            const amount = CallbackMetadata.Item.find(item => item.Name === 'Amount').Value;
            const mpesaReceiptNumber = CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber').Value;
            const phoneNumber = CallbackMetadata.Item.find(item => item.Name === 'PhoneNumber').Value;

            console.log('Payment Successful:', {
                amount,
                mpesaReceiptNumber,
                phoneNumber,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log('Payment Failed:', Body.stkCallback.ResultDesc);
        }

        // Always respond with success to M-PESA
        res.json({
            success: true
        });

    } catch (error) {
        console.error('Callback Error:', error.message);
        // Still send success response to M-PESA
        res.json({
            success: true
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
});