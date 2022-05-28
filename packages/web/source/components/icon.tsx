// source/components/icon.tsx
// Defines and exports icons and a component to display them.

/**
 * A type that defines which icons can be rendered, according to the icons in
 * the `icons` object below.
 */
export type IconType = keyof typeof icons

/**
 * An icon.
 *
 * @prop {IconType} type - The icon to render.
 *
 * @component
 */
export const Icon = (props: { type: IconType }) => icons[props.type]

/**
 * A list of icons that we can render.
 *
 * All these icons are SVGs taken from https://feathericons.com.
 */
const icons = {
	up: (
		<>
			<span class="sr-only">Up</span>
			<svg
				class="block pt-1"
				viewBox="0 0 24 24"
				height="25"
				width="25"
				stroke="currentColor"
				stroke-width="2"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="18 15 12 9 6 15"></polyline>
			</svg>
		</>
	),
	down: (
		<>
			<span class="sr-only">Down</span>
			<svg
				class="block pt-1"
				viewBox="0 0 24 24"
				height="25"
				width="25"
				stroke="currentColor"
				stroke-width="2"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</>
	),
	close: (
		<>
			<span class="sr-only">Close</span>
			<svg
				class="block h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
			>
				<path d="M6 18L18 6M6 6l12 12" />
			</svg>
		</>
	),
	menu: (
		<>
			<span class="sr-only">Menu</span>
			<svg
				class="block h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
			>
				<path d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</>
	),
	settings: (
		<>
			<span class="sr-only">Settings</span>
			<svg
				class="block h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.5"
			>
				<line x1="4" y1="21" x2="4" y2="14"></line>
				<line x1="4" y1="10" x2="4" y2="3"></line>
				<line x1="12" y1="21" x2="12" y2="12"></line>
				<line x1="12" y1="8" x2="12" y2="3"></line>
				<line x1="20" y1="21" x2="20" y2="16"></line>
				<line x1="20" y1="12" x2="20" y2="3"></line>
				<line x1="1" y1="14" x2="7" y2="14"></line>
				<line x1="9" y1="8" x2="15" y2="8"></line>
				<line x1="17" y1="16" x2="23" y2="16"></line>
			</svg>
		</>
	),
	save: (
		<>
			<span class="sr-only">Save</span>
			<svg
				class="block"
				fill="none"
				viewBox="0 0 24 24"
				width="20"
				height="20"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="20 6 9 17 4 12"></polyline>
			</svg>
		</>
	),
	add: (
		<>
			<span class="sr-only">Add</span>
			<svg
				class="block h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
		</>
	),
	edit: (
		<>
			<span class="sr-only">Edit</span>
			<svg
				class="block h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
			>
				<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
			</svg>
		</>
	),
	remove: (
		<>
			<span class="sr-only">Remove</span>
			<svg
				class="block h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<polyline points="3 6 5 6 21 6" />
				<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
				<line x1="10" y1="11" x2="10" y2="17" />
				<line x1="14" y1="11" x2="14" y2="17" />
			</svg>
		</>
	),
}
