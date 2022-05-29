// source/utilities/auth.ts
// Defines and exports helper functions related to authentication and
// authorization of the user.

import { storage } from './storage'

/**
 * Checks whether or not the user is authenticated.
 *
 * @returns {boolean} - Whether or not the user is authenticated.
 */
export const isAuthenticated = (): boolean =>
	storage.exists('user') && storage.exists('tokens')
