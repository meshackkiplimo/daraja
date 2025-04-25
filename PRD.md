# M-PESA STK Push Integration - Product Requirements Document

## Overview

This document outlines the requirements for a minimalistic Node.js API service that integrates with Safaricom's M-PESA STK Push payment gateway in a sandbox environment. The service provides a simple, secure way to initiate mobile money payments and handle transaction callbacks.

## Technical Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **HTTP Client**: Axios
- **Additional Dependencies**:
  - dotenv (^16.0.0) - Environment variable management
  - cors (^2.8.5) - Cross-Origin Resource Sharing support

## Core Features

### 1. Token Generation Middleware

- **Purpose**: Automatically fetch and inject OAuth access tokens for Safaricom API authentication
- **Implementation**:
  - Uses Basic Auth with consumer key and secret
  - Caches token for its validity period
  - Injects token into request headers
- **Error Handling**: 
  - Retries on failure (max 3 attempts)
  - Logs authentication errors
  - Returns 500 status if token generation fails

### 2. Payment Initiation Endpoint

- **Route**: POST /pay
- **Authentication**: None (internal service use)
- **Request Body**:
```json
{
    "phone": "254712345678",
    "amount": 1000
}
```
- **Response**:
```json
{
    "success": true,
    "requestId": "ws_CO_123456789",
    "message": "Payment request initiated"
}
```
- **Error Response**:
```json
{
    "success": false,
    "error": "Invalid phone number format"
}
```

### 3. Callback Handler

- **Route**: POST /callback
- **Purpose**: Process M-PESA transaction confirmations
- **Implementation**:
  - Validates incoming webhook data
  - Logs transaction details
  - Returns acknowledgment response
- **Expected Data**:
```json
{
    "MerchantRequestID": "12345-67890",
    "CheckoutRequestID": "ws_CO_123456789",
    "ResultCode": 0,
    "ResultDesc": "Success",
    "Amount": 1000,
    "MpesaReceiptNumber": "PGL7YP0LP2",
    "PhoneNumber": "254712345678"
}
```

## Environment Configuration

Required environment variables:
```
# M-PESA API Credentials
CONSUMER_KEY=your_consumer_key
CONSUMER_SECRET=your_consumer_secret
PASSKEY=your_passkey
BUSINESS_SHORT_CODE=174379  # Sandbox paybill

# API Configuration
PORT=3000
NODE_ENV=development

# M-PESA API URLs (Sandbox)
TOKEN_URL=https://sandbox.safaricom.co.ke/oauth/v1/generate
STK_URL=https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
```

## Integration Flow

1. Client initiates payment via POST /pay
2. Server generates OAuth token via middleware
3. Server constructs STK Push request:
   - Generates timestamp
   - Creates password (shortcode + passkey + timestamp)
   - Builds request payload
4. Server sends STK Push request to M-PESA
5. M-PESA sends STK prompt to user's phone
6. User enters M-PESA PIN
7. M-PESA processes payment
8. M-PESA sends callback to /callback endpoint
9. Server processes callback and logs transaction

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create .env file with required variables

3. For local development, use ngrok to receive callbacks:
```bash
ngrok http 3000
```

4. Update callback URL in M-PESA portal with ngrok URL

## Security Considerations

1. **Token Management**:
   - Tokens stored in memory only
   - Automatic refresh before expiry
   - Secure transmission in headers

2. **Error Handling**:
   - Sanitized error responses
   - Detailed internal logging
   - No sensitive data in responses

3. **Input Validation**:
   - Phone number format validation
   - Amount range validation
   - JSON schema validation

## Monitoring & Logging

- Log all payment requests
- Track token generation success/failure
- Monitor callback success rate
- Log transaction details for reconciliation

## Future Enhancements

1. Rate limiting
2. Request queuing
3. Automated reconciliation
4. Dashboard for transaction monitoring
5. Support for other M-PESA APIs

## Testing

- Unit tests for utility functions
- Integration tests for token generation
- End-to-end payment flow tests
- Callback handling tests
- Error scenario testing

## Deployment Notes

1. Ensure secure transmission of environment variables
2. Configure proper CORS settings for production
3. Set up monitoring and logging
4. Configure SSL/TLS
5. Review security headers