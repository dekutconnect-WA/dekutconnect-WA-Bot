/**
 * Firebase Admin SDK initializer for Na-api-main (Next.js)
 * Uses Firebase Realtime Database for chat — eliminates PostgreSQL polling.
 *
 * Set FIREBASE_SERVICE_ACCOUNT env var to your service account JSON string,
 * OR rely on Application Default Credentials when deployed on Cloud Run / Firebase Hosting.
 */
import admin from 'firebase-admin';

let app;

function getAdminApp() {
    if (admin.apps.length > 0) return admin.apps[0];

    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : undefined;

    app = admin.initializeApp({
        credential: serviceAccount
            ? admin.credential.cert(serviceAccount)
            : admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_DATABASE_URL ||
            'https://dekut-app-main-default-rtdb.firebaseio.com',
        projectId: process.env.FIREBASE_PROJECT_ID || 'dekut-app-main',
    });

    return app;
}

export function getDb() {
    const app = getAdminApp();
    return admin.database(app);
}

export default getAdminApp;
