// source/utilities/http.ts
// A wrapper around `ky` to make it easier to use.

import ky from 'ky'
import { route } from 'preact-router'

import { storage } from './storage'
import { errors } from './text'

import type { Tokens } from '@/api'

const json = JSON

/**
 * A set of options to pass to the wrapper function to make an HTTP request.
 */
export interface KyOptions {
	/**
	 * The URL (relative to the `prefixUrl` set in the `_fetch` instance below) to
	 * make the request to.
	 */
	url: string

	/**
	 * The HTTP method to make the request with. Must be one of the given strings.
	 */
	method: 'head' | 'get' | 'patch' | 'put' | 'post' | 'delete'

	/**
	 * A JSON object to send as the request body.
	 */
	json?: unknown

	/**
	 * Query parameters to send in the URL.
	 */
	query?: Record<string, string>

	/**
	 * A JSON object to send as the request headers.
	 */
	headers?: Record<string, string | undefined>
}

/**
 * An error returned by the API.
 */
export interface MentoringApiError {
	code:
		| 'improper-payload'
		| 'invalid-token'
		| 'incorrect-credentials'
		| 'not-allowed'
		| 'entity-not-found'
		| 'route-not-found'
		| 'entity-already-exists'
		| 'precondition-failed'
		| 'too-many-requests'
		| 'backend-error'
		| 'server-crash'
		| 'network-error'
	status: 400 | 401 | 403 | 404 | 405 | 409 | 412 | 429 | 500 | 503
	message: string
}

/**
 * The object type returned by the Mentoring API when an error occurs.
 */
export type MentoringApiErrorResponse = {
	error: MentoringApiError
}

/**
 * The response returned by the Mentoring API.
 */
export type MentoringApiResponse<T = unknown> = MentoringApiErrorResponse | T

// Export the extended instance of ky as well.
export const _fetch = ky.create({
	// Set the prefix URL to the server URL so we can mention only the endpoint
	// path in the rest of the code.
	prefixUrl: window.location.href.startsWith('https://mentoring.godonew.com')
		? 'https://mentoring.godonew.com/api'
		: window.location.href.startsWith('https://mentoring-sandbox.godonew.com')
		? 'https://mentoring-sandbox.godonew.com/api'
		: 'http://localhost:5000/api',
	// Don't throw errors, just return them as responses and the app will handle
	// the rest.
	throwHttpErrors: false,
	// Refresh the token automatically when we get a HTTP 401 `invalid-token`
	// error as a response from the API.
	hooks: {
		afterResponse: [
			async (request: any, _options: any, response: any) => {
				// Only run this hook if the body is JSON.
				if (!response.headers.get('content-type')?.includes('application/json'))
					return

				const { status } = response
				const body = await response.json()

				if (status === 401 && body?.error?.code === 'invalid-token') {
					// Get a new access token.
					const tokenResponse = await fetch<{ tokens: Tokens }>({
						method: 'post',
						url: 'auth/refresh-token',
						json: {
							refreshToken: storage.get<Tokens>('tokens')?.refresh,
						},
					})
					// If the refresh token is invalid, then delete token data and redirect
					// to the sign in page.
					if (isErrorResponse(tokenResponse)) {
						storage.delete('tokens')
						route(
							`/signin?redirect=${window.location.pathname}&error=expired-credentials`,
						)

						return
					}

					// Else store them for usage in the future, and retry the request with the token.
					storage.set('tokens', tokenResponse.tokens)
					request.headers.set('authorization', tokenResponse.tokens.bearer)

					return ky(request)
				}
			},
		],
	},
})

/**
 * A wrapper around `ky`, that converts the response to JSON automatically and
 * handles non-HTTP errors.
 *
 * @param {KyOptions} options - The request configuration.
 *
 * @returns {Promise<MentoringApiResponse<T>>} - The response data, wrapped in a Promise.
 */
export const fetch = async <T>(
	passedOptions: KyOptions,
): Promise<MentoringApiResponse<T>> => {
	// Normalize the options
	const options = passedOptions

	// Pass the authorization token in the `Authorization` header
	options.headers = {
		authorization: storage.get<Tokens>('tokens')?.bearer,
		...options.headers,
	}

	try {
		// Make the request, replacing any slashes at the beginning of the url
		const response = await _fetch(options.url.replace(/^\/+/g, ''), {
			method: options.method,
			json: options.json,
			searchParams: options.query,
			headers: options.headers,
		})

		// Check if the response is JSON or not.
		if (response.headers.get('content-type')?.includes('application/json')) {
			// If it is, parse it and return the json.
			return (await response.json()) as MentoringApiResponse<T>
		}

		// Else return the response as a string.
		return (await response.text()) as unknown as MentoringApiResponse<T>
	} catch (error: unknown) {
		// If an error occurs, check if it is a network error.
		if ((error as any).message?.includes('NetworkError')) {
			// If it is, mimic the Mentoring API's error response format and set the code
			// to 'network-error'.
			return {
				error: {
					status: 503,
					code: 'network-error',
					message: errors.get('network-error'),
				},
			}
		}

		// If the token has expired, delete it and retry the request.
		if ((error as any).message?.includes('401 Unauthorized')) {
			storage.delete('tokens')

			return fetch(passedOptions)
		}

		// Else log the error and mimic the Mentoring API's error response format
		// and set the code to 'server-crash'.
		console.error('An unexpected error occurred while making a request:', error)
		return {
			error: {
				status: 500,
				code: 'server-crash',
				message: errors.get('server-crash'),
			},
		}
	}
}

/**
 * Determines whether the response is an error response or not.
 *
 * @param {MentoringApiResponse} response - The response received.
 *
 * @returns {boolean} - Whether or not it is an error response.
 */
export const isErrorResponse = (
	response: MentoringApiResponse,
): response is MentoringApiErrorResponse => {
	return typeof (response as MentoringApiErrorResponse).error !== 'undefined'
}

// Export the original ky instance too.
export { default as _ky } from 'ky'
