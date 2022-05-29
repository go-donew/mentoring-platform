// @/models/script.ts
// Class that represents an script.

/**
 * An interface representing a dependency for a script.
 *
 * @typedef {object} DependentAttribute
 * @property {string} id.required - The attribute ID.
 * @property {boolean} optional.required - Whether this dependency is required or not.
 */
export interface DependentAttribute {
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
export interface ComputedAttribute {
	id: string
	optional: boolean
}

/**
 * A class representing a script.
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
export class Script {
	id: string
	name: string
	description: string
	tags: string[]
	input: DependentAttribute[]
	computed: ComputedAttribute[]
	content: string

	constructor(
		id: string,
		name: string,
		description: string,
		tags: string[],
		input: DependentAttribute[],
		computed: ComputedAttribute[],
		content: string,
	) {
		this.id = id
		this.name = name
		this.description = description
		this.tags = tags
		this.input = input
		this.computed = computed
		this.content = content
	}
}
