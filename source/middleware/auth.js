// source/middleware/authentication.ts
// Exports middleware used for authenticating users.

import { json, object } from '../utilities/globals.js'
import { logger } from '../utilities/logger.js'
import { ServerError } from '../utilities/errors.js'

/**
 * Pre-request handler that authenticates the user making the request.
 */
export const authenticateUser = () => async (request, _) => {
	const server = request.server

	logger.info('authenticating user')

	// Get the authorization token from the `Authorization` header or the `token`
	// query parameter.
	const token = (request.headers.authorization ?? request.query.token)
		?.replace(/bearer/i, '')
		?.trim()
	if (!token) {
		logger.warn('found no bearer token in request')
		throw new ServerError('invalid-token')
	}

	// Parse the token and get the user's profile from it.
	const user = await server.auth.parseToken(token)

	// Add that to the request object, and off we go!
	request.user = { ...user, token }
	server.database.token = request.user.token
	logger.info('sucessfully authenticated user %s', user.id)
}

/**
 * The context in which a request is to be allowed to pass. The `subject` indicates
 * the type of data being accessed, while the roles indicate which type of users
 * are allowed to access the data.
 *
 * type AuthorizationContext =
 * 	| {
 * 			subject: 'user'
 * 			roles: Array<'self' | 'mentor' | 'supermentor'>
 * 	  }
 * 	| {
 * 			subject: 'group'
 * 			roles: Array<'participant' | 'mentee' | 'mentor' | 'supermentor'>
 * 	  }
 * 	| {
 * 			subject: 'report'
 * 			roles: 'dynamic'
 * 	  }
 * 	| {
 * 			subject: 'conversation'
 * 			roles: 'dynamic'
 * 	  }
 * 	| 'groot'
 */

/**
 * Pre-request handler that checks if the user is authorized to perform the
 * given action.
 */
export const authorizeUser = (context) => async (request, _) => {
	const server = request.server
	const user = request.user

	logger.info('authorizing user')

	// If the user is not signed in, throw a 403 not-allowed error.
	if (!user) {
		logger.error('user is not authenticated')
		throw new ServerError('not-allowed')
	}

	// Else, check if the user is authorized to access it.
	logger.silly('user is authenticated; checking authorization')

	// Start by checking if the user is Groot. If yes, they can do anything they
	// want.
	if (user.groot) {
		logger.info('authorized user as user is groot')

		return
	}

	logger.silly('parsing authorization context - %s', json.stringify(context))

	// In this context, only groot can perform the operation.
	if (context === 'groot') {
		// If the user is groot, then we have already let them through in the
		// previous check.
		logger.info('user is not authorized as they are not groot')

		throw new ServerError('not-allowed')
	}

	// In this context, the user is performing an operation which involves some
	// user's data.
	if (context.subject === 'user') {
		// Allow the user to do this if:
		// - `self` => the user is the user themselves.
		// - `<role>` => the user is a <role> in a group with the user.
		for (const role of context.roles) {
			if (role === 'self') {
				if (request.params.userId === user.id) {
					logger.info(
						'authorized user as they are accessing information about themselves',
					)

					return
				}

				// If not, the user could still match another role, so continue with the
				// loop.
				continue
			}

			// Query the database and check if:
			// - the user is part of a group with the user.
			// - in that group, the user is a mentor/supermentor of the user.
			const query = await server.database
				.collection('groups')
				.where(`__participants.${request.params.userId}`, '==', true)
				.where(`__participants.${user.id}`, '==', true)
				.get()
			const groups = query.docs.map((doc) => doc.data())

			// If any such group exists, then let the user proceed.
			if (groups.some((group) => group.participants[user.id] === role)) {
				logger.info(
					'authorized user as they are %s of the user in a group',
					role,
				)

				return
			}
		}

		// If the user matches none of the above roles, return a 403 not-allowed error.
		logger.warn(
			'user is unauthorized to perform this operation on user %s',
			request.params.userId,
		)
		throw new ServerError('not-allowed')
	}

	// In this context, the user is performing an operation involving group data.
	if (context.subject === 'group') {
		// Allow the user to do this if:
		// - participant => the user is a part of the group (any role).
		// - <role> => the user is a <role> in the group.
		for (const role of context.roles) {
			// First, fetch the group.
			const ref = await server.database
				.doc(`groups/${request.params.groupId}`)
				.get()
			const group = ref.data()

			// If the group doesn't exist, return a 404 entity-not-found error.
			if (!group)
				throw new ServerError(
					'entity-not-found',
					'The requested group was not found.',
				)

			if (
				role === 'participant' && // The user just needs to be part of the group
				object.keys(group.participants).includes(user.id)
			) {
				logger.info(
					'authorized user as they are a participant in the group being accessed/modified',
				)

				return
			}

			// The user needs to be a <role> in the group.
			if (group.participants[user.id] === role) {
				logger.info(
					'authorized user as they are a %s in the group being accessed/modified',
					role,
				)

				return
			}
		}

		// If the user matches none of the above roles, return a 403 not-allowed error.
		logger.info(
			'user is unauthorized to perform an operation on group %s',
			request.params.groupId,
		)
		throw new ServerError('not-allowed')
	}

	// In this context, the user is performing an operation involving a conversation.
	if (context.subject === 'conversation') {
		// Query the database and check if the user is part of a group and that
		// the group members are allowed to take the conversation.
		const query = await server.database
			.collection('groups')
			.where(`__participants.${user.id}`, '==', true)
			.where(`__conversations.${request.params.conversationId}`, '==', true)
			.get()
		const groups = query.docs.map((doc) => doc.data())

		// Within a group, it is possible to restrict the ability to take part
		// in a conversation to certain roles. Check if the user has the correct
		// role to take the conversation.
		if (
			groups.some((group) =>
				group.conversations[request.params.conversationId].includes(
					group.participants[user.id],
				),
			)
		) {
			logger.info(
				'user is authorized as they are in a group that is allowed to take the conversation',
			)

			return
		}

		// If the user matches none of the above roles, return a 403 not-allowed error.
		logger.info(
			'user is unauthorized perform this operation on conversation %s',
			request.params.conversationId,
		)
		throw new ServerError('not-allowed')
	}

	// In this context, the user is performing an operation involving a report.
	if (context.subject === 'report') {
		// Query the database and check if the user is part of a group and that
		// the group members are allowed to view the report.
		let query = await server.database
			.collection('groups')
			.where(`__participants.${user.id}`, '==', true)
			.where(`__reports.${request.params.reportId}`, '==', true)
		// The user ID can only be found in the URL if the user is making a
		// render report request, and not when the user is fetching details
		// about the report
		if (request.params.userId)
			query.where(`__participants.${request.params.userId}`, '==', true)
		query = query.get()
		const groups = query.docs.map((doc) => doc.data())

		// Within a group, it is possible to restrict the ability to view the
		// report to certain roles. Check if the user has the correct role to
		// view the report.
		if (
			groups.some((group) =>
				group.reports[request.params.reportId].includes(
					group.participants[user.id],
				),
			)
		) {
			logger.info(
				'user is authorized as they are a in a group that is allowed to view the report',
			)
			return
		}

		// If the user matches none of the above roles, return a 403 not-allowed error.
		logger.info(
			'user is unauthorized to perform this operation on report %s',
			request.params.reportId,
		)
		throw new ServerError('not-allowed')
	}

	// If the request slips through all these checks, err on the side of safety.
	logger.error('authorization checks missed')
	throw new ServerError('not-allowed')
}
