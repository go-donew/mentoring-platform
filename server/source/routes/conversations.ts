// @/routes/conversations.ts
// Request handlers for conversation related endpoints.

import { Router as createRouter } from 'express'
import type { Request, Response } from 'express'

import { permit } from '@/middleware/authorization'
import { service as conversations } from '@/services/conversations'
import { service as questions } from '@/services/conversations/questions'

// Create a router for the endpoint
const endpoint = createRouter()

/**
 * GET /conversations
 *
 * @summary List/find conversations
 * @tags conversations - Conversation related endpoints
 *
 * @security bearer
 *
 * @param {ListOrFindConversationsPayload} request.body - The query to run and find conversations.
 *
 * @returns {ListOrFindConversationsResponse} 200 - The conversations that the user is allowed to take.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all conversations that are tagged `quiz`
 * {
 * 	"tags": ["quiz"]
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/',
	// => permit('anyone'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await conversations.find(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * POST /conversations
 *
 * @summary Create a conversation
 * @tags conversations - Conversation related endpoints
 *
 * @security bearer
 *
 * @param {CreateConversationPayload} request.body - The necessary details to create a conversation.
 *
 * @returns {CreateConversationResponse} 201 - The created conversation. You must be Groot to create a conversation.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that creates a conversation
 * {
 * 	"name": "Daily Update",
 *  "description": "Enables the user to give a daily update to their mentor in a conversational format."
 * 	"once": false,
 *  "tags": ["daily-update"]
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await conversations.create(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * GET /conversations/{conversationId}
 *
 * @summary Retrieve a requested conversation
 * @tags conversations - Conversation related endpoints
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the conversation to return.
 *
 * @returns {RetrieveConversationResponse} 200 - The requested conversation. You must be a part of the group that is allowed to take this conversation.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:conversationId',
	permit({
		subject: 'conversation',
		roles: 'dynamic',
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await conversations.get(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * PUT /conversations/{conversationId}
 *
 * @summary Update a certain conversation
 * @tags conversations - Conversation related endpoints
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the conversation to update.
 * @param {UpdateConversationPayload} request.body.required - The new conversation.
 *
 * @returns {UpdateConversationResponse} 200 - The updated conversation. You must be a part of the group that is allowed to take this conversation.
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
	'/:conversationId',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await conversations.update(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * DELETE /conversations/{conversationId}
 *
 * @summary Delete a certain conversation
 * @tags conversations - Conversation related endpoints
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the conversation to delete.
 *
 * @returns {object} 204 - You must be Groot to delete a conversation.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.delete(
	'/:conversationId',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await conversations.delete(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * GET /conversations/{conversationId}/questions
 *
 * @summary List/find questions
 * @tags questions - Question related endpoints
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the user whose questions to list.
 * @param {ListOrFindQuestionsPayload} request.body - The query to run and find questions.
 *
 * @returns {ListOrFindQuestionsResponse} 200 - The questions returned from the query. If no parameters are passed, then it returns all the questions part of the conversation.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that returns all questions that have the tag `quiz`.
 * {
 * 	"tags": ["quiz"]
 * }
 *
 * @endpoint
 */
endpoint.get(
	'/:conversationId/questions',
	permit({
		subject: 'conversation',
		roles: 'dynamic',
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await questions.find(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * POST /conversations/{conversationId}/questions
 *
 * @summary Create a question
 * @tags questions - Question related endpoints
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the user whose question to create.
 * @param {CreateQuestionPayload} request.body - The necessary details to create a question.
 *
 * @returns {CreateQuestionResponse} 201 - The created question. You must be Groot to create a question.
 * @returns {ImproperPayloadError} 400 - The query was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @example request - An example query that creates a question
 * {
 * 	"text": "Some question?",
 * 	"options": [
 * 		{
 * 			"position": 1,
 * 			"type": "select",
 * 			"text": "An Option",
 * 			"attribute": {
 * 				"id": "answered-question",
 * 				"value": 1
 * 			},
 * 		},
 * 	],
 * 	"first": true,
 * 	"last": false,
 * 	"randomizeOptionOrder": true
 * }
 *
 * @endpoint
 */
endpoint.post(
	'/:conversationId/questions',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await questions.create(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * GET /conversations/{conversationId}/questions/{questionId}
 *
 * @summary Retrieve a requested question
 * @tags questions - Question related endpoints
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the user whose question to return.
 * @param {string} questionId.path.required - The ID of the question to return.
 *
 * @returns {RetrieveQuestionResponse} 200 - The requested question. You must be part of a group that is allowed to take the conversation.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.get(
	'/:conversationId/questions/:questionId',
	permit({
		subject: 'conversation',
		roles: 'dynamic',
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await questions.get(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * PUT /conversations/{conversationId}/questions/{questionId}
 *
 * @summary Update a certain question
 * @tags questions - Question related endpoints
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the user whose question to update.
 * @param {string} questionId.path.required - The ID of the question to update.
 * @param {UpdateQuestionPayload} request.body.required - The new question.
 *
 * @returns {UpdateQuestionResponse} 200 - The updated question. You must be Groot to update a question.
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
	'/:conversationId/questions/:questionId',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await questions.update(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * DELETE /conversations/{conversationId}/questions/{questionId}
 *
 * @summary Delete a certain question
 * @tags questions - Question related endpoints
 *
 * @security bearer
 *
 * @param {string} conversationId.path.required - The ID of the user whose question to delete.
 * @param {string} questionId.path.required - The ID of the question to delete.
 *
 * @returns {object} 204 - You must be Groot to delete a question.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {NotAllowedError} 403 - The client lacked sufficient authorization to perform the operation OR the entity does not exist.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.delete(
	'/:conversationId/questions/:questionId',
	permit('groot'),
	async (request: Request, response: Response): Promise<void> => {
		const result = await questions.delete(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

/**
 * PUT /conversations/{conversationId}/questions/{questionId}/answer
 *
 * @summary Answer a question
 * @tags questions - Question related endpoints
 *
 * @security bearer
 *
 * @param {AnswerQuestionPayload} request.body.required - The details required for joining a group.
 *
 * @returns {AnswerQuestionResponse} 200 - The next question the user should answer.
 * @returns {ImproperPayloadError} 400 - The payload was invalid.
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 * @returns {EntityNotFoundError} 404 - There was no group that can be joined using the passed code.
 * @returns {TooManyRequestsError} 429 - The client was rate-limited.
 * @returns {BackendError} 500 - An error occurred while interacting with the backend.
 * @returns {ServerCrashError} 500 - The server crashed.
 *
 * @endpoint
 */
endpoint.put(
	'/:conversationId/questions/:questionId/answer',
	permit({
		subject: 'conversation',
		roles: 'dynamic',
	}),
	async (request: Request, response: Response): Promise<void> => {
		const result = await questions.answer(request)

		if (result.error) response.sendError(result.error)
		else response.status(result.status!).send(result.data)
	},
)

// Export the router
export { endpoint }
