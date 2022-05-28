// @/middleware/authentication.ts
// Middleware that authenticates users making requests.

import type { Request, Response, NextFunction, RequestHandler } from 'express'

import { ServerError } from '@/errors'
import { provider as auth } from '@/provider/auth'
import { provider as users } from '@/provider/data/users'
import { handleAsyncErrors } from '@/utilities'
import { logger } from '@/utilities/logger'

/**
 * Ensure that users accessing the API are authenticated, except for
 * authentication and documentation related routes.
 *
 * The function returns middleware to authenticate the user. The middleware:
 * - First checks the 'Authorization' header, then the 'X-Access-Token' header
 *   for an access token.
 * - If none of the headers contain an access token, return a
 *   `NotAuthenticatedError` (401).
 * - If an access token is found, decode and verify it.
 * - If the access token is invalid, return an `InvalidAccessTokenError` (401).
 * - Lastly, retrieve the user from the ID specified in the access token.
 *
 * @returns {RequestHandler} - The authentication middleware.
 * @throws {ServerError} - 'invalid-token'
 */
export const authenticateRequests = (): RequestHandler =>
	handleAsyncErrors(
		async (
			request: Request,
			_response: Response,
			next: NextFunction,
		): Promise<void> => {
			logger.info('[authentication] authenticating user')

			// Don't do anything for docs and auth related routes. Also disable auth
			// for the `/ping` route, but not `/pong` - useful for tests!
			if (
				request.url.startsWith('/api/ping') ||
				request.url.startsWith('/api/auth') ||
				request.url.startsWith('/api/docs')
			) {
				logger.info(
					'[authentication] skipping authentication on request',
					request.url,
				)

				next()
				return
			}

			// Check for a Bearer token in the `Authorization` header
			let token = request.headers.authorization
			// If there is nothing in either header, throw an error
			if (typeof token !== 'string') {
				logger.silly(
					'[authentication] found non-string token in authorization header',
				)

				next(new ServerError('invalid-token'))
				return
			}

			// Remove the `bearer` prefix (if it exists) and extra whitespaces from the
			// access token
			token = token.replace(/bearer/i, '').trim()

			logger.silly('[authentication] found token in auth header')

			// Fetch the user's details from the database and store the user in the
			// request object, so the request handlers know who is making the request
			try {
				logger.silly('[authentication] verifying token, retrieving user data')

				const tokenData = await auth.verifyToken(token)
				const user = await users.get(tokenData.sub)
				const claims = await auth.retrieveClaims(user.id)

				logger.silly(
					'[authentication] sucessfully verified token and retrieved user data',
				)

				request.user = {
					...user,
					isGroot: claims?.groot ?? false,
					token,
				}
			} catch (error: unknown) {
				logger.warn('[authentication] error while verifying token', error)

				next(error)
				return
			}

			logger.info(
				'[authentication] sucessfully authenticated user %s',
				request.user.id,
			)

			// We are good to go!
			next()
		},
	)
