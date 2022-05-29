// @/errors/index.ts
// We <3 errors! No, not really XD

/**
 * A list of errors we can return.
 */
export const errors = {
	/**
	 * Error to return when the request body contained invalid data.
	 *
	 * @typedef {object} ImproperPayloadError
	 *
	 * @property {string} code.required - The error code. - enum:improper-payload
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:400
	 */
	'improper-payload': {
		message: `The request body did not contain valid data needed to perform the operation.`,
		status: 400,
	},

	/**
	 * Error to return when the bearer token passed by the user is invalid.
	 *
	 * @typedef {object} InvalidTokenError
	 *
	 * @property {string} code.required - The error code. - enum:invalid-token
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:401
	 */
	'invalid-token': {
		message: `Could not find a valid access token in the 'Authorization' header. Please retrieve an access token by authenticating via the '/auth/signin' endpoint, and place it in the 'Authorization' header.`,
		status: 401,
	},

	/**
	 * Error to return when the credentials (usually password) passed by the user
	 * were incorrect.
	 *
	 * @typedef {object} IncorrectCredentialsError
	 *
	 * @property {string} code.required - The error code. - enum:incorrect-credentials
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:401
	 */
	'incorrect-credentials': {
		message: `The credentials passed were invalid. Please pass valid credentials and try again.`,
		status: 401,
	},

	/**
	 * Error to return when the user is not authorized to perform an operation.
	 *
	 * @typedef {object} NotAllowedError
	 *
	 * @property {string} code.required - The error code. - enum:not-allowed
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:403
	 */
	'not-allowed': {
		message: `You cannot perform this operation.`,
		status: 403,
	},

	/**
	 * Error to return when the requested entity was not found.
	 *
	 * @typedef {object} EntityNotFoundError
	 *
	 * @property {string} code.required - The error code. - enum:entity-not-found
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:404
	 */
	'entity-not-found': {
		message: `The requested entity was not found.`,
		status: 404,
	},

	/**
	 * Error to return when the route requested by the user doesn't exist.
	 *
	 * @typedef {object} RouteNotFoundError
	 *
	 * @property {string} code.required - The error code. - enum:route-not-found
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:404
	 */
	'route-not-found': {
		message: `The requested route was not found. Take a look at the documentation for a list of valid endpoints.`,
		status: 404,
	},

	/**
	 * Error to return when an entity with the same value in a unique field exists.
	 *
	 * @typedef {object} EntityAlreadyExistsError
	 *
	 * @property {string} code.required - The error code. - enum:entity-already-exists
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:409
	 */
	'entity-already-exists': {
		message: `An entity with the same ID already exists.`,
		status: 409,
	},

	/**
	 * Error to return when the user tries to do something that requires certain
	 * conditions to be met, and those conditions have not been met.
	 *
	 * @typedef {object} PreconditionFailedError
	 *
	 * @property {string} code.required - The error code. - enum:precondition-failed
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:412
	 */
	'precondition-failed': {
		message: `To perform this action, certain preconditions need to be met. Unfortunately, one or more of these conditions have not been met. Please try again after these preconditions have been met.`,
		status: 412,
	},

	/**
	 * Error to return when the user gets rate limited.
	 *
	 * @typedef {object} TooManyRequestsError
	 *
	 * @property {string} code.required - The error code. - enum:too-many-requests
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:429
	 */
	'too-many-requests': {
		message: `Woah! You made too many requests within one hour. Try again after some time (rate limit related info is passed in the 'RateLimit-*' headers).`,
		status: 429,
	},

	/**
	 * Error to return when an error occurs while talking to the database/auth service.
	 *
	 * @typedef {object} BackendError
	 *
	 * @property {string} code.required - The error code. - enum:backend-error
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:500
	 */
	'backend-error': {
		message: `An unexpected error occurred while interacting with the backend. Please try again in a few seconds or report this issue.`,
		status: 500,
	},

	/**
	 * Error to return when the server crashes.
	 *
	 * @typedef {object} ServerCrashError
	 *
	 * @property {string} code.required - The error code. - enum:server-crash
	 * @property {string} message.required - The error message.
	 * @property {number} status.required - The HTTP error code. - enum:500
	 */
	'server-crash': {
		message: `An unexpected error occurred. Please try again in a few seconds or report this issue.`,
		status: 500,
	},
}

/**
 * A type for error codes.
 */
export type ErrorCode = keyof typeof errors

/**
 * A custom error class with additional information to return to the client.
 *
 * @property {string} code - The error 'code'.
 * @property {number} status - The corresponding HTTP status code to return.
 * @property {string} message - A detailed error message, explaining why the error occurred and a possible fix.
 */
export class ServerError extends Error {
	code: ErrorCode
	status: number
	message: string

	constructor(code: ErrorCode, message?: string, status?: number) {
		super(message ?? errors[code].message)
		Error.captureStackTrace(this)

		this.code = code
		this.status = status ?? errors[code].status
		this.message = message ?? errors[code].message
	}
}
