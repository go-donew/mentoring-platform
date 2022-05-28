// source/hooks/theme.ts
// Defines and exports a hook that enables switching the theme.

import { useCallback, useState } from 'preact/hooks'

import { storage } from '@/utilities/storage'

const defaultTheme = 'dark'

/**
 * The theme to render the page in.
 */
export type Theme = 'dark' | 'light'

/**
 * A custom hook that enables switching the page's theme.
 */
export const useTheme = (): {
	theme: Theme
	switchTheme: () => void
} => {
	const [theme, setTheme] = useState<Theme>(
		storage.get('theme') ?? defaultTheme,
	)
	const switchTheme = useCallback(() => {
		setTheme(theme === 'dark' ? 'light' : 'dark')
	}, [theme])

	return { theme, switchTheme }
}
