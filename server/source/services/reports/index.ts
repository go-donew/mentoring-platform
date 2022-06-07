// @/services/reports/index.ts
// Service that handles report search, creation, modification, deletion operations.

import type { ServiceRequest, ServiceResponse, Query } from '@/types'

import { ServerError } from '@/errors'
import { Report, DependentAttribute } from '@/models/report'
import { provider as reports } from '@/provider/data/reports'
import { generateId } from '@/utilities'

/**
 * The payload needed to make a request to list/find reports.
 *
 * @typedef {object} ListOrFindReportsPayload
 * @property {string} name.required - The report should have this name.
 * @property {array<string>} tags.required - The report should have all of the given tags.
 * @property {array<string>} input.required - The report should require these attributes.
 */
export type ListOrFindReportsPayload = {
	name?: string
	tags?: string[]
	input?: DependentAttribute[]
}

/**
 * The response from the list/find reports endpoint.
 *
 * @typedef {object} ListOrFindReportsResponse
 * @property {array<Report>} reports.required - The reports returned from the query.
 */
export type ListOrFindReportsResponse = {
	reports: Report[]
}

/**
 * Method to list/find a report.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the reports that match the query.
 */
const find = async (
	request: ServiceRequest<ListOrFindReportsPayload>,
): Promise<ServiceResponse<ListOrFindReportsResponse>> => {
	try {
		const query: Array<Query<Report>> = []
		for (const [field, value] of Object.entries(request.data)) {
			if (['input', 'tags'].includes(field))
				for (const element of value as string[])
					query.push({ field, operator: 'includes', value: element })
			else query.push({ field, operator: '==', value })
		}

		const foundReports = await reports.find(query)

		const data = { reports: foundReports }
		return {
			status: 200,
			data,
		}
	} catch (error: unknown) {
		return {
			error:
				error instanceof ServerError ? error : new ServerError('server-crash'),
		}
	}
}

/**
 * The payload needed to create a report.
 *
 * @typedef {object} CreateReportPayload
 * @property {string} name.required - The report name.
 * @property {string} description.required - The report description.
 * @property {array<string>} tags.required - The list of tags to enhance searchability of the report.
 * @property {string} template.required - The EJS template used to generate the report.
 * @property {array<DependentAttribute>} input.required - The list of attribute IDs required to generate the report.
 */
export type CreateReportPayload = {
	name: string
	description: string
	tags: string[]
	template: string
	input: DependentAttribute[]
}

/**
 * The response from the create report endpoint.
 *
 * @typedef {object} CreateReportResponse
 * @property {Report} report.required - The created report.
 */
export type CreateReportResponse = {
	report: Report
}

/**
 * Method to create a report.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the newly created report.
 */
const create = async (
	request: ServiceRequest<CreateReportPayload>,
): Promise<ServiceResponse<CreateReportResponse>> => {
	try {
		const report = await reports.create({ ...request.data, id: generateId() })

		const data = { report }
		return {
			status: 201,
			data,
		}
	} catch (error: unknown) {
		return {
			error:
				error instanceof ServerError ? error : new ServerError('server-crash'),
		}
	}
}

/**
 * The response from the retrieve report endpoint.
 *
 * @typedef {object} RetrieveReportResponse
 * @property {Report} report.required - The requested report.
 */
export type RetrieveReportResponse = {
	report: Report
}

/**
 * Method to retrieve a report.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the requested report.
 */
const get = async (
	request: ServiceRequest<{ reportId: string }>,
): Promise<ServiceResponse<RetrieveReportResponse>> => {
	try {
		const report = await reports.get(request.data.reportId)

		const data = { report }
		return {
			status: 200,
			data,
		}
	} catch (error: unknown) {
		return {
			error:
				error instanceof ServerError ? error : new ServerError('server-crash'),
		}
	}
}

/**
 * The payload needed to update a report.
 *
 * @typedef {object} UpdateReportPayload
 * @property {string} name.required - The report name.
 * @property {string} description.required - The report description.
 * @property {array<string>} tags.required - The list of tags to enhance searchability of the report.
 * @property {string} template.required - The EJS template used to generate the report.
 * @property {array<DependentAttribute>} input.required - The list of attribute IDs required to generate the report.
 */
export type UpdateReportPayload = {
	name: string
	description: string
	tags: string[]
	template: string
	input: DependentAttribute[]
}

/**
 * The response from the update report endpoint.
 *
 * @typedef {object} UpdateReportResponse
 * @property {Report} report.required - The updated report.
 */
export type UpdateReportResponse = {
	report: Report
}

/**
 * Method to update a report.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the updated report.
 */
const update = async (
	request: ServiceRequest<UpdateReportPayload & { reportId: string }>,
): Promise<ServiceResponse<UpdateReportResponse>> => {
	try {
		const report = await reports.update({
			...request.data,
			id: request.data.reportId,
		})

		const data = { report }
		return {
			status: 200,
			data,
		}
	} catch (error: unknown) {
		return {
			error:
				error instanceof ServerError ? error : new ServerError('server-crash'),
		}
	}
}

/**
 * Method to delete a report.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return nothing.
 */
const _delete = async (
	request: ServiceRequest<{ reportId: string }>,
): Promise<ServiceResponse<unknown>> => {
	try {
		await reports.delete(request.data.reportId)

		const data = {}
		return {
			status: 204,
			data,
		}
	} catch (error: unknown) {
		return {
			error:
				error instanceof ServerError ? error : new ServerError('server-crash'),
		}
	}
}

// Export the functions
export const service = {
	find,
	create,
	get,
	update,
	delete: _delete,
}
