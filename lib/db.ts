import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { localDb, readDb, writeDb } from './localDb';
import * as models from './dbModels';

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

const SEED_ACCOUNTS = [
  {
    _id: "650000000000000000000005",
    name: "Acme Appliances Inc.",
    email: "company@hamic.com",
    passwordHash: bcrypt.hashSync("company123", 10),
    role: "company",
    companyDetails: {
      description: "Leading manufacturer of high-quality household cooling systems and washing machines.",
      website: "https://acme-appliances.example.com",
      logoUrl: ""
    }
  },
  {
    _id: "650000000000000000000006",
    name: "John Doe",
    email: "user@hamic.com",
    passwordHash: bcrypt.hashSync("user123", 10),
    role: "user"
  }
];

const SEED_PRODUCTS = [
  {
    _id: "650000000000000000000001",
    companyId: "650000000000000000000005",
    name: "Acme Air Conditioner",
    category: "Air Conditioners",
    description: "High-efficiency split-system air conditioner with smart temperature control and eco-friendly cooling.",
    imageUrl: "",
    specs: [
      { label: "Cooling Capacity", value: "12,000 BTU" },
      { label: "Energy Rating", value: "5 Star" },
      { label: "Refrigerant", value: "R410A" }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: "650000000000000000000003",
    companyId: "650000000000000000000005",
    name: "WashMaster Pro",
    category: "Washing Machines",
    description: "Heavy-duty front load washing machine with multi-cycle wash, noise reduction, and smart load sensing.",
    imageUrl: "",
    specs: [
      { label: "Drum Capacity", value: "9.0 Kg" },
      { label: "Max Spin Speed", value: "1400 RPM" },
      { label: "Motor Type", value: "Direct Drive" }
    ],
    createdAt: new Date().toISOString()
  }
];

const SEED_MATERIALS = [
  {
    _id: "650000000000000000000002",
    productId: "650000000000000000000001",
    title: "Acme Split AC User Manual & Troubleshooting Guide",
    type: "text",
    rawText: `Acme Split Air Conditioner Manual.
Safety Instructions: Always disconnect power before checking electrical parts.
To resolve cooling issues:
- Check if the thermostat is set to 'Cool' and target temperature is below room temperature.
- A dirty or clogged air filter restricts air flow and degrades cooling performance. Clean or replace the HEPA air filter every 3 months.
- If the outdoor unit fan is not spinning or humming, the condenser motor might be faulty.
- Evaporator coil freezing and ice formation on indoor copper tubes is caused by low refrigerant levels (refrigerant leak).`,
    createdAt: new Date().toISOString()
  },
  {
    _id: "650000000000000000000004",
    productId: "650000000000000000000003",
    title: "WashMaster Pro Front Load Washer Owner Manual",
    type: "text",
    rawText: `WashMaster Pro Front Load Washing Machine Support Manual.
Safety Warning: Always unplug the washing machine from the outlet before performing physical repairs.
Diagnostic Checklist:
- Severe vibration or stopping mid-cycle is usually caused by an unbalanced load. Ensure clothes are distributed evenly.
- If the washer refuses to start or spin, the lid switch or door lock actuator assembly might be broken or not acknowledging door closure.
- Water remaining in the drum that is failing to drain out indicates a drain pump clog or pump assembly motor failure.
- If the motor hums but the drum does not rotate when turned by hand, the drum drive belt might be broken or slipped off.`,
    createdAt: new Date().toISOString()
  }
];

async function seedIfEmpty() {
  try {
    if (MONGODB_URI && isConnected) {
      const productCount = await models.Product.countDocuments();
      if (productCount === 0) {
        console.log("🌱 Database is empty. Seeding MongoDB Atlas...");
        
        for (const acc of SEED_ACCOUNTS) {
          const exists = await models.Account.findOne({ email: acc.email });
          if (!exists) {
            await models.Account.create(acc);
          }
        }

        for (const prod of SEED_PRODUCTS) {
          const exists = await models.Product.findById(prod._id);
          if (!exists) {
            await models.Product.create(prod);
          }
        }

        for (const mat of SEED_MATERIALS) {
          const exists = await models.SupportMaterial.findById(mat._id);
          if (!exists) {
            await models.SupportMaterial.create(mat);
          }
        }
        console.log("✅ MongoDB Atlas seeding completed.");
      }
    }

    const db = await readDb();
    if (!db.products || db.products.length === 0) {
      console.log("🌱 Local DB is empty. Seeding local database...");
      
      if (!db.accounts) db.accounts = [];
      if (!db.products) db.products = [];
      if (!db.supportmaterials) db.supportmaterials = [];
      if (!db.diagnosticsessions) db.diagnosticsessions = [];

      for (const acc of SEED_ACCOUNTS) {
        const exists = db.accounts.some((a: any) => a.email === acc.email);
        if (!exists) {
          db.accounts.push(acc);
        }
      }

      for (const prod of SEED_PRODUCTS) {
        const exists = db.products.some((p: any) => p._id === prod._id);
        if (!exists) {
          db.products.push(prod);
        }
      }

      for (const mat of SEED_MATERIALS) {
        const exists = db.supportmaterials.some((m: any) => m._id === mat._id);
        if (!exists) {
          db.supportmaterials.push(mat);
        }
      }

      await writeDb(db);
      console.log("✅ Local DB seeding completed.");
    }
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  if (isConnected) return;

  if (!MONGODB_URI) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️  MONGODB_URI is not set. Running Hamic in LOCAL FILE DATABASE mode.');
    }
    await seedIfEmpty();
    return;
  }

  try {
    const opts = {
      bufferCommands: false,
    };
    await mongoose.connect(MONGODB_URI, opts);
    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas successfully.');
    await seedIfEmpty();
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error);
    console.log('⚠️  Falling back to LOCAL FILE DATABASE mode.');
    await seedIfEmpty();
  }
}

// Convert Mongoose document to clean JS object with string ID
function cleanDoc(doc: any) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  if (obj._id) obj._id = obj._id.toString();
  if (obj.companyId) obj.companyId = obj.companyId.toString();
  if (obj.productId) obj.productId = obj.productId.toString();
  if (obj.userId) obj.userId = obj.userId.toString();
  return obj;
}

// Helpers to prevent Mongoose CastError by checking ObjectId validity
const isValidObjectId = (id: any): boolean => {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id);
};

const canQueryMongoose = (query: any): boolean => {
  if (!query) return true;
  if (typeof query === 'string') return isValidObjectId(query);
  
  // Check common schema fields that are mapped to ObjectIds
  const objectIdFields = ['_id', 'userId', 'productId', 'companyId'];
  for (const field of objectIdFields) {
    if (query[field] !== undefined) {
      const val = query[field];
      if (typeof val === 'string' && !isValidObjectId(val)) {
        return false;
      }
      if (typeof val === 'object' && val !== null && val.toString && !isValidObjectId(val.toString())) {
        return false;
      }
    }
  }
  return true;
};

// Unified repository database operations
export const dbModel = {
  Account: {
    async findOne(query: any) {
      if (MONGODB_URI && isConnected && canQueryMongoose(query)) {
        const doc = await models.Account.findOne(query);
        if (doc) return cleanDoc(doc);
      }
      return localDb.findOne('accounts', query);
    },
    async findById(id: string) {
      if (MONGODB_URI && isConnected && isValidObjectId(id)) {
        const doc = await models.Account.findById(id);
        if (doc) return cleanDoc(doc);
      }
      return localDb.findOne('accounts', { _id: id });
    },
    async create(data: any) {
      if (MONGODB_URI && isConnected) {
        const doc = await models.Account.create(data);
        return cleanDoc(doc);
      }
      return localDb.insert('accounts', data);
    },
    async findByIdAndUpdate(id: string, update: any) {
      if (MONGODB_URI && isConnected && isValidObjectId(id)) {
        const doc = await models.Account.findByIdAndUpdate(id, update, { new: true });
        if (doc) return cleanDoc(doc);
      }
      return localDb.findByIdAndUpdate('accounts', id, update);
    }
  },

  Product: {
    async find(query: any = {}) {
      if (MONGODB_URI && isConnected && canQueryMongoose(query)) {
        const docs = await models.Product.find(query).sort({ createdAt: -1 });
        return docs.map(cleanDoc);
      }
      const list = await localDb.find('products', query);
      return list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    async findById(id: string) {
      if (MONGODB_URI && isConnected && isValidObjectId(id)) {
        const doc = await models.Product.findById(id);
        if (doc) return cleanDoc(doc);
      }
      return localDb.findOne('products', { _id: id });
    },
    async create(data: any) {
      if (MONGODB_URI && isConnected) {
        const doc = await models.Product.create(data);
        return cleanDoc(doc);
      }
      return localDb.insert('products', data);
    },
    async findByIdAndUpdate(id: string, update: any) {
      if (MONGODB_URI && isConnected && isValidObjectId(id)) {
        const doc = await models.Product.findByIdAndUpdate(id, update, { new: true });
        if (doc) return cleanDoc(doc);
      }
      return localDb.findByIdAndUpdate('products', id, update);
    },
    async findByIdAndDelete(id: string) {
      if (MONGODB_URI && isConnected && isValidObjectId(id)) {
        const doc = await models.Product.findByIdAndDelete(id);
        if (doc) return cleanDoc(doc);
      }
      return localDb.findByIdAndDelete('products', id);
    }
  },

  SupportMaterial: {
    async find(query: any) {
      if (MONGODB_URI && isConnected && canQueryMongoose(query)) {
        const docs = await models.SupportMaterial.find(query).sort({ createdAt: -1 });
        return docs.map(cleanDoc);
      }
      return localDb.find('supportmaterials', query);
    },
    async findById(id: string) {
      if (MONGODB_URI && isConnected && isValidObjectId(id)) {
        const doc = await models.SupportMaterial.findById(id);
        if (doc) return cleanDoc(doc);
      }
      return localDb.findOne('supportmaterials', { _id: id });
    },
    async create(data: any) {
      if (MONGODB_URI && isConnected) {
        const doc = await models.SupportMaterial.create(data);
        return cleanDoc(doc);
      }
      return localDb.insert('supportmaterials', data);
    },
    async findByIdAndDelete(id: string) {
      if (MONGODB_URI && isConnected && isValidObjectId(id)) {
        const doc = await models.SupportMaterial.findByIdAndDelete(id);
        if (doc) return cleanDoc(doc);
      }
      return localDb.findByIdAndDelete('supportmaterials', id);
    }
  },

  DiagnosticSession: {
    async findById(id: string) {
      if (MONGODB_URI && isConnected && isValidObjectId(id)) {
        const doc = await models.DiagnosticSession.findById(id);
        if (doc) return cleanDoc(doc);
      }
      return localDb.findOne('diagnosticsessions', { _id: id });
    },
    async create(data: any) {
      if (MONGODB_URI && isConnected) {
        const doc = await models.DiagnosticSession.create(data);
        return cleanDoc(doc);
      }
      return localDb.insert('diagnosticsessions', data);
    },
    async findByIdAndUpdate(id: string, update: any) {
      if (MONGODB_URI && isConnected && isValidObjectId(id)) {
        const doc = await models.DiagnosticSession.findByIdAndUpdate(id, update, { new: true });
        if (doc) return cleanDoc(doc);
      }
      return localDb.findByIdAndUpdate('diagnosticsessions', id, update);
    }
  },

  OwnedProduct: {
    async find(query: any = {}) {
      if (MONGODB_URI && isConnected && canQueryMongoose(query)) {
        const docs = await models.OwnedProduct.find(query);
        return docs.map(cleanDoc);
      }
      return localDb.find('ownedproducts', query);
    },
    async findOne(query: any) {
      if (MONGODB_URI && isConnected && canQueryMongoose(query)) {
        const doc = await models.OwnedProduct.findOne(query);
        if (doc) return cleanDoc(doc);
      }
      return localDb.findOne('ownedproducts', query);
    },
    async create(data: any) {
      if (MONGODB_URI && isConnected) {
        const doc = await models.OwnedProduct.create(data);
        return cleanDoc(doc);
      }
      return localDb.insert('ownedproducts', data);
    },
    async deleteOne(query: any) {
      if (MONGODB_URI && isConnected && canQueryMongoose(query)) {
        const doc = await models.OwnedProduct.deleteOne(query);
        return { deletedCount: doc.deletedCount || 0 };
      }
      const found = await localDb.findOne('ownedproducts', query);
      if (found) {
        await localDb.findByIdAndDelete('ownedproducts', found._id);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    }
  },

  MaintenanceTask: {
    async find(query: any = {}) {
      if (MONGODB_URI && isConnected && canQueryMongoose(query)) {
        const docs = await models.MaintenanceTask.find(query).sort({ dueDate: 1 });
        return docs.map(cleanDoc);
      }
      const list = await localDb.find('maintenancetasks', query);
      return list.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    },
    async create(data: any) {
      if (MONGODB_URI && isConnected) {
        const doc = await models.MaintenanceTask.create(data);
        return cleanDoc(doc);
      }
      return localDb.insert('maintenancetasks', data);
    },
    async findByIdAndUpdate(id: string, update: any) {
      if (MONGODB_URI && isConnected && isValidObjectId(id)) {
        const doc = await models.MaintenanceTask.findByIdAndUpdate(id, update, { new: true });
        if (doc) return cleanDoc(doc);
      }
      return localDb.findByIdAndUpdate('maintenancetasks', id, update);
    },
    async deleteMany(query: any) {
      if (MONGODB_URI && isConnected && canQueryMongoose(query)) {
        const result = await models.MaintenanceTask.deleteMany(query);
        return { deletedCount: result.deletedCount || 0 };
      }
      const db = await readDb();
      const colName = 'maintenancetasks';
      const items = db[colName] || [];
      const keptItems = items.filter((item: any) => {
        for (const key in query) {
          if (item[key] === query[key]) return false;
        }
        return true;
      });
      const deletedCount = items.length - keptItems.length;
      db[colName] = keptItems;
      await writeDb(db);
      return { deletedCount };
    }
  }
};
