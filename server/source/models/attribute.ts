// @/models/attribute.ts
// Class that represents an attribute.

/**
 * Where this change was observed or what triggered the change. Could be the ID
 * of a message or a question, answering which, the value of the attribute was
 * changed.
 *
 * @typedef {object} BlamedMessage
 * @property {string} in.required - Whether the change was observed in a message or question. - enum:question,message
 * @property {string} id.required - The ID of the message/question.
 */
export type BlamedMessage = {
	in: 'question' | 'message'
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
 * @property {BlamedMessage} message - Where this change was observed or what triggered the change.
 */
export type AttributeSnapshot = {
	value: string | number | boolean
	observer: string | 'bot'
	timestamp: Date
	message?: BlamedMessage
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
	id: string
	value: string | number | boolean
	history: AttributeSnapshot[]

	readonly _userId: string

	constructor(
		id: string,
		value: string | number | boolean,
		history: AttributeSnapshot[],
		userId: string,
	) {
		this.id = id
		this.value = value
		this.history = history

		this._userId = userId
	}
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
	id: string
	name: string
	description: string
	tags: string[]
	conversations: string[]

	constructor(
		id: string,
		name: string,
		description: string,
		tags: string[],
		conversations: string[],
	) {
		this.id = id
		this.name = name
		this.description = description
		this.tags = tags
		this.conversations = conversations
	}
}
