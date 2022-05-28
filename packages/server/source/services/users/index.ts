// @/services/users/index.ts
// Service that handles user search, creation, modification, deletion operations.

import type { ServiceRequest, ServiceResponse, Query } from '@/types'

import { ServerError } from '@/errors'
import { User } from '@/models/user'
import { service as authService } from '@/services/auth'
import { provider as auth } from '@/provider/auth'
import { provider as users } from '@/provider/data/users'

/**
 * The payload needed to make a request to list/find users.
 *
 * @typedef {object} ListOrFindUsersPayload
 * @property {string} name - The user should have this name.
 * @property {string} email - The user should have this email address. - email
 * @property {string} phone - The user should have this phone number.
 * @property {string} lastSignedInBefore - The user should have signed in before this time. - date
 * @property {string} lastSignedInAfter - The user should have signed in after this time. - date
 */
export type ListOrFindUsersPayload = {
	name?: string
	email?: string
	phone?: string
	lastSignedInBefore?: string
	lastSignedInAfter?: string
}

/**
 * The response from the list/find users endpoint.
 *
 * @typedef {object} ListOrFindUsersResponse
 * @property {array<User>} users.required - The users returned from the query.
 */
export type ListOrFindUsersResponse = {
	users: User[]
}

/**
 * Method to search for users that match the given query.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the list of users that match the query.
 */
const find = async (
	request: ServiceRequest<ListOrFindUsersPayload, unknown>,
): Promise<ServiceResponse<ListOrFindUsersResponse>> => {
	try {
		const query: Array<Query<User>> = []
		for (const [field, value] of Object.entries(request.body)) {
			if (field.endsWith('Before'))
				query.push({
					field: field.replace(/Before$/, ''),
					operator: '<',
					value,
				})
			else if (field.endsWith('After'))
				query.push({ field: field.replace(/After$/, ''), operator: '>', value })
			else query.push({ field, operator: '==', value })
		}

		const foundUsers = await users.find(query)

		const data = { users: foundUsers }
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
 * The response from the retrieve users endpoint.
 *
 * @typedef {object} RetrieveUserResponse
 * @property {User} user.required - The requested user.
 */
export type RetrieveUserResponse = {
	user: User
}

/**
 * Method to retrieve a certain user.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the user that matches the query.
 */
const get = async (
	request: ServiceRequest<unknown, { userId: string }>,
): Promise<ServiceResponse<RetrieveUserResponse>> => {
	try {
		const user = await users.get(request.params.userId)

		const data = { user }
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
 * The payload needed to create a user.
 *
 * @typedef {object} CreateUserPayload
 * @property {string} name.required - The user's name.
 * @property {string} email.required - The user's email address. - email
 * @property {string} password.required - The user's password. - password
 */
export type CreateUserPayload = {
	name: string
	email: string
	password: string
}

/**
 * The response from the create user endpoint.
 *
 * @typedef {object} CreateUserResponse
 * @property {User} user.required - The newly created user.
 */
export type CreateUserResponse = {
	user: User
}

/**
 * Method to create a new user.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the newly created user.
 */
const create = authService.signUp

/**
 * The payload needed to update a user.
 *
 * @typedef {object} UpdateUserPayload
 * @property {string} name.required - The user's name.
 */
export type UpdateUserPayload = {
	name: string
}

/**
 * The response from the create user endpoint.
 *
 * @typedef {object} UpdateUserResponse
 * @property {User} user.required - The updated user.
 */
export type UpdateUserResponse = {
	user: User
}

/**
 * Method to update a certain user.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the updated user.
 */
const update = async (
	request: ServiceRequest<UpdateUserPayload, { userId: string }>,
): Promise<ServiceResponse<UpdateUserResponse>> => {
	try {
		const user = await users.update({
			...request.body,
			id: request.params.userId,
		})

		const data = { user }
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

/**
 * Method to delete a certain user.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return nothing.
 */
const _delete = async (
	request: ServiceRequest<unknown, { userId: string }>,
): Promise<ServiceResponse<unknown>> => {
	try {
		await auth.deleteAccount(request.params.userId)
		await users.delete(request.params.userId)

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
	get,
	create,
	update,
	delete: _delete,
}
