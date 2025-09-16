import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || 'publishers-admolabs',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

function createFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  
  return initializeApp(firebaseAdminConfig);
}

const adminApp = createFirebaseAdminApp();
export const adminAuth = getAuth(adminApp);

export default adminApp;