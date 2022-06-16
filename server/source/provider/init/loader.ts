// @/provider/init/index.ts
// Loader that initializes the Firebase Admin SDK.

import process from 'node:process'
import type { Application } from 'express'

import { initializeApp, applicationDefault } from 'firebase-admin/app'

/**
 * Initializes the Firebase Admin SDK.
 */
export const load = async (_app: Application): Promise<void> => {
	// Initialize the Firebase Admin SDK
	if (process.env.NODE_ENV === 'production') {
		// Force Firestore to use REST APIs.
		process.env.FIRESTORE_USE_REST_API = 'true'
		// If in production, connect to the real Firebase project
		initializeApp({
			credential: applicationDefault(),
		})
	} else {
		// Else just connect to the emulators
		initializeApp()
	}
}
