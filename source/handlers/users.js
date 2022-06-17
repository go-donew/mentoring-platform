// source/handlers/users.ts
// Controllers for the `/user` routes.

/**
 * Lists all the users present in the database.
 */
export const list = async (request, reply) => {
	const server = request.server

	server.log.silly('fetching user list from database')

	const refs = await server.database.collection('users').get()
	const users = refs.docs.filter((doc) => doc.exists).map((doc) => doc.data())

	server.log.silly('fetched user list successfully')

	reply.status(200)
	return {
		meta: { status: 200 },
		data: users,
	}
}
