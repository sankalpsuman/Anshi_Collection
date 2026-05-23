export interface Admin {
  id: string; // The user's UID
  email: string;
  role: 'super_admin' | 'admin';
  status: 'active' | 'disabled';
  createdAt: any;
}

export interface Feedback {
  id: string;
  productId: string;
  userName: string;
  comment: string;
  rating: number; // 1-5
  createdAt: any;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  imageUrls?: string[]; // Multiple images
  videoUrl?: string; // Optional short video/reel preview URL
  publicId?: string; // Cloudinary public_id
  publicIds?: string[]; // Cloudinary public_ids for extra images
  category?: string;
  createdAt: any;
  updatedAt: any;
  
  // Premium clothing e-commerce fields
  code: string; // Product Code (e.g. ANS102)
  sizes?: string[]; // Available sizes (e.g. S, M, L, XL, XXL)
  colors?: string[]; // Available colors
  fabric?: string; // Fabric details, e.g., pure silk, georgette
  deliveryTime?: string; // Est. delivery time, e.g., 3-5 working days
  offerPercent?: number; // Offer / discount % (e.g., 20 for 20% off)
  customMessage?: string; // Custom WhatsApp message
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  badge?: 'new_arrival' | 'trending' | 'fast_selling' | 'limited_stock' | 'sale' | ''; // Product badge
  peopleInterested?: number; // "People interested in this product" counter
  views?: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
