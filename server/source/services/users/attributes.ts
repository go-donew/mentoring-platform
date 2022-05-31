// @/services/users/attributes.ts
// Service that handles user attribute search, creation, modification, deletion operations.

import type { ServiceRequest, ServiceResponse } from '@/types'

import { ServerError } from '@/errors'
import { UserAttribute, SnapshotBlame } from '@/models/attribute'
import { provider as attributes } from '@/provider/data/users/attributes'

/**
 * The payload needed to make a request to list/find a user's attributes.
 *
 * @typedef {object} ListOrFindUserAttributesPayload
 * @property {string | number | boolean} value - The attribute should have the given value.
 */
export type ListOrFindUserAttributesPayload = {
	value?: string | number | boolean
}

/**
 * The response from the list/find user attributes endpoint.
 *
 * @typedef {object} ListOrFindUserAttributesResponse
 * @property {array<UserAttribute>} attributes.required - The attributes returned from the query.
 */
export type ListOrFindUserAttributesResponse = {
	attributes: UserAttribute[]
}

/**
 * Method to list/find a user's attributes.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the attributes that match the query.
 */
const find = async (
	request: ServiceRequest<ListOrFindUserAttributesPayload, { userId: string }>,
): Promise<ServiceResponse<ListOrFindUserAttributesResponse>> => {
	try {
		attributes.userId = request.params.userId
		const foundUserAttributes = await attributes.find(
			request.body.value
				? [
						{
							field: 'value',
							operator: '==',
							value: request.body.value,
						},
				  ]
				: [],
		)

		const data = { attributes: foundUserAttributes }
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
 * @typedef {object} CreateUserAttributePayload
 * @property {string} id.required - The ID of the attribute (from the global attribute list).
 * @property {string | number | boolean} value.required - The value to set for the attribute.
 * @property {SnapshotBlame} message - The message/question, answering which, this attribute was observed.
 */
export type CreateUserAttributePayload = {
	id: string
	value: string | number | boolean
	message: SnapshotBlame
}

/**
 * The response from the create attribute endpoint.
 *
 * @typedef {object} CreateUserAttributeResponse
 * @property {UserAttribute} attribute.required - The created attribute.
 */
export type CreateUserAttributeResponse = {
	attribute: UserAttribute
}

/**
 * Method to create an attribute for a user.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the newly created attribute.
 */
const create = async (
	request: ServiceRequest<CreateUserAttributePayload, { userId: string }>,
): Promise<ServiceResponse<CreateUserAttributeResponse>> => {
	try {
		attributes.userId = request.params.userId
		const attribute = await attributes.create(
			new UserAttribute(
				request.body.id,
				request.body.value,
				[
					{
						value: request.body.value,
						observer: request.user!.id,
						timestamp: new Date(),
						message: request.body.message ?? null, // Firebase doesn't like `undefined`
					},
				],
				request.params.userId,
			),
		)

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
 * @typedef {object} RetrieveUserAttributeResponse
 * @property {UserAttribute} attribute.required - The requested attribute.
 */
export type RetrieveUserAttributeResponse = {
	attribute: UserAttribute
}

/**
 * Method to retrieve an attribute for a user.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the requested attribute.
 */
const get = async (
	request: ServiceRequest<unknown, { userId: string; attributeId: string }>,
): Promise<ServiceResponse<RetrieveUserAttributeResponse>> => {
	try {
		attributes.userId = request.params.userId
		const attribute = await attributes.get(request.params.attributeId)

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
 * @typedef {object} UpdateUserAttributePayload
 * @property {string | number | boolean} value.required - The value to set for the attribute.
 * @property {SnapshotBlame} message - The message/question, answering which, this attribute was observed.
 */
export type UpdateUserAttributePayload = {
	value: string | number | boolean
	message: SnapshotBlame
}

/**
 * The response from the update attribute endpoint.
 *
 * @typedef {object} UpdateUserAttributeResponse
 * @property {UserAttribute} attribute.required - The updated attribute.
 */
export type UpdateUserAttributeResponse = {
	attribute: UserAttribute
}

/**
 * Method to update an attribute for a user.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the updated attribute.
 */
const update = async (
	request: ServiceRequest<
		UpdateUserAttributePayload,
		{ userId: string; attributeId: string }
	>,
): Promise<ServiceResponse<UpdateUserAttributeResponse>> => {
	try {
		attributes.userId = request.params.userId
		const attribute = await attributes.get(request.params.attributeId)

		attribute.value = request.body.value
		attribute.history.push({
			value: request.body.value,
			observer: request.user!.id,
			timestamp: new Date(),
			message: request.body.message ?? null, // Firebase doesn't like `undefined`
		})
		await attributes.update(attribute)

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
 * Method to delete an attribute for a user.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return nothing.
 */
const _delete = async (
	request: ServiceRequest<unknown, { userId: string; attributeId: string }>,
): Promise<ServiceResponse<unknown>> => {
	try {
		attributes.userId = request.params.userId
		await attributes.delete(request.params.attributeId)

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
