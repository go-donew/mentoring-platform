// @/models/attribute.ts
// Class that represents an attribute.

/**
 * Where this change was observed or what triggered the change. Could be the ID
 * of a message or a conversation, answering which, the value of the attribute was
 * changed.
 *
 * @typedef {object} SnapshotBlame
 * @property {string} in.required - Whether the change was observed in a message/conversation/script. - enum:conversation,message,script
 * @property {string} id.required - The ID of the message/conversation/script.
 */
export type SnapshotBlame = {
	in: 'conversation' | 'message' | 'script'
	id: string
}

/**
 * A snapshot of an an attribute when a certain change was made and the metadata
 * related to that change.
 *
 * @typedef {object} AttributeSnapshot
 * @property {string | number | boolean} value.required - The attribute's value.
 * @property {string} observer.required - The ID of the user who made this change.
 * @property {string} timestamp.required - When the change occurred. - date
 * @property {SnapshotBlame} message - Where this change was observed or what triggered the change.
 */
export type AttributeSnapshot = {
	value: string | number | boolean
	observer: string
	timestamp: Date
	message?: SnapshotBlame
}

/**
 * A class representing an attribute of a certain user.
 *
 * @typedef {object} UserAttribute
 * @property {string} id.required - The attribute ID.
 * @property {string | number | boolean} value.required - The attribute's value.
 * @property {array<AttributeSnapshot>} history - A list of changes that have been made to the attribute's value.
 */
export class UserAttribute {
	constructor(
		public id: string,
		public value: string | number | boolean,
		public history: AttributeSnapshot[],
		public readonly _userId: string,
	) {}
}

/**
 * A class representing an attribute.
 *
 * @typedef {object} Attribute
 * @property {string} id.required - The attribute ID.
 * @property {string} name.required - The attribute's name.
 * @property {string} description.required - The attribute's description.
 * @property {array<string>} tags.required - Tags to enhance the attribute's searchability.
 * @property {array<string>} conversations.required - A list of conversations that might set this attribute.
 */
export class Attribute {
	constructor(
		public id: string,
		public name: string,
		public description: string,
		public tags: string[],
		public conversations: string[],
	) {}
}
