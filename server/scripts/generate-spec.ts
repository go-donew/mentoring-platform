// scripts/generate-spec.ts
// Generates the Open API spec from the source code.

import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFile } from 'node:fs/promises'

import generateOpenApiSpec from 'express-jsdoc-swagger'

const __dirname = dirname(fileURLToPath(import.meta.url))
const json = JSON

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
	baseDir: resolvePath(__dirname, '../source/'),
	filesPattern: [
		'routes/**/*.ts',
		'services/**/*.ts',
		'models/**/*.ts',
		'errors/**/*.ts',
		'types.ts',
	],

	// Don't expose any endpoint, we are simply parsing the code for now.
	exposeSwaggerUI: false,
}

// Generate the documentation
const spec = await new Promise((resolve) => {
	// @ts-expect-error We don't need to pass an `Application` instance because
	// we don't want to expose an API endpoint.
	generateOpenApiSpec({})(config)
		.on('finish', resolve)
		.on('error', console.error)
})

// Save it to the /docs/spec.json file.
await writeFile(
	resolvePath(__dirname, '../docs/spec.json'),
	json.stringify(spec, undefined, '\t'),
)

console.log('Successfully generated OpenAPI specification.')
