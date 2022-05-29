// @/provider/data/conversation.ts
// Retrieves, creates, updates and deletes conversations in Firebase.

import { getFirestore } from 'firebase-admin/firestore'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import type { FirebaseError } from 'firebase-admin'

import { ServerError } from '@/errors'
import { Conversation } from '@/models/conversation'
import { logger, stringify } from '@/utilities/logger'

import type { Query, DataProvider } from '@/types'

/**
 * A interface that a data provider must implement.
 */
class ConversationProvider implements DataProvider<Conversation> {
	/**
	 * Lists/searches through all conversations.
	 *
	 * @param {Array<Query>} queries - A list of queries to filter the conversations.
	 *
	 * @returns {Conversation[]} - Array of conversations matching the query.
	 * @throws {ServerError} - 'backend-error'
	 */
	async find(queries: Array<Query<Conversation>>): Promise<Conversation[]> {
		logger.info('[firebase/conversations/find] finding conversations by query')

		// Build the query
		logger.silly(
			'[firebase/conversations/find] parsing query - %s',
			stringify(queries),
		)
		const conversationsRef = getFirestore().collection('conversations')
		let foundConversations = conversationsRef.orderBy('name')
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
				'[firebase/conversations/find] parsed condition - %s %s %s',
				field,
				operator,
				value,
			)

			foundConversations = foundConversations.where(field, operator, value)
		}

		// Execute the query
		let docs
		try {
			logger.silly('[firebase/conversations/find] calling get on query ref')
			;({ docs } = await foundConversations.get())
			logger.silly('[firebase/conversations/find] received docs from firestore')
		} catch (error: unknown) {
			logger.warn(
				'[firebase/conversations/find] received error while querying docs - %s',
				stringify(error),
			)
			throw new ServerError('backend-error')
		}

		// Convert the documents retrieved into instances of a `Conversation` class
		const conversations = []
		logger.silly('[firebase/conversations/find] parsing firestore docs')
		for (const doc of docs) {
			// If the document does not exist, skip it
			const data = doc.data()
			if (!doc.exists || !data) {
				logger.silly(
					'[firebase/conversations/find] received empty doc - discarding',
				)
				continue
			}

			// Add it to the array
			conversations.push(
				plainToInstance(Conversation, data, { excludePrefixes: ['__'] }),
			)

			logger.silly('[firebase/conversations/find] succesfully parsed a doc')
		}

		logger.info(
			'[firebase/conversations/find] returning list of found conversations',
		)
		return conversations
	}

	/**
	 * Retrieves a conversation from the database.
	 *
	 * @param {string} id - The ID of the conversation to retrieve.
	 *
	 * @returns {Conversation} - The requested conversation.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async get(id: string): Promise<Conversation> {
		logger.info('[firebase/conversations/get] fetching conversation %s', id)

		// Fetch the conversation from Firestore
		let doc
		try {
			logger.silly('[firebase/conversations/get] calling get on ref')
			doc = await getFirestore().collection('conversations').doc(id).get()
			logger.silly('[firebase/conversations/get] received doc from firestore')
		} catch (error: unknown) {
			logger.warn(
				'[firebase/conversations/get] received error while fetching conversation from firestore - %s',
				stringify(error),
			)

			// Handle a not found error, but pass on the rest as a backend error
			const error_ =
				error instanceof ServerError
					? error
					: (error as FirebaseError).code === 'not-found'
					? new ServerError('entity-not-found')
					: new ServerError('backend-error')
			throw error_
		}

		// Convert the document retrieved into an instance of a `Conversation` class
		const data = doc.data()
		// If the document does not exist, skip it
		if (!doc.exists || !data) {
			logger.silly(
				'[firebase/conversations/get] received empty doc - returning entity-not-found error',
			)
			throw new ServerError('entity-not-found')
		}

		// Return the object as an instance of the `Conversation` class
		logger.info('[firebase/conversations/get] fetched conversation succesfully')
		return plainToInstance(Conversation, data, { excludePrefixes: ['__'] })
	}

	/**
	 * Stores a conversation in the database.
	 *
	 * @param {Conversation} data - The data to store in the conversation.
	 *
	 * @returns {Conversation} - The created conversation.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 */
	async create(data: Conversation): Promise<Conversation> {
		logger.info(
			'[firebase/conversations/create] create conversation %s',
			data.id,
		)

		// Convert the `Conversation` instance to a firebase document and save it
		try {
			// Check if the document exists
			logger.silly(
				'[firebase/conversations/create] checking if a doc with the same id exists',
			)
			const conversationDocument = await getFirestore()
				.collection('conversations')
				.doc(data.id)
				.get()

			// If it does, then return an 'already-exists' error
			if (conversationDocument.exists) {
				logger.info(
					'[firebase/conversations/create] an conversation with the same id already exists',
				)
				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			logger.silly('[firebase/conversations/create] serializing conversation')
			const serializedConversation = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedConversation.__tags = {}
			for (const tag of serializedConversation.tags)
				serializedConversation.__tags[tag] = true

			// Add the data into the database
			logger.silly('[firebase/conversations/create] calling set on ref')
			await getFirestore()
				.collection('conversations')
				.doc(data.id)
				.set(serializedConversation)

			// If the transaction was successful, return the created conversation
			logger.info(
				'[firebase/conversations/create] successfully created conversation',
			)
			return data
		} catch (error: unknown) {
			// Pass on any error as a backend error
			logger.warn(
				'[firebase/conversations/create] received error while creating conversation - %s',
				stringify(error),
			)

			throw new ServerError('backend-error')
		}
	}

	/**
	 * Updates a conversation in the database.
	 *
			
	 * @param {Partial<Conversation>} data - A list of properties to update and the value to set.
	 *
	 * @returns {Conversation} - The updated conversation.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async update(data: Partial<Conversation>): Promise<Conversation> {
		logger.info(
			'[firebase/conversations/update] updating conversation %s',
			data.id,
		)

		// Update given fields for the conversation in Firestore
		try {
			// First retrieve the conversation
			logger.silly(
				'[firebase/conversations/update] checking if conversation exists in firestore',
			)
			const existingConversationDoc = await getFirestore()
				.collection('conversations')
				.doc(data.id!)
				.get()

			// If it does not exist, then return a 'not-found' error
			if (!existingConversationDoc.exists) {
				logger.warn(
					'[firebase/conversations/update] failed to update non-existent conversation',
				)
				throw new ServerError('entity-not-found')
			}

			logger.silly(
				'[firebase/conversations/update] found existing conversation in firestore',
			)

			// Else update away!
			logger.silly('[firebase/conversations/update] serializing conversation')
			const serializedConversation = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedConversation.__tags = {}
			for (const tag of serializedConversation.tags)
				serializedConversation.__tags[tag] = true
			// Merge the data with the existing data in the database
			logger.silly('[firebase/conversations/update] calling merge set on ref')
			await getFirestore()
				.collection('conversations')
				.doc(data.id!)
				.set(serializedConversation)

			// If the transaction was successful, return the updated conversation
			logger.info(
				'[firebase/conversations/update] successfully updated conversation',
			)
			return plainToInstance(
				Conversation,

				{
					...existingConversationDoc.data(),
					...data,
				},
				{ excludePrefixes: ['__'] },
			)
		} catch (error: unknown) {
			// Pass on any error as a backend error
			logger.warn(
				'[firebase/conversations/update] received error while updating conversation - %s',
				stringify(error),
			)

			// Handle a not found error, but pass on the rest as a backend error
			const error_ =
				error instanceof ServerError
					? error
					: (error as FirebaseError).code === 'not-found'
					? new ServerError('entity-not-found')
					: new ServerError('backend-error')
			throw error_
		}
	}

	/**
	 * Deletes a conversation in the database.
	 *
	 * @param {string} id - The ID of the conversation to delete.
	 *
	 * @returns {void}
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async delete(id: string): Promise<void> {
		logger.info('[firebase/conversations/delete] deleting conversation %s', id)
		// Delete the document
		try {
			logger.silly('[firebase/conversations/delete] calling delete on ref')
			await getFirestore().collection('conversations').doc(id).delete()
			logger.info(
				'[firebase/conversations/delete] sucessfully deleted conversation',
			)
		} catch (caughtError: unknown) {
			const error = caughtError as FirebaseError
			logger.warn(
				'[firebase/conversations/delete] received error while deleting conversation - %s',
				stringify(error),
			)

			// Handle a not found error, but pass on the rest as a backend error
			if (error.code === 'not-found') {
				throw new ServerError('entity-not-found')
			} else {
				console.trace(error)
				throw new ServerError('backend-error')
			}
		}
	}
}

export const provider = new ConversationProvider()
