// @/services/users/reports.ts
// Service that handles user report search, creation, modification, deletion operations.

import { Buffer } from 'node:buffer'

import { render } from 'ejs'

import type { ServiceRequest, ServiceResponse } from '@/types'

import { ServerError } from '@/errors'
import { Attribute } from '@/models/attribute'
import { provider as users } from '@/provider/data/users'
import { provider as attributes } from '@/provider/data/attributes'
import { provider as userAttributes } from '@/provider/data/users/attributes'
import { provider as reports } from '@/provider/data/reports'

/**
 * The HTML report rendered by the retrieve report endpoint.
 *
 * @typedef {string} RetrieveUserReportResponse
 */
export type RetrieveUserReportResponse = string

/**
 * Method to retrieve an report for a user.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the rendered report as HTML.
 */
const get = async (
	request: ServiceRequest<unknown, { userId: string; reportId: string }>,
): Promise<ServiceResponse<RetrieveUserReportResponse>> => {
	try {
		// Fetch the report to render
		const report = await reports.get(request.params.reportId)
		// Fetch the user's details
		const user = await users.get(request.params.userId)

		userAttributes.userId = request.params.userId

		// Go through the input attributes and check if they exist
		const input: Record<
			string,
			Attribute & { value: string | number | boolean }
		> = {}
		for (const { id, optional } of report.input) {
			try {
				const { value } = await userAttributes.get(id)
				const attribute = await attributes.get(id)
				input[id] = {
					...attribute,
					value,
				}
			} catch (error: unknown) {
				// If we can't find the attribute for the user, and it is a required attribute,
				// throw a Precondition Failed error.
				if ((error as ServerError).code === 'entity-not-found') {
					if (optional) continue
					else
						throw new ServerError(
							'precondition-failed',
							`Could not find the required attribute ${id} for the user.`,
						)
				}
			}
		}

		// Decode the script (it is stored in base64)
		report.template = Buffer.from(report.template, 'base64').toString('ascii')

		// Render the report HTML
		const html = render(report.template, {
			context: { input, user },
		})

		const data = html
		return {
			status: 200,
			data,
		}
	} catch (error: unknown) {
		console.trace(error)
		return {
			error:
				error instanceof ServerError ? error : new ServerError('server-crash'),
		}
	}
}

// Export the functions
export const service = {
	get,
}
