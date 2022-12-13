// scripts/build
// Generates a `package-lock.json` file, and then builds a docker container.

import { spinner } from 'zx/experimental'

import { logger } from './utilities/logger.js'

logger.title('scripts/build')

// Prepare for the deploy.
logger.info('preparing environment for build')

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
await spinner(
	logger.status('creating docker container using buildpack'),
	async () => {
		await $`pack build --builder gcr.io/buildpacks/builder --env GOOGLE_FUNCTION_SIGNATURE_TYPE=http --env GOOGLE_FUNCTION_TARGET=api --env GOOGLE_NODEJS_VERSION=16 donew-mentoring-api`
	},
)
logger.success('sucessfully built container')

// Cleanup the environment.
logger.info('cleaning up')
// Re-install the node modules using pnpm.
await spinner(logger.status('cleaning up'), async () => {
	await $`rm -rf node_modules`
	await $`pnpm install`
})
logger.success('succesfully restored environment')

logger.end()
