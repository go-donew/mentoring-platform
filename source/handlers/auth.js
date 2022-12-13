// source/handlers/auths.ts
// Controllers for the `/auth` routes.

import { logger } from '../utilities/logger.js'

/**
 * Sign a user up.
 */
export const signup = async (request, reply) => {
	const { server } = request

	logger.info('creating account for user')

	const { user, tokens } = await server.auth.signup({
		name: request.body.name,
		email: request.body.email,
		password: request.body.password,
	})
	server.database.token = tokens.bearer

	logger.silly('storing user in database')

	await server.database.set(`users/${user.id}`, user)

	logger.info('sucessfully created user account')

	reply.code(201)
	return {
		meta: { status: 201 },
		data: { user, tokens },
	}
}

/**
 * Sign a user into their account.
 */
export const signin = async (request, reply) => {
	const { server } = request

	logger.info('signing user into their account')

	const { user, tokens } = await server.auth.signin({
		email: request.body.email,
		password: request.body.password,
	})
	server.database.token = tokens.bearer

	logger.silly('storing user in database')

	await server.database.set(`users/${user.id}`, user)

	logger.info('sucessfully signed user into their account')

	reply.code(200)
	return {
		meta: { status: 200 },
		data: { user, tokens },
	}
}

/**
 * Give the user a new access token when the old one expires.
 */
export const refreshToken = async (request, reply) => {
	const { server } = request

	logger.info('refreshing user bearer token')

	const { tokens } = await server.auth.refreshToken({
		refreshToken: request.body.refreshToken,
	})
	server.database.token = tokens.bearer

	logger.info('sucessfully refreshed user tokens')

	reply.code(200)
	return {
		meta: { status: 200 },
		data: { tokens },
	}
}
