// source/loaders/routes.ts
// Loads and registers all the routes for the server.

import { handlers } from '../handlers/index.js'
import { authenticateUser, authorizeUser } from '../middleware/auth.js'
import { logger } from '../utilities/logger.js'

/**
 * Registers routes with the passed server instance.
 *
 * @param server The server instance to register the routes with.
 */
export const routes = async (server) => {
	logger.silly('registering routes')

	server.post('/auth/signup', {
		schema: {
			body: { $ref: 'dtos#/definitions/NameEmailPassword' },
		},
		handler: handlers.auth.signup,
	})

	server.post('/auth/signin', {
		schema: {
			body: { $ref: 'dtos#/definitions/EmailPassword' },
		},
		handler: handlers.auth.signin,
	})

	server.post('/auth/refresh-token', {
		schema: {
			body: { $ref: 'dtos#/definitions/RefreshToken' },
		},
		handler: handlers.auth.refreshToken,
	})

	server.get('/users', {
		preHandler: [authenticateUser(), authorizeUser('groot')],
		handler: handlers.users.list,
	})

	server.get('/users/:userId', {
		preHandler: [
			authenticateUser(),
			authorizeUser({
				subject: 'user',
				roles: ['self', 'mentor', 'supermentor'],
			}),
		],
		handler: handlers.users.get,
	})

	logger.silly('sucessfully registered routes')
}
