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
  publicId?: string; // Cloudinary public_id
  category?: string;
  createdAt: any;
  updatedAt: any;
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
