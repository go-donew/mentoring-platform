// @/provider/init/index.ts
// Loader that initializes the Firebase Admin SDK.

import process from 'node:process'
import type { Application } from 'express'

import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Initializes the Firebase Admin SDK.
 */
export const load = async (_app: Application): Promise<void> => {
	// Initialize the Firebase Admin SDK
	if (process.env.NODE_ENV === 'production') {
		// If in production, connect to the real Firebase project
		initializeApp({
			credential: applicationDefault(),
		})
	} else {
		// Else just connect to the emulators
		initializeApp()
	}

	// Setup Firestore
	getFirestore().settings({ ignoreUndefinedProperties: true })
}
