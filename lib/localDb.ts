import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_FILE = path.join(process.cwd(), 'local_db.json');

// Ensure db file exists with basic structure
function initializeDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({
        accounts: [],
        products: [],
        supportmaterials: [],
        diagnosticsessions: []
      }, null, 2));
    }
  } catch (err) {
    console.warn('⚠️ Local DB initialization skipped (read-only filesystem):', err);
  }
}

export async function readDb() {
  initializeDb();
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = await fs.promises.readFile(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading local DB:', err);
  }
  return { accounts: [], products: [], supportmaterials: [], diagnosticsessions: [] };
}

export async function writeDb(data: any) {
  try {
    initializeDb();
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('⚠️ Local DB write bypassed (read-only filesystem):', err);
  }
}

export const localDb = {
  async find(collectionName: string, query: any = {}) {
    const db = await readDb();
    const items = db[collectionName.toLowerCase()] || [];
    return items.filter((item: any) => {
      for (const key in query) {
        // Handle nested fields or simple fields
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  },

  async findOne(collectionName: string, query: any) {
    const items = await this.find(collectionName, query);
    return items[0] || null;
  },

  async insert(collectionName: string, doc: any) {
    const db = await readDb();
    const colName = collectionName.toLowerCase();
    if (!db[colName]) {
      db[colName] = [];
    }
    const newDoc = {
      _id: crypto.randomUUID(),
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString()
    };
    db[colName].push(newDoc);
    await writeDb(db);
    return newDoc;
  },

  async findByIdAndUpdate(collectionName: string, id: string, update: any) {
    const db = await readDb();
    const colName = collectionName.toLowerCase();
    const items = db[colName] || [];
    const index = items.findIndex((item: any) => item._id === id);
    if (index === -1) return null;

    // Apply update (handle $push, $set or standard merge)
    let current = items[index];
    if (update.$set) {
      current = { ...current, ...update.$set };
    } else if (update.$push) {
      for (const key in update.$push) {
        if (!current[key]) current[key] = [];
        current[key].push(update.$push[key]);
      }
    } else {
      current = { ...current, ...update };
    }

    items[index] = current;
    await writeDb(db);
    return current;
  },

  async findByIdAndDelete(collectionName: string, id: string) {
    const db = await readDb();
    const colName = collectionName.toLowerCase();
    const items = db[colName] || [];
    const index = items.findIndex((item: any) => item._id === id);
    if (index === -1) return null;

    const [deleted] = items.splice(index, 1);
    await writeDb(db);
    return deleted;
  }
};
