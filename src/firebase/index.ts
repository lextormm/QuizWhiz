'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, updateProfile, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, Firestore } from 'firebase/firestore'
import { initiateAnonymousSignIn } from './non-blocking-login';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export async function signIn(name: string, role: 'student' | 'professor') {
    const { auth, firestore } = initializeFirebase();
    const cred = await signInAnonymously(auth);
    if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
        const userRef = doc(firestore, 'users', cred.user.uid);
        
        setDoc(userRef, {
            id: cred.user.uid,
            name,
            role,
        }, { merge: true }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'write',
                requestResourceData: {id: cred.user.uid, name, role}
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
    return cred.user;
}

export function addDocumentNonBlocking(db: Firestore, collectionName: string, data: any) {
    const collRef = collection(db, collectionName);
    addDoc(collRef, data).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
