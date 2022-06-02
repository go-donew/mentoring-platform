// @/utilities/lua.ts
// Helper functions to run lua scripts.

// @ts-expect-error No type defs
import { runWithGlobals } from 'flua'
import redent from 'redent'

import { User } from '@/models/user'
import { UserAttribute } from '@/models/attribute'

import { logger, stringify } from '@/utilities/logger'

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
		{
			value: string | number | boolean
		}
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
	logger.info('[lua/runner] running script with context')
	// The script will have a `compute` function defined; which we call with the
	// context.
	const script = redent(`
		${code}

		-- Run the lua function with the given context
		__computed = compute(__context)
	`)

	// Define a logger function for the script.
	const scriptLogger = (message: any) =>
		logger.silly('[lua/script] %s', stringify(message))

	// Run the script
	const { __computed: computed } = await runWithGlobals(
		{ __context: context, log: scriptLogger },
		script,
		['__computed'],
	)

	logger.info('[lua/runner] ran script successfully')
	// We're done!
	return computed as ScriptOutput
}
