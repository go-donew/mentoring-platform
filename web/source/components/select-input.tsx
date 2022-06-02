// source/components/select-input.tsx
// Defines and exports a select element.

/**
 * An option for a dropdown.
 *
 * @param {string} text - The text to show the user that is selecting an option.
 * @param {string} value - The actual value selected by the user.
 */
export type Option =
	| {
			text: string
			value: string
	  }
	| string

/**
 * A simple select element.
 *
 * @prop {string} id - An ID to refer to the input in tests.
 * @prop {string} label - The label to display above the input element.
 * @prop {Option[]} options - The array of options to display.
 * @prop {string?} selected - The currently selected option.
 * @prop {Function?} update - The function to call when the selected option changes.
 *
 * @component
 */
export const SelectInput = (props: {
	id: string
	options: Option[]
	selected?: string
	update?: (selected: string) => void
}) => {
	return (
		<>
			<select
				id={props.id}
				name={props.id}
				value={props.selected}
				class="rounded-lg relative block w-full my-2 px-3 py-2 border border-gray-300 dark:border-background-dark bg-surface dark:bg-surface-dark text-on-surface dark:text-on-surface-dark focus:outline-none focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark focus:z-10 sm:text-sm font-mono"
				onChange={(event: any) => {
					if (typeof props.update === 'function')
						props.update(event.target.value)
				}}
			>
				{props.options.map((option) => (
					<option value={typeof option === 'string' ? option : option.value}>
						{typeof option === 'string' ? option : option.text}
					</option>
				))}
			</select>
		</>
	)
}
