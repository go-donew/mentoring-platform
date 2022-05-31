// @/helpers/test-data.ts
// Helper functions to get test data

import { readFile } from 'node:fs/promises'

/**
 * Returns the test data for a certain endpoint.
 *
 * @param {string} path - The path to the test data file.
 */
export const testData = async (
	path: string,
	data?: Record<string, string>,
): Promise<Record<string, unknown>> => {
	// Read the file
	let json = JSON.parse(
		await readFile(
			`tests/data/${/\.[json]$/.test(path) ? path : path + '.json'}`,
			'utf8',
		),
	) as Record<string, unknown>

	// Replace all placeholders
	for (const [field, value] of Object.entries(data ?? {})) {
		json = JSON.parse(
			JSON.stringify(json).replace(new RegExp(`{${field}}`, 'gm'), value),
		)
	}

	// Return the data
	return json
}
