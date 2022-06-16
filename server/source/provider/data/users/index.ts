// @/provider/data/users.ts
// Retrieves, creates, updates and deletes users in Firebase.

import { instanceToPlain, plainToInstance } from 'class-transformer'

import { ServerError } from '@/errors'
import { User } from '@/models/user'
import { firestore } from '@/provider/data/firestore'

import type { Query, DataProvider } from '@/types'

/**
 * A interface that a data provider must implement.
 */
class UserProvider implements DataProvider<User> {
	/**
	 * Lists/searches through all users.
	 *
	 * @param {Array<Query>} queries - A list of queries to filter the users.
	 *
	 * @returns {User[]} - Array of users matching the query.
	 * @throws {ServerError} - 'backend-error'
	 */
	async find(queries: Array<Query<User>>): Promise<User[]> {
		// Build the query
		const usersQuery = firestore.collection('users')
		for (const query of queries) {
			let { field } = query
			let operator = query.operator as '<' | '<=' | '==' | '!=' | '>=' | '>'
			let value = query.value as unknown

			if (query.operator === 'includes') {
				field = `__${query.field}.${query.value as string}`
				operator = '=='
				value = true
			}

			usersQuery.where(field, operator, value)
		}

		// Execute the query
		let docs
		try {
			;({ docs } = await usersQuery.get())
		} catch (error: unknown) {
			console.trace(error)
			throw new ServerError('backend-error')
		}

		// Convert the documents retrieved into instances of a `User` class
		const users = []
		for (const doc of docs) {
			// If the document does not exist, skip it
			if (!doc.exists) {
				continue
			}

			// Convert the `lastSignedIn` field from a `Timestamp` to a `Date`
			const data = doc.data()
			data.lastSignedIn = data.lastSignedIn.toDate()

			// Add it to the array
			users.push(plainToInstance(User, data as Record<string, any>))
		}

		return users
	}

	/**
	 * Retrieves a user from the database.
	 *
	 * @param {string} id - The ID of the user to retrieve.
	 *
	 * @returns {User} - The requested user.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async get(id: string): Promise<User> {
		// Fetch the user from Firestore
		let doc
		try {
			doc = await firestore.collection('users').doc(id).get()
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

		// Convert the document retrieved into an instance of a `User` class
		const data = doc.data()
		// If the document does not exist, skip it
		if (!doc.exists || !data) {
			throw new ServerError('entity-not-found')
		}

		// Convert the `lastSignedIn` field from a `Timestamp` to a `Date`
		data.lastSignedIn = data.lastSignedIn.toDate()

		// Return the object as an instance of the `User` class
		return plainToInstance(User, data as Record<string, any>)
	}

	/**
	 * Stores a user in the database.
	 *
	 * @param {User} data - The data to store in the user.
	 *
	 * @returns {User} - The created user.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 */
	async create(data: User): Promise<User> {
		// Convert the `User` instance to a firebase document and save it
		try {
			// Check if the document exists
			const userDocument = await firestore
				.collection('users')
				.doc(data.id)
				.get()

			// If it does, then return an 'already-exists' error
			if (userDocument.exists) {
				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			// @ts-expect-error This shouldn't even need to happen, but to be safe due to the weirdness
			// of `class-transformer`
			delete data.password
			const serializedUser = instanceToPlain(data)
			await firestore.collection('users').doc(data.id).set(serializedUser)

			// If the transaction was successful, return the created user
			return data
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(error)
			throw new ServerError('backend-error')
		}
	}

	/**
	 * Updates a user in the database.
	 *
	 * @param {string} data - A list of properties to update and the value to set.
	 *
	 * @returns {User} - The updated user.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async update(data: Partial<User>): Promise<User> {
		// Update given fields for the user in Firestore
		try {
			// First retrieve the user
			const userDocument = await firestore
				.collection('users')
				.doc(data.id!)
				.get()

			// If it does not exist, then return a 'not-found' error
			if (!userDocument.exists) {
				throw new ServerError('entity-not-found')
			}

			// Else update away!
			await firestore
				.collection('users')
				.doc(data.id!)
				.set(instanceToPlain(data))

			// If the transaction was successfull, return the updated user
			return plainToInstance(User, {
				...userDocument.data(),
				...data,
			} as Record<string, any>)
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
	 * Deletes a user in the database.
	 *
	 * @param {string} id - The ID of the user to delete.
	 *
	 * @returns {void}
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async delete(id: string): Promise<void> {
		// Delete the document
		try {
			await firestore.collection('users').doc(id).delete()
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

export const provider = new UserProvider()
