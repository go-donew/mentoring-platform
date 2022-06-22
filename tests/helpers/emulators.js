// tests/helpers/emulators.ts
// Exports a helper function to clear data from Firebase emulators.

import { env } from 'node:process'

import fetch from 'got'

/**
 * Clears all the data from the Firebase emulators.
 */
export const teardownEmulators = async () => {
	const clearIdentityEmulatorEndpoint = `http://${env.IDENTITY_EMULATOR_HOST}/emulator/v1/projects/donew-mentoring-api-sandbox/accounts`
	const clearFirestoreEmulatorEndpoint = `http://${env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/donew-mentoring-api-sandbox/databases/(default)/documents`

	await fetch(clearIdentityEmulatorEndpoint, {
		method: 'delete',
		headers: { authorization: 'bearer owner' },
	})
	await fetch(clearFirestoreEmulatorEndpoint, {
		method: 'delete',
		headers: { authorization: 'bearer owner' },
	})
}
