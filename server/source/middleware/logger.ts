// @/middleware/logger.ts
// Middleware that logs every request made to the server.

import type { Request, RequestHandler, Response, NextFunction } from 'express'

import { logger } from '@/utilities/logger'

/**
 * Log information regarding a request.
 *
 * @returns {RequestHandler} - The authorization middleware.
 */
export const logRequests =
	(): RequestHandler =>
	async (
		request: Request,
		response: Response,
		next: NextFunction,
	): Promise<void> => {
		// Log the received request
		const requestTimestamp = Date.now()
		logger.http(
			'[http/request] received request from %s - %s %s (%s)',
			(request.headers['x-forwarded-for'] as string)?.split(',')[0] ??
				request.headers['fastly-client-ip'] ??
				request.ip ??
				request.ips[0] ??
				request.connection.remoteAddress ??
				request.socket.remoteAddress ??
				'unknown',
			request.method.toLowerCase(),
			request.url,
			request.headers['user-agent'],
		)

		// Also log the sent response when the response finishes
		response.on('finish', () => {
			const responseTimestamp = Date.now()
			logger.http(
				'[http/response] returned %d in %d ms',
				response.statusCode,
				responseTimestamp - requestTimestamp,
			)
		})

		next()
	}
