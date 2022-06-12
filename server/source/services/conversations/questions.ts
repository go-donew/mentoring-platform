// @/services/conversations/questions.ts
// Service that handles question search, creation, modification, deletion operations.

import { render } from 'ejs'

import type { ServiceRequest, ServiceResponse, Query } from '@/types'

import { ServerError } from '@/errors'
import { Question, Option } from '@/models/question'
import { Attribute, UserAttribute } from '@/models/attribute'
import { provider as users } from '@/provider/data/users'
import { provider as attributes } from '@/provider/data/attributes'
import { provider as userAttributes } from '@/provider/data/users/attributes'
import { provider as questions } from '@/provider/data/conversations/questions'
import { service as scripts } from '@/services/scripts'
import { generateId, shuffle } from '@/utilities'

/**
 * The payload needed to make a request to list/find questions.
 *
 * @typedef {object} ListOrFindQuestionsPayload
 * @property {boolean} first - Whether the question should be the first one in the conversation.
 * @property {boolean} last - Whether the question should be the last one in the conversation.
 * @property {boolean} randomizeOptionOrder - Whether the options for that question should be randomized.
 * @property {array<string>} tags - The question should have all the given tags.
 * @property {boolean} raw - Whether or not to render the question text template.
 */
export type ListOrFindQuestionsPayload = {
	first?: boolean
	last?: boolean
	randomizeOptionOrder?: boolean
	tags?: string[]
	raw?: boolean
}

/**
 * The response from the list/find questions endpoint.
 *
 * @typedef {object} ListOrFindQuestionsResponse
 * @property {array<Question>} questions.required - The questions returned from the query.
 */
export type ListOrFindQuestionsResponse = {
	questions: Question[]
}

/**
 * Method to list/find a question.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the questions that match the query.
 */
const find = async (
	request: ServiceRequest<
		ListOrFindQuestionsPayload & { conversationId: string }
	>,
): Promise<ServiceResponse<ListOrFindQuestionsResponse>> => {
	try {
		const query: Array<Query<Question>> = []
		for (const [field, value] of Object.entries(request.data).filter(
			([key, _]) => key !== 'conversationId' && key !== 'raw',
		)) {
			if (['tags'].includes(field))
				for (const element of value as string[])
					query.push({ field, operator: 'includes', value: element })
			else if (['first', 'last', 'randomizeOptionOrder'].includes(field))
				query.push({ field, operator: '==', value: Boolean(value) })
			else query.push({ field, operator: '==', value })
		}

		questions.conversationId = request.data.conversationId
		const foundQuestions = await questions.find(query)

		// Prepare to render the template by fetching the user and their attributes
		if (!request.data.raw) {
			const user = await users.get(request.context!.user.id)
			const input: Record<
				string,
				Attribute & { value: string | number | boolean }
			> = {}

			userAttributes.userId = request.context!.user.id
			const fetchedUserAttributes = await userAttributes.find([])
			for (const fetchedUserAttribute of fetchedUserAttributes) {
				const attribute = await attributes.get(fetchedUserAttribute.id)
				input[fetchedUserAttribute.id] = {
					...attribute,
					...fetchedUserAttribute,
				}
			}

			// Sort the options and render the template.
			for (const question of foundQuestions) {
				question.options = question.randomizeOptionOrder
					? shuffle(question.options)
					: question.options.sort((a, b) => a.position - b.position)

				question.text = render(question.text, {
					context: { input, user },
				})
			}
		}

		const data = { questions: foundQuestions }
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
 * The payload needed to create a question.
 *
 * @typedef {object} CreateQuestionPayload
 * @property {string} text.required - The question text.
 * @property {array<Option>} options.required - The options to the question.
 * @property {boolean} first.required - Whether this is the first question in the conversation.
 * @property {boolean} last.required - Whether this is the last question in the conversation.
 * @property {boolean} randomizeOptionOrder.required - Whether to randomize the order of the options.
 * @property {array<string>} tags.required - Tags to enhance searchability of the conversation.
 */
export type CreateQuestionPayload = {
	text: string
	options: Option[]
	first: boolean
	last: boolean
	randomizeOptionOrder: boolean
	tags: string[]
}

/**
 * The response from the create question endpoint.
 *
 * @typedef {object} CreateQuestionResponse
 * @property {Question} question.required - The created question.
 */
export type CreateQuestionResponse = {
	question: Question
}

/**
 * Method to create a question.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the newly created question.
 */
const create = async (
	request: ServiceRequest<CreateQuestionPayload & { conversationId: string }>,
): Promise<ServiceResponse<CreateQuestionResponse>> => {
	try {
		questions.conversationId = request.data.conversationId
		const question = await questions.create({
			...request.data,
			id: generateId(),
			_conversationId: request.data.conversationId,
		})

		const data = { question }
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
 * The payload needed to retrieve a question.
 *
 * @typedef {object} RetrieveQuestionPayload
 * @property {boolean} raw - Whether or not to render the question text template.
 */
export type RetrieveQuestionsPayload = {
	raw?: boolean
}

/**
 * The response from the retrieve question endpoint.
 *
 * @typedef {object} RetrieveQuestionResponse
 * @property {Question} question.required - The requested question.
 */
export type RetrieveQuestionResponse = {
	question: Question
}

/**
 * Method to retrieve a question.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the requested question.
 */
const get = async (
	request: ServiceRequest<{
		conversationId: string
		questionId: string
		raw?: boolean
	}>,
): Promise<ServiceResponse<RetrieveQuestionResponse>> => {
	try {
		questions.conversationId = request.data.conversationId
		const question = await questions.get(request.data.questionId)

		// Prepare to render the template by fetching the user and their attributes
		if (!request.data.raw) {
			const user = await users.get(request.context!.user.id)
			const input: Record<
				string,
				Attribute & { value: string | number | boolean }
			> = {}

			userAttributes.userId = request.context!.user.id
			const fetchedUserAttributes = await userAttributes.find([])
			for (const fetchedUserAttribute of fetchedUserAttributes) {
				const attribute = await attributes.get(fetchedUserAttribute.id)
				input[fetchedUserAttribute.id] = {
					...attribute,
					...fetchedUserAttribute,
				}
			}

			// Sort the options and render the template.
			question.options = question.randomizeOptionOrder
				? shuffle(question.options)
				: question.options.sort((a, b) => a.position - b.position)
			question.text = render(question.text, {
				context: { input, user },
			})
		}

		const data = { question }
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
 * The payload needed to update a question.
 *
 * @typedef {object} UpdateQuestionPayload
 * @property {string} text.required - The question text.
 * @property {array<Option>} options.required - The options to the question.
 * @property {boolean} first.required - Whether this is the first question in the conversation.
 * @property {boolean} last.required - Whether this is the last question in the conversation.
 * @property {boolean} randomizeOptionOrder.required - Whether to randomize the order of the options.
 * @property {array<string>} tags.required - Tags to enhance searchability of the conversation.
 */
export type UpdateQuestionPayload = {
	text: string
	options: Option[]
	first: boolean
	last: boolean
	randomizeOptionOrder: boolean
	tags: string[]
}

/**
 * The response from the update question endpoint.
 *
 * @typedef {object} UpdateQuestionResponse
 * @property {Question} question.required - The updated question.
 */
export type UpdateQuestionResponse = {
	question: Question
}

/**
 * Method to update a question.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the updated question.
 */
const update = async (
	request: ServiceRequest<
		UpdateQuestionPayload & { conversationId: string; questionId: string }
	>,
): Promise<ServiceResponse<UpdateQuestionResponse>> => {
	try {
		questions.conversationId = request.data.conversationId
		const question = await questions.update({
			...request.data,
			id: request.data.questionId,
		})

		const data = { question }
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
 * Method to delete a question.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return nothing.
 */
const _delete = async (
	request: ServiceRequest<{ conversationId: string; questionId: string }>,
): Promise<ServiceResponse<unknown>> => {
	try {
		questions.conversationId = request.data.conversationId
		await questions.delete(request.data.questionId)

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
 * The payload needed to answer a question.
 *
 * @typedef {object} AnswerQuestionPayload
 * @property {number} position.required - The position of the answer selected by the user.
 * @property {string} input - The input provided by the user if the option was of type `input`.
 */
export type AnswerQuestionPayload = {
	position: number
	input?: string
}

/**
 * The response from the answer question endpoint.
 *
 * @typedef {object} AnswerQuestionResponse
 * @property {Question} next - The next question the user should answer.
 */
export type AnswerQuestionResponse = {
	next?: Question
}

/**
 * Method to answer a question.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return the next question the user must answer.
 */
const answer = async (
	request: ServiceRequest<
		AnswerQuestionPayload & { conversationId: string; questionId: string }
	>,
): Promise<ServiceResponse<AnswerQuestionResponse>> => {
	try {
		// Retrieve the question
		questions.conversationId = request.data.conversationId
		const question = await questions.get(request.data.questionId)

		// Check if the option chosen by the user exists
		const selectedOption = question.options.find(
			(option) => option.position === request.data.position,
		)
		if (!selectedOption)
			throw new ServerError(
				'entity-not-found',
				'Could not find that option in the question.',
			)

		// If it does and has an attribute to set, get the value to set as the attribute
		if (selectedOption.attribute) {
			const answer =
				selectedOption.type === 'input' // If the option was of type `input`, then set whatever the user has written
					? request.data.input ?? selectedOption.attribute.value // Fall back to the default if the user hasn't provided any input
					: selectedOption.attribute.value // Else set the value as given

			userAttributes.userId = request.context!.user.id
			try {
				// Retrieve the attribute, check if it exists
				const attribute = await userAttributes.get(selectedOption.attribute.id)
				// If it does, update the value
				attribute.value = answer
				attribute.history.push({
					value: answer,
					observer: 'questioner',
					timestamp: new Date(),
					message: {
						in: 'conversation',
						id: request.data.conversationId,
					},
				})
				// Save the attribute
				await userAttributes.update(attribute)
			} catch {
				// If the attribute does not exist, create it.
				const attribute = new UserAttribute(
					selectedOption.attribute.id,
					answer,
					[
						{
							value: answer,
							observer: 'questioner',
							timestamp: new Date(),
							message: {
								in: 'conversation',
								id: request.data.conversationId,
							},
						},
					],
					request.context!.user.id,
				)
				// Save the attribute
				await userAttributes.create(attribute)
			}
		}

		// If there is a script specified, run it.
		if (selectedOption.script) {
			// Run the script for the current user.
			await scripts.run({
				context: request.context,
				data: { scriptId: selectedOption.script },
			})
		}

		// If there is a next question specified, return that to the user
		questions.conversationId = selectedOption.next?.conversation
		const next = selectedOption.next
			? await questions.get(selectedOption.next.question)
			: undefined

		if (next) {
			// Prepare to render the template by fetching the user and their attributes
			const user = await users.get(request.context!.user.id)
			const input: Record<
				string,
				Attribute & { value: string | number | boolean }
			> = {}

			userAttributes.userId = request.context!.user.id
			const fetchedUserAttributes = await userAttributes.find([])
			for (const fetchedUserAttribute of fetchedUserAttributes) {
				const attribute = await attributes.get(fetchedUserAttribute.id)
				input[fetchedUserAttribute.id] = {
					...attribute,
					...fetchedUserAttribute,
				}
			}

			// Sort the options and render the template.
			next.options = next.randomizeOptionOrder
				? shuffle(next.options)
				: next.options.sort((a, b) => a.position - b.position)
			next.text = render(next.text, {
				context: { input, user },
			})
		}

		const data = { next }
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
	find,
	create,
	get,
	update,
	delete: _delete,
	answer,
}
