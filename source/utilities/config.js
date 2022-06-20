// source/utilities/config.ts
// Loads and manages configuration for the server.

import { env } from 'node:process'

import fetch from 'got'

const json = JSON
const number = Number
const environment = env.NODE_ENV?.toLowerCase().startsWith('prod')
	? 'production'
	: 'development'
const googleCreds =
	environment === 'production' ? json.parse(env.GOOGLE_SERVICE_ACCOUNT) : {}
const publicKeys =
	environment === 'production'
		? await fetch(
				'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
		  ).json()
		: {}

export const config = {
	// Whether we are in a development environment or not.
	prod: environment === 'production',
	// The port to bind the server to.
	port: number.parseInt(env.PORT ?? '4242', 10),

	// The configuration for the database and auth services.
	services: {
		database:
			environment === 'production'
				? {
						credentials: googleCreds,
				  }
				: {
						projectId: env.FIREBASE_PROJECT_ID,
						host: env.FIREBASE_DB_EMULATOR_HOST,
				  },
		auth:
			environment === 'production'
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
