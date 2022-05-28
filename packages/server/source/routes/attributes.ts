// @/routes/attributes.ts
// Request handlers for attribute related endpoints.

import { Router as createRouter } from 'express'
import type { Request, Response } from 'express'

import { permit } from '@/middleware/authorization'
import { service as attributes } from '@/services/attributes'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * GET /attributes
 *
 * @summary List/find attributes
 * @tags attributes - Attribute related endpoints
 *
 * @security bearer
 *
 * @param {ListOrFindAttributesPayload} request.body - The query to run and find attributes.
 *
 * @returns {ListOrFindAttributesResponse} 200 - The attributes returned from the query. If no parameters are passed, then it returns all the attributes.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all attributes that have the `computed` tag
 * {
 * 	"tags": ["computed"]
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/',
	// => permit('anyone'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await attributes.find(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * POST /attributes
 *
 * @summary Create an attribute
 * @tags attributes - Attribute related endpoints
 *
 * @security bearer
 *
 * @param {CreateAttributePayload} request.body - The necessary details to create an attribute.
 *
 * @returns {CreateAttributeResponse} 201 - The created attribute. You must be Groot to create an attribute.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that creates an attribute
 * {
 * 	"name": "An Attribute",
 * 	"description": "An attribute that tells us something about the person",
 * 	"tags": ["quiz"],
 * 	"conversations": ["LZfXLFzPPR4NNrgjlWDxn"]
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await attributes.create(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * GET /attributes/{attributeId}
 *
 * @summary Retrieve a requested attribute
 * @tags attributes - Attribute related endpoints
 *
 * @security bearer
 *
 * @param {string} attributeId.path.required - The ID of the attribute to return.
 *
 * @returns {RetrieveAttributeResponse} 200 - The requested attribute. You must be a part of the attribute.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:attributeId',
	// => permit('anyone'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await attributes.get(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * PUT /attributes/{attributeId}
 *
 * @summary Update a certain attribute
 * @tags attributes - Attribute related endpoints
 *
 * @security bearer
 *
 * @param {string} attributeId.path.required - The ID of the attribute to update.
 * @param {UpdateAttributePayload} request.body.required - The new attribute.
 *
 * @returns {UpdateAttributeResponse} 200 - The updated attribute. You must be Groot to update its details.
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
	'/:attributeId',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await attributes.update(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * DELETE /attributes/{attributeId}
 *
 * @summary Delete a certain attribute
 * @tags attributes - Attribute related endpoints
 *
 * @security bearer
 *
 * @param {string} attributeId.path.required - The ID of the attribute to delete.
 *
 * @returns {object} 204 - You must be Groot to delete an attribute.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.delete(
	'/:attributeId',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await attributes.delete(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

// Export the router
export { endpoint }
