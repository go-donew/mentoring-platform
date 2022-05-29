// source/components/toast.tsx
// Defines and exports a toast component.

/**
 * A simple toast.
 *
 * @prop {string} id - An ID to refer to the toast in tests.
 * @prop {'info' | 'error'} type - The type of toast to render.
 * @prop {string?} text - The text to display.
 *
 * @component
 */
export const Toast = (props: {
	id: string
	type: 'info' | 'error'
	text?: string
}) => {
	const toasts = {
		info: (
			<span class="text-sm text-secondary dark:text-secondary-dark font-medium">
				{props.text}
			</span>
		),
		error: (
			<span class="text-sm text-error dark:text-error-dark font-medium">
				{props.text}
			</span>
		),
	}

	return (
		<div
			class={`${
				// Automatically hide the toast if the text is updated to be undefined
				props.text ? 'block' : 'hidden'
			} mx-auto p-4 max-w-md text-center bg-background dark:bg-background-dark rounded-lg shadow`}
			data-ref="current-toast"
		>
			{toasts[props.type]}
		</div>
	)
}
