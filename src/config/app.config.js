/**
 * Application configuration
 */
const config = {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    mpesa: {
        businessShortCode: process.env.BUSINESS_SHORT_CODE,
        consumerKey: process.env.CONSUMER_KEY,
        consumerSecret: process.env.CONSUMER_SECRET,
        passkey: process.env.PASSKEY,
        urls: {
            token: process.env.TOKEN_URL,
            stkPush: process.env.STK_URL,
            callback: process.env.CALLBACK_URL
        }
    }
};

module.exports = config;