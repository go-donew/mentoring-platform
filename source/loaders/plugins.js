// source/loaders/plugins.ts
// Loads and registers all the plugins for the server.

import pluginify from 'fastify-plugin'
import { parse } from 'stacktrace-parser'

import { database } from '../provider/database.js'
import { auth } from '../provider/auth.js'
import { config } from '../utilities/config.js'
import { logger } from '../utilities/logger.js'
import { ServerError } from '../utilities/errors.js'

/**
 * Registers plugins with the passed server instance.
 *
 * @param server The server instance to register the plugins with.
 */
export const plugins = pluginify((server, _, done) => {
	// Functions already parses the body for us, so we pass on the parsed body.
	// See https://www.fastify.io/docs/latest/Guides/Serverless/#google-cloud-functions.
	if (config.prod)
		server.addContentTypeParser('application/json', {}, (_, body, done) =>
			done(undefined, body.body),
		)

	// Log the request as it comes.
	server.addHook('onRequest', (request, _, done) => {
		logger.http(
			'received request from %s - %s %s',
			request.ip,
			request.method.toLowerCase(),
			request.url,
		)
		done()
	})
	// Log the response's status code and response time.
	server.addHook('onResponse', (_, reply, done) => {
		logger.http(
			'sent response %s in %s ms',
			reply.statusCode,
			reply.getResponseTime().toFixed(3),
		)
		done()
	})

	// Decorate the server instance with the database and auth services.
	server.decorate('database', database)
	server.decorate('auth', auth)
	// Decorate the request with the user making it.
	server.decorateRequest('user', undefined)

	// Handle not found errors.
	server.setNotFoundHandler((_request, _reply) => {
		throw new ServerError('route-not-found')
	})
	// Handle server errors.
	server.setErrorHandler((caughtError, _request, reply) => {
		if (caughtError instanceof ServerError) {
			// If it is a server error, just forward it onward to the user.
			logger.http('sending error %s %s', caughtError.status, caughtError.code)
			reply.code(caughtError.status).send(caughtError.send())
		} else if (caughtError.validation) {
			// If it is a validation error, parse the error and send it as a
			// 400 improper-payload error.
			logger.http('validation error occurred - %j', caughtError.validation)
			// Get a comprehensible message.
			const message = `An error occurred while validating your request: ${caughtError.message}`
			const error = new ServerError('improper-payload', message)
			// Then send the error.
			reply.code(error.status).send(error.send())
		} else {
			// Otherwise, return a 500 to the user and print out neat diagnostic
			// information as to what the error was and where it occurred.
			const stack = parse(caughtError.stack)[0]
			// Make the filename relative.
			stack.file = stack.file.replace(/^.*\/source/g, './source')

			// Then print the error and send back a 500 server-crash error.
			logger.error(
				caughtError,
				`caught server error: '${caughtError.message}' in ${stack.file}:${stack.lineNumber}:${stack.column}`,
			)

			const error = new ServerError('server-crash')
			reply.code(error.status).send(error.send())
		}
	})

	done()
})
