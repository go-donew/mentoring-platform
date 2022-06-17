// source/loaders/routes.ts
// Loads and registers all the routes for the server.

import { handlers } from '../handlers/index.js'

/**
 * Registers routes with the passed server instance.
 *
 * @param server The server instance to register the routes with.
 */
export const routes = async (server) => {
	server.post('/auth/signup', {
		handler: handlers.auth.signup,
		schema: {
			body: { $ref: 'schemas#/definitions/UserDTO' },
		},
	})

	server.get('/users', handlers.users.list)
}
