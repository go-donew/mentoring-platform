// @/models/conversation.ts
// Class that represents a conversation.

/**
 * A class representing a conversation.
 *
 * @typedef {object} Conversation
 * @property {string} id.required - The conversation ID.
 * @property {string} name.required - The conversation's name.
 * @property {string} description.required - The conversation's description.
 * @property {boolean} once.required - Whether a user can go through the conversation again.
 * @property {array<string>} tags.required - Tags to enhance searchability of the conversation.
 */
export class Conversation {
	constructor(
		public id: string,
		public name: string,
		public description: string,
		public once: boolean,
		public tags: string[],
	) {}
}
