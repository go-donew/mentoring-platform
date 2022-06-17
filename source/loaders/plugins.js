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
export const plugins = pluginify((server, _, done) => {
	// Functions already parses the body for us, so we pass on the parsed body.
	// See https://www.fastify.io/docs/latest/Guides/Serverless/#google-cloud-functions.
	server.addContentTypeParser('application/json', {}, (_, body, done) => {
		done(undefined, body.body)
	})

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
		if (caughtError instanceof ServerError) {
			// If it is a server error, just forward it onward to the user.
			server.log.http('sending error %s %s', caughtError.status, caughtError.code)
			reply.status(caughtError.status).send(caughtError.send())
		} else if (caughtError.validation) {
			// If it is a validation error, parse the error and send it as a
			// 400 improper-payload error.
			server.log.http('validation error occurred - %j', caughtError.validation)
			// Get a comprehensible message.
			const message = `An error occurred while validating your request: ${caughtError.message}`
			const error = new ServerError('improper-payload', message)
			// Then send the error.
			reply.status(error.status).send(error.send())
		} else {
			// Otherwise, return a 500 to the user and print out neat diagnostic
			// information as to what the error was and where it occurred.
			const stack = parse(caughtError.stack)[0]
			// Make the filename relative.
			stack.file = stack.file.replace(/^.*\/source/g, './source')

			// Then print the error and send back a 500 server-crash error.
			server.log.error(
				caughtError,
				`caught server error: '${caughtError.message}' in ${stack.file}:${stack.lineNumber}:${stack.column}`,
			)

			const error = new ServerError('server-crash')
			reply.status(error.status).send(error.send())
		}
	})

	done()
})
