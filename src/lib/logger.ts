import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export const logActivity = async (action: string, details: string) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(collection(db, 'activityLogs'), {
      adminId: user.uid,
      adminEmail: user.email,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
