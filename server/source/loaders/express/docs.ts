// @/loaders/express/documentation.ts
// Loads and exposes the OpenAPI documentation for the API.

import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'

import type { Application, Response } from 'express'

import { static as serve } from 'express'
import { middleware as validate } from 'express-openapi-validator'

import { logger } from '@/utilities/logger'

const __dirname = dirname(fileURLToPath(import.meta.url))
const json = JSON

/**
 * Loads and exposes the OpenAPI documentation for the API at the
 * `/api/docs/spec.json` endpoint, as well as teh rendered
 *
 * @param {Application} app - The Express application instance.
 */
export const load = async (app: Application): Promise<void> => {
	logger.silly('[loaders/express/docs] reading open api spec')

	const spec = json.parse(
		await readFile(resolvePath(__dirname, '../docs/spec.json'), 'utf8'),
	)

	logger.silly('[loaders/express/docs] spec loaded successfully')

	// Expose the spec in its raw form as well as in the rendered HTML form (the
	// latter using @stoplightio/elements).
	app.get('/api/docs/spec.json', (_request, response) => response.send(spec))
	app.use(
		'/api/docs',
		serve(resolvePath(__dirname, '../docs/api.html'), {
			// FIXME: Is this dangerous?
			setHeaders: (response: Response) =>
				response.setHeader('content-security-policy', ''),
		}),
	)

	// Use the validation middleware
	app.use(
		validate({
			apiSpec: spec as any,
			validateSecurity: false, // Let us take care of authorization
		}),
	)
}
