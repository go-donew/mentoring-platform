// scripts/roles
// Sets a certain user's role.

import { Buffer as buffer } from 'node:buffer'
import { env, exit } from 'node:process'
import { spinner } from 'zx/experimental'
import { question } from 'zx'

import got from 'got'
import jwt from 'jsonwebtoken'

import { logger } from './utilities/logger.js'
import { date, math, json } from './utilities/globals.js'

logger.title('scripts/groot')

if (!env.GOOGLE_SERVICE_ACCOUNT) {
	logger.error(
		'store the contents of service account key file in the `GOOGLE_SERVICE_ACCOUNT` environment variable before running the script',
	)

	exit(1)
}

const googleCreds = json.parse(env.GOOGLE_SERVICE_ACCOUNT)
const googlePublicKeys = await got(
	'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
).json()

const credentials = {
	projectId: googleCreds.project_id,
	email: googleCreds.client_email,
	privateKey: googleCreds.private_key,
	privateKeyId: googleCreds.private_key_id,
	publicKeys: googlePublicKeys,
}

// Create a JWT out of the google service account credentials.
const token = await spinner(
	logger.status('authenticating with google services'),
	async () => {
		const payload = {
			iss: credentials.email,
			sub: credentials.email,
			aud: `https://identitytoolkit.googleapis.com/`,
			exp: math.floor(date.now() / 1000) + 60 * 60,
		}
		const headers = {
			algorithm: 'RS256',
			keyid: credentials.privateKeyId,
		}
		const privateKey = credentials.privateKey

		return jwt.sign(payload, privateKey, headers)
	},
)
logger.success('successfully authenticated with google services')

// Create a custom instance of Got for making requests to the Firebase auth endpoints.
const fetch = got.extend({
	// Set the prefix URL to the server URL so we can mention only the endpoint
	// path in the rest of the code.
	prefixUrl: `https://identitytoolkit.googleapis.com/v1/`,
	// Don't throw errors, just return them as responses and we will handle
	// the rest.
	throwHttpErrors: false,
	// Always add the bearer token to the request.
	headers: { authorization: `Bearer ${token}` },
})

// Get the email and password for the user, so we can sign in and get their
// bearer token.
logger.info('sign in as the user to modify their role')
const email = await question(logger.ask('email'))
const password = await question(logger.ask('password'), { password: true })

const bearer = await spinner(
	logger.status(`fetching user's bearer token`),
	async () => {
		const { error, idToken: bearer } = await fetch(
			'accounts:signInWithPassword',
			{
				method: 'post',
				json: {
					email,
					password,
					returnSecureToken: true,
				},
			},
		).json()

		// If an error occurs at this point, just log it and return a 500 backend-error.
		if (error)
			return logger.error(
				`could not retrieve user details due to error`,
				json.stringify(error, undefined, '  '),
			)
		return bearer
	},
)
logger.success('successfully retrieved bearer token')

const claims = await spinner(
	logger.status('parsing bearer token'),
	async () => {
		// First, get the headers and find the ID of the key used to sign the JWT.
		const [rawHeaders, rawPayload] = bearer
			.split('.')
			.map((part) => buffer.from(part, 'base64').toString('ascii'))
			.filter((part) => part !== '')
		const [headers, payload] = [rawHeaders, rawPayload].map((part) =>
			json.parse(part),
		)

		const publicKey = credentials.publicKeys[headers.kid]
		if (!publicKey) {
			logger.error(
				'could not retrieve public key with id',
				headers.kid,
				'to verify jwt',
			)

			exit(1)
		}

		// Then verify the JWT with that public key.
		jwt.verify(bearer, publicKey, {
			// Ensure the algorithm, audience and issuer are set properly.
			algorithms: ['RS256'],
			audience: credentials.projectId,
			issuer: `https://securetoken.google.com/${credentials.projectId}`,
		})

		return payload.donew
	},
)
logger.success('successfully parsed claims')

await spinner(
	logger.status('settings new claims on bearer token'),
	async () => {
		// Set `groot` to `true`.
		claims.roles.groot = true

		// Then update the claims on the token.
		const { error } = await fetch('accounts:update', {
			method: 'post',
			json: {
				localId: claims.profile.id,
				customAttributes: json.stringify({ donew: claims }),
			},
		}).json()

		if (error) {
			logger.error(
				`could not set claims on token due to error`,
				json.stringify(error, undefined, '  '),
			)

			exit(1)
		}
	},
)
logger.success(
	'successfully updated claims:',
	json.stringify(claims, undefined, '  '),
)
