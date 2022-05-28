// @/loaders/express/routes.ts
// Loader to register API endpoints with the server.

import type { Application, Request, Response, NextFunction } from 'express'

import { endpoint as auth } from '@/routes/auth'
import { endpoint as users } from '@/routes/users'
import { endpoint as groups } from '@/routes/groups'
import { endpoint as attributes } from '@/routes/attributes'
import { endpoint as conversations } from '@/routes/conversations'
import { endpoint as reports } from '@/routes/reports'
import { endpoint as scripts } from '@/routes/scripts'
import { endpoint as meta } from '@/routes/meta'
import { ServerError } from '@/errors'
import { logger, stringify } from '@/utilities/logger'

/**
 * Registers API endpoint handlers with the express application instance passed.
 *
 * @param {Application} app - The Express application instance.
 */
export const load = async (app: Application): Promise<void> => {
	// Register the API endpoints
	// `/ping` and `/pong` are test routes
	app.all(/api\/p[i|o]ng/, (_: Request, response: Response) =>
		response
			.status(200)
			.send(
				'Thanks for using the DoNew Mentoring API! Check out the docs by going to /docs in your browser.',
			),
	)

	app.use('/api/auth', auth)
	app.use('/api/users', users)
	app.use('/api/groups', groups)
	app.use('/api/attributes', attributes)
	app.use('/api/conversations', conversations)
	app.use('/api/reports', reports)
	app.use('/api/scripts', scripts)
	app.use('/api/meta', meta)

	// If a client calls a random route that has no registered request handler,
	// return a 404 `route-not-found` error.
	app.all('*', (_: Request, response: Response): void => {
		response.sendError('route-not-found')
	})
	// Handle any other errors that are thrown
	app.use(
		(
			caughtError: Error,
			_request: Request,
			response: Response,
			_next: NextFunction,
		) => {
			logger.silly(
				'[http/response] handling error - %s',
				stringify(caughtError),
			)

			if (caughtError instanceof ServerError) {
				// We threw this error, so pass it on
				response.sendError(caughtError)
			} else if ((caughtError as any).status === 400) {
				// The request validator threw an error, return it as an `improper-payload`
				// error
				response.sendError(
					new ServerError(
						'improper-payload',
						`An error occurred while validating your request: ${caughtError.message}.`,
					),
				)
			} else if (
				(caughtError as any).status === 404 &&
				(caughtError as any).path &&
				!(caughtError instanceof ServerError)
			) {
				// The request validator threw an error for an unknown route, so return it
				// as a `route-not-found` error
				response.sendError(new ServerError('route-not-found'))
			} else {
				// We crashed :/
				logger.error('server crashed due to error - %j', caughtError)

				response.sendError('server-crash')
			}
		},
	)
}
