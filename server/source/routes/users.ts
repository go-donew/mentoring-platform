// @/routes/users.ts
// Request handlers for user related endpoints.

import { Router as createRouter } from 'express'
import type { Request, Response } from 'express'

import { permit } from '@/middleware/authorization'
import { service as users } from '@/services/users'
import { service as attributes } from '@/services/users/attributes'
import { service as reports } from '@/services/users/reports'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * GET /users
 *
 * @summary List/find users
 * @tags users - User related endpoints
 *
 * @security bearer
 *
 * @param {ListOrFindUsersPayload} request.query - The query to run and find users.
 *
 * @returns {ListOrFindUsersResponse} 200 - The users returned from the query. You must be `groot` to perform this query.
 * @returns {ImproperPayloadError} 400 - The name, email, phone or timestamps passed were invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all users that signed in after midnight (IST) on 1st January, 1970.
 * {
 * 	"lastSignedInAfter": "19700101T000000+0530"
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await users.find({
			context: { user: request.user!, rate: request.rateLimit },
			data: {
				...request.body,
				...request.params,
				...(request.query.request as any),
			},
		})

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * GET /users/{userId}
 *
 * @summary Retrieve a requested user
 * @tags users - User related endpoints
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user to return.
 *
 * @returns {RetrieveUserResponse} 200 - The requested user. You must be the user themself, or their mentor/supermentor.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:userId',
	permit({
		subject: 'user',
		roles: ['self', 'mentor', 'supermentor'],
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await users.get({
			context: { user: request.user!, rate: request.rateLimit },
			data: {
				...request.body,
				...request.params,
				...(request.query.request as any),
			},
		})

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * DELETE /users/{userId}
 *
 * @summary Delete the specified user
 * @tags users - User related endpoints
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user to return.
 *
 * @returns {object} 204 - You must be the user themself, or Groot.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.delete(
	'/:userId',
	permit({
		subject: 'user',
		roles: ['self'],
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await users.delete({
			context: { user: request.user!, rate: request.rateLimit },
			data: {
				...request.body,
				...request.params,
				...(request.query.request as any),
			},
		})

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * GET /users/{userId}/attributes
 *
 * @summary List/find a user's attributes
 * @tags users - User related endpoints
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user whose attributes to list.
 * @param {ListOrFindUserAttributesPayload} request.query - The query to run and find attributes.
 *
 * @returns {ListOrFindUserAttributesResponse} 200 - The attributes returned from the query. If no parameters are passed, then it returns all the attributes the user is a part of.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all attributes that have the value `1`.
 * {
 * 	"value": 1
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/:userId/attributes',
	permit({
		subject: 'user',
		roles: ['self', 'mentor', 'supermentor'],
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await attributes.find({
			context: { user: request.user!, rate: request.rateLimit },
			data: {
				...request.body,
				...request.params,
				...(request.query.request as any),
			},
		})

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * POST /users/{userId}/attributes
 *
 * @summary Create an attribute for a user
 * @tags users - User related endpoints
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user whose attribute to create.
 * @param {CreateUserAttributePayload} request.body - The necessary details to create a attribute.
 *
 * @returns {CreateUserAttributeResponse} 201 - The created attribute.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that creates a attribute
 * {
 * 	"id": "LZfXLFzPPR4NNrgjlWDxn",
 * 	"value": 10
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/:userId/attributes',
	permit({
		subject: 'user',
		roles: ['self', 'mentor', 'supermentor'],
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await attributes.create({
			context: { user: request.user!, rate: request.rateLimit },
			data: {
				...request.body,
				...request.params,
				...(request.query.request as any),
			},
		})

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * GET /users/{userId}/attributes/{attributeId}
 *
 * @summary Retrieve an attribute for a certain user
 * @tags users - User related endpoints
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user whose attribute to return.
 * @param {string} attributeId.path.required - The ID of the attribute to return.
 *
 * @returns {RetrieveUserAttributeResponse} 200 - The requested attribute. You must be a part of the attribute.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:userId/attributes/:attributeId',
	permit({
		subject: 'user',
		roles: ['self', 'mentor', 'supermentor'],
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await attributes.get({
			context: { user: request.user!, rate: request.rateLimit },
			data: {
				...request.body,
				...request.params,
				...(request.query.request as any),
			},
		})

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * PUT /users/{userId}/attributes/{attributeId}
 *
 * @summary Update an attribute for a certain user
 * @tags users - User related endpoints
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user whose attribute to update.
 * @param {string} attributeId.path.required - The ID of the attribute to update.
 * @param {UpdateUserAttributePayload} request.body.required - The new attribute.
 *
 * @returns {UpdateUserAttributeResponse} 200 - The updated attribute. You must be a supermentor of the attribute to update its details.
 * @returns {ImproperPayloadError} 400 - The payload was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.put(
	'/:userId/attributes/:attributeId',
	permit({
		subject: 'user',
		roles: ['self', 'mentor', 'supermentor'],
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await attributes.update({
			context: { user: request.user!, rate: request.rateLimit },
			data: {
				...request.body,
				...request.params,
				...(request.query.request as any),
			},
		})

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * DELETE /users/{userId}/attributes/{attributeId}
 *
 * @summary Delete an attribute for a certain user
 * @tags users - User related endpoints
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user whose attribute to delete.
 * @param {string} attributeId.path.required - The ID of the attribute to delete.
 *
 * @returns {object} 204 - You must be Groot to delete a attribute.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.delete(
	'/:userId/attributes/:attributeId',
	permit({
		subject: 'user',
		roles: ['supermentor'],
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await attributes.delete({
			context: { user: request.user!, rate: request.rateLimit },
			data: {
				...request.body,
				...request.params,
				...(request.query.request as any),
			},
		})

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * GET /users/{userId}/reports/{reportId}
 *
 * @summary Render a report using the report template for a user
 * @tags users - User related endpoints
 *
 * @security bearer
 *
 * @param {string} userId.path.required - The ID of the user whose report to return.
 * @param {string} reportId.path.required - The ID of the report to return.
 *
 * @returns {string} 200 - The requested report, as HTML. You must be allowed to view the report to render it.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:userId/reports/:reportId',
	permit({
		subject: 'report',
		roles: 'dynamic',
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await reports.get({
			context: { user: request.user!, rate: request.rateLimit },
			data: {
				...request.body,
				...request.params,
				...(request.query.request as any),
			},
		})

		if (result.error) response.sendError(result.error)
		else
			response
				.status(result.status!)
				.header('content-type', 'text/html')
				.send(result.data)
	},
)

// Export the router
export { endpoint }
