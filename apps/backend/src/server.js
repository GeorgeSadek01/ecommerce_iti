import 'dotenv/config';
import app from './app.js';
import dbConnect from './core/db/dbConnect.js';

const PORT = process.env.PORT || 4000;

const start = async () => {
  await dbConnect();

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV ?? 'development'} mode on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('[Server] Failed to start:', err.message);
  process.exit(1);
});
