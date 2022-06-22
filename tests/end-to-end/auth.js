// tests/end-to-end/api.js
// Test all endpoints of the API.

import { env } from 'node:process'

import fetch from 'got'

import { loadFixture } from '../helpers/fixtures.js'

import { build } from '../../source/loaders/index.js'
import { json } from '../../source/utilities/globals.js'
import { ServerError } from '../../source/utilities/errors.js'

// Create the server before running all the tests.
let server
beforeAll(() => {
	server = build({ disableRequestLogging: true })
})
// After all the tests, clear the data from the emulators.
afterAll(async () => {
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
})

test('post /auth/signup | 400 improper-payload [no name]', async () => {
	const response = await server.inject({
		method: 'post',
		url: '/auth/signup',
		// Don't pass the name of the user in the request body.
		payload: loadFixture('auth/email-password'),
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
	// Ensure the error message is regarding the missing `name` field.
	expect(error?.message).toMatch(/'name'/)
})

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

test('post /auth/signup | 400 improper-payload [weak password]', async () => {
	const response = await server.inject({
		method: 'post',
		url: '/auth/signup',
		// Pass a weak password (< 6 letters) in the request body.
		payload: loadFixture('auth/name-email-weak-password'),
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
	// Ensure the error message is regarding the weak password.
	expect(error?.message).toMatch(/weak/)
})

test('post /auth/signup | 201 created', async () => {
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
	expect(meta?.status).toEqual(201)
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

test('post /auth/signup | 409 entity-already-exists', async () => {
	const response = await server.inject({
		method: 'post',
		url: '/auth/signup',
		// Make the same request as before.
		payload: loadFixture('auth/name-email-password'),
		headers: {
			'content-type': 'application/json',
		},
	})

	const { meta, error, data } = json.parse(response.payload)
	const expectedError = new ServerError('entity-already-exists')

	// Check that the request body contains only the `meta` and `error` fields,
	// and that the error returned is a 409 entity-already-exists error.
	expect(data).toEqual(undefined)
	expect(meta?.status).toEqual(expectedError.status)
	expect(error?.code).toEqual(expectedError.code)
	// Ensure the error message is about a user with the same email.
	expect(error?.message).toMatch(/email address already exists/)
})
