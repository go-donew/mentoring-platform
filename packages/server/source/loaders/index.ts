// @/loaders/index.ts
// Runs all loaders in the `@/loaders` folder.

import type { Application } from 'express'

import { load as loadProvider } from '@/loaders/provider'
import { load as loadMiddleware } from '@/loaders/express/middleware'
import { load as loadDocumentation } from '@/loaders/express/docs'
import { load as loadRoutes } from '@/loaders/express/routes'
import { logger } from '@/utilities/logger'

/**
 * Calls all the loaders in this directory one by one, and passes the epxress
 * application instance to them.
 *
 * @param {Application} app - The Express application instance.
 */
export const load = async (app: Application): Promise<void> => {
	logger.info(' [loaders] running loaders')

	// Initialize the data and auth provider
	await loadProvider(app)
	// Register Express middleware
	await loadMiddleware(app)
	// Generate the documentation
	await loadDocumentation(app)
	// Register API endpoints
	await loadRoutes(app)

	logger.info('[loaders] all loaders succeeded')
}
