// source/components/radio-button.tsx
// Defines and exports a radio button component.

/**
 * The radio in the button.
 *
 * @prop {string} id - An ID to refer to the button in tests.
 * @prop {boolean} selected - Whether or not the radio button is checked.
 *
 * @component
 */
export const Radio = (props: { id: string; selected: boolean }) => (
	<input
		id={props.id}
		name={props.id}
		checked={props.selected}
		type="radio"
		class="w-3 h-3 dark:border-background-dark bg-surface dark:bg-surface-dark text-on-surface dark:text-on-surface-dark focus:outline-none focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark focus:z-10"
	/>
)

/**
 * A radio button.
 *
 * @prop {string} id - An ID to refer to the button in tests.
 * @prop {string} text - The text to display on the button.
 *
 * @prop {Function} action - The function to call on clicking the button.
 * @prop {'text' | 'filled'} type - The type of button to render.
 *
 * @component
 */
export const RadioButton = (props: {
	id: string
	text: string
	selected: boolean
	action: () => void
	class?: string
}) => (
	<div
		onClick={() => {
			if (typeof props.action === 'function') props.action()
		}}
	>
		<Radio id={props.id} selected={props.selected} />
		<label for={props.id} class={`ml-2 text-md font-normal ${props.class}`}>
			{props.text}
		</label>
	</div>
)
