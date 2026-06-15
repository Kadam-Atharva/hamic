import mongoose, { Schema } from 'mongoose';

// Force Mongoose to re-register schemas when hot-reloaded in Next.js development
if (mongoose.models) {
  delete (mongoose.models as any).Account;
  delete (mongoose.models as any).Product;
  delete (mongoose.models as any).SupportMaterial;
  delete (mongoose.models as any).DiagnosticSession;
  delete (mongoose.models as any).OwnedProduct;
  delete (mongoose.models as any).MaintenanceTask;
}

// 1. Account Schema
const AccountSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['company', 'user'], required: true },
  companyDetails: {
    description: String,
    website: String,
    logoUrl: String,
  },
  createdAt: { type: Date, default: Date.now }
});

// 2. Product Schema
const ProductSchema = new Schema({
  companyId: { type: Schema.Types.Mixed, ref: 'Account', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: String,
  specs: [{ label: String, value: String }],
  createdAt: { type: Date, default: Date.now }
});

// 3. SupportMaterial Schema
const SupportMaterialSchema = new Schema({
  productId: { type: Schema.Types.Mixed, ref: 'Product', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'text', 'image', 'video', 'link'], required: true },
  contentUrl: String,
  rawText: String,
  createdAt: { type: Date, default: Date.now }
});

// 4. DiagnosticSession Schema
const DiagnosticSessionSchema = new Schema({
  productId: { type: Schema.Types.Mixed, ref: 'Product', required: true },
  userId: { type: Schema.Types.Mixed, ref: 'Account' },
  symptom: { type: String, required: true },
  status: { type: String, enum: ['active', 'resolved', 'unresolved'], default: 'active' },
  chatHistory: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  symptomTracker: [{
    symptom: { type: String, required: true },
    status: { type: String, enum: ['confirmed', 'denied', 'suspected'], required: true }
  }],
  ruledOutCauses: [{ type: String }],
  suspectedCauses: [{
    cause: { type: String, required: true },
    probability: { type: Number, required: true } // 0 to 100
  }],
  createdAt: { type: Date, default: Date.now }
});

export const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const SupportMaterial = mongoose.models.SupportMaterial || mongoose.model('SupportMaterial', SupportMaterialSchema);
export const DiagnosticSession = mongoose.models.DiagnosticSession || mongoose.model('DiagnosticSession', DiagnosticSessionSchema);

// 5. OwnedProduct Schema
const OwnedProductSchema = new Schema({
  userId: { type: Schema.Types.Mixed, ref: 'Account', required: true },
  productId: { type: Schema.Types.Mixed, ref: 'Product', required: true },
  createdAt: { type: Date, default: Date.now }
});

// 6. MaintenanceTask Schema
const MaintenanceTaskSchema = new Schema({
  userId: { type: Schema.Types.Mixed, ref: 'Account', required: true },
  productId: { type: Schema.Types.Mixed, ref: 'Product', required: true },
  title: { type: String, required: true },
  description: String,
  intervalMonths: Number,
  dueDate: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

export const OwnedProduct = mongoose.models.OwnedProduct || mongoose.model('OwnedProduct', OwnedProductSchema);
export const MaintenanceTask = mongoose.models.MaintenanceTask || mongoose.model('MaintenanceTask', MaintenanceTaskSchema);
