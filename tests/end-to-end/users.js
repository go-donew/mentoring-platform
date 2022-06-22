// tests/end-to-end/users.ts
// Test all the user related endpoints of the API.

import { teardownEmulators, seedDatabase } from '../helpers/emulators.js'

import { build } from '../../source/loaders/index.js'
import { json } from '../../source/utilities/globals.js'
import { ServerError } from '../../source/utilities/errors.js'

export const users = () => {
	// Create the server and seed the database before running all the tests.
	let server, users
	beforeAll(async () => {
		server = build({ disableRequestLogging: true })
		users = await seedDatabase({ server, test: 'users' })
	})
	// After all the tests, clear the data from the emulators.
	afterAll(async () => await teardownEmulators())

	test('get /users | 403 not-allowed [non-groot user]', async () => {
		const response = await server.inject({
			method: 'get',
			url: '/users',
			headers: {
				authorization: users.find((user) => user.groot === false).tokens.bearer,
			},
		})

		const { meta, error, data } = json.parse(response.payload)
		const expectedError = new ServerError('not-allowed')

		// Check that the request body contains only the `meta` and `error` fields,
		// and that the error returned is a 403 not-allowed error.
		expect(data).toEqual(undefined)
		expect(meta?.status).toEqual(expectedError.status)
		expect(error?.code).toEqual(expectedError.code)
	})

	test('get /users | 200 okay', async () => {
		const response = await server.inject({
			method: 'get',
			url: '/users',
			headers: {
				authorization: users.find((user) => user.groot === true).tokens.bearer,
			},
		})

		const { meta, error, data } = json.parse(response.payload)

		// Check the status code and ensure there are no errors.
		expect(meta?.status).toEqual(200)
		expect(error).toEqual(undefined)
		// Make sure all the created users are returned.
		expect(data.users.length).toEqual(users.length)
		expect(data.users).toEqual(
			expect.arrayContaining(
				users.map((user) => {
					delete user.tokens
					return user
				}),
			),
		)
	})
}
