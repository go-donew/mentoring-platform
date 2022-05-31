// @/services/auth/index.ts
// Service that handles registration and login of users, and token refresh operations.

import type { ServiceRequest, ServiceResponse, Tokens } from '@/types'

import { ServerError } from '@/errors'
import { User } from '@/models/user'
import { provider as users } from '@/provider/data/users'
import { provider as auth } from '@/provider/auth'

/**
 * The payload needed to make a request to sign up a user.
 *
 * @typedef {object} SignUpPayload
 * @property {string} name.required - The user's name.
 * @property {string} email.required - The user's email address. - email
 * @property {string} password.required - The user's password. - password
 */
export type SignUpPayload = {
	name: string
	email: string
	password: string
}

/**
 * The response from the sign up endpoint.
 *
 * @typedef {object} SignUpResponse
 * @property {User} user.required - The created user.
 * @property {Tokens} tokens.required - The tokens the user can use to access other endpoints.
 */
export type SignUpResponse = {
	user: User
	tokens: Tokens
}

/**
 * Method to create a new user.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the auth provider. If successful, the service will return the user's details and tokens.
 */
const signUp = async (
	request: ServiceRequest<SignUpPayload, Record<string, unknown>>,
): Promise<ServiceResponse<SignUpResponse>> => {
	try {
		const { userId, tokens } = await auth.signUp(
			request.body.name,
			request.body.email,
			request.body.password,
		)
		const user = await users.create({
			...request.body,
			id: userId,
			phone: undefined,
			lastSignedIn: new Date(),
		})

		// @ts-expect-error This is because we pass password when doing ...request.body
		// above, and `class-transformer` happily adds that as a property.
		delete user.password

		const data = { user, tokens }
		return {
			status: 201,
			data,
		}
	} catch (error: unknown) {
		return {
			error:
				error instanceof ServerError ? error : new ServerError('server-crash'),
		}
	}
}

/**
 * The payload needed to make a request to sign in a user.
 *
 * @typedef {object} SignInPayload
 * @property {string} email.required - The user's email address. - email
 * @property {string} password.required - The user's password. - password
 */
export type SignInPayload = {
	email: string
	password: string
}
/**
 * The response from the sign in endpoint.
 *
 * @typedef {object} SignInResponse
 * @property {User} user.required - The signed in user.
 * @property {Tokens} tokens.required - The tokens the user can use to access other endpoints.
 */
export type SignInResponse = {
	user: User
	tokens: Tokens
}

/**
 * Method to log a user into their account.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the auth provider. If successful, the service will return the user's details and tokens.
 */
const signIn = async (
	request: ServiceRequest<SignInPayload, Record<string, unknown>>,
): Promise<ServiceResponse<SignInResponse>> => {
	try {
		const { userId, tokens } = await auth.signIn(
			request.body.email,
			request.body.password,
		)
		const user = await users.get(userId)

		const data = { user, tokens }
		return {
			status: 200,
			data,
		}
	} catch (error: unknown) {
		return {
			error:
				error instanceof ServerError ? error : new ServerError('server-crash'),
		}
	}
}

/**
 * The payload needed to make a request to refresh a user's tokens.
 *
 * @typedef {object} TokenRefreshPayload
 * @property {string} refreshToken.required - The user's refresh token.
 */
export type TokenRefreshPayload = {
	refreshToken: string
}

/**
 * The response from the token refresh endpoint.
 *
 * @typedef {object} TokenRefreshResponse
 * @property {Tokens} tokens.required - The tokens the user can use to access other endpoints.
 */
export type TokenRefreshResponse = {
	tokens: Tokens
}

/**
 * Method to refresh the bearer token returned when signing up/in.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the auth provider. If successful, the service will return the new set of tokens.
 */
const refreshToken = async (
	request: ServiceRequest<TokenRefreshPayload, unknown>,
): Promise<ServiceResponse<TokenRefreshResponse>> => {
	try {
		const tokens = await auth.refreshTokens(request.body.refreshToken)

		const data = { tokens }
		return {
			status: 200,
			data,
		}
	} catch (error: unknown) {
		return {
			error:
				error instanceof ServerError ? error : new ServerError('server-crash'),
		}
	}
}

// Export the functions
export const service = {
	signUp,
	signIn,
	refreshToken,
}
