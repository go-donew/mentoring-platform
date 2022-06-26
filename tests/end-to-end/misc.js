// tests/end-to-end/misc.ts
// Test stuff that is not related to one particular set of endpoints.

import { teardownEmulators } from '../helpers/emulators.js'

import { build } from '../../source/loaders/index.js'
import { json } from '../../source/utilities/globals.js'
import { ServerError } from '../../source/utilities/errors.js'

export const misc = () => {
	// Create the server before running all the tests.
	let server
	beforeAll(() => {
		server = build({ disableRequestLogging: true })
	})
	// After all the tests, clear the data from the emulators.
	afterAll(() => teardownEmulators())

	test('get /blah | 404 route-not-found', async () => {
		const response = await server.inject({
			method: 'get',
			url: '/blah',
		})

		const { meta, error, data } = json.parse(response.payload)
		const expectedError = new ServerError('route-not-found')

		// Check that the request body contains only the `meta` and `error` fields,
		// and that the error returned is a 404 route-not-found error.
		expect(data).toEqual(undefined)
		expect(meta?.status).toEqual(expectedError.status)
		expect(error?.code).toEqual(expectedError.code)
		// Ensure the error message is regarding the route not existing.
		expect(error?.message).toMatch(/requested route was not found/)
	})
}
