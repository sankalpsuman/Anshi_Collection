import { 
  collection, 
  getDocs, 
  addDoc,
  query, 
  where,
  orderBy, 
  limit,
  startAfter,
  serverTimestamp,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { OperationType, Product } from '../types';
import { handleFirestoreError } from '../lib/firebaseUtils';

const COLLECTION_NAME = 'user_images';

export interface UserImage {
  id: string;
  userId: string;
  imageUrl: string;
  publicId: string;
  createdAt: any;
}

export const imageService = {
  // Add an image to the user's image library
  saveUserImage: async (imageUrl: string, publicId: string): Promise<string | undefined> => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("No logged-in user to save image reference for.");
      return;
    }
    if (!imageUrl) return;

    try {
      // Check if this image URL already exists for this user to avoid duplicates
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('imageUrl', '==', imageUrl),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        userId,
        imageUrl,
        publicId: publicId || '',
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      } catch (err) {
        console.error("Failed to register user image:", err);
      }
    }
  },

  // Get user's image library with pagination/lazy loading & search
  getUserImages: async (
    limitCount: number = 12,
    lastVisible: QueryDocumentSnapshot | null = null,
    searchQuery: string = ''
  ): Promise<{ images: UserImage[]; lastDoc: QueryDocumentSnapshot | null }> => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return { images: [], lastDoc: null };
    }

    try {
      // Index-free Query: filter by userId only (guaranteed to work without composite index)
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      
      let images = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserImage[];

      // Sort by createdAt descending in-memory (handles serverTimestamp fields perfectly)
      images.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds * 1000 || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds * 1000 || 0);
        return timeB - timeA;
      });

      if (searchQuery) {
        const queryTerm = searchQuery.toLowerCase();
        images = images.filter(img => 
          (img.imageUrl && img.imageUrl.toLowerCase().includes(queryTerm)) || 
          (img.publicId && img.publicId.toLowerCase().includes(queryTerm))
        );
      }

      // Handle simple index-free pagination inside memory
      const startIndex = lastVisible ? images.findIndex(img => img.id === lastVisible.id) + 1 : 0;
      const paginatedImages = images.slice(startIndex, startIndex + limitCount);
      
      // Determine simulated lastDoc matching the slice
      const lastImgInSlice = paginatedImages[paginatedImages.length - 1];
      const lastDocInSlice = lastImgInSlice 
        ? querySnapshot.docs.find(doc => doc.id === lastImgInSlice.id) || null
        : null;

      return {
        images: paginatedImages,
        lastDoc: lastDocInSlice
      };
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      } catch (err) {
        console.error("Failed to query user images:", err);
      }
      return { images: [], lastDoc: null };
    }
  },

  // Proactive sync logic: populate library with standard active product list images so the view isn't empty of existing uploads
  syncProductsToLibrary: async (products: Product[]): Promise<void> => {
    const userId = auth.currentUser?.uid;
    if (!userId || !products || products.length === 0) return;

    try {
      // Fetch user's existing images to prevent redundant Firestore insertions
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const existingUrls = new Set(snapshot.docs.map(d => d.data().imageUrl));

      for (const prod of products) {
        if (prod.imageUrl && !existingUrls.has(prod.imageUrl)) {
          await addDoc(collection(db, COLLECTION_NAME), {
            userId,
            imageUrl: prod.imageUrl,
            publicId: prod.publicId || '',
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.warn("Proactive image sync skipped or unauthorized:", error);
    }
  }
};
