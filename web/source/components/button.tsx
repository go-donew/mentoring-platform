// source/components/button.tsx
// Defines and exports a simple button component.

/**
 * A simple button.
 *
 * @prop {string} id - An ID to refer to the button in tests.
 * @prop {string} text - The text to display on the button.
 * @prop {Function} action - The function to call on clicking the button.
 * @prop {'text' | 'filled'} type - The type of button to render.
 *
 * @component
 */
export const Button = (props: {
	id: string
	text: string
	action: () => void
	type: 'text' | 'filled'
	class?: string
}) => (
	<button
		id={props.id}
		type="button"
		class={`px-4 py-2 text-sm font-bold rounded-lg ${
			props.type === 'filled'
				? 'bg-primary dark:bg-primary-dark text-on-primary dark:text-on-primary-dark'
				: 'text-on-background dark:text-on-background-dark'
		} ${props.class}`}
		onClick={props.action}
	>
		{props.text}
	</button>
)
