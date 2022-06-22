// tests/end-to-end/users.ts
// Test all the user related endpoints of the API.

import { loadFixture } from '../helpers/fixtures.js'
import { teardownEmulators } from '../helpers/emulators.js'

import { build } from '../../source/loaders/index.js'
import { json } from '../../source/utilities/globals.js'
import { ServerError } from '../../source/utilities/errors.js'

// Create the server and seed the database before running all the tests.
let server
beforeAll(async () => {
	server = build({ disableRequestLogging: true })
	await seedDatabase({ for: 'users' })
})
// After all the tests, clear the data from the emulators.
afterAll(async () => await teardownEmulators())

test('post /auth/signup | 400 improper-payload [invalid email]', async () => {
	const response = await server.inject({
		method: 'post',
		url: '/auth/signup',
		// Pass an invalid email in the request body.
		payload: loadFixture('auth/name-invalid-email-password'),
		headers: {
			'content-type': 'application/json',
		},
	})

	const { meta, error, data } = json.parse(response.payload)
	const expectedError = new ServerError('improper-payload')

	// Check that the request body contains only the `meta` and `error` fields,
	// and that the error returned is a 400 improper-payload error.
	expect(data).toEqual(undefined)
	expect(meta?.status).toEqual(expectedError.status)
	expect(error?.code).toEqual(expectedError.code)
	// Ensure the error message is regarding the invalid email.
	expect(error?.message).toMatch(/email/)
})

test('post /auth/signup | 200 okay', async () => {
	const response = await server.inject({
		method: 'post',
		url: '/auth/signup',
		// Make a valid request this time.
		payload: loadFixture('auth/name-email-password'),
		headers: {
			'content-type': 'application/json',
		},
	})

	const { meta, error, data } = json.parse(response.payload)

	// Check the status code and ensure there are no errors.
	expect(meta?.status).toEqual(200)
	expect(error).toEqual(undefined)
	// Make sure the user data returned is correct.
	expect(data.user.name).toEqual('Someone')
	expect(data.user.email).toEqual('someone@example.com')
	expect(data.user.groot).toEqual(false)
	// The tokens, as well as the `id` and `lastSignedIn` properties are not
	// fixed, so just ensure they exist.
	expect(typeof data.user.id).toEqual('string')
	expect(typeof data.user.lastSignedIn).toEqual('string')
	expect(typeof data.tokens.bearer).toEqual('string')
	expect(typeof data.tokens.refresh).toEqual('string')
})
