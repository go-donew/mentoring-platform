// source/services/database.js
// Defines and exports the database service used by the server.

import got from 'got'

import { config } from '../../utilities/config.js'

import { parseDocument } from './data.js'

// If we are in a development environment, connect to the emulator. In the
// Cloud Functions environment, we will be provided project info via the
// `GOOGLE_APPLICATION_CREDENTIALS` environment variable.
const options = config.services.database

const host = config.prod ? 'firestore.googleapis.com' : options.host
const protocol = /localhost|127/.test(host) ? 'http' : 'https'
const endpoints = {
	origin: `${host}/v1/projects/${options.projectId}/databases/(default)/documents`,
}

export const database = {
	/**
	 * Firestore needs a user's ID token, not a service account's auth token.
	 */
	token: undefined,

	/**
	 * Custom instances of Got for making requests to the Firestore endpoints.
	 */
	fetch: got.extend({
		// Set the prefix URL to the server URL so we can mention only the endpoint
		// path in the rest of the code.
		prefixUrl: `${protocol}://${endpoints.origin}/`,
		// Don't throw errors, just return them as responses and we will handle
		// the rest.
		throwHttpErrors: false,
	}),

	/**
	 * Lists the documents in a Firestore collection.
	 *
	 * @param {string} collection - The name of the collection.
	 *
	 * @returns {Promise<T[]>} - The documents within that collection.
	 */
	async list(collection) {
		const refs = await this.fetch(collection, {
			headers: { authorization: `Bearer ${this.token}` },
		}).json()
		const docs = refs.documents.map(parseDocument)

		return docs
	},
}
