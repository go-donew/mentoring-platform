// @/types.ts
// Type declarations for the server.

import type { RateLimitInfo } from 'express-rate-limit'

import { ServerError, ErrorCode } from '@/errors'
import { User } from '@/models/user'

// Extend Express' types
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			/**
			 * The request ID.
			 */
			id: string

			/**
			 * The user making the request.
			 */
			user?: User & {
				isGroot: boolean
				token: string
			}

			/**
			 * The rate limit metadata for the request.
			 *
			 * @typedef {object} RateLimitInfo
			 * @property {number} limit.required - The total requests we can make in a window.
			 * @property {number} current.required - The number of requests made in the current window.
			 * @property {number} remaining.required - The number of requests we can still make.
			 * @property {string} resetTime - The time left before the window elapses.
			 */
			rateLimit: RateLimitInfo
		}

		interface Response {
			/**
			 * Send an error back to the client.
			 */
			sendError: (error: ErrorCode | ServerError) => void
		}
	}
}

// Route definitions for `/ping` and `/pong`
/**
 * GET /ping
 *
 * @summary Check if server is ready to accept connections
 * @tags internal
 *
 * @returns {string} 200 - A message
 *
 * @endpoint
 */
/**
 * GET /pong
 *
 * @summary Check if your authentication token is valid
 * @tags internal
 *
 * @security bearer
 *
 * @returns {string} 200 - A message
 * @returns {InvalidTokenError} 401 - The bearer token passed was invalid.
 *
 * @endpoint
 */

/**
 * The bearer token and refresh token set returned when a user signs in/up or
 * refreshes the token set.
 *
 * @typedef {object} Tokens
 * @property {string} bearer.required - The user's bearer token that must be passed in the `Authorization` header of subsequent requests.
 * @property {string} refresh.required - The refresh token used to retrieve a new set of tokens when the current set expires.
 */
export declare type Tokens = {
	/**
	 * The user's bearer token. Must be passed in the `Authorization` header in
	 * all requests.
	 *
	 * @type {string}
	 */
	bearer: string

	/**
	 * The user's refresh token. Used to retrieve a new set of tokens from the
	 * server if the bearer token expires.
	 *
	 * @type {string}
	 */
	refresh: string
}

/**
 * The contents of a bearer token.
 */
export declare type DecodedToken = {
	/**
	 * The user's ID.
	 *
	 * @type {string}
	 */
	sub: string
}

/**
 * The custom claims set on a user.
 */
export declare type CustomClaims = {
	/**
	 * Whether the user is `groot` (super-duper admin).
	 *
	 * @type {boolean}
	 */
	groot: boolean
}

/**
 * The object sent as a request to a service.
 */
export declare type ServiceRequest<D> = {
	/**
	 * The metadata of the request, i.e., who is making the request, and their
	 * rate limit data.
	 */
	context?: {
		user: User & {
			isGroot: boolean
			token: string
		}
		rate: RateLimitInfo
	}

	/**
	 * The request data.
	 */
	data: D
}

/**
 * The object sent back as a response from a service.
 */
export declare type ServiceResponse<D> = {
	/**
	 * The status code to set while responding.
	 */
	status?: number

	/**
	 * The response data.
	 */
	data?: D

	/**
	 * The error that occurred, if any.
	 */
	error?: ServerError
}

/**
 * A query on a entity.
 */
export declare type Query<T> = {
	/**
	 * The field name.
	 *
	 * @type {keyof T}
	 */
	field: keyof T | string // So we don't need to type cast everytime

	/**
	 * The query operator. Can be one of the following:
	 *
	 * - '=='
	 * - '!='
	 * - '>'
	 * - '<'
	 * - '>='
	 * - '<='
	 *
	 * @type {string}
	 */
	operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'includes'

	/**
	 * The value the field should be equal to, not equal to, etc.
	 *
	 * @type {T[keyof T]}
	 */
	value: T[keyof T]
}

/**
 * A interface that an authentication provider must implement.
 */
export declare interface AuthProvider {
	/**
	 * Signs a user up.
	 *
	 * @param {string} name - The user's display name.
	 * @param {string} email - The user's email address.
	 * @param {string} password - A password for the user's account.
	 *
	 * @returns {Object<userId: string, tokens: Tokens>} - The user's profile and tokens.
	 * @throws {ServerError} - 'improper-payload' | 'already-exists' | 'too-many-requests' | 'backend-error'
	 *
	 * @async
	 */
	signUp(
		name: string,
		email: string,
		password: string,
	): Promise<{ userId: string; tokens: Tokens }>

	/**
	 * Signs a user into their account.
	 *
	 * @param {string} email - The user's email address.
	 * @param {string} password - A password for the user's account.
	 *
	 * @returns {Object<userId: string, tokens: Tokens>} - The user's profile and tokens.
	 * @throws {ServerError} - 'improper-payload' | 'incorrect-credentials' | 'not-found' | 'backend-error'
	 *
	 * @async
	 */
	signIn(
		email: string,
		password: string,
	): Promise<{ userId: string; tokens: Tokens }>

	/**
	 * Given a refresh token, returns a new set of tokens for a user.
	 *
	 * @param {string} refreshToken - The refresh token returned when signing in/up.
	 *
	 * @returns {Tokens} - A new set of tokens for the user.
	 * @throws {ServerError} - 'improper-payload' | 'backend-error'
	 *
	 * @async
	 */
	refreshTokens(refreshToken: string): Promise<Tokens>

	/**
	 * Verifies a bearer token.
	 *
	 * @param {string} token - The token to verify.
	 *
	 * @returns {DecodedToken} - The contents of the bearer token.
	 * @throws {ServerError} - 'improper-payload' | 'backend-error'
	 *
	 * @async
	 */
	verifyToken(token: string): Promise<DecodedToken>

	/**
	 * Retrieve the custom claims set on a user.
	 *
	 * @param {string} userId - The ID of the user whose claims to retrieve.
	 *
	 * @returns {CustomClaims} - The custom claims set on a user.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 *
	 * @async
	 */
	retrieveClaims(userId: string): Promise<CustomClaims>
}

/**
 * A interface that a data provider must implement.
 */
export declare interface DataProvider<T> {
	/**
	 * Lists/searches through all entities.
	 *
	 * @param {Array<Query query>} - A list of queries to filter the entities.
	 * @param {unknown}
	 *
	 * @returns {T[]} - Array of entities matchin the query.
	 * @throws {ServerError} - 'backend-error'
	 *
	 * @async
	 */
	find(queries: Array<Query<T>>, options: unknown): Promise<T[]>

	/**
	 * Retrieves an entity from the database.
	 *
	 * @param {string} id - The ID of the entity to retrieve.
	 *
	 * @returns {T} - The requested entity.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 *
	 * @async
	 */
	get(id: string): Promise<T>

	/**
	 * Stores an entity in the database.
	 *
	 * @param {T} data - The data to store in the entity.
	 *
	 * @returns {T} - The created entity.
	 * @throws {ServerError} - 'already-exists' | 'backend-error'
	 *
	 * @async
	 */
	create(data: T): Promise<T>

	/**
	 * Updates an entity in the database.
	 *
	 * @param {string} data - A list of properties to update and the value to set.
	 *
	 * @returns {T} - The updated entity.
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 *
	 * @async
	 */
	update(data: Partial<T>): Promise<T>

	/**
	 * Deletes an entity in the database.
	 *
	 * @param {string} id - The ID of the entity to delete.
	 *
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 *
	 * @async
	 */
	delete(id: string): Promise<void>
}
