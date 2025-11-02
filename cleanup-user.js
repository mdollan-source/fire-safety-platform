const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'fire-235c2'
});

const db = admin.firestore();
const auth = admin.auth();

async function cleanupUser() {
  const userId = 'MVGAaxyESMMZQK8oG1VbYNNAPYr2';

  try {
    console.log('Starting cleanup for user:', userId);

    // 1. Get user document to find orgId
    console.log('Fetching user document...');
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData) {
      console.log('User data:', userData);

      // 2. If user has orgId, delete organisation and sites
      if (userData.orgId) {
        console.log('Deleting organisation:', userData.orgId);

        // Delete all sites for this org
        const sitesSnapshot = await db.collection('sites')
          .where('orgId', '==', userData.orgId)
          .get();

        console.log(`Found ${sitesSnapshot.size} sites to delete`);
        for (const doc of sitesSnapshot.docs) {
          console.log(`Deleting site: ${doc.id}`);
          await doc.ref.delete();
        }

        // Delete organisation
        await db.collection('organisations').doc(userData.orgId).delete();
        console.log('Organisation deleted');
      }

      // 3. Delete user document from Firestore
      console.log('Deleting user document from Firestore...');
      await db.collection('users').doc(userId).delete();
      console.log('User document deleted');
    }

    // 4. Delete user from Firebase Auth
    console.log('Deleting user from Firebase Auth...');
    await auth.deleteUser(userId);
    console.log('User deleted from Auth');

    console.log('✅ Cleanup complete!');
    process.exit(0);

  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupUser();
