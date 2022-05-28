// @/services/groups/index.ts
// Service that handles group search, creation, modification, deletion operations.

import type { ServiceRequest, ServiceResponse, Query } from '@/types'

import { ServerError } from '@/errors'
import {
	Group,
	ParticipantList,
	ConversationList,
	ReportList,
} from '@/models/group'
import { provider as groups } from '@/provider/data/groups'
import { generateId } from '@/utilities'

/**
 * The payload needed to make a request to list/find groups.
 *
 * @typedef {object} ListOrFindGroupsPayload
 * @property {string} name - The group should have this name.
 * @property {array<string>} participants - The group should have the given participants.
 * @property {array<string>} conversations - The group should be allowed to take part in the given conversations.
 * @property {array<string>} reports - The group should be allowed to view the given reports.
 * @property {string} code - The group should have this code.
 * @property {array<string>} tags - The group should have the given tags.
 */
export type ListOrFindGroupsPayload = {
	name?: string
	participants?: string[]
	conversations?: string[]
	reports?: string[]
	code?: string
	tags?: string[]
}

/**
 * The response from the list/find groups endpoint.
 *
 * @typedef {object} ListOrFindGroupsResponse
 * @property {array<Group>} groups.required - The groups returned from the query.
 */
export type ListOrFindGroupsResponse = {
	groups: Group[]
}

/**
 * Method to list/find a group.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the groups that match the query.
 */
const find = async (
	request: ServiceRequest<ListOrFindGroupsPayload, unknown>,
): Promise<ServiceResponse<ListOrFindGroupsResponse>> => {
	try {
		const query: Array<Query<Group>> = []
		for (const [field, value] of Object.entries(request.body)) {
			if (['participants', 'conversations', 'reports', 'tags'].includes(field))
				for (const element of value as string[])
					query.push({ field, operator: 'includes', value: element })
			else query.push({ field, operator: '==', value })
		}

		if (!request.user?.isGroot)
			query.push({
				field: 'participants',
				operator: 'includes',
				value: request.user!.id,
			})

		const foundGroups = await groups.find(query)

		const data = { groups: foundGroups }
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
 * The payload needed to create a group.
 *
 * @typedef {object} CreateGroupPayload
 * @property {string} name.required - The group group name.
 * @property {ParticipantList} participants.required - The group should have the given participants.
 * @property {ConversationList} conversations.required - The group should be allowed to take part in the given conversations.
 * @property {ReportList} reports.required - The group should be allowed to view the given reports.
 * @property {string} code.required - The group should have this code.
 * @property {array<string>} tags.required - The group should have this tags.
 */
export type CreateGroupPayload = {
	name: string
	participants: ParticipantList
	conversations: ConversationList
	reports: ReportList
	code: string
	tags: string[]
}

/**
 * The response from the create group endpoint.
 *
 * @typedef {object} CreateGroupResponse
 * @property {Group} group.required - The created group.
 */
export type CreateGroupResponse = {
	group: Group
}

/**
 * Method to create a group.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the newly created group.
 */
const create = async (
	request: ServiceRequest<CreateGroupPayload, unknown>,
): Promise<ServiceResponse<CreateGroupResponse>> => {
	try {
		const group = await groups.create({ ...request.body, id: generateId() })

		const data = { group }
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
 * The response from the retrieve group endpoint.
 *
 * @typedef {object} RetrieveGroupResponse
 * @property {Group} group.required - The requested group.
 */
export type RetrieveGroupResponse = {
	group: Group
}

/**
 * Method to retrieve a group.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the requested group.
 */
const get = async (
	request: ServiceRequest<unknown, { groupId: string }>,
): Promise<ServiceResponse<RetrieveGroupResponse>> => {
	try {
		const group = await groups.get(request.params.groupId)

		const data = { group }
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
 * The payload needed to update a group.
 *
 * @typedef {object} UpdateGroupPayload
 * @property {string} name.required - The group group name.
 * @property {ParticipantList} participants.required - The group should have the given participants.
 * @property {ConversationList} conversations.required - The group should be allowed to take part in the given conversations.
 * @property {ReportList} reports.required - The group should be allowed to view the given reports.
 * @property {string} code.required - The group should have this code.
 * @property {array<string>} tags.required - The group should have this tags.
 */
export type UpdateGroupPayload = {
	name: string
	participants: ParticipantList
	conversations: ConversationList
	reports: ReportList
	code: string
	tags: string[]
}

/**
 * The response from the update group endpoint.
 *
 * @typedef {object} UpdateGroupResponse
 * @property {Group} group.required - The updated group.
 */
export type UpdateGroupResponse = {
	group: Group
}

/**
 * Method to update a group.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the updated group.
 */
const update = async (
	request: ServiceRequest<UpdateGroupPayload, { groupId: string }>,
): Promise<ServiceResponse<UpdateGroupResponse>> => {
	try {
		const group = await groups.update({
			...request.body,
			id: request.params.groupId,
		})

		const data = { group }
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
 * Method to delete a group.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return nothing.
 */
const _delete = async (
	request: ServiceRequest<unknown, { groupId: string }>,
): Promise<ServiceResponse<unknown>> => {
	try {
		await groups.delete(request.params.groupId)

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
 * The payload needed to join a group.
 *
 * @typedef {object} JoinGroupPayload
 * @property {string} code.required - The code to be used to join the group.
 */
export type JoinGroupPayload = {
	code: string
}

/**
 * The response from the join group endpoint.
 *
 * @typedef {object} JoinGroupResponse
 * @property {Group} group.required - The group the user was added to.
 */
export type JoinGroupResponse = {
	group: Group
}

/**
 * Method to add a user to a group.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the group the user was added to.
 */
const join = async (
	request: ServiceRequest<JoinGroupPayload, unknown>,
): Promise<ServiceResponse<JoinGroupResponse>> => {
	try {
		const foundGroups = await groups.find([
			{ field: 'code', operator: '==', value: request.body.code },
		])
		if (foundGroups.length === 0 || !foundGroups[0])
			throw new ServerError(
				'entity-not-found',
				'Could not find a group with that code.',
			)
		const group = foundGroups[0]
		group.participants[request.user!.id] = 'mentee'
		await groups.update(group)

		const data = { group }
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
	join,
}
