// source/utilities/config.ts
// Loads and manages configuration for the server.

import { env } from 'node:process'

export const config = {
	// Whether we are in a development environment or not.
	prod: env.NODE_ENV?.toLowerCase().startsWith('prod'),
	// The port to bind the server to.
	port: parseInt(env.PORT ?? '34342'),
}
