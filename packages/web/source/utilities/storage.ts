// source/utilities/storage.ts
// A wrapper around `localStorage` to make it easier to use.

const json = JSON
const prefix = 'data'

export const storage = {
	/**
	 * A function to check if data is stored in local storage.
	 *
	 * @param {string} key - The name of the object to check.
	 *
	 * @returns {boolean} - Whether any data with the passed name is stored in local storage.
	 */
	exists(key: string): boolean {
		const serializedData = localStorage.getItem(`${prefix}:${key}`)

		return serializedData !== null
	},

	/**
	 * A function to store data in local storage.
	 *
	 * @param {string} key - The name that will be used to access the data.
	 * @param {T} data - The data to store.
	 *
	 * @returns {T} - The stored data.
	 */
	set<T = unknown>(key: string, data: T): T {
		const serializedData = json.stringify(data)

		localStorage.setItem(`${prefix}:${key}`, serializedData)

		return data
	},

	/**
	 * A function to retrieve data stored in local storage.
	 *
	 * @param {string} key - The name of the data to retrieve.
	 *
	 * @returns {T | undefined} - The stored data or `undefined` if it does not exist.
	 */
	get<T = unknown>(key: string): T | undefined {
		const serializedData = localStorage.getItem(`${prefix}:${key}`)

		if (serializedData === null) return undefined

		return json.parse(serializedData) as T
	},

	/**
	 * A function to delete data stored in local storage.
	 *
	 * @param {string} key - The name of the data to delete.
	 */
	delete: (key: string): void => localStorage.removeItem(`${prefix}:${key}`),
}
