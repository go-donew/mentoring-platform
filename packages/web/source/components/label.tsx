// source/components/label.tsx
// Defines and exports an element to label input elements.

/**
 * A simple label, usually shown above input elements.
 *
 * @prop {string} text - The text to display.
 * @prop {boolean} required - Whether the input is required. If it is, a red asterix is shown alongside the text.
 *
 * @component
 */
export const Label = (props: { text: string; required: boolean }) => (
	<label class="block text-sm font-medium text-on-surface dark:text-on-surface-dark">
		{props.text}
		{props.required ? (
			<span class="text-error dark:text-error-dark">*</span>
		) : (
			<></>
		)}
	</label>
)
