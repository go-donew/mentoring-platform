// source/handlers/users.ts
// Controllers for the `/user` routes.

import { logger } from '../utilities/logger.js'

/**
 * Lists all the users present in the database.
 */
export const list = async (request, reply) => {
	const server = request.server

	logger.silly('fetching user list from database')

	const refs = await server.database.collection('users').get()
	const users = refs.docs.filter((doc) => doc.exists).map((doc) => doc.data())

	logger.silly('fetched user list successfully')

	reply.code(200)
	return {
		meta: { status: 200 },
		data: users,
	}
}
