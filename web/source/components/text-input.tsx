// source/components/text-input.tsx
// Defines and exports an element to get text input from the user.

import { Label } from './label'

/**
 * A simple text input element.
 *
 * @prop {string} id - An ID to refer to the input in tests.
 * @prop {string} label - The label to display above the input element.
 * @prop {string} type - The type of input element to render.
 * @prop {string?} placeholder - The placeholder for the input element.
 * @prop {string?} value - The text to display in the element.
 * @prop {boolean?} required - Whether the field is required or not.
 * @prop {boolean?} disabled - Whether the field can be edited by the user or not.
 * @prop {number?} minimum - The minimum value of the field when the input accepts only numbers.
 * @prop {Function?} update - The function to call when the text in the element changes.
 * @prop {Function?} focus - The function to call when the user focuses the element.
 *
 * @component
 */
export const TextInput = (props: {
	id: string
	label: string
	type: string
	placeholder?: string
	value?: string
	required?: boolean
	disabled?: boolean
	minimum?: number
	update?: (value: string) => void
	focus?: () => void
}) => (
	<div>
		<Label
			for={props.id}
			text={props.label}
			required={props.required ?? false}
		/>
		<input
			id={props.id}
			name={props.id}
			type={props.type}
			placeholder={props.placeholder}
			value={props.value}
			disabled={props.disabled ?? false}
			min={props.minimum}
			class="appearance-none rounded-lg relative block w-full my-2 px-3 py-2 border border-gray-300 dark:border-background-dark bg-surface dark:bg-surface-dark text-on-surface dark:text-on-surface-dark focus:outline-none focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark focus:z-10 sm:text-sm font-mono"
			onChange={(event: any) => {
				if (typeof props.update === 'function') props.update(event.target.value)
			}}
			onFocus={() => {
				if (typeof props.focus === 'function') props.focus()
			}}
		/>
	</div>
)

/**
 * An expandable text input element.
 *
 * @prop {string} id - An ID to refer to the input in tests.
 * @prop {string} type - The type of input element to render.
 * @prop {string?} placeholder - The placeholder for the input element.
 * @prop {string?} value - The text to display in the element.
 * @prop {boolean?} required - Whether the field is required or not.
 * @prop {boolean?} disabled - Whether the field can be edited by the user or not.
 * @prop {Function?} update - The function to call when the text in the element changes.
 * @prop {Function?} focus - The function to call when the user focuses the element.
 *
 * @component
 */
export const ExpandableTextInput = (props: {
	id: string
	type: string
	placeholder?: string
	value?: string
	required?: boolean
	disabled?: boolean
	update?: (value: string) => void
	focus?: () => void
}) => (
	<textarea
		id={props.id}
		name={props.id}
		type={props.type}
		placeholder={props.placeholder}
		value={props.value}
		disabled={props.disabled ?? false}
		rows={1}
		class="appearance-none rounded-lg relative block w-full my-2 px-3 py-2 border border-gray-300 dark:border-background-dark bg-surface dark:bg-surface-dark text-on-surface dark:text-on-surface-dark focus:outline-none focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark focus:z-10 sm:text-sm font-mono"
		style={{
			resize: (props.value?.length ?? 0) > 40 ? 'vertical' : 'none',
		}}
		onChange={(event: any) => {
			if (typeof props.update === 'function') props.update(event.target.value)
		}}
		onFocus={() => {
			if (typeof props.focus === 'function') props.focus()
		}}
	/>
)
