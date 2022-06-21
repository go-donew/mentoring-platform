// source/server.ts
// Exports the server for GCP.

import { build } from './loaders/index.js'
import { logger } from './utilities/logger.js'

// Create the Fastify server.
const server = build({
	// Use a custom Pino logger.
	logger: logger,
	disableRequestLogging: true,
})

logger.info('server ready to receive requests')

// Export the server in a way that Google Cloud Functions can recognize it.
export const api = async (request, reply) => {
	await server.ready()

	server.server.emit('request', request, reply)
}
