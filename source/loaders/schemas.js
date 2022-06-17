// source/loaders/schemas.ts
// Registers schemas for everything.

import pluginify from 'fastify-plugin'

/**
 * Registers the schemas with the passed server instance.
 *
 * @param server The server instance to register the schemas with.
 */
export const schemas = pluginify((server, _, done) => {
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
			UserDTO: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					email: { type: 'string' },
					password: { type: 'string' },
				},
				required: ['name', 'email', 'password'],
			},
		},
	})

	done()
})
