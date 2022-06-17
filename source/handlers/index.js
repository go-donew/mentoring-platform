// source/handlers/index.ts
// Exports all the handlers in this folder.

import * as auth from './auth.js'
import * as users from './users.js'

export const handlers = {
	auth,
	users,
}
