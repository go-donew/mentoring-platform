// @/models/group.ts
// Class that represents a group.

/**
 * List of participants in a group.
 *
 * @typedef {object} ParticipantList
 * @property {string} userId - The participating user's ID and their role in the group. - enum:mentee,mentor,supermentor
 */
export type ParticipantList = Record<
	string,
	'mentee' | 'mentor' | 'supermentor'
>

/**
 * List of conversations the group's participants are allowed to take part in.
 *
 * @typedef {object} ConversationList
 * @property {array<string>} conversationId - The conversation ID and which roles in the group are allowed to take part in it. - enum:mentee,mentor,supermentor
 */
export type ConversationList = Record<
	string,
	Array<'mentee' | 'mentor' | 'supermentor'>
>

/**
 * List of reports the group's participants can view.
 *
 * @typedef {object} ReportList
 * @property {array<string>} reportId - The report ID and which roles in the group are allowed to view it. - enum:mentee,mentor,supermentor
 */
export type ReportList = Record<
	string,
	Array<'mentee' | 'mentor' | 'supermentor'>
>

/**
 * A class representing a group.
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
export class Group {
	constructor(
		public id: string,
		public name: string,
		public participants: ParticipantList,
		public conversations: ConversationList,
		public reports: ReportList,
		public code: string,
		public tags: string[],
	) {}
}
