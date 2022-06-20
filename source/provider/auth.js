// source/provider/auth.js
// Defines and exports the auth service used by the server.

import { Buffer as buffer } from 'node:buffer'

import got from 'got'
import jwt from 'jsonwebtoken'

import { ServerError } from '../utilities/errors.js'
import { config } from '../utilities/config.js'
import { logger } from '../utilities/logger.js'

const json = JSON

/**
 * Generates a token for making requests to the authentication service.
 *
 * @returns {Promise<string>} - The bearer token, to pass in the `Authorization` header in all requests.
 */
const getServiceAccountToken = async () => {
	// In production, create a JWT token from the credentials passed to the service.
	if (config.prod) {
		logger.silly('generating jwt for service account')

		const { credentials, host } = config.services.auth

		const payload = {
			iss: credentials.email,
			sub: credentials.email,
			aud: `https://${host}/`,
			exp: Math.floor(Date.now() / 1000) + 60 * 60,
		}
		const headers = {
			algorithm: 'RS256',
			keyid: credentials.privateKeyId,
		}
		const privateKey = credentials.privateKey

		const token = jwt.sign(payload, privateKey, headers)
		logger.silly('successfully generated service account jwt')

		return token
	} else return 'owner'
}

const token = await getServiceAccountToken()
const endpoints = {
	signup: 'v1/accounts:signUp',
	signin: 'v1/accounts:signInWithPassword',
	update: 'v1/accounts:update',
}

/**
 * A custom instance of Got for making requests to the Firebase auth endpoints.
 */
const fetch = got.extend({
	// Set the prefix URL to the server URL so we can mention only the endpoint
	// path in the rest of the code.
	prefixUrl: `${config.services.auth.host.includes('localhost') ? 'http' : 'https'}://${config.services.auth.host}/`,
	// Don't throw errors, just return them as responses and we will handle
	// the rest.
	throwHttpErrors: false,
	// Always add the bearer token to the request.
	headers: { authorization: `Bearer ${token}` },
})

export const auth = {
	/**
	 * Creates an account for a user.
	 *
	 * @param {NameEmailPassword} userDto - The name, email and password of the user to create.
	 *
	 * @returns {Promise<UserAndTokens>} - The user's profile and tokens.
	 */
	signup: async ({ name, email, password }) => {
		logger.silly('creating account for user')

		// First, create their account.
		let { error, localId: id } = await fetch(endpoints.signup, {
			method: 'post',
			json: { email, password },
		}).json()

		// Handle any errors that the API might return.
		if (error?.message) {
			if (error.message.startsWith('EMAIL_EXISTS'))
				throw new ServerError(
					'entity-already-exists',
					'A user with that email address already exists. Please try again with a different email or contact us if you think this is a mistake.',
				)
			if (error.message.startsWith('INVALID_EMAIL'))
				throw new ServerError(
					'improper-payload',
					'The email address passed in the request body was invalid. Please try again with a valid email address.',
				)
			if (error.message.startsWith('WEAK_PASSWORD'))
				throw new ServerError(
					'improper-payload',
					'The password passed in the request body was too weak. Please try again with a longer (> 6 letters) password.',
				)
			if (error.message.startsWith('TOO_MANY_ATTEMPTS_TRY_LATER')) throw new ServerError('too-many-requests')
		}

		logger.silly('succesfully created account')
		logger.silly(`attempting to set claims on user's bearer token`)

		// Once we have created the account, set profile details like name, phone
		// number, etc. as custom claims on their bearer token.
		;({ error } = await fetch(endpoints.update, {
			method: 'post',
			json: {
				localId: id,
				displayName: name,
				customAttributes: json.stringify({
					donew: {
						profile: { id, name, email },
						roles: { groot: false },
					},
				}),
			},
		}))

		// If an error occurs at this point, just log it and return a 500 backend-error.
		if (error) {
			logger.error(error, `could not set profile on user's bearer token due to error`)
			throw new ServerError('backend-error')
		}

		logger.silly(`successfully set claims on user's bearer token`)
		logger.silly('retrieving tokens for user')

		// Then, sign in again to retrieve the user's tokens.
		let bearer,
			refresh = undefined
		;({
			error,
			idToken: bearer,
			refreshToken: refresh,
		} = await fetch(endpoints.signin, {
			method: 'post',
			json: { email, password, returnSecureToken: true },
		}).json())

		// If an error occurs at this point, just log it and return a 500 backend-error.
		if (error) {
			logger.error(error, `could not retrieve tokens for user due to error`)
			throw new ServerError('backend-error')
		}

		logger.silly('sucessfully retrieved tokens for user')

		// Then return the profile and tokens.
		return {
			user: await auth.parseToken(bearer),
			tokens: { bearer, refresh },
		}
	},

	/**
	 * Signs a user into their account.
	 *
	 * @param {EmailPassword} userDto - The email and password of the user.
	 *
	 * @returns {Promise<UserAndTokens>} - The user's profile and tokens.
	 */
	signin: async ({ email, password }) => {
		logger.silly('retrieving tokens for user')

		// Sign in to retrieve the user's tokens.
		const {
			error,
			idToken: bearer,
			refreshToken: refresh,
		} = await fetch(endpoints.signin, {
			method: 'post',
			json: { email, password, returnSecureToken: true },
		}).json()

		logger.error(error)

		if (error?.message) {
			if (error.message.startsWith('EMAIL_NOT_FOUND'))
				throw new ServerError(
					'entity-not-found',
					'A user with that email address does not exist. Perhaps you meant to sign up instead?',
				)
			if (error.message.startsWith('INVALID_EMAIL'))
				throw new ServerError(
					'improper-payload',
					'The email address passed in the request body was invalid. Please try again with a valid email address.',
				)
			if (error.message.startsWith('INVALID_PASSWORD')) throw new ServerError('incorrect-credentials')
			if (error.message.startsWith('TOO_MANY_ATTEMPTS_TRY_LATER')) throw new ServerError('too-many-requests')

			throw new ServerError('backend-error')
		}

		logger.silly('sucessfully retrieved tokens for user')

		// Then return the profile and tokens.
		return {
			user: await auth.parseToken(bearer),
			tokens: {
				bearer,
				refresh,
			},
		}
	},

	/**
	 * Returns a user from the metadata in a bearer token.
	 *
	 * @param {string} token - The bearer token passed in the `Authorization` header.
	 *
	 * @returns {Promise<User>} - The user profile.
	 */
	parseToken: async (token) => {
		const { credentials, projectId } = config.services.auth

		logger.silly('parsing jwt for user profile')

		// First, get the headers and find the ID of the key used to sign the JWT.
		const [rawHeaders, rawPayload] = token
			.split('.')
			.map((part) => buffer.from(part, 'base64').toString('ascii'))
			.filter((part) => part !== '')
		const [headers, payload] = [rawHeaders, rawPayload].map(json.parse)
		logger.silly('successfully parsed jwt')

		if (config.prod) {
			const publicKey = credentials.publicKeys[headers.kid]
			if (!publicKey) {
				logger.error('could not retrieve public key with id %s to verify jwt', headers.kid)

				throw new ServerError('backend-error', 'An error occurred while validating your access token.')
			}

			// Then verify the JWT with that public key.
			jwt.verify(token, publicKey, {
				// Ensure the algorithm, audience and issuer are set properly.
				algorithms: ['RS256'],
				audience: projectId,
				issuer: `https://securetoken.google.com/${projectId}`,
			})
			logger.silly('successfully verified jwt')
		}

		return {
			...payload.donew.profile,
			...payload.donew.roles,
			lastSignedIn: new Date(payload.iat).toISOString(),
		}
	},
}
