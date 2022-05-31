// @/models/user.ts
// Class that represents a user.

/**
 * A class representing a user.
 *
 * @typedef {object} User
 * @property {string} id.required - The user ID.
 * @property {string} name.required - The user's name.
 * @property {string} email - The user's email address. - email
 * @property {string} phone - The user's phone number.
 * @property {string} lastSignedIn.required - The time the user last signed in to their account. - date
 */
export class User {
	constructor(
		public id: string,
		public name: string,
		public email: string | undefined,
		public phone: string | undefined,
		public lastSignedIn: Date,
	) {}
}
