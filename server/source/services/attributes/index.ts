// @/services/attributes/index.ts
// Service that handles attribute search, creation, modification, deletion operations.

import type { ServiceRequest, ServiceResponse, Query } from '@/types'

import { ServerError } from '@/errors'
import { Attribute } from '@/models/attribute'
import { provider as attributes } from '@/provider/data/attributes'
import { generateId } from '@/utilities'

/**
 * The payload needed to make a request to list/find attributes.
 *
 * @typedef {object} ListOrFindAttributesPayload
 * @property {string} name - The attribute should have this name.
 * @property {array<string>} conversations - The attribute should be set by the given conversations.
 * @property {array<string>} tags - The attribute should have the given tags.
 */
export type ListOrFindAttributesPayload = {
	name?: string
	conversations?: string[]
	tags?: string[]
}

/**
 * The response from the list/find attributes endpoint.
 *
 * @typedef {object} ListOrFindAttributesResponse
 * @property {array<Attribute>} attributes.required - The attributes returned from the query.
 */
export type ListOrFindAttributesResponse = {
	attributes: Attribute[]
}

/**
 * Method to list/find a attribute.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the attributes that match the query.
 */
const find = async (
	request: ServiceRequest<ListOrFindAttributesPayload>,
): Promise<ServiceResponse<ListOrFindAttributesResponse>> => {
	try {
		const query: Array<Query<Attribute>> = []
		for (const [field, value] of Object.entries(request.data)) {
			if (['conversations', 'tags'].includes(field))
				for (const element of value as string[])
					query.push({ field, operator: 'includes', value: element })
			else query.push({ field, operator: '==', value })
		}

		const foundAttributes = await attributes.find(query)

		const data = { attributes: foundAttributes }
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
 * The payload needed to create a attribute.
 *
 * @typedef {object} CreateAttributePayload
 * @property {string} name.required - The attribute name.
 * @property {string} description.required - The attribute description.
 * @property {array<string>} conversations.required - The attribute should be set by these conversations.
 * @property {array<string>} tags.required - Tags to enhance the searchability of the attribute.
 */
export type CreateAttributePayload = {
	name: string
	description: string
	conversations: string[]
	tags: string[]
}

/**
 * The response from the create attribute endpoint.
 *
 * @typedef {object} CreateAttributeResponse
 * @property {Attribute} attribute.required - The created attribute.
 */
export type CreateAttributeResponse = {
	attribute: Attribute
}

/**
 * Method to create a attribute.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the newly created attribute.
 */
const create = async (
	request: ServiceRequest<CreateAttributePayload>,
): Promise<ServiceResponse<CreateAttributeResponse>> => {
	try {
		const attribute = await attributes.create({
			...request.data,
			id: generateId(),
		})

		const data = { attribute }
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
 * The response from the retrieve attribute endpoint.
 *
 * @typedef {object} RetrieveAttributeResponse
 * @property {Attribute} attribute.required - The requested attribute.
 */
export type RetrieveAttributeResponse = {
	attribute: Attribute
}

/**
 * Method to retrieve a attribute.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the requested attribute.
 */
const get = async (
	request: ServiceRequest<{ attributeId: string }>,
): Promise<ServiceResponse<RetrieveAttributeResponse>> => {
	try {
		const attribute = await attributes.get(request.data.attributeId)

		const data = { attribute }
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
 * The payload needed to update a attribute.
 *
 * @typedef {object} UpdateAttributePayload
 * @property {string} name.required - The attribute name.
 * @property {string} description.required - The attribute description.
 * @property {array<string>} conversations.required - The attribute should be set by these conversations.
 * @property {array<string>} tags.required - Tags to enhance the searchability of the attribute.
 */
export type UpdateAttributePayload = {
	name: string
	description: string
	conversations: string[]
	tags: string[]
}

/**
 * The response from the update attribute endpoint.
 *
 * @typedef {object} UpdateAttributeResponse
 * @property {Attribute} attribute.required - The updated attribute.
 */
export type UpdateAttributeResponse = {
	attribute: Attribute
}

/**
 * Method to update a attribute.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the updated attribute.
 */
const update = async (
	request: ServiceRequest<UpdateAttributePayload & { attributeId: string }>,
): Promise<ServiceResponse<UpdateAttributeResponse>> => {
	try {
		const attribute = await attributes.update({
			...request.data,
			id: request.data.attributeId,
		})

		const data = { attribute }
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
 * Method to delete a attribute.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return nothing.
 */
const _delete = async (
	request: ServiceRequest<{ attributeId: string }>,
): Promise<ServiceResponse<unknown>> => {
	try {
		await attributes.delete(request.data.attributeId)

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
