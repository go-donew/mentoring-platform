// @/utilities/lua/index.ts
// Helper functions to run lua scripts.

// @ts-expect-error No type defs
import { runWithGlobals } from 'flua'
import redent from 'redent'

import { User } from '@/models/user'
import { UserAttribute, BlamedMessage } from '@/models/attribute'

/**
 * The context a script runs in.
 */
interface ScriptContext {
	// The user the script is running for.
	user: User
	// The input attributes required by the script.
	input: Record<string, UserAttribute>
}

/**
 * The values the script has computed, that we need to store.
 */
interface ScriptOutput {
	// The computed attributes
	attributes?: Record<
		string,
		{ value: string | number | boolean; message?: BlamedMessage }
	>
}

/**
 * Runs the lua code passed to it for a certain user.
 *
 * @param code {string} - The code to run.
 * @param context {ScriptContext} - Globals to pass to the script.
 */
export const runLua = async (
	code: string,
	context: ScriptContext,
): Promise<ScriptOutput> => {
	// The script will have a `compute` function defined; which we call with the
	// context.
	const script = redent(`
		${code}

		-- Run the lua function with the given context
		__computed = compute(__context)
	`)

	// Run the script
	const { __computed: computed } = await runWithGlobals(
		{ __context: context },
		script,
		['__computed'],
	)

	// We're done!
	return computed as ScriptOutput
}
