// @/loaders/express/documentation.ts
// Parses the comments and generates the OpenAPI documentation for the API.

import { dirname, resolve as getAbsolutePath } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Application, Response } from 'express'

import { static as serve } from 'express'
import { middleware as validate } from 'express-openapi-validator'
import generateOpenApiSpec from 'express-jsdoc-swagger'

import { logger } from '@/utilities/logger'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * The configuration for generating the OpenAPI spec.
 */
const config = {
	// Basic information about the API to include in the spec
	info: {
		title: 'The DoNew Mentoring API',
		version: '0.0.0',
		description:
			'This is the documentation for the DoNew Mentoring API. Pick an endpoint from the sidebar on the left to know more about it.',
	},
	servers: [
		{
			url: 'http://mentoring.godonew.com/api',
			description: 'Public API server',
		},
		{
			url: 'http://mentoring-sandbox.godonew.com/api',
			description: 'Development server',
		},
		{
			url: 'http://localhost:5000/api',
			description: 'For local development only',
		},
	],
	security: {
		bearer: {
			type: 'http',
			scheme: 'bearer',
		},
	},

	// Extract comments from the following compiled files
	baseDir: getAbsolutePath(__dirname, '../source/'),
	filesPattern: [
		'routes/**/*.ts',
		'services/**/*.ts',
		'models/**/*.ts',
		'errors/**/*.ts',
		'types.ts',
	],
	// Expose the generated JSON spec as /api/docs/spec.json
	exposeApiDocs: true,
	apiDocsPath: '/api/docs/spec.json',
}

/**
 * Parses the comments and generates the OpenAPI documentation for the API.
 * Exposes the generated spec with the /api/docs/spec.json endpoint.
 *
 * @param {Application} app - The Express application instance.
 */
export const load = async (app: Application): Promise<void> => {
	logger.silly(
		'[loaders/express/docs] generating open api spec with config',
		config,
	)

	// Generate the documentation
	const spec = await new Promise((resolve) => {
		generateOpenApiSpec(app)(config)
			.on('finish', resolve)
			.on('error', console.error)
	})

	logger.silly('[loaders/express/docs] spec generated successfully', spec)

	// Render documentation using Elements
	app.use(
		'/api/docs',
		serve(getAbsolutePath(__dirname, '../docs/api.html'), {
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
