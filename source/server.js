// source/server.ts
// Binds the server to the port specified.

import createServer from 'fastify'

import { plugins } from './loaders/plugins.js'
import { schemas } from './loaders/schemas.js'
import { routes } from './loaders/routes.js'
import { logger } from './utilities/logger.js'

// Create the Fastify server.
const server = createServer({
	// Set the logger to the custom pino instance.
	logger: logger,
	disableRequestLogging: true,
})

// Load the schemas, middleware, and the routes.
server.register(schemas)
server.register(plugins)
server.register(routes)

server.log.info('server ready to receive requests')

// Export the server in a way that Google Cloud Functions can recognize it.
export const api = async (request, reply) => {
	await server.ready()

	server.server.emit('request', request, reply)
}
