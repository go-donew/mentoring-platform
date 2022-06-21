// scripts/develop
// Watches the `source/` folder for changes and reloads the function then.

import { stdout, env, exit } from 'node:process'

import { logger } from './utilities/logger.js'
import { object } from './utilities/globals.js'

logger.title('scripts/develop')

// Setup the environment.
const config = (await fs.readJson('package.json')).env.test
for (const [variable, value] of object.entries(config)) env[variable] = value

// Then run the tests.
try {
	await $`pnpm firebase emulators:exec --only firestore,auth --project donew-mentoring-api-sandbox "pnpm jest"`.pipe(
		stdout,
	)
	exit(0)
} catch (error) {
	exit(error.exitCode)
}
