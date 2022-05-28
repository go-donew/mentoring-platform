// @/provider/data/group.ts
// Retrieves, creates, updates and deletes groups in Firebase.

import { getFirestore } from 'firebase-admin/firestore'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import type { FirebaseError } from 'firebase-admin'

import { Group } from '@/models/group'
import { ServerError } from '@/errors'
import type { Query, DataProvider } from '@/types'

/**
 * A interface that a data provider must implement.
 */
class GroupProvider implements DataProvider<Group> {
	/**
	 * Lists/searches through all groups.
	 *
	 * @param {Array<Query>} queries - A list of queries to filter the groups.
	 *
	 * @returns {Group[]} - Array of groups matching the query.
	 * @throws {ServerError} - 'backend-error'
	 */
	async find(queries: Array<Query<Group>>): Promise<Group[]> {
		// Build the query
		const groupsRef = getFirestore().collection('groups')
		let foundGroups = groupsRef.orderBy('name')
		for (const query of queries) {
			let { field } = query
			let operator = query.operator as '<' | '<=' | '==' | '!=' | '>=' | '>'
			let value = query.value as any

			if (query.operator === 'includes') {
				field = `__${query.field}.${query.value as string}`
				operator = '=='
				value = true
			}

			foundGroups = foundGroups.where(field, operator, value)
		}

		// Execute the query
		let docs
		try {
			;({ docs } = await foundGroups.get())
		} catch (error: unknown) {
			console.trace(error)
			throw new ServerError('backend-error')
		}

		// Convert the documents retrieved into instances of a `Group` class
		const groups = []
		for (const doc of docs) {
			// If the document does not exist, skip it
			const data = doc.data()
			if (!doc.exists || !data) {
				continue
			}

			// Add it to the array
			groups.push(plainToInstance(Group, data, { excludePrefixes: ['__'] }))
		}

		return groups
	}

	/**
	 * Retrieves a group from the database.
	 *
	 * @param {string} id - The ID of the group to retrieve.
	 *
	 * @returns {Group} - The requested group.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async get(id: string): Promise<Group> {
		// Fetch the group from Firestore
		let doc
		try {
			doc = await getFirestore().collection('groups').doc(id).get()
		} catch (caughtError: unknown) {
			const error = caughtError as FirebaseError
			// Handle a not found error, but pass on the rest as a backend error
			if (error.code === 'not-found') {
				throw new ServerError('entity-not-found')
			} else {
				console.trace(error)
				throw new ServerError('backend-error')
			}
		}

		// Convert the document retrieved into an instance of a `Group` class
		const data = doc.data()
		// If the document does not exist, skip it
		if (!doc.exists || !data) {
			throw new ServerError('entity-not-found')
		}

		// Return the object as an instance of the `Group` class
		return plainToInstance(Group, data, { excludePrefixes: ['__'] })
	}

	/**
	 * Stores a group in the database.
	 *
	 * @param {Group} data - The data to store in the group.
	 *
	 * @returns {Group} - The created group.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 */
	async create(data: Group): Promise<Group> {
		// Convert the `Group` instance to a firebase document and save it
		try {
			// Check if the document exists
			const groupDocument = await getFirestore()
				.collection('groups')
				.doc(data.id)
				.get()

			// If it does, then return an 'already-exists' error
			if (groupDocument.exists) {
				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			const serializedGroup = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedGroup.__participants = {}
			serializedGroup.__conversations = {}
			serializedGroup.__reports = {}
			serializedGroup.__tags = {}
			for (const participant of Object.keys(serializedGroup.participants))
				serializedGroup.__participants[participant] = true
			for (const conversation of Object.keys(serializedGroup.conversations))
				serializedGroup.__conversations[conversation] = true
			for (const report of Object.keys(serializedGroup.reports))
				serializedGroup.__reports[report] = true
			for (const tag of Object.keys(serializedGroup.tags))
				serializedGroup.__tags[tag] = true
			// Add the data into the database
			await getFirestore()
				.collection('groups')
				.doc(data.id)
				.set(serializedGroup)

			// If the transaction was successful, return the created group
			return data
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(error)
			throw new ServerError('backend-error')
		}
	}

	/**
	 * Updates a group in the database.
	 *
	 * @param {Partial<Group>} data - A list of properties to update and the value to set.
	 *
	 * @returns {Group} - The updated group.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async update(data: Partial<Group>): Promise<Group> {
		// Update given fields for the group in Firestore
		try {
			// First retrieve the group
			const existingGroupDoc = await getFirestore()
				.collection('groups')
				.doc(data.id!)
				.get()

			// If it does not exist, then return a 'not-found' error
			if (!existingGroupDoc.exists) {
				throw new ServerError('entity-not-found')
			}

			// Else update away!
			const serializedGroup = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedGroup.__participants = {}
			serializedGroup.__conversations = {}
			serializedGroup.__reports = {}
			serializedGroup.__tags = {}
			for (const participant of Object.keys(serializedGroup.participants))
				serializedGroup.__participants[participant] = true
			for (const conversation of Object.keys(serializedGroup.conversations))
				serializedGroup.__conversations[conversation] = true
			for (const report of Object.keys(serializedGroup.reports))
				serializedGroup.__reports[report] = true
			for (const tag of Object.keys(serializedGroup.tags))
				serializedGroup.__tags[tag] = true
			// Merge the data with the existing data in the database
			await getFirestore()
				.collection('groups')
				.doc(data.id!)
				.set(serializedGroup)

			// If the transaction was successful, return the updated group
			return plainToInstance(
				Group,
				{
					...existingGroupDoc.data(),
					...data,
				},
				{ excludePrefixes: ['__'] },
			)
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(error)

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
	 * Deletes a group in the database.
	 *
	 * @param {string} id - The ID of the group to delete.
	 *
	 * @returns {void}
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async delete(id: string): Promise<void> {
		// Delete the document
		try {
			await getFirestore().collection('groups').doc(id).delete()
		} catch (caughtError: unknown) {
			const error = caughtError as FirebaseError
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

export const provider = new GroupProvider()
