// tests/end-to-end/api.js
// Test all endpoints of the API.

import { build } from '../../source/loaders/index.js'
import { json } from '../../source/utilities/globals.js'
import { ServerError } from '../../source/utilities/errors.js'

let server
beforeAll(() => {
	server = build({ disableRequestLogging: true })
})

test('post /auth/signup | 400 improper-payload', async () => {
	const response = await server.inject({
		method: 'post',
		url: '/auth/signup',
		payload: json.stringify({
			email: 'someone@example.com',
			password: 'happiness',
		}),
		headers: {
			'content-type': 'application/json',
		},
	})

	const { meta, error, data } = json.parse(response.payload)
	const expectedError = new ServerError('improper-payload')

	expect(meta?.status).toEqual(expectedError.status)
	expect(error?.code).toEqual(expectedError.code)
	expect(error?.message).toMatch(/'name'/)
	expect(data).toEqual(undefined)
})

test('post /auth/signup | 201 created', async () => {
	const response = await server.inject({
		method: 'post',
		url: '/auth/signup',
		payload: json.stringify({
			name: 'Someone',
			email: 'someone@example.com',
			password: 'happiness',
		}),
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
