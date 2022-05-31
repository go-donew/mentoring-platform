// @/models/question.ts
// Class that represents a question.

/**
 * An object that contains the data about the attribute to set when a user
 * answers a question with a given option.
 *
 * @typedef {object} AttributeToSet
 * @property {string} id.required - The ID of the attribute to set.
 * @property {string | number | boolean} value.required - The value of the attribute to set. If the `type` of the question is `input` and the user input is undefined, then this value will be set.
 */
export type AttributeToSet = {
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
export type NextQuestion = {
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
 * @property {NextQuestion} next - The next question to show the user if they select this option.
 */
export type Option = {
	position: number
	type: 'select' | 'input'
	text: string
	attribute: AttributeToSet
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
 * @property {array<string>} tags.required - Tags to enhance searchability of the question.
 */
export class Question {
	constructor(
		public id: string,
		public text: string,
		public options: Option[],
		public first: boolean,
		public last: boolean,
		public randomizeOptionOrder: boolean,
		public tags: string[],
		public readonly _conversationId: string,
	) {}
}
