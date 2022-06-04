// @/middleware/authorization.ts
// Middleware that checks if a user is authorized to make a request.

import type { Request, RequestHandler, Response, NextFunction } from 'express'

import { ServerError } from '@/errors'
import { provider as groups } from '@/provider/data/groups'
import { handleAsyncErrors } from '@/utilities'
import { logger, stringify } from '@/utilities/logger'
import { Query } from '@/types'
import { Group } from '@/models/group'

/**
 * The context in which a request is to be allowed to pass. The `subject` indicates
 * the type of data being accessed, while the roles indicate which type of users
 * are allowed to access the data.
 */
export type AuthorizationContext =
	| {
			subject: 'user'
			roles: Array<'self' | 'mentor' | 'supermentor'>
	  }
	| {
			subject: 'group'
			roles: Array<'participant' | 'mentee' | 'mentor' | 'supermentor'>
	  }
	| {
			subject: 'message'
			roles: Array<
				'participant' | 'sender' | 'mentee' | 'mentor' | 'supermentor'
			>
	  }
	| {
			subject: 'report'
			roles: 'dynamic'
	  }
	| {
			subject: 'conversation'
			roles: 'dynamic'
	  }
	| 'groot'

/**
 * Ensure that a user making a request is authorized to do so.
 *
 * @param {AuthorizationContext} context - This tells the middleware what kind of data is the endpoint returns, and who should be able to access it.
 *
 * @returns {RequestHandler} - The authorization middleware.
 * @throws {ServerError} - 'not-allowed'
 */
export const permit = (context: AuthorizationContext): RequestHandler =>
	handleAsyncErrors(
		async (
			request: Request,
			response: Response,
			next: NextFunction,
		): Promise<void> => {
			logger.info('[authorization] authorizing user')

			// Make sure the user exists
			if (!request.user) {
				logger.warn(
					'[authorization] an unauthenticated user cannot be authorized',
				)

				throw new ServerError('invalid-token')
			}

			// Retrieve the user's custom claims and check if groot is present and
			// set to true
			if (request.user.isGroot) {
				logger.info('[authorization] successfully authorized groot')

				// If so, let them access any endpoint
				next()
				return
			}

			logger.silly(
				'[authorization] parsing authorization context - %s',
				stringify(context),
			)

			// In this context, only groot can access the endpoint
			if (context === 'groot') {
				// If the client is groot, then we have already let them through in the
				// previous check
				logger.info(
					'[authorization] user is not authorized as they are not groot',
				)

				response.sendError('not-allowed')
				return
			}

			// In this context, the client is accessing data about a user
			if (context.subject === 'user') {
				// Allow the client to do this if they match the roles provided
				// - self => the client is the user themselves
				// - <role> => the client is a <role> in a group with the user
				for (const role of context.roles) {
					if (role === 'self') {
						if (request.params.userId === request.user.id) {
							logger.info(
								'[authorization] authorized user as they are accessing information about themselves',
							)

							next()
							return
						}

						continue
					}

					// Query the database and check if:
					// - the client is part of a group with the user
					// - in that group, the client is a mentor/supermentor of the user
					const foundGroups = await groups.find([
						{
							field: `participants`,
							operator: 'includes',
							value: request.params.userId,
						},
						{
							field: `participants`,
							operator: 'includes',
							value: request.user.id,
						},
					])

					// If any such group exists, then let them through
					if (
						foundGroups.some(
							(group) => group.participants[request.user!.id] === role,
						)
					) {
						logger.info(
							'[authorization] authorized user as they are %s of the user in a group',
							role,
						)

						next()
						return
					}
				}

				// If the client matches none of the above roles, return a 403
				logger.info(
					'[authorization] user is unauthorized to access the requested user data',
				)
				response.sendError('not-allowed')
				return
			}

			// In this context, the client is accessing data about a group
			if (context.subject === 'group') {
				// Allow the client to do this if they match the roles provided
				// - participant => the client is a part of the group (any role)
				// - <role> => the client is a <role> in the group
				for (const role of context.roles) {
					// Query the database and check if:
					// - the client is part of the group and is a participant, mentor or supermentor

					// First fetch the group
					const group = await groups.get(request.params.groupId)

					// Check the client's role in the group
					if (
						role === 'participant' && // The client just needs to be part of the group
						Object.keys(group.participants).includes(request.user.id)
					) {
						logger.info(
							'[authorization] authorized user as they are a participant in the group being accessed/modified',
						)

						next()
						return
					}

					// Else the client needs to be a <role> in the group
					if (group.participants[request.user.id] === role) {
						logger.info(
							'[authorization] authorized user as they are a %s in the group being accessed/modified',
							role,
						)

						next()
						return
					}
				}

				// If the client matches none of the above roles, return a 403
				logger.info(
					'[authorization] user is unauthorized to access the requested group data',
				)
				response.sendError('not-allowed')
				return
			}

			// In this context, the client is accessing data about a conversation
			if (context.subject === 'conversation') {
				// Query the database and check if the client is part of a group and that
				// the group members are allowed to take part in the conversation
				const foundGroups = await groups.find([
					{
						field: 'participants',
						operator: 'includes',
						value: request.user.id,
					},
					{
						field: 'conversations',
						operator: 'includes',
						value: request.params.conversationId,
					},
				])

				// Within a group, it is possible to restrict the ability to take part
				// in a conversation to certain roles. Check if the user has the correct
				// role to take part in the conversation
				if (
					foundGroups.some((group) =>
						group.conversations[request.params.conversationId].includes(
							group.participants[request.user!.id],
						),
					)
				) {
					logger.info(
						'[authorization] user is authorized as they are in a group that is allowed to take the conversation',
					)

					next()
					return
				}

				// If the client matches none of the above roles, return a 403
				logger.info(
					'[authorization] user is unauthorized to access conversation data',
				)
				response.sendError('not-allowed')
				return
			}

			// In this context, the client is accessing data about a report
			if (context.subject === 'report') {
				// Query the database and check if the client is part of a group and that
				// the group members are allowed to view the report
				const query = [
					{
						field: `participants`,
						operator: 'includes',
						value: request.user.id,
					},
					{
						field: 'reports',
						operator: 'includes',
						value: request.params.reportId,
					},
				]

				// The user ID can only be found in the URL if the user is making a
				// render report request, and not when the user is fetching details
				// about the report
				if (request.params.userId)
					query.push({
						field: `participants`,
						operator: 'includes',
						value: request.params.userId,
					})

				const foundGroups = await groups.find(query as Array<Query<Group>>)

				// Within a group, it is possible to restrict the ability to view the
				// report to certain roles. Check if the user has the correct role to
				// view the report
				if (
					foundGroups.some((group) =>
						group.reports[request.params.reportId].includes(
							group.participants[request.user!.id],
						),
					)
				) {
					logger.info(
						'[authorization] user is authorized as they are a in a group that is allowed to view the report',
					)
					next()
					return
				}

				// If the client matches none of the above roles, return a 403
				logger.info(
					'[authorization] user is unauthorized to access report data',
				)
				response.sendError('not-allowed')
				return
			}

			// To be safe, if somehow none of the above conditions match, err on the
			// side of safety/caution and return a 403
			logger.warn('[authorization] user is unauthorized as no context matched')
			response.sendError('not-allowed')
		},
	)
