// source/api.d.ts
// Type declarations for objects returned by the API.

/**
 * The bearer token and refresh token set returned when a user signs in/up or
 * refreshes the token set.
 *
 * @typedef {object} Tokens
 * @property {string} bearer.required - The user's bearer token that must be passed in the `Authorization` header of subsequent requests.
 * @property {string} refresh.required - The refresh token used to retrieve a new set of tokens when the current set expires.
 */
export declare interface Tokens {
	bearer: string
	refresh: string
}

/**
 * An interface representing user details.
 *
 * @typedef {object} User
 * @property {string} id.required - The user ID.
 * @property {string} name.required - The user's name.
 * @property {string} email - The user's email address. - email
 * @property {string} phone - The user's phone number.
 * @property {string} lastSignedIn.required - The time the user last signed in to their account. - date
 */
export declare interface User {
	id: string
	name: string
	email?: string
	phone?: string
	lastSignedIn: Date
}

/**
 * List of participants in a group.
 *
 * @typedef {object} ParticipantList
 * @property {string} userId - The participating user's ID and their role in the group. - enum:mentee,mentor,supermentor
 */
export declare type ParticipantList = Record<
	string,
	'mentee' | 'mentor' | 'supermentor'
>

/**
 * List of conversations the group's participants are allowed to take part in.
 *
 * @typedef {object} ConversationList
 * @property {array<string>} conversationId - The conversation ID and which roles in the group are allowed to take part in it. - enum:mentee,mentor,supermentor
 */
export declare type ConversationList = Record<
	string,
	Array<'mentee' | 'mentor' | 'supermentor'>
>

/**
 * List of reports the group's participants can view.
 *
 * @typedef {object} ReportList
 * @property {array<string>} reportId - The report ID and which roles in the group are allowed to view it. - enum:mentee,mentor,supermentor
 */
export declare type ReportList = Record<
	string,
	Array<'mentee' | 'mentor' | 'supermentor'>
>

/**
 * An interface representing a group.
 *
 * @typedef {object} Group
 * @property {string} id.required - The group ID.
 * @property {string} name.required - The group's name.
 * @property {ParticipantList} participants - The group's participants.
 * @property {ConversationList} conversations - The conversations the group's participants are allowed to take part in.
 * @property {ReportList} reports - The reports the group's participants can view.
 * @property {string} code.required - The code a user can use to join the group.
 * @property {array<string>} tags.required - Tags to enhance the searchability of the group.
 */
export declare interface Group {
	id: string
	name: string
	participants: ParticipantList
	conversations: ConversationList
	reports: ReportList
	code: string
	tags: string[]
}

/**
 * An interface representing an attribute.
 *
 * @typedef {object} Attribute
 * @property {string} id.required - The attribute ID.
 * @property {string} name.required - The attribute's name.
 * @property {string} description.required - The attribute's description.
 * @property {array<string>} tags.required - Tags to enhance the attribute's searchability.
 * @property {array<string>} conversations.required - A list of conversations that might set this attribute.
 */
export declare interface Attribute {
	id: string
	name: string
	description: string
	tags: string[]
	conversations: string[]
}

/**
 * Where this change was observed or what triggered the change. Could be the ID
 * of a message or a conversation, answering which, the value of the attribute was
 * changed.
 *
 * @typedef {object} SnapshotBlame
 * @property {string} in.required - Whether the change was observed in a message or conversation. - enum:conversation,message,script
 * @property {string} id.required - The ID of the message/conversation/script.
 */
export declare type SnapshotBlame = {
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
export declare type AttributeSnapshot = {
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
export declare interface UserAttribute {
	id: string
	value: string | number | boolean
	history: AttributeSnapshot[]
}

/**
 * An interface representing a conversation.
 *
 * @typedef {object} Conversation
 * @property {string} id.required - The conversation ID.
 * @property {string} name.required - The conversation's name.
 * @property {string} description.required - The conversation's description.
 * @property {boolean} once.required - Whether a user can go through the conversation again.
 * @property {array<string>} tags.required - Tags to enhance searchability of the conversation.
 */
export declare interface Conversation {
	id: string
	name: string
	description: string
	once: boolean
	tags: string[]
}

/**
 * An object that contains the data about the attribute to set when a user
 * answers a question with a given option.
 *
 * @typedef {object} AttributeToSet
 * @property {string} id.required - The ID of the attribute to set.
 * @property {string | number | boolean} value.required - The value of the attribute to set. If the `type` of the question is `input` and the user input is undefined, then this value will be set.
 */
export declare interface AttributeToSet {
	id: string
	value: string | number | boolean
}

/**
 * An object that contains the data about the next question to show a user when
 * they answer a question with a given option.
 *
 * @typedef {object} NextQuestion
 * @property {string} conversation.required - The ID of the conversation the next question is a part of.
 * @property {string} question.required - The ID of the question.
 */
export declare interface NextQuestion {
	conversation: string
	question: string
}

/**
 * An option a user can select to answer a question.
 *
 * @typedef {object} Option
 * @property {number} position.required - The position to show the option in if `randomizeOptionOrder` is `false`.
 * @property {string} type.required - The type of option. If it is `input`, the user can enter text as their answer - enum:select,input
 * @property {string} text.required - The question text. Should be shown as a hint for the textbox if `type` is `input`.
 * @property {AttributeToSet} attribute - The attribute to set when a user answers the question with this option.
 * @property {string} script - The script to run if they select this option.
 * @property {NextQuestion} next - The next question to show the user if they select this option.
 */
export declare interface Option {
	position: number
	type: 'select' | 'input'
	text: string
	attribute?: AttributeToSet
	script?: string
	next?: NextQuestion
}

/**
 * A class representing a question.
 *
 * @typedef {object} Question
 * @property {string} id.required - The question ID.
 * @property {string} text.required - The question text.
 * @property {array<Option>} options.required - The options to the question.
 * @property {boolean} first.required - Whether this is the first question in the conversation.
 * @property {boolean} last.required - Whether this is the last question in the conversation.
 * @property {boolean} randomizeOptionOrder.required - Whether to randomize the order of the options.
 * @property {array<string>} tags.required - Tags to enhance searchability of the conversation.
 */
export declare interface Question {
	id: string
	text: string
	options: Option[]
	first: boolean
	last: boolean
	randomizeOptionOrder: boolean
	tags: string[]
}

/**
 * An interface representing a dependency for a script.
 *
 * @typedef {object} DependentAttribute
 * @property {string} id.required - The attribute ID.
 * @property {boolean} optional.required - Whether this dependency is required or not.
 */
export declare interface DependentAttribute {
	id: string
	optional: boolean
}

/**
 * An interface representing an attribute computed by a script.
 *
 * @typedef {object} ComputedAttribute
 * @property {string} id.required - The attribute ID.
 * @property {boolean} optional.required - Whether the attribute is guaranteed to be computed.
 */
export declare interface ComputedAttribute {
	id: string
	optional: boolean
}

/**
 * An interface representing a script.
 *
 * @typedef {object} Script
 * @property {string} id.required - The script ID.
 * @property {string} name.required - The script name.
 * @property {string} description.required - The script description.
 * @property {array<string>} tags.required - The list of tags to enhance searchability of the script.
 * @property {array<DependentAttribute>} input.required - The list of attributes required to run the script.
 * @property {array<ComputedAttribute>} computed.required - The list of attributes computed and set by this script.
 * @property {string} content.required - The base64 encoded lua code to run.
 */
export declare interface Script {
	id: string
	name: string
	description: string
	tags: string[]
	input: DependentAttribute[]
	computed: ComputedAttribute[]
	content: string
}

/**
 * An interface representing a report.
 *
 * @typedef {object} Report
 * @property {string} id.required - The report ID.
 * @property {string} name.required - The report name.
 * @property {string} description.required - The report description.
 * @property {array<string>} tags.required - The list of tags to enhance searchability of the report.
 * @property {string} template.required - The EJS template used to generate the report.
 * @property {array<DependentAttribute>} input.required - The list of attribute IDs required to generate the report.
 */
export declare interface Report {
	id: string
	name: string
	description: string
	tags: string[]
	template: string
	input: DependentAttribute[]
}
