// source/middleware/authentication.ts
// Exports middleware used for authenticating users.

import { ServerError } from '../utilities/errors.js'

/**
 * Pre-request handler that authenticates the user making the request.
 */
export const authenticateUser = (request, _, done) => {
	const server = request.server

	// Get the authorization token from the `Authorization` header or the `token` parameter.
	const token = (request.headers.authorization ?? request.query.token)?.replace(/bearer/i, '')?.trim()
	if (!token) throw new ServerError('invalid-token')

	// Parse the token and get the user's profile from it.
	const user = server.auth.parseToken(token)

	// Add that to the request object, and off we go!
	request.user = user
	done()
}
