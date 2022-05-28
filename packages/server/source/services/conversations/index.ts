// @/services/conversations/index.ts
// Service that handles conversation search, creation, modification, deletion operations.

import type { ServiceRequest, ServiceResponse, Query } from '@/types'

import { ServerError } from '@/errors'
import { Conversation } from '@/models/conversation'
import { provider as conversations } from '@/provider/data/conversations'
import { provider as questions } from '@/provider/data/conversations/questions'
import { generateId } from '@/utilities'

/**
 * The payload needed to make a request to list/find conversations.
 *
 * @typedef {object} ListOrFindConversationsPayload
 * @property {string} name - The conversation should have this name.
 * @property {string} description - The conversation should have this description.
 * @property {boolean} once - The conversation should be allowed to be taken only once.
 * @property {array<string>} tags - The conversation should have all these tags.
 */
export type ListOrFindConversationsPayload = {
	name?: string
	description?: string
	once?: boolean
	tags?: string[]
}

/**
 * The response from the list/find conversations endpoint.
 *
 * @typedef {object} ListOrFindConversationsResponse
 * @property {array<Conversation>} conversations.required - The conversations returned from the query.
 */
export type ListOrFindConversationsResponse = {
	conversations: Conversation[]
}

/**
 * Method to list/find a conversation.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the conversations that match the query.
 */
const find = async (
	request: ServiceRequest<ListOrFindConversationsPayload, unknown>,
): Promise<ServiceResponse<ListOrFindConversationsResponse>> => {
	try {
		const query: Array<Query<Conversation>> = []
		for (const [field, value] of Object.entries(request.body)) {
			if (['tags'].includes(field))
				for (const element of value as string[])
					query.push({ field, operator: 'includes', value: element })
			else query.push({ field, operator: '==', value })
		}

		const foundConversations = await conversations.find(query)

		const data = { conversations: foundConversations }
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
 * The payload needed to create a conversation.
 *
 * @typedef {object} CreateConversationPayload
 * @property {string} name.required - The name of the conversation.
 * @property {string} description.required - The description of the conversation.
 * @property {boolean} once.required - Whether the conversation should be taken only once.
 * @property {array<string>} tags.required - The tags of the conversation.
 */
export type CreateConversationPayload = {
	name: string
	description: string
	once: boolean
	tags: string[]
}

/**
 * The response from the create conversation endpoint.
 *
 * @typedef {object} CreateConversationResponse
 * @property {Conversation} conversation.required - The created conversation.
 */
export type CreateConversationResponse = {
	conversation: Conversation
}

/**
 * Method to create a conversation.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the newly created conversation.
 */
const create = async (
	request: ServiceRequest<CreateConversationPayload, unknown>,
): Promise<ServiceResponse<CreateConversationResponse>> => {
	try {
		const conversation = await conversations.create({
			...request.body,
			id: generateId(),
		})

		const data = { conversation }
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
 * The response from the retrieve conversation endpoint.
 *
 * @typedef {object} RetrieveConversationResponse
 * @property {Conversation} conversation.required - The requested conversation.
 */
export type RetrieveConversationResponse = {
	conversation: Conversation
}

/**
 * Method to retrieve a conversation.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the requested conversation.
 */
const get = async (
	request: ServiceRequest<unknown, { conversationId: string }>,
): Promise<ServiceResponse<RetrieveConversationResponse>> => {
	try {
		const conversation = await conversations.get(request.params.conversationId)

		const data = { conversation }
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
 * The payload needed to update a conversation.
 *
 * @typedef {object} UpdateConversationPayload
 * @property {string} name.required - The name of the conversation.
 * @property {string} description.required - The description of the conversation.
 * @property {boolean} once.required - Whether the conversation should be taken only once.
 * @property {array<string>} tags.required - The tags of the conversation.
 */
export type UpdateConversationPayload = {
	name: string
	description: string
	once: boolean
	tags: string[]
}

/**
 * The response from the update conversation endpoint.
 *
 * @typedef {object} UpdateConversationResponse
 * @property {Conversation} conversation.required - The updated conversation.
 */
export type UpdateConversationResponse = {
	conversation: Conversation
}

/**
 * Method to update a conversation.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the updated conversation.
 */
const update = async (
	request: ServiceRequest<
		UpdateConversationPayload,
		{ conversationId: string }
	>,
): Promise<ServiceResponse<UpdateConversationResponse>> => {
	try {
		const conversation = await conversations.update({
			...request.body,
			id: request.params.conversationId,
		})

		const data = { conversation }
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
 * Method to delete a conversation.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return nothing.
 */
const _delete = async (
	request: ServiceRequest<unknown, { conversationId: string }>,
): Promise<ServiceResponse<unknown>> => {
	try {
		await conversations.delete(request.params.conversationId)

		questions.conversationId = request.params.conversationId
		const questionsToDelete = await questions.find([])
		for (const question of questionsToDelete) {
			await questions.delete(question.id)
		}

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
