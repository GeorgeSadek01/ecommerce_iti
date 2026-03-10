#!/usr/bin/env node
/**
 * scripts/fix-googleid-index.js
 *
 * Drops the existing googleId index (if any) and recreates a sparse unique index
 * so that documents without `googleId` won't be indexed (avoids duplicate nulls).
 *
 * Usage:
 *   node scripts/fix-googleid-index.js
 *
 * Requires `MONGO_URI` in environment (apps/backend/.env or exported).
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('Missing MONGO_URI in environment.');
  process.exit(2);
}

const run = async () => {
  await mongoose.connect(uri, { autoIndex: false });
  const db = mongoose.connection.db;
  const collName = 'users';

  try {
    console.log(`Connected to ${uri}. Using collection: ${collName}`);

    // List indexes
    const indexes = await db.collection(collName).indexes();
    console.log('Existing indexes:', indexes.map((i) => i.name));

    // Drop any index that includes googleId
    for (const idx of indexes) {
      if (idx.key && Object.prototype.hasOwnProperty.call(idx.key, 'googleId')) {
        console.log(`Dropping index: ${idx.name}`);
        await db.collection(collName).dropIndex(idx.name);
      }
    }

    // Create the sparse unique index
    console.log('Creating sparse unique index on googleId...');
    await db.collection(collName).createIndex({ googleId: 1 }, { unique: true, sparse: true });
    console.log('Index created successfully.');
  } catch (err) {
    console.error('Error while fixing index:', err.message || err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
