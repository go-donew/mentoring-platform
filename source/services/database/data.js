// source/services/database/data.js
// Helps convert Firebase documents to POJOs.

import { object } from '../../utilities/globals.js'

/**
 * Converts a Firestore document to a plain JS object.
 *
 * @param {object} document - A Firestore document.
 *
 * @returns {object} - A plain JS object containing the data in the document.
 */
export const parseDocument = (document) => {
	if (!document.fields) return undefined

	const data = {}
	for (const [field, value] of object.entries(document.fields)) {
		const directPlacers = ['stringValue', 'booleanValue', 'doubleValue']

		for (const type of directPlacers) {
			if (value[type]) data[field] = value[type]
		}

		if (value['integerValue']) data[field] = parseInt(value['integerValue'])

		if (value['arrayValue']) {
			const length = value['arrayValue'].values.length
			const builtDoc = {}
			const parsedArray = []

			for (let index = 0; index < length; index++) {
				builtDoc[index] = value['arrayValue'].values[index]
			}

			const subDoc = parseDocument({
				fields: builtDoc,
			})
			parsedArray.push(...object.values(subDoc))

			data[field] = parsedArray
		}

		if (value['mapValue']) {
			data[field] = parseDocument(value['mapValue'])
		}
	}

	return data
}
