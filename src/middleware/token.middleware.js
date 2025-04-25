const axios = require('axios');

// Token storage
let accessToken = null;
let tokenExpiry = null;

/**
 * Middleware to handle M-PESA token generation and caching
 */
const tokenMiddleware = async (req, res, next) => {
    try {
        const now = Date.now();
        
        // Check if token needs to be refreshed
        if (!accessToken || !tokenExpiry || now >= tokenExpiry) {
            const auth = Buffer.from(
                `${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`
            ).toString('base64');

            const response = await axios.get(process.env.TOKEN_URL, {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            });

            accessToken = response.data.access_token;
            // Set expiry to 1 minute before actual expiry for safety
            tokenExpiry = now + (response.data.expires_in * 1000) - 60000;
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

module.exports = tokenMiddleware;