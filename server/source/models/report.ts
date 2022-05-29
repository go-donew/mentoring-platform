// @/models/report.ts
// Class that represents an report.

import { DependentAttribute } from '@/models/script'

// Re-export the type
export { DependentAttribute } from '@/models/script'

/**
 * A class representing a report.
 *
 * @typedef {object} Report
 * @property {string} id.required - The report ID.
 * @property {string} name.required - The report name.
 * @property {string} description.required - The report description.
 * @property {array<string>} tags.required - The list of tags to enhance searchability of the report.
 * @property {string} template.required - The EJS template used to generate the report.
 * @property {array<DependentAttribute>} input.required - The list of attribute IDs required to generate the report.
 */
export class Report {
	id: string
	name: string
	description: string
	tags: string[]
	template: string
	input: DependentAttribute[]

	constructor(
		id: string,
		name: string,
		description: string,
		tags: string[],
		template: string,
		input: DependentAttribute[],
	) {
		this.id = id
		this.name = name
		this.description = description
		this.tags = tags
		this.template = template
		this.input = input
	}
}
