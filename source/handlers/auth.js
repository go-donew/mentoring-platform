// source/handlers/auths.ts
// Controllers for the `/auth` routes.

/**
 * Sign a user up.
 */
export const signup = async (request, reply) => {
	const server = request.server

	server.log.silly('signing user up')

	const { user, tokens } = await server.auth.signup({
		name: request.body.name,
		email: request.body.email,
		password: request.body.password,
	})

	reply.status(201)
	return {
		meta: { status: 201 },
		data: { user, tokens },
	}
}
