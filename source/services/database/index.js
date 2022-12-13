// source/services/database.js
// Defines and exports the database service used by the server.

import got from 'got'

import { config } from '../../utilities/config.js'
import { logger } from '../../utilities/logger.js'
import { ServerError } from '../../utilities/errors.js'

import { getOperator, parseDocument, createDocument } from './firestore.js'

// If we are in a development environment, connect to the emulator. In the
// Cloud Functions environment, we will be provided project info via the
// `GOOGLE_APPLICATION_CREDENTIALS` environment variable.
const options = config.services.database

const host = config.prod ? 'firestore.googleapis.com' : options.host
const protocol = /localhost|127/.test(host) ? 'http' : 'https'
const remote = `projects/${options.projectId}/databases/(default)/documents`
const endpoints = {
	data: `${host}/v1/${remote}`,
	query: `${host}/v1/${remote}:runQuery`,
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
		prefixUrl: `${protocol}://${endpoints.data}/`,
		// Don't throw errors, just return them as responses and we will handle
		// the rest.
		throwHttpErrors: false,
		// Allow making a GET request with a body.
		allowGetBody: true,
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

		if (refs.error) {
			logger.warn(refs.error, 'failed to fetch entities')
			throw new ServerError(
				'backend-error',
				`Failed to fetch entities under ${collection}`,
			)
		}

		return refs.documents.map((ref) => parseDocument(ref))
	},

	/**
	 * Lists the documents that satisfy the given condition in a Firestore collection.
	 *
	 * @param {string} collection - The name of the collection.
	 * @param {Query[]} queries - The list of filters to apply.
	 *
	 * @returns {Promise<T[]>} - The documents within that collection.
	 */
	async query(collection, queries) {
		const filters = []
		for (const query of queries) {
			filters.push({
				fieldFilter: {
					field: { fieldPath: query.field },
					op: getOperator(query.operator),
					value: { stringValue: query.value },
				},
			})
		}

		const refs = await got(`${protocol}://${endpoints.query}`, {
			headers: { authorization: `Bearer ${this.token}` },
			json: {
				structuredQuery: {
					from: [{ collectionId: collection }],
					where: {
						compositeFilter: { op: 'AND', filters },
					},
				},
			},
			method: 'post',
			throwHttpErrors: false,
		}).json()

		return refs
			.map((ref) => (ref.document ? parseDocument(ref.document) : undefined))
			.filter(Boolean)
	},

	/**
	 * Fetches a document from Firestore.
	 *
	 * @param {string} path - The path to the document.
	 *
	 * @returns {Promise<T>} - The document located at the given path.
	 */
	async get(path) {
		const ref = await this.fetch(path.replace(/^\//, ''), {
			headers: { authorization: `Bearer ${this.token}` },
		}).json()

		if (ref.error) {
			logger.warn(ref.error, 'failed to fetch entity')

			if (ref.error.code === 404)
				throw new ServerError(
					'entity-not-found',
					`Could not find entity ${path}`,
				)

			throw new ServerError('backend-error', `Failed to fetch entity ${path}`)
		}

		const doc = parseDocument(ref)

		return doc
	},

	/**
	 * Inserts/updates a document in Firestore.
	 *
	 * @param {string} path - The location to upsert the document.
	 * @param {T} data - The data to upsert.
	 *
	 * @returns {Promise<T>} - The document upserted at that path.
	 */
	async set(path, data) {
		const ref = await this.fetch(path.replace(/^\//, ''), {
			headers: { authorization: `Bearer ${this.token}` },
			json: createDocument(data),
			method: 'patch',
		}).json()

		if (ref.error) {
			logger.warn(ref.error, 'failed to upsert entity')
			throw new ServerError('backend-error', `Failed to upsert entity ${path}`)
		}

		const doc = parseDocument(ref)

		return doc
	},

	/**
	 * Deletes a document in Firestore.
	 *
	 * @param {string} path - The location of the document to delete.
	 */
	async delete(path) {
		const ref = await this.fetch(path.replace(/^\//, ''), {
			headers: { authorization: `Bearer ${this.token}` },
			method: 'delete',
		}).json()

		if (ref.error) {
			logger.warn(ref.error, 'failed to delete entity')
			throw new ServerError('backend-error', `Failed to delete entity ${path}`)
		}
	},
}
