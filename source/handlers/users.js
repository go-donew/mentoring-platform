// source/handlers/users.ts
// Controllers for the `/user` routes.

import { logger } from '../utilities/logger.js'

/**
 * Lists all the users present in the database.
 */
export const list = async (request, reply) => {
	const server = request.server

	logger.silly('fetching user list from database')

	server.database.token = request.user.token
	const refs = await server.database.list('users')
	//const users = refs.docs.filter((doc) => doc.exists).map((doc) => doc.data())

	logger.silly('fetched user list successfully')

	reply.code(200)
	return {
		meta: { status: 200 },
		data: { refs },
	}
}

/**
 * Retrieve a user from the database.
 */
export const get = async (request, reply) => {
	const server = request.server

	const userId = request.params.userId

	logger.silly('fetching user %s from database', userId)

	const refs = await server.database.doc(`users/${userId}`).get()
	const user = refs.data()

	logger.silly('fetched user data successfully')

	reply.code(200)
	return {
		meta: { status: 200 },
		data: { user },
	}
}
