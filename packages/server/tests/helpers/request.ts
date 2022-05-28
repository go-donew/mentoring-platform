// @/helpers/request.ts
// Helper functions to easily make calls to the server

import got, { RequestError, Response } from 'got'

import { ServerError } from '../../source/errors'

/**
 * A `got` instance with the prefixUrl set to the Firebase Hosting Emulator URL.
 */
const _fetch = got.extend({
	prefixUrl: 'http://localhost:5000/api',
})

/**
 * Makes an API call and return the JSON request body and the status code.
 *
 * @param {unknown} options - The options to pass to the `got` instance.
 *
 * @returns {Object<body: any, status: number>} - The response body and status code.
 */
export const fetch = async (
	options: unknown,
): Promise<{ body: any; status: number }> => {
	// Make the request
	let rawBody
	let statusCode
	try {
		;({ rawBody, statusCode } = (await _fetch(options as any)) as Response)
	} catch (caughtError: unknown) {
		const error = caughtError as RequestError

		// Parse the response body
		const body = JSON.parse(
			(error.response?.body as string | undefined) ?? '{}',
		)
		// Log the error
		console.error('Expected successful response, got error:', body)

		throw caughtError
	}

	// Parse the response
	const body = rawBody.toString('utf-8')
	if (body) {
		try {
			return { body: JSON.parse(body), status: statusCode }
		} catch {
			// The body is not JSON (for the `/ping` and `/pong` endpoints)
			return { body: rawBody, status: statusCode }
		}
	}

	return { body: {}, status: statusCode }
}

/**
 * Makes an API call and returns the error in the response as a `ServerError`.
 *
 * @param {unknown} options - The options to pass to the `got` instance.
 *
 * @returns {ServerError | undefined} - The error returned in the response.
 */
export const fetchError = async (
	options: unknown,
): Promise<ServerError | undefined> => {
	try {
		// Make the request
		const response = await _fetch(options as any)

		// Log the body if an error is not returned
		console.error('Expected error, got response instead:', response.body)
	} catch (caughtError: unknown) {
		const error = caughtError as RequestError

		// Parse the response body and check if it is a `ServerError`
		const body = JSON.parse(
			(error.response?.body as string | undefined) ?? '{}',
		)
		const serverError = body.error as Record<string, any> | undefined

		// If yes, convert the JSON object to an instance of a `ServerError`
		if (serverError?.code && serverError?.message && serverError?.status)
			return new ServerError(
				serverError.code,
				serverError.message,
				serverError.status,
			)
	}
}
