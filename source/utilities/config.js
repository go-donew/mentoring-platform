// source/utilities/config.ts
// Loads and manages configuration for the server.

import { readFile } from 'node:fs/promises'
import { env } from 'node:process'

import fetch from 'got'

const json = JSON
const isProduction = env.NODE_ENV?.toLowerCase().startsWith('prod')
const googleKeyFile = env.GOOGLE_APPLICATION_CREDENTIALS
const googleCreds = isProduction ? json.parse(await readFile(googleKeyFile, 'utf8')) : {}
const publicKeys = isProduction
	? await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com').json()
	: {}

export const config = {
	// Whether we are in a development environment or not.
	prod: isProduction,
	// The port to bind the server to.
	port: parseInt(env.PORT ?? '4242'),

	// The configuration for the database and auth services.
	services: {
		database: isProduction
			? {
					credentials: googleCreds,
			  }
			: {
					projectId: env.FIREBASE_PROJECT_ID,
					host: env.FIREBASE_DB_EMULATOR_HOST,
			  },
		auth: isProduction
			? {
					credentials: {
						email: googleCreds.client_email,
						privateKey: googleCreds.private_key,
						privateKeyId: googleCreds.private_key_id,
						publicKeys,
					},
					host: 'identitytoolkit.googleapis.com',
					projectId: googleCreds.project_id,
			  }
			: {
					projectId: env.FIREBASE_PROJECT_ID,
					host: `${env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com`,
			  },
	},
}
