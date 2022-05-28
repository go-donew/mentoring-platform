// source/components/navbar.tsx
// Defines and exports the navigation bar shown on top of each page.

import { useState, useCallback } from 'preact/hooks'
import { Link } from 'preact-router/match'

import { IconButton } from './icon-button'

/**
 * A page of the application.
 */
export interface Route {
	// The relative URL of the page.
	path: string
	// The name of the page to show in the navbar.
	name: string
	// Whether or not to show the page in the navbar.
	nav: boolean
}

/**
 * A navbar.
 *
 * @prop {Route[]} routes - A list of routes of the application.
 * @prop {string} currentUrl - The URL of the page rendered on screen.
 *
 * @component
 */
export const Navbar = (props: { routes: Route[]; currentUrl: string }) => {
	// Define the hook that handles opening and closing the mobile menu.
	const [menuState, setMenuState] = useState<'open' | 'closed'>('closed')
	const toggleMenuState = useCallback(() => {
		setMenuState(menuState === 'open' ? 'closed' : 'open')
	}, [menuState])

	// Take the routes that can be shown on the navbar and render them.
	const pages = props.routes
		.filter((route) => route.nav)
		.map((route) => (
			<Link
				href={route.path}
				activeClassName="bg-background dark:bg-background-dark"
				class="text-on-background dark:text-on-background-dark hover:text-on-background dark:hover:text-on-background-dark px-3 py-2 rounded-md block text-sm font-medium"
			>
				{route.name}
			</Link>
		))

	return (
		<nav
			// Don't render the navbar on auth routes.
			class={`${
				props.currentUrl === '/signin' || props.currentUrl === '/signup'
					? 'hidden'
					: 'block'
			} bg-surface dark:bg-surface-dark`}
		>
			<div class="max-w-4xl mx-auto px-2 sm:px-6">
				<div class="relative flex items-center justify-center h-16">
					<div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
						<IconButton
							id="mobile-menu-button"
							action={toggleMenuState}
							icon={menuState === 'closed' ? 'menu' : 'close'}
							class="text-primary hover:text-on-surface hover:bg-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-on-surface"
						/>
					</div>
					<div
						class="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start"
						data-ref="normal-menu"
					>
						<span class="flex-shrink-0 flex items-center text-on-surface font-bold">
							<img class="h-6 h-8" src="/assets/icon.png" />
						</span>
						<div class="hidden sm:block sm:ml-6">
							<div class="flex space-x-4">{pages}</div>
						</div>
					</div>
				</div>
			</div>
			<div
				class={menuState === 'closed' ? 'hidden' : 'block'}
				data-ref="mobile-menu"
			>
				<div class="px-2 pt-2 pb-3 space-y-1">{pages}</div>
			</div>
		</nav>
	)
}
