// @/routes/reports.ts
// Request handlers for report related endpoints.

import { Router as createRouter } from 'express'
import type { Request, Response } from 'express'

import { permit } from '@/middleware/authorization'
import { service as reports } from '@/services/reports'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * GET /reports
 *
 * @summary List/find reports
 * @tags reports - Report related endpoints
 *
 * @security bearer
 *
 * @param {ListOrFindReportsPayload} request.body - The query to run and find reports.
 *
 * @returns {ListOrFindReportsResponse} 200 - The reports returned from the query. If no parameters are passed, then it returns all the reports the user is a part of.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all reports that have the tag `quiz`
 * {
 * 	"tags": ["quiz"]
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/',
	permit({
		subject: 'report',
		roles: 'dynamic',
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await reports.find(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * POST /reports
 *
 * @summary Create a report
 * @tags reports - Report related endpoints
 *
 * @security bearer
 *
 * @param {CreateReportPayload} request.body - The necessary details to create a report.
 *
 * @returns {CreateReportResponse} 201 - The created report. You must be Groot to create a report.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that creates a report
 * {
 * 	"name": "A Report",
 * 	"description": "The report generated once you have completed a conversation",
 * 	"tags": ["quiz"],
 * 	"template": "<div align='center'> Your score on the quiz is <%= input.attribute.LZfXLFzPPR4NNrgjlWDxn.value %></div>",
 * 	"input": [{
 * 		"id": "LZfXLFzPPR4NNrgjlWDxn",
 * 		"optional": false
 * 	}]
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await reports.create(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * GET /reports/{reportId}
 *
 * @summary Retrieve a requested report
 * @tags reports - Report related endpoints
 *
 * @security bearer
 *
 * @param {string} reportId.path.required - The ID of the report to return.
 *
 * @returns {RetrieveReportResponse} 200 - The requested report. You must be a part of the report.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:reportId',
	permit({
		subject: 'report',
		roles: 'dynamic',
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await reports.get(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * PUT /reports/{reportId}
 *
 * @summary Update a certain report
 * @tags reports - Report related endpoints
 *
 * @security bearer
 *
 * @param {string} reportId.path.required - The ID of the report to update.
 * @param {UpdateReportPayload} request.body.required - The new report.
 *
 * @returns {UpdateReportResponse} 200 - The updated report. You must be a supermentor of the report to update its details.
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
	'/:reportId',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await reports.update(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * DELETE /reports/{reportId}
 *
 * @summary Delete a certain report
 * @tags reports - Report related endpoints
 *
 * @security bearer
 *
 * @param {string} reportId.path.required - The ID of the report to delete.
 *
 * @returns {object} 204 - You must be Groot to delete a report.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.delete(
	'/:reportId',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await reports.delete(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

// Export the router
export { endpoint }
