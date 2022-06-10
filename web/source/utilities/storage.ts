// source/utilities/storage.ts
// A wrapper around `localStorage` to make it easier to use.

const json = JSON
const dataPrefix = 'data'
const cachePrefix = 'cache'

/**
 * A wrapper around `localStorage`, that supports storing JSON objects/arrays.
 */
export const storage = {
	/**
	 * A function to check if data is stored in local storage.
	 *
	 * @param {string} key - The name of the object to check.
	 *
	 * @returns {boolean} - Whether any data with the passed name is stored in local storage.
	 */
	exists(key: string): boolean {
		const serializedData = localStorage.getItem(`${dataPrefix}:${key}`)

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

		localStorage.setItem(`${dataPrefix}:${key}`, serializedData)

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
		const serializedData = localStorage.getItem(`${dataPrefix}:${key}`)

		if (serializedData === null) return undefined

		return json.parse(serializedData) as T
	},

	/**
	 * A function to delete data stored in local storage.
	 *
	 * @param {string} key - The name of the data to delete.
	 */
	delete: (key: string): void =>
		localStorage.removeItem(`${dataPrefix}:${key}`),
}

/**
 * A caching utility that uses `localStorage` to store data.
 */
export const cache = {
	/**
	 * A function to check if data exists in cache.
	 *
	 * @param {string} key - The name of the object to check.
	 *
	 * @returns {boolean} - Whether any data with the passed name is stored in cache and has not expired.
	 */
	exists(key: string): boolean {
		const serializedData = localStorage.getItem(`${cachePrefix}:${key}`)

		return (
			serializedData !== null && json.parse(serializedData).expiry < Date.now()
		)
	},

	/**
	 * A function to cache data in Local Storage.
	 *
	 * @param {string} key - The name that will be used to access the data.
	 * @param {T} data - The data to cache.
	 * @param {number} expiry - The time, in seconds, after which the cache expires.
	 *
	 * @returns {T} - The cached data.
	 */
	set<T = unknown>(key: string, data: T, expiry: number): T {
		const serializedData = json.stringify({
			expiry: Date.now() + expiry * 1000, // Date.now() returns a timestamp in milliseconds, so ensure expiry is also in milliseconds
			value: data,
		})

		localStorage.setItem(`${cachePrefix}:${key}`, serializedData)

		return data
	},

	/**
	 * A function to retrieve cached data stored in Local Storage.
	 *
	 * @param {string} key - The name of the data to retrieve.
	 *
	 * @returns {T | undefined} - The stored data or `undefined` if it does not exist/has expired.
	 */
	get<T = unknown>(key: string): T | undefined {
		const serializedData = json.parse(
			localStorage.getItem(`${cachePrefix}:${key}`) ?? 'null',
		)

		if (serializedData === null) return undefined

		// Delete the cached data if it has expired
		if (serializedData.expiry < Date.now()) {
			this.delete(key)
			return undefined
		}

		return serializedData.value as T
	},

	/**
	 * A function to delete cached data stored in Local Storage.
	 *
	 * @param {string} key - The name of the data to delete.
	 */
	delete: (key: string): void =>
		localStorage.removeItem(`${cachePrefix}:${key}`),
}
