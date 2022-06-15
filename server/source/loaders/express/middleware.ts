// @/loaders/express/middleware.ts
// Registers middleware with the express application.

import type { Application, Request, Response, NextFunction } from 'express'

import { json as parseJson } from 'express'
import secureResponses from 'helmet'
import enableCors from 'cors'
import addRequestId from 'express-request-id'
import rateLimitRequests from 'express-rate-limit'

import { authenticateRequests } from '@/middleware/authentication'
import { logRequests } from '@/middleware/logger'
import { ServerError, ErrorCode } from '@/errors'
import { logger, stringify } from '@/utilities/logger'

/**
 * Registers middleware with the express application instance passed.
 *
 * @param {Application} app - The Express application instance.
 */
export const load = async (app: Application): Promise<void> => {
	// Tweak server settings
	// This one allows us to get the client's IP address
	app.set('trust proxy', 1)
	app.set('x-powered-by', 'people doing something new')

	// Add a custom method to the request object
	app.use((_request: Request, response: Response, next: NextFunction): void => {
		response.sendError = (error: ErrorCode | ServerError) => {
			const serverError =
				typeof error === 'string' ? new ServerError(error) : error

			logger.http('[http/response] sending error - %s', stringify(serverError))
			response.status(serverError.status).send({
				error: serverError,
			})
		}

		next()
	})

	// Log all requests
	app.use(logRequests())
	// Register body-parsing middleware
	app.use(parseJson())
	// Make our responses secure using the `helmet` library
	app.use(secureResponses())
	// Allow cross-origin requests
	app.use(enableCors())
	// Add a request ID to every request
	app.use(addRequestId())
	// Authenticate the user making the request
	app.use(authenticateRequests())
	// Rate limit the user making the request
	app.use(
		rateLimitRequests({
			// Time duration is one hour
			windowMs: 60 * 60 * 1000,
			// Use the `RateLimit-*` headers to send rate limit information instead
			// of the `X-RateLimit-*` headers.
			standardHeaders: true,
			legacyHeaders: false,
			// Authenticated users can make 2k requests per hour, while
			// unauthenticated users can make only 50 per hour. Groot can make 10k
			// requests in an hour. Users viewing documentation can make 500 per hour
			max(request: Request): number {
				return request.user
					? request.user.isGroot
						? 10_000
						: 2000
					: request.url.startsWith('/api/docs')
					? 500
					: 50
			},
			// Send a `too-many-requests` error when you have exceeded the limit
			handler(request: Request, response: Response): void {
				logger.http(
					'[http/request] rate limited request %s',
					stringify(request.user),
				)
				response.sendError('too-many-requests')
			},
			// Use the bearer token or the IP address of the client as the key if
			// they are not signed in.
			keyGenerator(request: Request): string {
				const userIdentifier = request.user?.token
				const requestIdentifier =
					request.ip ?? request.ips[0] ?? request.socket.remoteAddress

				logger.http(
					'[http/request] checking rate limit for %s',
					userIdentifier ? request.user!.id : requestIdentifier,
				)

				return userIdentifier ?? requestIdentifier
			},
		}),
	)
}
