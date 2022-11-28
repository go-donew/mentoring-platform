// source/services/utilities/token.js
// Token-related utilities.

import jwt from 'jsonwebtoken'

import { logger } from './logger.js'

/**
 * Generates a token for making requests to the authentication service.
 *
 * @returns {Promise<string>} - The bearer token, to pass in the `Authorization` header in all requests.
 */
export const getServiceAccountToken = async (config) => {
	// In production, create a JWT token from the credentials passed to the service.
	/* c8 ignore start */
	if (config.prod) {
		logger.silly('generating jwt for service account')

		const { credentials, identityServer } = config.services.auth

		const payload = {
			iss: credentials.email,
			sub: credentials.email,
			aud: `https://${identityServer}/`,
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
	}
	/* c8 ignore end */

	// The emulator only needs us to pass `owner` instead of an actual token.
	return 'owner'
}
