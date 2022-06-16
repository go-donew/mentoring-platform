// @/provider/data/question.ts
// Retrieves, creates, updates and deletes questions in Firebase.

import { instanceToPlain, plainToInstance } from 'class-transformer'

import { Question } from '@/models/question'
import { logger, stringify } from '@/utilities/logger'
import { ServerError } from '@/errors'
import { firestore } from '@/provider/data/firestore'

import type { Query, DataProvider } from '@/types'

/**
 * A interface that a data provider must implement.
 */
class QuestionProvider implements DataProvider<Question> {
	/**
	 * Questions are specific to a certain conversation.
	 */
	conversationId?: string

	/**
	 * Lists/searches through all questions.
	 *
	 * @param {Array<Query>} queries - A list of queries to filter the questions.
	 *
	 * @returns {Question[]} - Array of questions matching the query.
	 * @throws {ServerError} - 'backend-error'
	 */
	async find(queries: Array<Query<Question>>): Promise<Question[]> {
		logger.info(
			'[firebase/conversations/questions/find] finding questions by query',
		)

		if (!this.conversationId) {
			logger.warn(
				'[firebase/conversations/questions/find] conversation id was not set for provider beforehand',
			)
			throw new Error(
				'Finding a question can only be done for a certain conversation.',
			)
		}

		// Build the query
		logger.silly(
			'[firebase/conversations/questions/find] parsing query - %s',
			stringify(queries),
		)
		const questionsRef = firestore
			.collection('conversations')
			.doc(this.conversationId)
			.collection('questions')
		let foundQuestions = questionsRef.orderBy('id')
		for (const query of queries) {
			let { field } = query
			let operator = query.operator as '<' | '<=' | '==' | '!=' | '>=' | '>'
			let value = query.value as any

			if (query.operator === 'includes') {
				field = `__${query.field}.${query.value as string}`
				operator = '=='
				value = true
			}

			logger.silly(
				'[firebase/conversations/questions/find] parsed condition - %s %s %s',
				field,
				operator,
				value,
			)

			foundQuestions = foundQuestions.where(field, operator, value)
		}

		// Execute the query
		let docs
		try {
			logger.silly(
				'[firebase/conversations/questions/find] calling get on query ref',
			)

			// Execute the query
			;({ docs } = await foundQuestions.get())
			// Sort the docs according to the time created.
			docs.sort(
				(a: any, b: any) =>
					a.createTime.toDate().valueOf() - b.createTime.toDate().valueOf(),
			)

			logger.silly(
				'[firebase/conversations/questions/find] received docs from firestore',
			)
		} catch (error: unknown) {
			logger.warn(
				'[firebase/conversations/questions/find] received error while querying docs - %s',
				stringify(error),
			)

			throw new ServerError('backend-error')
		}

		// Convert the documents retrieved into instances of a `Question` class
		logger.silly(
			'[firebase/conversations/questions/find] parsing firestore docs',
		)
		const questions = []
		for (const doc of docs) {
			// If the document does not exist, skip it
			const data = doc.data()
			if (!doc.exists || !data) {
				logger.silly(
					'[firebase/conversations/questions/find] received empty doc - discarding',
				)

				continue
			}

			// Add it to the array
			logger.silly(
				'[firebase/conversations/questions/find] succesfully parsed a doc',
			)
			questions.push(
				plainToInstance(Question, data as Record<string, any>, {
					excludePrefixes: ['__'],
				}),
			)
		}

		logger.info(
			'[firebase/conversations/questions/find] returning list of found questions',
		)
		return questions
	}

	/**
	 * Retrieves a question from the database.
	 *
	 * @param {string} id - The ID of the question to retrieve.
	 *
	 * @returns {Question} - The requested question.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async get(id: string): Promise<Question> {
		logger.info(
			'[firebase/conversations/questions/get] fetching question %s',
			id,
		)

		if (!this.conversationId) {
			logger.warn(
				'[firebase/conversations/questions/logger] conversation id was not set for provider beforehand',
			)
			throw new Error(
				'Retrieving a question can only be done for a certain conversation.',
			)
		}

		// Fetch the question from Firestore
		let doc
		try {
			logger.silly('[firebase/conversations/questions/get] calling get on ref')
			doc = await firestore
				.collection('conversations')
				.doc(this.conversationId)
				.collection('questions')
				.doc(id)
				.get()
			logger.silly(
				'[firebase/conversations/questions/get] received doc from firestore',
			)
		} catch (error: unknown) {
			logger.warn(
				'[firebase/conversations/questions/get] received error while fetching question from firestore - %s',
				stringify(error),
			)

			// Handle a not found error, but pass on the rest as a backend error
			const error_ =
				error instanceof ServerError
					? error
					: (error as any).code === 'not-found'
					? new ServerError('entity-not-found')
					: new ServerError('backend-error')
			throw error_
		}

		// Convert the document retrieved into an instance of a `Question` class
		const data = doc.data()
		// If the document does not exist, skip it
		if (!doc.exists || !data) {
			logger.silly(
				'[firebase/conversations/questions/get] received empty doc - returning entity-not-found error',
			)

			throw new ServerError('entity-not-found')
		}

		// Return the object as an instance of the `Question` class
		logger.info(
			'[firebase/conversations/questions/get] fetched question succesfully',
		)
		return plainToInstance(Question, data as Record<string, any>, {
			excludePrefixes: ['__'],
		})
	}

	/**
	 * Stores a question in the database.
	 *
	 * @param {Question} data - The data to store in the question.
	 *
	 * @returns {Question} - The created question.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 */
	async create(data: Question): Promise<Question> {
		logger.info(
			'[firebase/conversations/questions/create] create question %s',
			data.id,
		)

		if (!this.conversationId) {
			logger.warn(
				'[firebase/conversations/questions/logger] conversation id was not set for provider beforehand',
			)
			throw new Error(
				'Creating a question can only be done for a certain conversation.',
			)
		}

		// Convert the `Question` instance to a firebase document and save it
		try {
			// Check if the document exists
			logger.silly(
				'[firebase/conversations/questions/create] checking if a doc with the same id exists',
			)
			const questionDocument = await firestore
				.collection('conversations')
				.doc(this.conversationId)
				.collection('questions')
				.doc(data.id)
				.get()

			// If it does, then return an 'already-exists' error
			if (questionDocument.exists) {
				logger.info(
					'[firebase/conversations/questions/create] an question with the same id already exists',
				)
				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			logger.silly(
				'[firebase/conversations/questions/create] serializing question',
			)
			const serializedQuestion = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedQuestion._conversationId = this.conversationId
			serializedQuestion.__tags = {}
			for (const tag of serializedQuestion.tags)
				serializedQuestion.__tags[tag] = true
			// Add the data into the database
			logger.silly(
				'[firebase/conversations/questions/create] calling set on ref',
			)
			await firestore
				.collection('conversations')

				.doc(this.conversationId)
				.collection('questions')
				.doc(data.id)

				.set(serializedQuestion)

			// If the transaction was successful, return the created question
			logger.info(
				'[firebase/conversations/questions/create] successfully created question',
			)
			return data
		} catch (error: unknown) {
			// Pass on any error as a backend error
			logger.warn(
				'[firebase/conversations/questions/create] received error while creating question - %s',
				stringify(error),
			)

			throw new ServerError('backend-error')
		}
	}

	/**
	 * Updates a question in the database.
	 *
	 * @param {Partial<Question>} data - A list of properties to update and the value to set.
	 *
	 * @returns {Question} - The updated question.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async update(data: Partial<Question>): Promise<Question> {
		logger.info(
			'[firebase/conversations/questions/update] updating question %s',
			data.id,
		)

		if (!this.conversationId) {
			logger.warn(
				'[firebase/conversations/questions/logger] conversation id was not set for provider beforehand',
			)
			throw new Error(
				'Updating a question can only be done for a certain conversation.',
			)
		}

		// Update given fields for the question in Firestore
		try {
			// First retrieve the question
			logger.silly(
				'[firebase/conversations/questions/update] checking if question exists in firestore',
			)
			const existingQuestionDoc = await firestore
				.collection('conversations')
				.doc(this.conversationId)
				.collection('questions')
				.doc(data.id!)

				.get()

			// If it does not exist, then return a 'not-found' error
			if (!existingQuestionDoc.exists) {
				logger.warn(
					'[firebase/conversations/questions/update] failed to update non-existent question',
				)
				throw new ServerError('entity-not-found')
			}

			logger.silly(
				'[firebase/conversations/questions/update] found existing question in firestore',
			)

			// Else update away!
			logger.silly(
				'[firebase/conversations/questions/update] serializing question',
			)
			const serializedQuestion = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedQuestion._conversationId = this.conversationId
			serializedQuestion.__tags = {}
			for (const tag of serializedQuestion.tags)
				serializedQuestion.__tags[tag] = true
			// Merge the data with the existing data in the database
			logger.silly(
				'[firebase/conversations/questions/update] calling merge set on ref',
			)
			await firestore
				.collection('conversations')

				.doc(this.conversationId)
				.collection('questions')
				.doc(data.id!)
				.set(serializedQuestion)

			// If the transaction was successful, return the updated question
			logger.info(
				'[firebase/conversations/questions/update] successfully updated question',
			)
			return plainToInstance(
				Question,
				{
					...existingQuestionDoc.data(),
					...data,
				} as Record<string, any>,
				{ excludePrefixes: ['__'] },
			)
		} catch (error: unknown) {
			// Pass on any error as a backend error
			logger.warn(
				'[firebase/conversations/questions/update] received error while updating question - %s',
				stringify(error),
			)

			// Handle a not found error, but pass on the rest as a backend error
			const error_ =
				error instanceof ServerError
					? error
					: (error as any).code === 'not-found'
					? new ServerError('entity-not-found')
					: new ServerError('backend-error')
			throw error_
		}
	}

	/**
	 * Deletes a question in the database.
	 *
	 * @param {string} id - The ID of the question to delete.
	 *
	 * @returns {void}
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async delete(id: string): Promise<void> {
		logger.info(
			'[firebase/conversations/questions/delete] deleting question %s',
			id,
		)
		if (!this.conversationId) {
			logger.warn(
				'[firebase/conversations/questions/delete] conversation id was not set for provider beforehand',
			)
			throw new Error(
				'Deleting a question can only be done for a certain conversation.',
			)
		}

		// Delete the document

		try {
			logger.silly(
				'[firebase/conversations/questions/delete] calling delete on ref',
			)
			await firestore
				.collection('conversations')
				.doc(this.conversationId)
				.collection('questions')
				.doc(id)
				.delete()
			logger.info(
				'[firebase/conversations/questions/delete] sucessfully deleted question',
			)
		} catch (error: unknown) {
			logger.warn(
				'[firebase/conversations/questions/delete] received error while deleting question - %s',
				stringify(error),
			)

			// Handle a not found error, but pass on the rest as a backend error
			const error_ =
				error instanceof ServerError
					? error
					: (error as any).code === 'not-found'
					? new ServerError('entity-not-found')
					: new ServerError('backend-error')
			throw error_
		}
	}
}

export const provider = new QuestionProvider()
