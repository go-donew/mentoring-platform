// source/components/icon-button.tsx
// Defines and exports an icon button component.

import { Icon } from './icon'

import type { IconType } from './icon'

/**
 * A button with an icon instead of text.
 *
 * @prop {string} id - An ID to refer to the button in tests.
 * @prop {IconType} icon - The icon to render.
 * @prop {Function?} action - The function to call on clicking the button.
 *
 * @component
 */
export const IconButton = (props: {
	id: string
	icon: IconType
	action?: () => void
	class?: string
}) => (
	<button
		id={props.id}
		type="button"
		class={`text-sm font-bold rounded-lg text-primary dark:text-primary-dark ${props.class}`}
		onClick={props.action}
	>
		<Icon type={props.icon} />
	</button>
)
