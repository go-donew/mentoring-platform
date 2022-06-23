// tests/helpers/emulators.ts
// Exports a helper function to clear data from Firebase emulators.

import { env } from 'node:process'

import fetch from 'got'

import { json } from '../../source/utilities/globals.js'

import { loadFixture } from './fixtures.js'

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

/**
 * Seeds data for a certain test.
 *
 * @param {FastifyServer} server - The server to inject requests into.
 *
 * @returns {any} - The seed data.
 */
export const seedDatabase = async ({ server, test }) => {
	if (test === 'users') {
		// Create two users, one groot, and the other not.
		const createUser = async (name) => {
			const response = await server.inject({
				method: 'post',
				url: '/auth/signup',
				payload: loadFixture(`users/${name}`),
				headers: {
					'content-type': 'application/json',
				},
			})
			const { meta, error, data } = json.parse(response.payload)

			if (meta.status === 201) return data
			throw new Error(error.message)
		}

		const [grootDetails, lokiDetails] = await Promise.all(
			['groot', 'loki'].map((name) => createUser(name)),
		)
		let [groot, loki] = [grootDetails, lokiDetails].map((data) => {
			return {
				...data.user,
				tokens: data.tokens,
			}
		})

		// Make groot a Groot by updating the claims on the bearer token.
		const updateClaimsEndpoint = `http://${env.IDENTITY_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:update`
		const claims = {
			profile: {
				id: groot.id,
				name: groot.name,
				email: groot.email,
			},
			roles: { groot: true },
		}
		await fetch(updateClaimsEndpoint, {
			method: 'post',
			json: {
				localId: groot.id,
				customAttributes: json.stringify({ donew: claims }),
			},
			headers: { authorization: 'bearer owner' },
		}).json()

		// Then sign Groot in again to replace groot's now-invalid bearer tokens.
		const response = await server.inject({
			method: 'post',
			url: '/auth/signin',
			payload: loadFixture('users/groot'),
			headers: {
				'content-type': 'application/json',
			},
		})
		const { meta, error, data } = json.parse(response.payload)

		if (meta.status !== 200) throw new Error(error.message)
		groot = {
			...data.user,
			tokens: data.tokens,
		}

		// Return the created users
		return [groot, loki]
	}
}
