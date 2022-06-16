// @/provider/data/report.ts
// Retrieves, creates, updates and deletes reports in Firebase.

import { instanceToPlain, plainToInstance } from 'class-transformer'

import { Report } from '@/models/report'
import { ServerError } from '@/errors'
import { firestore } from '@/provider/data/firestore'

import type { Query, DataProvider } from '@/types'

/**
 * A interface that a data provider must implement.
 */
class ReportProvider implements DataProvider<Report> {
	/**
	 * Lists/searches through all reports.
	 *
	 * @param {Array<Query>} queries - A list of queries to filter the reports.
	 *
	 * @returns {Report[]} - Array of reports matching the query.
	 * @throws {ServerError} - 'backend-error'
	 */
	async find(queries: Array<Query<Report>>): Promise<Report[]> {
		// Build the query
		const reportsRef = firestore.collection('reports')
		let foundReports = reportsRef.orderBy('name')
		for (const query of queries) {
			let { field } = query
			let operator = query.operator as '<' | '<=' | '==' | '!=' | '>=' | '>'
			let value = query.value as any

			if (query.operator === 'includes') {
				field = `__${query.field}.${query.value as string}`
				operator = '=='
				value = true
			}

			foundReports = foundReports.where(field, operator, value)
		}

		// Execute the query
		let docs
		try {
			;({ docs } = await foundReports.get())
		} catch (error: unknown) {
			console.trace(error)
			throw new ServerError('backend-error')
		}

		// Convert the documents retrieved into instances of a `Report` class
		const reports = []
		for (const doc of docs) {
			// If the document does not exist, skip it
			const data = doc.data()
			if (!doc.exists || !data) {
				continue
			}

			// Add it to the array
			reports.push(
				plainToInstance(Report, data as Record<string, any>, {
					excludePrefixes: ['__'],
				}),
			)
		}

		return reports
	}

	/**
	 * Retrieves a report from the database.
	 *
	 * @param {string} id - The ID of the report to retrieve.
	 *
	 * @returns {Report} - The requested report.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async get(id: string): Promise<Report> {
		// Fetch the report from Firestore
		let doc
		try {
			doc = await firestore.collection('reports').doc(id).get()
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

		// Convert the document retrieved into an instance of a `Report` class
		const data = doc.data()
		// If the document does not exist, skip it
		if (!doc.exists || !data) {
			throw new ServerError('entity-not-found')
		}

		// Return the object as an instance of the `Report` class
		return plainToInstance(Report, data as Record<string, any>, {
			excludePrefixes: ['__'],
		})
	}

	/**
	 * Stores a report in the database.
	 *
	 * @param {Report} data - The data to store in the report.
	 *
	 * @returns {Report} - The created report.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 */
	async create(data: Report): Promise<Report> {
		// Convert the `Report` instance to a firebase document and save it
		try {
			// Check if the document exists
			const reportDocument = await firestore
				.collection('reports')
				.doc(data.id)
				.get()

			// If it does, then return an 'already-exists' error
			if (reportDocument.exists) {
				throw new ServerError('entity-already-exists')
			}

			// Else insert away!
			const serializedReport = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedReport.__input = {}
			serializedReport.__tags = {}
			for (const attribute of Object.keys(serializedReport.input))
				serializedReport.__input[attribute] = true
			for (const tag of Object.keys(serializedReport.tags))
				serializedReport.__tags[tag] = true
			// Add the data into the database
			await firestore.collection('reports').doc(data.id).set(serializedReport)

			// If the transaction was successful, return the created report
			return data
		} catch (error: unknown) {
			// Pass on any error as a backend error
			console.trace(error)
			throw new ServerError('backend-error')
		}
	}

	/**
	 * Updates a report in the database.
	 *
	 * @param {Partial<Report>} data - A list of properties to update and the value to set.
	 *
	 * @returns {Report} - The updated report.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async update(data: Partial<Report>): Promise<Report> {
		// Update given fields for the report in Firestore
		try {
			// First retrieve the report
			const existingReportDoc = await firestore
				.collection('reports')
				.doc(data.id!)
				.get()

			// If it does not exist, then return a 'not-found' error
			if (!existingReportDoc.exists) {
				throw new ServerError('entity-not-found')
			}

			// Else update away!
			const serializedReport = instanceToPlain(data)
			// Add some extra fields for easy querying
			serializedReport.__input = {}
			serializedReport.__tags = {}
			for (const attribute of Object.keys(serializedReport.input))
				serializedReport.__input[attribute] = true
			for (const tag of Object.keys(serializedReport.tags))
				serializedReport.__tags[tag] = true
			// Merge the data with the existing data in the database
			await firestore.collection('reports').doc(data.id!).set(serializedReport)

			// If the transaction was successful, return the updated report
			return plainToInstance(
				Report,
				{
					...existingReportDoc.data(),
					...data,
				} as Record<string, any>,
				{ excludePrefixes: ['__'] },
			)
		} catch (error: unknown) {
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
	 * Deletes a report in the database.
	 *
	 * @param {string} id - The ID of the report to delete.
	 *
	 * @returns {void}
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 */
	async delete(id: string): Promise<void> {
		// Delete the document
		try {
			await firestore.collection('reports').doc(id).delete()
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

export const provider = new ReportProvider()
