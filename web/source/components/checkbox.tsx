// source/components/checkbox.tsx
// Defines and exports a checkbox component.

/**
 * A checkbox.
 *
 * @prop {string} id - An ID to refer to the button in tests.
 * @prop {string} text - The text to display on the button.
 * @prop {boolean} selected - Whether or not the option is currently selected.
 * @prop {Function} action - The function to call on clicking the button.
 *
 * @component
 */
export const Checkbox = (props: {
	id: string
	text: string
	selected: boolean
	action: (checked: boolean) => void
	class?: string
}) => (
	<div
		onClick={(event: any) => {
			if (typeof props.action === 'function') props.action(event.target.checked)
		}}
	>
		<input
			id={props.id}
			name={props.id}
			checked={props.selected}
			type="checkbox"
			class="w-3 h-3 dark:border-background-dark bg-surface dark:bg-surface-dark text-on-surface dark:text-on-surface-dark focus:outline-none focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark focus:z-10"
		/>
		<label class={`ml-2 text-md font-normal ${props.class}`}>
			{props.text}
		</label>
	</div>
)
