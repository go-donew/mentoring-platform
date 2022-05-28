// @/routes/meta.ts
// Request handlers for the metadata endpoints.

import { Router as createRouter } from 'express'
import type { Request, Response } from 'express'

import { service as meta } from '@/services/meta'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * GET /meta
 *
 * @summary User metadata
 * @tags meta - Metadata endpoints
 *
 * @security bearer
 *
 * @returns {ListOrFindUsersResponse} 200 - The users returned from the query. You must be `groot` to perform this query.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/',
	// => permit('anyone'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await meta.get(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

// Export the router
export { endpoint }
