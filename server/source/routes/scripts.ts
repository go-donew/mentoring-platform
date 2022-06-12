// @/routes/scripts.ts
// Request handlers for script related endpoints.

import { Router as createRouter } from 'express'
import type { Request, Response } from 'express'

import { permit } from '@/middleware/authorization'
import { service as scripts } from '@/services/scripts'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * GET /scripts
 *
 * @summary List/find scripts
 * @tags scripts - Script related endpoints
 *
 * @security bearer
 *
 * @param {ListOrFindScriptsPayload} request.query - The query to run and find scripts.
 *
 * @returns {ListOrFindScriptsResponse} 200 - The scripts returned from the query. You must be Groot.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all scripts that have the tag `quiz`
 * {
 * 	"tags": ["quiz"]
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await scripts.find({
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
 * POST /scripts
 *
 * @summary Create a script
 * @tags scripts - Script related endpoints
 *
 * @security bearer
 *
 * @param {CreateScriptPayload} request.body - The necessary details to create a script.
 *
 * @returns {CreateScriptResponse} 201 - The created script. You must be Groot to create a script.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that creates a script
 * {
 * 	"name": "A Script",
 * 	"description": "The script generated once you have completed a conversation",
 * 	"tags": ["quiz"],
 * 	"input": [{
 * 		"id": "LZfXLFzPPR4NNrgjlWDxn",
 * 		"optional": false
 * 	}],
 * 	"computed": [{
 * 		"id": "LZfXLFzPPR4NNrgjlWDxn",
 * 		"optional": false
 * 	}],
 * 	"content": "<base64 encoded script>"
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await scripts.create({
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
 * GET /scripts/{scriptId}
 *
 * @summary Retrieve a requested script
 * @tags scripts - Script related endpoints
 *
 * @security bearer
 *
 * @param {string} scriptId.path.required - The ID of the script to return.
 *
 * @returns {RetrieveScriptResponse} 200 - The requested script. You must be Groot.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:scriptId',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await scripts.get({
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
 * PUT /scripts/{scriptId}
 *
 * @summary Update a certain script
 * @tags scripts - Script related endpoints
 *
 * @security bearer
 *
 * @param {string} scriptId.path.required - The ID of the script to update.
 * @param {UpdateScriptPayload} request.body.required - The new script.
 *
 * @returns {UpdateScriptResponse} 200 - The updated script. You must be Groot to update a script's details.
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
	'/:scriptId',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await scripts.update({
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
 * DELETE /scripts/{scriptId}
 *
 * @summary Delete a certain script
 * @tags scripts - Script related endpoints
 *
 * @security bearer
 *
 * @param {string} scriptId.path.required - The ID of the script to delete.
 *
 * @returns {object} 204 - You must be Groot to delete a script.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.delete(
	'/:scriptId',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await scripts.delete({
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
 * PUT /scripts/{scriptId}/run
 *
 * @summary Run a certain script
 * @tags scripts - Script related endpoints
 *
 * @security bearer
 *
 * @param {string} scriptId.path.required - The ID of the script to run.
 * @param {RunScriptPayload} request.body - The user ID for whom to run the script.
 *
 * @returns {RunScriptResponse} 204 - You must be Groot to run a script.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.put(
	'/:scriptId/run',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await scripts.run({
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

// Export the router
export { endpoint }
