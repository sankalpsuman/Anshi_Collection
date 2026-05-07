import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Feedback, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firebaseUtils';

const COLLECTION_NAME = 'feedback';

export const feedbackService = {
  // Real-time listener for feedback for a specific product
  subscribeToFeedback: (
    productId: string,
    callback: (feedback: Feedback[]) => void,
    onError?: (error: any) => void
  ) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('productId', '==', productId)
    );

    return onSnapshot(q, (snapshot) => {
      const feedback = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Feedback[];

      // Sort client-side by creation date (newest first)
      feedback.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });

      callback(feedback);
    }, (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    });
  },

  // Add a new feedback
  addFeedback: async (feedback: Omit<Feedback, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...feedback,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      throw error;
    }
  },

  // Delete a feedback (Admin only)
  deleteFeedback: async (id: string) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
      throw error;
    }
  }
};
