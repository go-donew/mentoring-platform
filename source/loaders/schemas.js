// source/loaders/schemas.ts
// Registers schemas for everything.

import pluginify from 'fastify-plugin'

import { logger } from '../utilities/logger.js'

/**
 * Registers the schemas with the passed server instance.
 *
 * @param server The server instance to register the schemas with.
 */
export const schemas = pluginify((server, _, done) => {
	logger.silly('registering schemas')

	server.addSchema({
		$id: 'schemas',
		type: 'object',
		definitions: {
			User: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					phone: { type: 'string', nullable: true },
					email: { type: 'string', nullable: true },
					lastSignedIn: { type: 'string' },
				},
			},
			Tokens: {
				type: 'object',
				properties: {
					bearer: { type: 'string' },
					tokens: { type: 'string' },
				},
			},
		},
	})

	server.addSchema({
		$id: 'dtos',
		type: 'object',
		definitions: {
			NameEmailPassword: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					email: { type: 'string' },
					password: { type: 'string' },
				},
				required: ['name', 'email', 'password'],
			},
			EmailPassword: {
				type: 'object',
				properties: {
					email: { type: 'string' },
					password: { type: 'string' },
				},
				required: ['email', 'password'],
			},
		},
	})

	logger.silly('successfully registered schemas')

	done()
})
