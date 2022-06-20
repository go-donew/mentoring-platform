// utilities/errors.ts
// We <3 errors! No, not really XD

/**
 * A list of errors we can return.
 */
export const errors = {
	// Error to return when the request body contained invalid data.
	'improper-payload': {
		message: `The request body did not contain valid data needed to perform the operation.`,
		status: 400,
	},

	// Error to return when the bearer token passed by the user is invalid.
	'invalid-token': {
		message: `Could not find a valid access token in the 'Authorization' header. Please retrieve an access token by authenticating via the sign in endpoint, and pass it in the 'Authorization' header.`,
		status: 401,
	},

	// Error to return when the credentials (usually password) passed by the user
	// were incorrect.
	'incorrect-credentials': {
		message: `The credentials passed were invalid. Please pass valid credentials and try again.`,
		status: 401,
	},

	// Error to return when the user is not authorized to perform an operation.
	'not-allowed': {
		message: `You cannot perform this operation.`,
		status: 403,
	},

	// Error to return when the requested entity was not found.
	'entity-not-found': {
		message: `The requested entity was not found.`,
		status: 404,
	},

	// Error to return when the route requested by the user doesn't exist.
	'route-not-found': {
		message: `The requested route was not found. Take a look at the documentation for a list of valid endpoints.`,
		status: 404,
	},

	// Error to return when an entity with the same value in a unique field exists.
	'entity-already-exists': {
		message: `An entity with the same ID already exists.`,
		status: 409,
	},

	// Error to return when the user tries to do something that requires certain
	// conditions to be met, and those conditions have not been met.
	'precondition-failed': {
		message: `To perform this action, certain preconditions need to be met. Unfortunately, one or more of these conditions have not been met. Please try again after these preconditions have been met.`,
		status: 412,
	},

	// Error to return when the user gets rate limited.
	'too-many-requests': {
		message: `Too many requests were made within one hour. Try again after some time (rate limit related info is passed in the 'RateLimit-*' headers).`,
		status: 429,
	},

	// Error to return when an error occurs while talking to the database/auth service.
	'backend-error': {
		message: `An unexpected error occurred while interacting with the backend. Please try again in a few seconds or report this issue.`,
		status: 500,
	},

	// Error to return when the server crashes.
	'server-crash': {
		message: `An unexpected error occurred. Please try again in a few seconds or report this issue.`,
		status: 500,
	},
}

/**
 * A custom error class with additional information to return to the client.
 */
export class ServerError extends Error {
	/**
	 * Creates a new server error.
	 *
	 * @param {string} code - The error 'code'.
	 * @param {string?} message - A detailed error message, explaining why the error occurred and a possible fix.
	 * @param {number?} status - The corresponding HTTP status code to return.
	 */
	constructor(code, message, status) {
		super(message ?? errors[code].message)

		this.code = code
		this.status = status ?? errors[code].status
		this.message = message ?? errors[code].message
	}

	/**
	 * Convert the error to a JSON object so it can be sent as a HTTP response.
	 */
	send() {
		return {
			meta: {
				status: this.status,
			},
			error: {
				code: this.code,
				message: this.message,
			},
		}
	}
}
