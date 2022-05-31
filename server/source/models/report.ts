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
	constructor(
		public id: string,
		public name: string,
		public description: string,
		public tags: string[],
		public template: string,
		public input: DependentAttribute[],
	) {}
}
