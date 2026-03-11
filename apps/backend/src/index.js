// import express from 'express';
// import categoryRoutes from './features/categories/categories.routes.js';
import 'dotenv/config';
import express from 'express';
//const categoryRoutes = require('./features/categories/categories.routes.js');
import productRoutes from './features/products/product.routes.js';
import dbConnect from './core/db/dbConnect.js';

const app = express();
app.use(express.json());

// Use the router
//app.use("/api/v1/admin/categories",categoryRoutes);

app.use('/api/v1/seller/products', productRoutes);

// Start server with proper error handling
(async () => {
  try {
    await dbConnect();
    app.listen(3000, () => console.log('Server running on port 3000'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
