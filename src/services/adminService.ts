import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  query, 
  where,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Admin, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firebaseUtils';

const COLLECTION_NAME = 'admins';

export const adminService = {
  // Check if current user is an authorized admin
  checkAdminStatus: async (email: string): Promise<{ authorized: boolean, role: string | null }> => {
    const normalizedEmail = email.toLowerCase().trim();
    // Super admin fallback
    if (normalizedEmail === 'sankalpsmn@gmail.com') {
      return { authorized: true, role: 'super_admin' };
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, normalizedEmail);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Admin;
        return { 
          authorized: data.status === 'active', 
          role: data.role 
        };
      }
      return { authorized: false, role: null };
    } catch (error) {
      console.error('Error checking admin status:', error);
      // Even if check fails, firestore rules will block them if not in DB
      return { authorized: false, role: null };
    }
  },

  // Subscribe to all admins (Super Admin only)
  subscribeToAdmins: (
    callback: (admins: Admin[]) => void,
    onError?: (error: any) => void
  ) => {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
      const admins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Admin[];
      callback(admins);
    }, (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    });
  },

  // Add a new admin (By email)
  addAdmin: async (email: string, role: 'super_admin' | 'admin' = 'admin') => {
    try {
      const trimmedEmail = email.toLowerCase().trim();
      const docRef = doc(db, COLLECTION_NAME, trimmedEmail);
      
      await setDoc(docRef, {
        email: trimmedEmail,
        role,
        status: 'active',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      throw error;
    }
  },

  // Toggle admin status
  updateAdminStatus: async (email: string, status: 'active' | 'disabled') => {
    try {
      const docRef = doc(db, COLLECTION_NAME, email);
      await updateDoc(docRef, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${email}`);
      throw error;
    }
  },

  // Update admin role
  updateAdminRole: async (email: string, role: 'super_admin' | 'admin') => {
    try {
      if (email === 'sankalpsmn@gmail.com') {
        throw new Error('Cannot change main super admin role');
      }
      const docRef = doc(db, COLLECTION_NAME, email);
      await updateDoc(docRef, { role });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${email}`);
      throw error;
    }
  },

  // Remove an admin
  removeAdmin: async (email: string) => {
    try {
      if (email === 'sankalpsmn@gmail.com') {
        throw new Error('Cannot remove super admin');
      }
      const docRef = doc(db, COLLECTION_NAME, email);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${email}`);
      throw error;
    }
  }
};
