// @/routes/auth.ts
// Request handlers for auth related endpoints.

import { Router as createRouter } from 'express'
import type { Request, Response } from 'express'

import { service as auth } from '@/services/auth'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * POST /auth/signup
 *
 * @summary Create an account
 * @tags auth - Authentication related endpoints
 *
 * @param {SignUpPayload} request.body.required - The name, email address and password of the user to create.
 *
 * @returns {SignUpResponse} 201 - The created user and the tokens for that user.
 * @returns {ImproperPayloadError} 400 - The name, email or password passed were invalid.
 * @returns {EntityAlreadyExistsError} 409 - A user with the same email address already exists.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example payload.
 * {
 * 	"name": "A User",
 * 	"email": "user@example.com",
 * 	"password": "secret"
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/signup',
	async (request: Request, response: Response): Promise<void> => {
		const result = await auth.signUp({
			data: {
				...request.body,
				...request.params,
				...(request.query.request as any),
			},
		})

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * POST /auth/signin
 *
 * @summary Sign into your account
 * @tags auth - Authentication related endpoints
 *
 * @param {SignInPayload} request.body.required - The email address and password of the user to sign in.
 *
 * @returns {SignInResponse} 200 - The signed in user and the tokens for that user.
 * @returns {ImproperPayloadError} 400 - The email or password passed were invalid.
 * @returns {IncorrectCredentialsError} 401 - The password for that account was incorrect.
 * @returns {EntityNotFoundError} 404 - A user with the email address passed in the request does not exists.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example payload.
 * {
 * 	"email": "user@example.com",
 * 	"password": "secret"
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/signin',
	async (request: Request, response: Response): Promise<void> => {
		const result = await auth.signIn({
			data: {
				...request.body,
				...request.params,
				...(request.query.request as any),
			},
		})

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * POST /auth/refresh-token
 *
 * @summary Refresh access token
 * @tags auth - Authentication related endpoints
 *
 * @param {TokenRefreshPayload} request.body.required - The refresh token the user is given while signing up/in.
 *
 * @returns {TokenRefreshResponse} 200 - The new set of tokens the user can use.
 * @returns {ImproperPayloadError} 400 - The refresh token passed was invalid.
 * @returns {IncorrectCredentialsError} 401 - The refresh token had expired.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example payload.
 * {
 * 	"refreshToken": "..."
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/refresh-token',
	async (request: Request, response: Response): Promise<void> => {
		const result = await auth.refreshToken({
			data: {
				...request.body,
				...request.params,
				...(request.query.request as any),
			},
		})

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

// Export the router
export { endpoint }
