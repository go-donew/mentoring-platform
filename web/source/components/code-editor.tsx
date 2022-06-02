// source/components/code-editor.tsx
// Defines and exports a simple code editor.

import { useEffect, useState } from 'preact/hooks'
import { getHighlighter, setCDN as setupShiki } from 'shiki'
import { useTheme } from '@/hooks/theme'

// Make sure shiki can retrieve the stuff it needs to.
setupShiki('https://unpkg.com/shiki/')

/**
 * A simple code editor, consisting of a textarea which is completely transparent,
 * except for the cursor, and a div on top of it that renders the highlighted
 * code.
 *
 * @prop {string} id - An ID to refer to the input in tests.
 * @prop {string} code - The code to render.
 * @prop {'lua' | 'html'} language - The language of the code to highlight.
 * @prop {Function?} update - The function to call when the text in the element changes.
 *
 * @component
 */
export const CodeEditor = (props: {
	id: string
	code: string
	language: 'lua' | 'html'
	update?: (value: string) => void
}) => {
	// Get the current theme.
	const { theme } = useTheme()
	// Define a state for the highlighted code.
	const [highlightedCode, setHighlightedCode] = useState<string>('Loading...')

	// Instantiate the highlighter.
	const highlighter = getHighlighter({
		theme: `github-${theme}`,
		langs: ['lua', 'html'],
		themes: ['github-dark', 'github-light'],
	})

	// Whenever the code changes, re-highlight it and display it.
	useEffect(() => {
		highlighter
			.then(({ codeToHtml }) =>
				setHighlightedCode(codeToHtml(props.code, { lang: props.language })),
			)
			.catch((_error) => {})
	})

	return (
		<div class="relative text-left my-2 p-0 box-border overflow-hidden">
			<textarea
				id={props.id}
				name={props.id}
				type="text"
				value={props.code}
				rows={1000}
				spellcheck={false}
				class="appearance-none whitespace-pre rounded-lg absolute mt-0 ml-0 p-2 z-10 w-full border-none outline-none text-transparent bg-transparent caret-on-surface dark:caret-on-surface-dark text-sm font-mono"
				onInput={(event: any) => {
					highlighter
						.then(({ codeToHtml }) =>
							setHighlightedCode(
								codeToHtml(event.target.value, { lang: props.language }),
							),
						)
						.catch((_error) => {})

					if (typeof props.update === 'function')
						props.update(event.target.value)
				}}
			/>
			<pre
				id={props.id}
				name={props.id}
				type="code"
				aria-hidden={true}
				class="appearance-none rounded-lg relative p-2 z-1 w-full border border-gray-300 dark:border-background-dark bg-[#ffffff] dark:bg-[#0d1117] text-on-surface text-sm font-mono"
				dangerouslySetInnerHTML={{
					__html: highlightedCode,
				}}
			/>
		</div>
	)
}
