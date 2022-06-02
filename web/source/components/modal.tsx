// source/components/modal.tsx
// Defines and exports a simple modal.

import { useState } from 'preact/hooks'

import { IconButton } from './icon-button'

/**
 * A simple modal that floats in the center of the page.
 *
 * @prop {string} title - The title of the modal.
 * @prop {string} description - The text that explains to the user what to do.
 * @prop {boolean} isVisible - Whether the modal is visible or not.
 * @prop {Function} toggleModal - A function to close the modal when the close button is pressed.
 *
 * @component
 */
export const Modal = (props: {
	title: string
	description: string
	isVisible: boolean
	toggleModal: (open: boolean) => void
	children: any
}) => (
	<div
		tab-index="-1"
		aria-hidden="true"
		class={`${
			props.isVisible ? 'block' : 'hidden'
		} fixed mx-auto z-50 w-3xl flex place-content-center items-center md:inset-0 md:h-full overflow-y-auto overflow-x-hidden text-left`}
	>
		<div class="relative p-4 w-full max-w-md h-full md:h-auto">
			<div class="relative bg-white rounded-lg shadow dark:bg-background-dark">
				<IconButton
					id="close-user-modal-button"
					action={() => props.toggleModal(false)}
					icon="close"
					class="absolute top-3 right-2.5"
				/>
				<div class="py-4 px-6 rounded-t border-b dark:border-gray-600">
					<h3 class="text-base font-semibold text-gray-900 lg:text-xl dark:text-white">
						{props.title}
					</h3>
				</div>
				<div class="pt-4 px-6">
					<p class="text-sm font-normal text-gray-500 dark:text-gray-400">
						{props.description}
					</p>
				</div>
				<div class="m-6 pb-6">{props.children}</div>
			</div>
		</div>
	</div>
)
