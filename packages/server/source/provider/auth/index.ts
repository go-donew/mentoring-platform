// @/provider/auth.ts
// Firebase auth provider.

import process from 'node:process'

import { getAuth } from 'firebase-admin/auth'
import fetch from 'got'
import type { FirebaseError } from 'firebase-admin'

import { ServerError } from '@/errors'
import { logger, stringify } from '@/utilities/logger'
import type { AuthProvider, CustomClaims, DecodedToken, Tokens } from '@/types'

// The accounts endpoint to create/delete users
const signInUpEndpoint =
	process.env.NODE_ENV === 'production'
		? 'https://identitytoolkit.googleapis.com/v1'
		: `http://${process.env
				.FIREBASE_AUTH_EMULATOR_HOST!}/identitytoolkit.googleapis.com/v1`
// The endpoint to refresh the bearer token
const tokenExchangeEndpoint =
	process.env.NODE_ENV === 'production'
		? 'https://securetoken.googleapis.com/v1'
		: `http://${process.env
				.FIREBASE_AUTH_EMULATOR_HOST!}/securetoken.googleapis.com/v1`
// The API key to use while making calls to the above endpoints
const apiKey =
	process.env.NODE_ENV === 'production'
		? process.env.FIREBASE_API_KEY!
		: 'the-answer-to-life-the-universe-and-everything:42'

/**
 * The response to expect from the auth endpoints.
 */
type FirebaseAuthApiResponse = {
	idToken: string
	refreshToken: string
	localId: string
	email: string
	displayName: string
}

/**
 * The response to expect from the token endpoint.
 */
type FirebaseTokenApiResponse = {
	id_token: string
	refresh_token: string
}

/**
 * A wrapper around Firebase Auth.
 */
export class FirebaseAuthProvider implements AuthProvider {
	/**
	 * Signs a user up.
	 *
	 * @param {string} name - The user's display name.
	 * @param {string} email - The user's email address.
	 * @param {string} password - A password for the user's account.
	 *
	 * @returns {Object<userId: string, tokens: Tokens>} - The user ID and tokens.
	 * @throws {ServerError} - 'improper-payload' | 'entity-already-exists' | 'too-many-requests' | 'backend-error'
	 *
	 * @async
	 */
	async signUp(
		name: string,
		email: string,
		password: string,
	): Promise<{ userId: string; tokens: Tokens }> {
		logger.info('[firebase/auth/signup] signing user up')

		// Make a manual REST API call to sign up the user
		let body: FirebaseAuthApiResponse
		try {
			// Sign up the user via email and password
			logger.silly('[firebase/auth/signup] making api call to sign up')
			body = await fetch({
				method: 'post',
				url: `${signInUpEndpoint}/accounts:signUp`,
				json: {
					email,
					password,
					returnSecureToken: true,
				},
				searchParams: {
					key: apiKey,
				},
			}).json()
			logger.silly(
				'[firebase/auth/signup] received succesful response from endpoint',
			)

			// Also set their display name
			logger.silly('[firebase/auth/signup] making api call to set display name')
			await fetch({
				method: 'post',
				url: `${signInUpEndpoint}/accounts:update`,
				json: {
					idToken: body.idToken,
					displayName: name,
					returnSecureToken: true,
				},
				searchParams: {
					key: apiKey,
				},
			}).json()
			logger.silly(
				'[firebase/auth/signup] received sucessful response from endpoint',
			)
		} catch (caughtError: unknown) {
			const { error } = JSON.parse(
				(caughtError as any).response?.body ?? '{"error": {"message": ""}}',
			)
			logger.silly(
				'[firebase/auth/signup] received error while signing user up - %s',
				stringify(error),
			)

			if ((error.message as string).startsWith('EMAIL_EXISTS'))
				throw new ServerError(
					'entity-already-exists',
					'A user with that email address already exists. Please try again with a different email or contact us if you think this is a mistake.',
				)
			if ((error.message as string).startsWith('INVALID_EMAIL'))
				throw new ServerError(
					'improper-payload',
					'The email address passed in the request body was invalid. Please try again with a valid email address.',
				)
			if ((error.message as string).startsWith('WEAK_PASSWORD'))
				throw new ServerError(
					'improper-payload',
					'The password passed in the request body was too weak. Please try again with a longer (> 6 letters) password.',
				)
			if ((error.message as string).startsWith('TOO_MANY_ATTEMPTS_TRY_LATER'))
				throw new ServerError('too-many-requests')

			throw new ServerError('backend-error')
		}

		// The ID token that Firebase Auth returns is also their bearer token for
		// the API endpoints, as well as the refresh token to get a new bearer token
		// once the current one expires
		const { refreshToken: refresh, idToken: bearer } = body

		logger.info('[firebase/auth/signup] successfully signed user up')

		// Return them all
		return {
			userId: body.localId,
			tokens: { bearer, refresh },
		}
	}

	/**
	 * Signs a user into their account.
	 *
	 * @param {string} email - The user's email address.
	 * @param {string} password - A password for the user's account.
	 *
	 * @returns {Object<userId: string, tokens: Tokens>} - The user ID and tokens.
	 * @throws {ServerError} - 'improper-payload' | 'incorrect-credentials' | 'not-found' | 'backend-error'
	 *
	 * @async
	 */
	async signIn(
		email: string,
		password: string,
	): Promise<{
		userId: string
		tokens: Tokens
	}> {
		logger.info('[firebase/auth/signin] signing user in')

		// Make a manual REST API call to sign the user in
		let body: FirebaseAuthApiResponse
		try {
			logger.silly('[firebase/auth/signin] making api call to sign in')
			body = await fetch({
				method: 'post',
				url: `${signInUpEndpoint}/accounts:signInWithPassword`,
				json: {
					email,
					password,
					returnSecureToken: true,
				},
				searchParams: {
					key: apiKey,
				},
			}).json()
			logger.silly(
				'[firebase/auth/signin] received sucessful response from endpoint',
			)
		} catch (caughtError: unknown) {
			const { error } = JSON.parse(
				(caughtError as any).response?.body ?? '{"error": {"message": ""}}',
			)
			logger.silly(
				'[firebase/auth/signin] received error while signing in - %s',
				stringify(error),
			)

			if ((error.message as string).startsWith('EMAIL_NOT_FOUND'))
				throw new ServerError(
					'entity-not-found',
					'We could not find a user with that email address. Please check the email address for typos and try again.',
				)
			if ((error.message as string).startsWith('INVALID_PASSWORD'))
				throw new ServerError(
					'incorrect-credentials',
					'The password for that account was incorrect. Please try again with valid credentials.',
				)

			throw new ServerError('backend-error')
		}

		// The ID token that Firebase Auth returns is also their bearer token for
		// the API endpoints. Also return the refresh token so they can get a new
		// bearer token once the current one expires
		const { refreshToken: refresh, idToken: bearer } = body

		logger.info('[firebase/auth/signin] successfully signed user in')

		// Return them all
		return {
			userId: body.localId,
			tokens: { bearer, refresh },
		}
	}

	/**
	 * Given a refresh token, returns a new set of tokens for a user.
	 *
	 * @param {string} refreshToken The refresh token returned when signing in/up.
	 *
	 * @returns {Tokens} A new set of tokens for the user.
	 * @throws {ServerError} - 'improper-payload' | 'backend-error'
	 *
	 * @async
	 */
	async refreshTokens(refreshToken: string): Promise<Tokens> {
		logger.info('[firebase/auth/token-refresh] refreshing user tokens')

		// Make a manual REST API call to refresh the token
		let body: FirebaseTokenApiResponse
		try {
			logger.silly(
				'[firebase/auth/token-refresh] making api call to refresh token',
			)
			body = await fetch({
				method: 'post',
				url: `${tokenExchangeEndpoint}/token`,
				json: {
					grant_type: 'refresh_token', // eslint-disable-line @typescript-eslint/naming-convention
					refresh_token: refreshToken, // eslint-disable-line @typescript-eslint/naming-convention
				},
				searchParams: {
					key: apiKey,
				},
			}).json()
			logger.silly(
				'[firebase/auth/token-refresh] received sucessful response from endpoint',
			)
		} catch (caughtError: unknown) {
			const { error } = JSON.parse(
				(caughtError as any).response?.body ?? '{"error": {"message": ""}}',
			)
			logger.silly(
				'[firebase/auth/token-refresh] received error while refreshing tokens - %s',
				stringify(error),
			)

			if ((error.message as string).startsWith('INVALID_REFRESH_TOKEN'))
				throw new ServerError(
					'improper-payload',
					'The refresh token passed in the request body was invalid. Please try again with a valid refresh token.',
				)
			if ((error.message as string).startsWith('TOKEN_EXPIRED'))
				throw new ServerError(
					'incorrect-credentials',
					'The refresh token passed in the request body had expired. Please sign in to get a new set of tokens instead.',
				)

			throw new ServerError('backend-error')
		}

		logger.info(
			'[firebase/auth/token-refresh] successfully refreshed user tokens',
		)

		// Return the 'rejuvenated' tokens
		return {
			bearer: body.id_token,
			refresh: body.refresh_token,
		}
	}

	/**
	 * Verifies a bearer token.
	 *
	 * @param {string} token The token to verify.
	 *
	 * @returns {DecodedToken} The contents of the bearer token.
	 * @throws {ServerError} - 'improper-payload' | 'backend-error'
	 *
	 * @async
	 */
	async verifyToken(token: string): Promise<DecodedToken> {
		logger.info('[firebase/auth/token-verify] verifying user token')
		// Verify and decode the bearer token
		try {
			const decodedToken = await getAuth().verifyIdToken(token, true)

			logger.info(
				'[firebase/auth/token-verify] successfully decoded and verified user token',
			)
			return decodedToken
		} catch (error: unknown) {
			logger.silly(
				'[firebase/auth/token-verify] received error while verifying auth token - %s',
				stringify(error),
			)

			throw new ServerError(
				'invalid-token',
				(error as FirebaseError).code === 'auth/id-token-revoked'
					? 'This bearer token was revoked. Please sign in again to retrieve a new set of tokens.'
					: undefined,
			)
		}
	}

	/**
	 * Retrieve the custom claims set on a user.
	 *
	 * @param {string} userId The ID of the user whose claims to retrieve.
	 *
	 * @returns {CustomClaims} The custom claims set on a user.
	 * @throws {ServerError} - 'backend-error'
	 *
	 * @async
	 */
	async retrieveClaims(userId: string): Promise<CustomClaims> {
		logger.info('[firebase/auth/claims] retrieving claims for user %s', userId)

		let user
		try {
			user = await getAuth().getUser(userId)
		} catch (error: unknown) {
			logger.silly(
				'[firebase/auth/claims] received error while retrieving user claims - %s',
				stringify(error),
			)

			throw new ServerError('backend-error')
		}

		logger.info('[firebase/auth/claims] successfully retrieved user claims')

		return user.customClaims as CustomClaims
	}

	/**
	 * Deletes a user's account.
	 *
	 * @param {string} userId - The ID of the user whose claims to retrieve.
	 *
	 * @returns {void}
	 * @throws {ServerError} - 'not-found' | 'backend-error'
	 *
	 * @async
	 */
	async deleteAccount(userId: string): Promise<void> {
		logger.info(
			'[firebase/auth/delete-account] deleting user account for user %s',
			userId,
		)

		try {
			await getAuth().deleteUser(userId)
		} catch (caughtError: unknown) {
			const error = caughtError as FirebaseError
			logger.silly(
				'[firebase/auth/delete-account] received error while deleting user account - %s',
				stringify(error),
			)

			if (error.code === 'auth/user-not-found')
				throw new ServerError('entity-not-found')

			throw new ServerError('backend-error')
		}

		logger.info(
			'[firebase/auth/delete-account] successfully deleted user account',
		)
	}
}

// Export a new instance of the auth provider
export const provider = new FirebaseAuthProvider()
