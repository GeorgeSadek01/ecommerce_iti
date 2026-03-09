// import express from 'express';
// import categoryRoutes from './Features/Categories/categories.routes.js';
require('dotenv').config();
const express = require('express');
const categoryRoutes = require('./apps/backend/src/Features/Categories/categories.routes.js');
const paymentRoutes = require('./apps/backend/src/Features/Payment/payment.routes.js');
const dbConnect = require('./apps/backend/src/core/db/dbConnect.js');

// Connect to MongoDB
dbConnect();

const app = express();
app.use(express.json());

// Use the router
app.use('/api/v1/admin/categories', categoryRoutes);
app.use('/api/v1/payment', paymentRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));
