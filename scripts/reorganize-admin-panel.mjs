import fs from 'fs';
import path from 'path';

const collectionPath = path.resolve('endpoints', 'ecommerce.postman.json');

function getGroupKeyFromRequest(item) {
  try {
    const url = item.request && item.request.url;
    if (!url) return 'misc';
    // Prefer path array
    const pathArr = url.path || (typeof url === 'string' ? url.split('/') : undefined);
    if (Array.isArray(pathArr)) {
      const idx = pathArr.findIndex((seg) => String(seg).toLowerCase() === 'admin');
      if (idx >= 0 && pathArr.length > idx + 1) return String(pathArr[idx + 1]);
      if (pathArr.length >= 4) return String(pathArr[3]);
    }
    // Fallback to parsing raw
    if (url.raw) {
      const raw = String(url.raw)
        .replace(/https?:\/\//, '')
        .split('?')[0];
      const parts = raw.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p.toLowerCase() === 'admin');
      if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1];
      if (parts.length >= 4) return parts[3];
    }
  } catch (e) {
    return 'misc';
  }
  return 'misc';
}

function capitalize(s) {
  return String(s || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function reorganizeAdminFolder(collection) {
  if (!collection.item || !Array.isArray(collection.item)) return false;
  const adminIndex = collection.item.findIndex((it) => /admin panel/i.test(it.name));
  if (adminIndex === -1) return false;

  const adminFolder = collection.item[adminIndex];
  const items = Array.isArray(adminFolder.item) ? adminFolder.item : [];

  const groups = new Map();

  for (const it of items) {
    // if it's a folder already, put under its own name
    if (it.item) {
      const key = (it.name || 'Misc').toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
      continue;
    }
    const key = String(getGroupKeyFromRequest(it) || 'misc').toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }

  const newSubfolders = [];
  for (const [key, arr] of groups.entries()) {
    const folder = {
      name: capitalize(key),
      description: `Auto-grouped requests for '${key}'`,
      item: arr,
    };
    newSubfolders.push(folder);
  }

  // Replace admin folder items with grouped subfolders
  adminFolder.item = newSubfolders;
  collection.item[adminIndex] = adminFolder;
  return true;
}

function main() {
  if (!fs.existsSync(collectionPath)) {
    console.error('collection not found:', collectionPath);
    process.exit(2);
  }
  const raw = fs.readFileSync(collectionPath, 'utf8');
  let col;
  try {
    col = JSON.parse(raw);
  } catch (e) {
    console.error('invalid json', e.message);
    process.exit(3);
  }

  const changed = reorganizeAdminFolder(col);
  if (!changed) {
    console.log('No Admin Panel folder found or nothing to change.');
    process.exit(0);
  }

  fs.writeFileSync(collectionPath, JSON.stringify(col, null, 2), 'utf8');
  console.log(
    'Admin Panel reorganized into',
    col.item.find((it) => /admin panel/i.test(it.name)).item.length,
    'subfolders'
  );
}

main();
