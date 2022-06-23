// source/loaders/routes.ts
// Loads and registers all the routes for the server.

import { handlers } from '../handlers/index.js'
import { authenticateUser, authorizeUser } from '../middleware/auth.js'

/**
 * Registers routes with the passed server instance.
 *
 * @param server The server instance to register the routes with.
 */
export const routes = async (server) => {
	server.post('/auth/signup', {
		handler: handlers.auth.signup,
		schema: {
			body: { $ref: 'dtos#/definitions/NameEmailPassword' },
		},
	})

	server.post('/auth/signin', {
		handler: handlers.auth.signin,
		schema: {
			body: { $ref: 'dtos#/definitions/EmailPassword' },
		},
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
}
