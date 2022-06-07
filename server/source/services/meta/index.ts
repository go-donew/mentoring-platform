// @/services/meta/index.ts
// Service that provides user metadata.

import type { RateLimitInfo } from 'express-rate-limit'

import type { ServiceRequest, ServiceResponse } from '@/types'

import { ServerError } from '@/errors'
import { User } from '@/models/user'

/**
 * The response from the metadata endpoint.
 *
 * @typedef {object} MetadataResponse
 * @property {User} user.required - The user calling the API, along with some extra metadata.
 * @property {RateLimitInfo} rate.required - Rate limit information.
 */
export type MetadataResponse = {
	user: User & {
		isGroot: boolean
		token: string
	}
	rate: RateLimitInfo
}

/**
 * Method to retrieve metadata about the user calling the API.
 *
 * @param {ServiceRequest} request - The request consisting of payload required to perform this operation.
 *
 * @returns {ServiceResponse} - The response from the data provider. If successful, the service will return metadata about the user calling the API.
 */
const get = async (
	request: ServiceRequest<unknown>,
): Promise<ServiceResponse<MetadataResponse>> => {
	try {
		const data = {
			user: request.context!.user,
			rate: request.context!.rate,
		}

		return {
			status: 200,
			data,
		}
	} catch (error: unknown) {
		return {
			error:
				error instanceof ServerError ? error : new ServerError('server-crash'),
		}
	}
}

// Export the functions
export const service = {
	get,
}
