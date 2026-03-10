import 'dotenv/config';
import env from './core/config/env.js';
import app from './app.js';
import dbConnect from './core/db/dbConnect.js';

const PORT = env.PORT;

const start = async () => {
  await dbConnect();

  app.listen(PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('[Server] Failed to start:', err.message);
  process.exit(1);
});
