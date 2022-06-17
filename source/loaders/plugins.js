// source/loaders/plugins.ts
// Loads and registers all the plugins for the server.

import pluginify from 'fastify-plugin'
import { parse } from 'stacktrace-parser'

import { ServerError } from '../utilities/errors.js'
import { database } from '../provider/database.js'

/**
 * Registers plugins with the passed server instance.
 *
 * @param server The server instance to register the plugins with.
 */
export const plugins = pluginify((server, _options, done) => {
	// Log the request as it comes.
	server.addHook('onRequest', (request, _, done) => {
		server.log.http('received request from %s - %s %s', request.ip, request.method.toLowerCase(), request.url)
		done()
	})
	// Log the response's status code and response time.
	server.addHook('onResponse', (_, reply, done) => {
		server.log.http('sent response %s in %s ms', reply.statusCode, reply.getResponseTime().toFixed(3))
		done()
	})

	// Decorate the server instance with the database and auth services.
	server.decorate('database', database)

	// Handle not found errors.
	server.setNotFoundHandler((_request, _reply) => {
		throw new ServerError('route-not-found')
	})
	// Handle server errors.
	server.setErrorHandler((caughtError, _request, reply) => {
		const error = caughtError instanceof ServerError ? caughtError : new ServerError('server-crash')

		// If it is a server error, just forward it onward to the user.
		if (caughtError instanceof ServerError) {
			server.log.http('sending error %s %s', caughtError.status, caughtError.code)
		} else {
			// Otherwise, return a 500 to the user and print out neat diagnostic
			// information as to what the error was and where it occurred.
			const stack = parse(caughtError.stack)[0]
			// Make the filename relative.
			stack.file = stack.file.replace(/^.*\/source/g, './source')

			// Then print the error.
			server.log.error(
				caughtError,
				`caught server error: '${caughtError.message}' in ${stack.file}:${stack.lineNumber}:${stack.column}`,
			)
		}

		reply.status(error.status).send(error.send())
	})

	done()
})
