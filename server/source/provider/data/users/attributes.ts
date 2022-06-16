// @/provider/data/attributes.ts
// Retrieves, creates, updates and deletes a user's attributes in Firebase.

import { instanceToPlain, plainToInstance } from 'class-transformer'

import { ServerError } from '@/errors'
import { UserAttribute } from '@/models/attribute'
import { firestore } from '@/provider/data/firestore'

import type { Query, DataProvider } from '@/types'

/**
 * A interface that a data provider must implement.
 */
class UserAttributeProvider implements DataProvider<UserAttribute> {
	/**
	 * Attributes are specific to a certain user.
	 */
	userId?: string

	/**
	 * Lists/searches through all attributes.
	 *
	 * @param {Array<Query>} queries - A list of queries to filter the attributes.
	 *
	 * @returns {UserAttribute[]} - Array of attributes matching the query.
	 * @throws {ServerError} - 'backend-error'
	 */
	async find(queries: Array<Query<UserAttribute>>): Promise<UserAttribute[]> {
		if (!this.userId)
			throw new Error(
				'Finding an attribute can only be done for a certain user.',
			)

		// Build the query
		const attributesRef = firestore
			.collection('users')
			.doc(this.userId)
			.collection('attributes')
		let foundUserAttributes = attributesRef.orderBy('id')
		for (const query of queries) {
			foundUserAttributes = foundUserAttributes.where(
				query.field,
				query.operator as '<' | '<=' | '==' | '!=' | '>=' | '>',
				query.value as any,
			)
		}

		// Execute the query
		let docs
		try {
			;({ docs } = await foundUserAttributes.get())
		} catch (error: unknown) {
			console.trace(error)
			throw new ServerError('backend-error')
		}

		// Convert the documents retrieved into instances of a `UserAttribute` class
		const attributes = []
		for (const doc of docs) {
			// If the document does not exist, skip it
			const data = doc.data()
			if (!doc.exists || !data) {
				continue
			}

			// Add it to the array
			for (const snapshot of data.history) {
				const time = new Date(Date.UTC(1970, 0, 1))
				time.setSeconds(snapshot.timestamp._seconds)

				snapshot.timestamp = time
			}

			attributes.push(
				plainToInstance(UserAttribute, data as Record<string, any>, {
					excludePrefixes: ['__'],
				}),
			)
		}

		return attributes
	}

	/**
	 * Retrieves a attribute from the database.
	 *
	 * @param {string} id - The ID of the attribute to retrieve.
	 *
	 * @returns {UserAttribute} - The requested attribute.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async get(id: string): Promise<UserAttribute> {
		if (!this.userId)
			throw new Error(
				'Retrieving an attribute can only be done for a certain user.',
			)

		// Fetch the attribute from Firestore
		let doc
		try {
			doc = await firestore
				.collection('users')
				.doc(this.userId)
				.collection('attributes')
				.doc(id)
				.get()
		} catch (caughtError: unknown) {
			const error = caughtError as any
			// Handle a not found error, but pass on the rest as a backend error
			if (error.code === 'not-found') {
				throw new ServerError('entity-not-found')
			} else {
				console.trace(error)
				throw new ServerError('backend-error')
			}
		}

		// If the document does not exist, skip it
		const data = doc.data()
		if (!doc.exists || !data) {
			throw new ServerError('entity-not-found')
		}

		// Convert the document retrieved into an instance of a `UserAttribute` class
		for (const snapshot of data.history) {
			const time = new Date(Date.UTC(1970, 0, 1))
			time.setSeconds(snapshot.timestamp._seconds)

			snapshot.timestamp = new Date(time)
		}

		// Return the object as an instance of the `UserAttribute` class
		return plainToInstance(UserAttribute, data as Record<string, any>, {
			excludePrefixes: ['__'],
		})
	}

	/**
	 * Stores a attribute in the database.
	 *
	 * @param {UserAttribute} data - The data to store in the attribute.
	 *
	 * @returns {UserAttribute} - The created attribute.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 */
	async create(data: UserAttribute): Promise<UserAttribute> {
		if (!this.userId)
			throw new Error(
				'Creating an attribute can only be done for a certain user.',
			)

		// Check if the attribute is a valid attribute
		try {
			const doc = await firestore.collection('attributes').doc(data.id).get()
			if (!doc.exists || !doc.data()) throw new Error('Trigger the catch block')
		} catch {
			throw new ServerError(
				'not-allowed',
				'The attribute ID does not refer to a valid attribute. Retrieve a list of valid attributes by making a GET request to /attributes.',
			)
		}

		// Convert the `UserAttribute` instance to a firebase document and save it
		try {
			// Check if the document exists
			const attributeDocument = await firestore
				.collection('users')
				.doc(this.userId)
				.collection('attributes')
				.doc(data.id)
				.get()

			// If it does, then return an 'already-exists' error
			if (attributeDocument.exists) {
				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			const serializedUserAttribute = instanceToPlain(data)
			serializedUserAttribute._userId = this.userId
			// Add the data into the database
			await firestore
				.collection('users')
				.doc(this.userId)
				.collection('attributes')
				.doc(data.id)
				.set(serializedUserAttribute)

			// If the transaction was successful, return the created attribute
			return data
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(error)
			throw new ServerError('backend-error')
		}
	}

	/**
	 * Updates a attribute in the database.
	 *
	 * @param {Partial<UserAttribute>} data - A list of properties to update and the value to set.
	 *
	 * @returns {UserAttribute} - The updated attribute.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async update(data: Partial<UserAttribute>): Promise<UserAttribute> {
		if (!this.userId)
			throw new Error(
				'Updating an attribute can only be done for a certain user.',
			)

		// Update given fields for the attribute in Firestore
		try {
			// First retrieve the attribute
			const existingUserAttributeDoc = await firestore
				.collection('users')
				.doc(this.userId)
				.collection('attributes')
				.doc(data.id!)
				.get()

			// If it does not exist, then return a 'not-found' error
			const existingData = existingUserAttributeDoc.data()
			if (!existingUserAttributeDoc.exists || !existingData) {
				throw new ServerError('entity-not-found')
			}

			// Else update away!
			for (const snapshot of existingData.history) {
				const time = new Date(Date.UTC(1970, 0, 1))
				time.setSeconds(snapshot.timestamp._seconds)

				snapshot.timestamp = new Date(time)
			}

			const serializedUserAttribute = instanceToPlain({
				...existingData,
				...data,
				history: data.history ?? [],
			})

			serializedUserAttribute._userId = this.userId
			// Merge the data with the existing data in the database
			await firestore
				.collection('users')
				.doc(this.userId)
				.collection('attributes')
				.doc(data.id!)
				.set(serializedUserAttribute)

			// If the transaction was successful, return the updated attribute
			return plainToInstance(UserAttribute, serializedUserAttribute, {
				excludePrefixes: ['__'],
			})
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(error)

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
	 * Deletes a attribute in the database.
	 *
	 * @param {string} id - The ID of the attribute to delete.
	 *
	 * @returns {void}
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async delete(id: string): Promise<void> {
		if (!this.userId)
			throw new Error(
				'Deleting an attribute can only be done for a certain user.',
			)

		// Delete the document
		try {
			await firestore
				.collection('users')
				.doc(this.userId)
				.collection('attributes')
				.doc(id)
				.delete()
		} catch (caughtError: unknown) {
			const error = caughtError as any
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

export const provider = new UserAttributeProvider()
