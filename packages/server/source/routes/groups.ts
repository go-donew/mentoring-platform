// @/routes/groups.ts
// Request handlers for group related endpoints.

import { Router as createRouter } from 'express'
import type { Request, Response } from 'express'

import { permit } from '@/middleware/authorization'
import { service as groups } from '@/services/groups'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * GET /groups
 *
 * @summary List/find groups
 * @tags groups - Group related endpoints
 *
 * @security bearer
 *
 * @param {ListOrFindGroupsPayload} request.body - The query to run and find groups.
 *
 * @returns {ListOrFindGroupsResponse} 200 - The groups returned from the query. If no parameters are passed, then it returns all the groups the user is a part of.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all groups that have the user ID `LZfXLFzPPR4NNrgjlWDxn`
 * {
 * 	"participants": ["LZfXLFzPPR4NNrgjlWDxn"]
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/',
	// => permit('anyone'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await groups.find(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * POST /groups
 *
 * @summary Create a group
 * @tags groups - Group related endpoints
 *
 * @security bearer
 *
 * @param {CreateGroupPayload} request.body - The necessary details to create a group.
 *
 * @returns {CreateGroupResponse} 201 - The created group. You must be Groot to create a group.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that creates a group
 * {
 * 	"name": "A Group",
 * 	"participants": {
 * 		"LZfXLFzPPR4NNrgjlWDxn"	: "mentee"
 * 	},
 * 	"conversations": {
 * 		"quiz": ["mentee"]
 * 	},
 * 	"reports": {
 * 		"quiz-score": ["mentor"]
 * 	},
 * 	"code": "join-using-this-code",
 * 	"tags": ["quiz"]
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await groups.create(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * PUT /groups/join
 *
 * @summary Join a certain group
 * @tags groups - Group related endpoints
 *
 * @security bearer
 *
 * @param {JoinGroupPayload} request.body.required - The details required for joining a group.
 *
 * @returns {JoinGroupResponse} 200 - The group the user was added to.
 * @returns {ImproperPayloadError} 400 - The payload was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {EntityNotFoundError} 404 - There was no group that can be joined using the passed code.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.put(
	'/join',
	// => permit('anyone'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await groups.join(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * GET /groups/{groupId}
 *
 * @summary Retrieve a requested group
 * @tags groups - Group related endpoints
 *
 * @security bearer
 *
 * @param {string} groupId.path.required - The ID of the group to return.
 *
 * @returns {RetrieveGroupResponse} 200 - The requested group. You must be a part of the group.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:groupId',
	permit({
		subject: 'group',
		roles: ['participant'],
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await groups.get(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * PUT /groups/{groupId}
 *
 * @summary Update a certain group
 * @tags groups - Group related endpoints
 *
 * @security bearer
 *
 * @param {string} groupId.path.required - The ID of the group to update.
 * @param {UpdateGroupPayload} request.body.required - The new group.
 *
 * @returns {UpdateGroupResponse} 200 - The updated group. You must be a supermentor of the group to update its details.
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
	'/:groupId',
	permit({
		subject: 'group',
		roles: ['supermentor'],
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await groups.update(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * DELETE /groups/{groupId}
 *
 * @summary Delete a certain group
 * @tags groups - Group related endpoints
 *
 * @security bearer
 *
 * @param {string} groupId.path.required - The ID of the group to delete.
 *
 * @returns {object} 204 - You must be Groot to delete a group.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.delete(
	'/:groupId',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await groups.delete(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

// Export the router
export { endpoint }
