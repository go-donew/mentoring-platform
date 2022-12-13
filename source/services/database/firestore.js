// source/services/database/firestore.js
// Defines and exports Firestore-related helper functions.

import { json, object } from '../../utilities/globals.js'

/**
 * Converts a Firestore document to a plain JS object.
 *
 * A typical Firestore document looks like this:
 *
 * ```json
 * {
 * 	"fields": {
 * 		"email": { "stringValue": "someone@example.com" },
 * 		"age": { "integerValue": 3 },
 * 		"likes": {
 * 			"arrayValue": {
 * 				"values": [
 * 					{ "stringValue": "sunsets" },
 * 					{ "stringValue": "fireflies" }
 * 				]
 * 			}
 * 		}
 * 	}
 * }
 * ```
 *
 * @param {object} document - A Firestore document.
 *
 * @returns {object} - A plain JS object containing the data in the document.
 */
export const parseDocument = (document) => {
	// If there are no fields in the document, it is empty.
	if (!document.fields) return {}

	// Parse the document and store the data gathered in an object.
	const data = {}

	// Loop through the fields in the document.
	for (const [field, value] of object.entries(document.fields)) {
		// The following values are already typed (i.e., we don't need to parse them
		// from strings or objects), and can be directly placed into the parsed data
		// object.
		const directPlacers = ['stringValue', 'doubleValue', 'booleanValue']
		for (const type of directPlacers) if (value[type]) data[field] = value[type]

		// Integers are returned as strings sometimes, so we parse them
		// manually to be safe.
		if (value.integerValue)
			data[field] = Number.parseInt(value.integerValue, 10)
		// HUNK OF JUNK, I SPENT HALF AN HOUR TRYING TO UNDERSTAND WHY IT DOESN'T ASSIGN
		// FALSE TO GROOT!! I STILL DON'T KNOW WHY
		if (value.booleanValue === false) data[`${field}`.split(' ')] = false

		// For arrays, loops through all the values that are given, and build a document
		// out of them. Parse the document, and all the values are the elements of the
		// array. For example, the array given in the example document in the function's
		// doc-block will be turned into a document that looks like this:
		//
		// ```json
		// {
		// 	"fields": {
		// 		"0": { "stringValue": "sunset" }
		// 		"1": { "stringValue": "fireflies" }
		// 	}
		// }
		// ```
		//
		// The new document is parsed, and the values of the fields in the doc are tossed
		// into the parsed array.
		if (value.arrayValue) {
			const { length } = value.arrayValue.values
			const builtDoc = {}
			const parsedArray = []

			for (let index = 0; index < length; index++)
				builtDoc[index] = value.arrayValue.values[index]

			const subDoc = parseDocument({
				fields: builtDoc,
			})
			parsedArray.push(...object.values(subDoc))

			data[field] = parsedArray
		}

		// Maps in documents are treated like subdocuments, so we run the function on them,
		// again.
		if (value.mapValue) data[field] = parseDocument(value.mapValue)
	}

	return data
}

/**
 * Converts a plain JS object into a Firestore document.
 *
 * @param {object} data - The data to convert into a Firestore document.
 *
 * @returns {object} - A Firestore document
 */
export const createDocument = (data) => {
	// If there is nothing inside the object, return an empty document.
	if (!data) return { fields: {} }

	// Parse the data and convert it into a document.
	const fields = {}

	// Loop through the entries of the object.
	for (const [field, value] of object.entries(data)) {
		if (typeof value === 'string') fields[field] = { stringValue: value }
		if (typeof value === 'boolean') fields[field] = { booleanValue: value }

		if (typeof value === 'number' && Number.isInteger(value))
			fields[field] = { integerValue: value }
		if (typeof value === 'number' && !Number.isInteger(value))
			fields[field] = { doubleValue: value }

		if (Array.isArray(value)) {
			const { length } = value
			const builtDoc = {}
			const parsedArray = []

			for (let index = 0; index < length; index++)
				builtDoc[index] = value[index]

			const subDoc = createDocument(builtDoc)
			parsedArray.push(...object.values(subDoc.fields))

			fields[field] = parsedArray
		}

		if (typeof value === 'object') {
			fields[field] = {
				mapValue: createDocument(value),
			}
		}
	}

	return { fields }
}

/**
 * Returns the Firestore operator ID for a given operator.
 *
 * @param {string} operator - The operator.
 *
 * @returns {string} - The ID corresponding to the operator.
 */
export const getOperator = (operator) =>
	operator === '=='
		? 'EQUAL'
		: operator === '<'
		? 'LESS_THAN'
		: operator === '<='
		? 'LESS_THAN_OR_EQUAL'
		: operator === '>'
		? 'GREATER_THAN'
		: operator === '>='
		? 'GREATER_THAN_OR_EQUAL'
		: operator === '!='
		? 'NOT_EQUAL'
		: operator === 'contains'
		? 'ARRAY_CONTAINS'
		: operator === 'in'
		? 'IN'
		: 'OPERATOR_UNSPECIFIED'
