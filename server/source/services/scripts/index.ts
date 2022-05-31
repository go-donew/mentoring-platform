// @/services/scripts/index.ts
// Service that handles script search, creation, modification, deletion operations.

import { Buffer } from 'node:buffer'

import { ServerError } from '@/errors'
import { Script, DependentAttribute, ComputedAttribute } from '@/models/script'
import { UserAttribute } from '@/models/attribute'
import { provider as scripts } from '@/provider/data/scripts'
import { provider as users } from '@/provider/data/users'
import { provider as attributes } from '@/provider/data/users/attributes'
import { generateId } from '@/utilities'
import { runLua } from '@/utilities/lua'
import type { ServiceRequest, ServiceResponse, Query } from '@/types'

/**
 * The payload needed to make a request to list/find scripts.
 *
 * @typedef {object} ListOrFindScriptsPayload
 * @property {string} name - The script should have this name.
 * @property {array<string>} tags - The script should have these tags.
 * @property {array<string>} input - The script should be dependent on these attributes.
 * @property {array<string>} computed - The script should compute these attributes.
 */
export type ListOrFindScriptsPayload = {
	name?: string
	tags?: string[]
	input?: string[]
	computed?: string[]
}

/**
 * The response from the list/find scripts endpoint.
 *
 * @typedef {object} ListOrFindScriptsResponse
 * @property {array<Script>} scripts.required - The scripts returned from the query.
 */
export type ListOrFindScriptsResponse = {
	scripts: Script[]
}

/**
 * Method to list/find a script.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the scripts that match the query.
 */
const find = async (
	request: ServiceRequest<ListOrFindScriptsPayload, unknown>,
): Promise<ServiceResponse<ListOrFindScriptsResponse>> => {
	try {
		const query: Array<Query<Script>> = []
		for (const [field, value] of Object.entries(request.body)) {
			if (['input', 'computed', 'tags'].includes(field))
				for (const element of value as string[])
					query.push({ field, operator: 'includes', value: element })
			else query.push({ field, operator: '==', value })
		}

		const foundScripts = await scripts.find(query)

		const data = { scripts: foundScripts }
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
 * The payload needed to create a script.
 *
 * @typedef {object} CreateScriptPayload
 * @property {string} name.required - The script name.
 * @property {string} description.required - The script description.
 * @property {array<string>} tags.required - The list of tags to enhance searchability of the script.
 * @property {array<DependentAttribute>} input.required - The list of attributes required to run the script.
 * @property {array<ComputedAttribute>} computed.required - The list of attributes computed and set by this script.
 */
export type CreateScriptPayload = {
	name: string
	description: string
	tags: string[]
	input: DependentAttribute[]
	computed: ComputedAttribute[]
	content: string
}

/**
 * The response from the create script endpoint.
 *
 * @typedef {object} CreateScriptResponse
 * @property {Script} script.required - The created script.
 */
export type CreateScriptResponse = {
	script: Script
}

/**
 * Method to create a script.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the newly created script.
 */
const create = async (
	request: ServiceRequest<CreateScriptPayload, unknown>,
): Promise<ServiceResponse<CreateScriptResponse>> => {
	try {
		const script = await scripts.create({ ...request.body, id: generateId() })

		const data = { script }
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
 * The response from the retrieve script endpoint.
 *
 * @typedef {object} RetrieveScriptResponse
 * @property {Script} script.required - The requested script.
 */
export type RetrieveScriptResponse = {
	script: Script
}

/**
 * Method to retrieve a script.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the requested script.
 */
const get = async (
	request: ServiceRequest<unknown, { scriptId: string }>,
): Promise<ServiceResponse<RetrieveScriptResponse>> => {
	try {
		const script = await scripts.get(request.params.scriptId)

		const data = { script }
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
 * The payload needed to update a script.
 *
 * @typedef {object} UpdateScriptPayload
 * @property {string} name.required - The script name.
 * @property {string} description.required - The script description.
 * @property {array<string>} tags.required - The list of tags to enhance searchability of the script.
 * @property {array<DependentAttribute>} input.required - The list of attributes required to run the script.
 * @property {array<ComputedAttribute>} computed.required - The list of attributes computed and set by this script.
 */
export type UpdateScriptPayload = {
	name: string
	description: string
	tags: string[]
	input: DependentAttribute[]
	computed: ComputedAttribute[]
	content: string
}

/**
 * The response from the update script endpoint.
 *
 * @typedef {object} UpdateScriptResponse
 * @property {Script} script.required - The updated script.
 */
export type UpdateScriptResponse = {
	script: Script
}

/**
 * Method to update a script.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the updated script.
 */
const update = async (
	request: ServiceRequest<UpdateScriptPayload, { scriptId: string }>,
): Promise<ServiceResponse<UpdateScriptResponse>> => {
	try {
		const script = await scripts.update({
			...request.body,
			id: request.params.scriptId,
		})

		const data = { script }
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
 * Method to delete a script.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return nothing.
 */
const _delete = async (
	request: ServiceRequest<unknown, { scriptId: string }>,
): Promise<ServiceResponse<unknown>> => {
	try {
		await scripts.delete(request.params.scriptId)

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

/**
 * The payload needed to run a script for a certain user.
 *
 * @typedef {object} RunScriptPayload
 * @property {string} userId - The user to run the script for. Defaults to the current user.
 */
export type RunScriptPayload = {
	userId?: string
}

/**
 * The response from the run script endpoint.
 *
 * @typedef {object} RunScriptResponse
 * @property {array<UserAttribute>} attributes - The attributes computed by the script.
 */
export type RunScriptResponse = {
	attributes: UserAttribute[]
}

/**
 * Method to run a script for the specified user.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - If the script runs sucessfully, nothing will be returned.
 */
const run = async (
	request: ServiceRequest<RunScriptPayload, { scriptId: string }>,
): Promise<ServiceResponse<RunScriptResponse>> => {
	try {
		const script = await scripts.get(request.params.scriptId)
		// Get the current user so the script can access it, but do not let the
		// script get their access token
		const user = await users.get(request.body.userId ?? request.user!.id)
		// Decode the script (it is stored in base64)
		script.content = Buffer.from(script.content, 'base64').toString('ascii')

		attributes.userId = user.id

		// Retrieve all the attributes the script needs to run
		const input: Record<string, UserAttribute> = {}
		for (const { id, optional } of script.input) {
			try {
				input[id] = await attributes.get(id)
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

		const computedAttributes = []
		try {
			// TODO: This should be able to handle groups, reports, etc too.
			// Run the lua script
			let { attributes: computed } = await runLua(script.content, {
				input,
				user,
			})
			if (!computed) computed = {}

			// Store the computed attribute(s)
			for (const [id, snapshot] of Object.entries(computed)) {
				try {
					// Retrieve the attribute and update it if it exists
					const attribute = await attributes.get(id)
					attribute.value = snapshot.value
					attribute.history.push({
						value: snapshot.value,
						observer: 'bot',
						timestamp: new Date(),
						message: {
							in: 'script',
							id: script.id,
						},
					})
					await attributes.update(attribute)
					computedAttributes.push(attribute)
				} catch (error: unknown) {
					// If it does not exist, then create it
					if ((error as ServerError).code === 'entity-not-found') {
						const attribute = await attributes.create({
							id,
							value: snapshot.value,
							history: [
								{
									value: snapshot.value,
									observer: 'bot',
									timestamp: new Date(),
									message: {
										in: 'script',
										id: script.id,
									},
								},
							],
							_userId: user.id,
						})
						computedAttributes.push(attribute)
					} else {
						throw error
					}
				}
			}
		} catch (error: unknown) {
			console.trace(error)
			throw new ServerError('backend-error')
		}

		const data = { attributes: computedAttributes }
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

// Export the functions
export const service = {
	find,
	create,
	get,
	update,
	delete: _delete,
	run,
}
