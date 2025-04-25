require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config/app.config');
const mpesaRoutes = require('./routes/mpesa.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', mpesaRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log('Environment:', config.env);
});