// source/server.ts
// Binds the server to the port specified.

import createServer from 'fastify'

import { plugins } from './loaders/plugins.js'
import { routes } from './loaders/routes.js'
import { config } from './utilities/config.js'
import { options } from './utilities/logger.js'

// Log colorfully when we are in a development environment, else use the
// standard JSON logger.
if (config.prod) {
	delete options.transport
}

// Create the Fastify server.
const server = createServer({
	// Configure the logger.
	logger: options,
	disableRequestLogging: true,
})

// Load the middleware, and the routes.
server.register(plugins)
server.register(routes)

server.log.info('server ready to receive requests')

// Export the server in a way that Google Cloud Functions can recognize it.
export const api = async (request, reply) => {
	await server.ready()

	server.server.emit('request', request, reply)
}
