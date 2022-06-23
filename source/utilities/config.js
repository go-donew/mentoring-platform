// source/utilities/config.ts
// Loads and manages configuration for the server.

import { env } from 'node:process'

import fetch from 'got'

import { json, number } from '../utilities/globals.js'

const environment = env.NODE_ENV?.toLowerCase().startsWith('prod')
	? 'production'
	: env.NODE_ENV?.toLowerCase().startsWith('test')
	? 'test'
	: 'development'

/**
 * Returns the configuration for the auth and database services, depending on
 * whether we are in a production or development environment.
 */
const fetchServiceConfig = async () => {
	if (environment === 'production') {
		const account = json.parse(env.GOOGLE_SERVICE_ACCOUNT)
		const publicKeys = await fetch(
			'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
		).json()

		return {
			database: { credentials: account },
			auth: {
				credentials: {
					email: account.client_email,
					privateKey: account.private_key,
					privateKeyId: account.private_key_id,
					publicKeys,
				},
				host: 'identitytoolkit.googleapis.com',
				projectId: account.project_id,
			},
		}
	}

	return {
		database: {
			projectId: env.FIREBASE_PROJECT_ID,
			host: env.FIRESTORE_EMULATOR_HOST,
		},
		auth: {
			projectId: env.FIREBASE_PROJECT_ID,
			host: `${env.IDENTITY_EMULATOR_HOST}/identitytoolkit.googleapis.com`,
		},
	}
}

export const config = {
	// Whether we are in a development environment or not.
	prod: environment === 'production',
	test: environment === 'test',
	// The port to bind the server to.
	port: number.parseInt(env.PORT ?? '4242', 10),

	// The configuration for the database and auth services.
	services: await fetchServiceConfig(),
}
