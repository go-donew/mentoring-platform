// source/loaders/index.ts
// Creates the server and registers schemas, plugins and routes with it.

import createServer from 'fastify'

import { plugins } from './plugins.js'
import { schemas } from './schemas.js'
import { routes } from './routes.js'

export const build = (options) => {
	// Create the Fastify server.
	const server = createServer(options)

	// Load the schemas, middleware, and the routes.
	server.register(schemas)
	server.register(plugins)
	server.register(routes)

	return server
}
