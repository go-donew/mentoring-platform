// scripts/deploy
// Generates a `package-lock.json` file, and then deploys the function.

import { spinner } from 'zx/experimental'

import { logger } from './utilities/logger.js'

logger.title('scripts/deploy')

// Prepare for the deploy.
logger.info('preparing environment for deploy')

// Delete the existing `node_modules/` folder and get npm to install packages
// its way.
await spinner(
	logger.status('generating `package-lock.json` using npm'),
	async () => {
		await $`rm -rf node_modules`
		await $`npm install`
	},
)
logger.success('successfully generated npm lockfile')

// Then deploy the function.
await spinner(logger.status('deploying function to google cloud'), async () => {
	await $`gcloud functions deploy api --source ./ --runtime nodejs16 --trigger-http --allow-unauthenticated --project donew-mentoring-api-sandbox`
})
logger.success('sucessfully deployed function')

// Cleanup the environment.
logger.info('cleaning up')
// Re-install the node modules using pnpm.
await spinner(logger.status('cleaning up'), async () => {
	await $`rm -rf node_modules`
	await $`pnpm install`
})
logger.success('done')
