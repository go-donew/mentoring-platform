// source/components/page-wrapper.tsx
// Defines and exports a wrapper for the page.

import { useTheme } from '@/hooks/theme'

/**
 * A wrapper around the page's content. This wrapper ensures the theme and font
 * are set for each page, and a footer is added at the bottom.
 *
 * @component
 */
export const PageWrapper = (props: { children?: any }) => {
	// The theme to display the page in.
	const { theme } = useTheme()

	// Add the theme to the class body
	document.body.classList.add(theme)

	return (
		<div id="page" class="min-h-screen font-sans">
			<div class="p-8">{props.children}</div>
		</div>
	)
}
