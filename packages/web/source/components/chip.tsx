// source/components/chip.tsx
// Defines and exports a simple chip component.

/**
 * A chip.
 *
 * @prop {string} value - The text to show inside the chip.
 *
 * @component
 */
export const Chip = (props: { value: string }) => (
	<span class="px-2 m-1 rounded-full bg-primary dark:bg-primary-dark text-on-primary dark:text-on-primary text-xs">
		{props.value}
	</span>
)
