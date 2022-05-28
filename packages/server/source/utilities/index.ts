// @/utilities/index.ts
// Utility functions that are used in multiple places.

import type { Request, Response, NextFunction, RequestHandler } from 'express'

import { customAlphabet } from 'nanoid'

/**
 * Generates a random 28 long alphanum ID that matches Firebase's IDs.
 *
 * @returns {string}
 */
export const generateId = customAlphabet(
	'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
	28,
)

/**
 * Shuffles an array. Taken from the 'knuth-shuffle-seed' package as it had no
 * type definitions.
 *
 * @param {array<T>} array - The array of objects to shuffle.
 *
 * @returns {array<T>} - The shuffled array.
 */
export const shuffle = <T>(array: T[]): T[] => {
	let currentIndex
	let temporaryValue
	let randomIndex

	currentIndex = array.length

	while (currentIndex !== 0) {
		randomIndex = Math.floor(Math.random() * currentIndex--)

		temporaryValue = array[currentIndex]
		array[currentIndex] = array[randomIndex]
		array[randomIndex] = temporaryValue
	}

	return array
}

/**
 * Catches asynchronous errors thrown in middleware, and forwards them using
 * the `next` function
 *
 * @param fn {RequestHandler} - The request handler for which to handle errors
 *
 * @returns {RequestHandler} - The request handler wrapped with a `.catch` clause
 */
export const handleAsyncErrors =
	(fn: RequestHandler): RequestHandler =>
	async (request: Request, response: Response, next: NextFunction) => {
		try {
			await Promise.resolve(fn(request, response, next)).catch(next)
		} catch (error: unknown) {
			next(error)
		}
	}
