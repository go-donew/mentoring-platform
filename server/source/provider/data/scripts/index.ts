// @/provider/data/script.ts
// Retrieves, creates, updates and deletes scripts in Firebase.

import { instanceToPlain, plainToInstance } from 'class-transformer'

import { Script } from '@/models/script'
import { ServerError } from '@/errors'
import { firestore } from '@/provider/data/firestore'

import type { Query, DataProvider } from '@/types'

/**
 * A interface that a data provider must implement.
 */
class ScriptProvider implements DataProvider<Script> {
	/**
	 * Lists/searches through all scripts.
	 *
	 * @param {Array<Query>} queries - A list of queries to filter the scripts.
	 *
	 * @returns {Script[]} - Array of scripts matching the query.
	 * @throws {ServerError} - 'backend-error'
	 */
	async find(queries: Array<Query<Script>>): Promise<Script[]> {
		// Build the query
		const scriptsRef = firestore.collection('scripts')
		let foundScripts = scriptsRef.orderBy('name')
		for (const query of queries) {
			let { field } = query
			let operator = query.operator as '<' | '<=' | '==' | '!=' | '>=' | '>'
			let value = query.value as any

			if (query.operator === 'includes') {
				field = `__${query.field}.${query.value as string}`
				operator = '=='
				value = true
			}

			foundScripts = foundScripts.where(field, operator, value)
		}

		// Execute the query
		let docs
		try {
			;({ docs } = await foundScripts.get())
		} catch (error: unknown) {
			console.trace(error)
			throw new ServerError('backend-error')
		}

		// Convert the documents retrieved into instances of a `Script` class
		const scripts = []
		for (const doc of docs) {
			// If the document does not exist, skip it
			const data = doc.data()
			if (!doc.exists || !data) {
				continue
			}

			// Add it to the array
			scripts.push(
				plainToInstance(Script, data as Record<string, any>, {
					excludePrefixes: ['__'],
				}),
			)
		}

		return scripts
	}

	/**
	 * Retrieves a script from the database.
	 *
	 * @param {string} id - The ID of the script to retrieve.
	 *
	 * @returns {Script} - The requested script.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async get(id: string): Promise<Script> {
		// Fetch the script from Firestore
		let doc
		try {
			doc = await firestore.collection('scripts').doc(id).get()
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

		// Convert the document retrieved into an instance of a `Script` class
		const data = doc.data()
		// If the document does not exist, skip it
		if (!doc.exists || !data) {
			throw new ServerError('entity-not-found')
		}

		// Return the object as an instance of the `Script` class
		return plainToInstance(Script, data as Record<string, any>, {
			excludePrefixes: ['__'],
		})
	}

	/**
	 * Stores a script in the database.
	 *
	 * @param {Script} data - The data to store in the script.
	 *
	 * @returns {Script} - The created script.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 */
	async create(data: Script): Promise<Script> {
		// Convert the `Script` instance to a firebase document and save it
		try {
			// Check if the document exists
			const scriptDocument = await firestore
				.collection('scripts')
				.doc(data.id)
				.get()

			// If it does, then return an 'already-exists' error
			if (scriptDocument.exists) {
				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			const serializedScript = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedScript.__input = {}
			serializedScript.__computed = {}
			serializedScript.__tags = {}
			for (const attribute of Object.keys(serializedScript.input))
				serializedScript.__input[attribute] = true
			for (const attribute of Object.keys(serializedScript.computed))
				serializedScript.__computed[attribute] = true
			for (const tag of Object.keys(serializedScript.tags))
				serializedScript.__tags[tag] = true
			// Add the data into the database
			await firestore.collection('scripts').doc(data.id).set(serializedScript)

			// If the transaction was successful, return the created script
			return data
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(error)
			throw new ServerError('backend-error')
		}
	}

	/**
	 * Updates a script in the database.
	 *
	 * @param {Partial<Script>} data - A list of properties to update and the value to set.
	 *
	 * @returns {Script} - The updated script.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async update(data: Partial<Script>): Promise<Script> {
		// Update given fields for the script in Firestore
		try {
			// First retrieve the script
			const existingScriptDoc = await firestore
				.collection('scripts')
				.doc(data.id!)
				.get()

			// If it does not exist, then return a 'not-found' error
			if (!existingScriptDoc.exists) {
				throw new ServerError('entity-not-found')
			}

			// Else update away!
			const serializedScript = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedScript.__input = {}
			serializedScript.__computed = {}
			serializedScript.__tags = {}
			for (const attribute of Object.keys(serializedScript.input))
				serializedScript.__input[attribute] = true
			for (const attribute of Object.keys(serializedScript.computed))
				serializedScript.__computed[attribute] = true
			for (const tag of Object.keys(serializedScript.tags))
				serializedScript.__tags[tag] = true
			// Merge the data with the existing data in the database
			await firestore.collection('scripts').doc(data.id!).set(serializedScript)

			// If the transaction was successful, return the updated script
			return plainToInstance(
				Script,
				{
					...existingScriptDoc.data(),
					...data,
				} as Record<string, any>,
				{ excludePrefixes: ['__'] },
			)
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
	 * Deletes a script in the database.
	 *
	 * @param {string} id - The ID of the script to delete.
	 *
	 * @returns {void}
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async delete(id: string): Promise<void> {
		// Delete the document
		try {
			await firestore.collection('scripts').doc(id).delete()
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

export const provider = new ScriptProvider()
