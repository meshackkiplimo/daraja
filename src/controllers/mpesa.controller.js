const axios = require('axios');
const { generateTimestamp, generatePassword, formatPhoneNumber } = require('../utils/mpesa.utils');

/**
 * Handle STK Push payment request
 */
const initiatePayment = async (req, res) => {
    try {
        const { phone, amount } = req.body;

        // Validate input
        if (!phone || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and amount are required'
            });
        }

        const formattedPhone = formatPhoneNumber(phone);
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
};

/**
 * Handle M-PESA callback
 */
const handleCallback = (req, res) => {
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
};

module.exports = {
    initiatePayment,
    handleCallback
};