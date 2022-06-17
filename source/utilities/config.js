// source/utilities/config.ts
// Loads and manages configuration for the server.

import { env } from 'node:process'

const isProduction = env.NODE_ENV?.toLowerCase().startsWith('prod')

export const config = {
	// Whether we are in a development environment or not.
	prod: isProduction,
	// The port to bind the server to.
	port: parseInt(env.PORT ?? '4242'),

	// Database and authentication settings.
	database: isProduction
		? undefined
		: {
				projectId: env.FIREBASE_PROJECT_ID,
				host: env.FIREBASE_DB_EMULATOR_HOST,
		  },
	auth: isProduction
		? undefined
		: {
				projectId: env.FIREBASE_PROJECT_ID,
				host: env.FIREBASE_AUTH_EMULATOR_HOST,
				apiKey: env.FIREBASE_API_KEY,
		  },
}
