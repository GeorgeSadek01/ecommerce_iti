// import express from 'express';
// import categoryRoutes from './features/categories/categories.routes.js';
import 'dotenv/config';
import express from 'express';
//const categoryRoutes = require('./features/categories/categories.routes.js');
import productRoutes from './features/products/product.routes.js';
import dbConnect from './core/db/dbConnect.js';

// Connect to MongoDB
dbConnect();

const app = express();
app.use(express.json());

// Use the router
//app.use("/api/v1/admin/categories",categoryRoutes);

app.use('/api/v1/seller/products', productRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));
