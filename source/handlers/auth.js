// source/handlers/auths.ts
// Controllers for the `/auth` routes.

import { logger } from '../utilities/logger.js'

/**
 * Sign a user up.
 */
export const signup = async (request, reply) => {
	const server = request.server

	logger.info('creating account for user')

	const { user, tokens } = await server.auth.signup({
		name: request.body.name,
		email: request.body.email,
		password: request.body.password,
	})

	logger.info('sucessfully created user account')

	reply.status(201)
	return {
		meta: { status: 201 },
		data: { user, tokens },
	}
}
