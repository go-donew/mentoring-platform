// source/services/auth/index.js
// Defines and exports the auth service used by the server.

import { Buffer as buffer } from 'node:buffer'

import got from 'got'
import jwt from 'jsonwebtoken'

import { ServerError } from '../../utilities/errors.js'
import { config } from '../../utilities/config.js'
import { logger } from '../../utilities/logger.js'
import { json } from '../../utilities/globals.js'

import { getServiceAccountToken } from '../../utilities/token.js'

const options = config.services.auth
const token = await getServiceAccountToken(config)

const identityPrefix = config.prod ? '' : 'identitytoolkit.googleapis.com/'
const secureTokenPrefix = config.prod ? '' : 'securetoken.googleapis.com/'
const protocol = /localhost|127/.test(options.identityServer) ? 'http' : 'https'

const endpoints = {
	signup: `${identityPrefix}v1/accounts:signUp`,
	signin: `${identityPrefix}v1/accounts:signInWithPassword`,
	update: `${identityPrefix}v1/accounts:update`,
	token: `${secureTokenPrefix}v1/token`,
}

/**
 * Custom instances of Got for making requests to the Firebase auth endpoints.
 */
const fetchFromIdentityServer = got.extend({
	// Set the prefix URL to the server URL so we can mention only the endpoint
	// path in the rest of the code.
	prefixUrl: `${protocol}://${options.identityServer}/`,
	// Don't throw errors, just return them as responses and we will handle
	// the rest.
	throwHttpErrors: false,
	// Always add the bearer token to the request.
	headers: { authorization: `Bearer ${token}` },
})
const fetchFromSecureTokenServer = got.extend({
	// Set the prefix URL to the server URL so we can mention only the endpoint
	// path in the rest of the code.
	prefixUrl: `${protocol}://${options.secureTokenServer}/`,
	// Don't throw errors, just return them as responses and we will handle
	// the rest.
	throwHttpErrors: false,
	// Always add the bearer token to the request.
	searchParams: { key: options.credentials.apiKey },
})

export const auth = {
	/**
	 * Creates an account for a user.
	 *
	 * @param {NameEmailPassword} userDto - The name, email and password of the user to create.
	 *
	 * @returns {Promise<UserAndTokens>} - The user's profile and tokens.
	 */
	async signup({ name, email, password }) {
		logger.silly('creating account for user')

		// First, create their account.
		let { error, localId: id } = await fetchFromIdentityServer(
			endpoints.signup,
			{
				method: 'post',
				json: { email, password },
			},
		).json()

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
			if (error.message.startsWith('TOO_MANY_ATTEMPTS_TRY_LATER'))
				throw new ServerError('too-many-requests')
		}

		logger.silly('succesfully created account')
		logger.silly(`attempting to set claims on user's bearer token`)

		// Once we have created the account, set profile details like name, phone
		// number, etc. as custom claims on their bearer token.
		;({ error } = await fetchFromIdentityServer(endpoints.update, {
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
			logger.error(
				error,
				`could not set profile on user's bearer token due to error`,
			)
			throw new ServerError('backend-error')
		}

		logger.silly(`successfully set claims on user's bearer token`)
		logger.silly('retrieving tokens for user')

		// Then, sign in again to retrieve the user's tokens.
		let bearer
		let refresh
		;({
			error,
			idToken: bearer,
			refreshToken: refresh,
		} = await fetchFromIdentityServer(endpoints.signin, {
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
	async signin({ email, password }) {
		logger.silly('retrieving tokens for user')

		// Sign in to retrieve the user's tokens.
		const {
			error,
			idToken: bearer,
			refreshToken: refresh,
		} = await fetchFromIdentityServer(endpoints.signin, {
			method: 'post',
			json: { email, password, returnSecureToken: true },
		}).json()

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
			if (error.message.startsWith('INVALID_PASSWORD'))
				throw new ServerError('incorrect-credentials')
			if (error.message.startsWith('TOO_MANY_ATTEMPTS_TRY_LATER'))
				throw new ServerError('too-many-requests')

			logger.error(error, 'could not sign in due to error')
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
	 * Give the user a new access token when the old one expires.
	 *
	 * @param {RefreshToken} tokenDto - The refresh token.
	 *
	 * @returns {Promise<Tokens>} - The user's profile and tokens.
	 */
	async refreshToken({ refreshToken }) {
		logger.silly('rejuvenating tokens for user')

		// Make an API call with the refresh token in the payload to get a new set
		// of tokens.
		const {
			error,
			id_token: bearer,
			refresh_token: refresh,
		} = await fetchFromSecureTokenServer(endpoints.token, {
			method: 'post',
			json: {
				grant_type: 'refresh_token', // eslint-disable-line camelcase
				refresh_token: refreshToken, // eslint-disable-line camelcase
			},
		}).json()

		if (error?.message) {
			if (error.message.startsWith('INVALID_REFRESH_TOKEN'))
				throw new ServerError(
					'improper-payload',
					'The refresh token passed in the request body was invalid. Please try again with a valid refresh token.',
				)
			if (error.message.startsWith('TOKEN_EXPIRED'))
				throw new ServerError(
					'incorrect-credentials',
					'The refresh token passed in the request body had expired. Please sign in to get a new set of tokens instead.',
				)
			if (error.message.startsWith('TOO_MANY_ATTEMPTS_TRY_LATER'))
				throw new ServerError('too-many-requests')

			logger.error(error, 'could not refresh token due to error')
			throw new ServerError('backend-error')
		}

		logger.silly('sucessfully retrieved tokens for user')

		// Then return the tokens.
		return {
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
	async parseToken(token) {
		const { credentials, projectId } = options

		logger.silly('parsing jwt for user profile')

		// First, get the headers and find the ID of the key used to sign the JWT.
		const [rawHeaders, rawPayload] = token
			.split('.')
			.map((part) => buffer.from(part, 'base64').toString('ascii'))
			.filter((part) => part !== '')
		const [headers, payload] = [rawHeaders, rawPayload].map((part) =>
			json.parse(part),
		)
		logger.silly('successfully parsed jwt')

		/* c8 ignore start */
		if (config.prod) {
			const publicKey = credentials.publicKeys[headers.kid]
			if (!publicKey) {
				logger.error(
					'could not retrieve public key with id %s to verify jwt',
					headers.kid,
				)

				throw new ServerError(
					'backend-error',
					'An error occurred while validating your access token.',
				)
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
		/* c8 ignore end */

		return {
			...payload.donew.profile,
			...payload.donew.roles,
			lastSignedIn: new Date(payload.iat).toISOString(),
		}
	},
}