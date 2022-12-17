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

// Then build and deploy the container.
await spinner(
	logger.status('creating docker container using buildpack'),
	async () => {
		await $`pack build --builder gcr.io/buildpacks/builder --env GOOGLE_FUNCTION_SIGNATURE_TYPE=http --env GOOGLE_FUNCTION_TARGET=api --env GOOGLE_NODEJS_VERSION=16 asia.gcr.io/donew-mentoring-api-sandbox/server:latest`
	},
)
logger.success('sucessfully built container')
await spinner(logger.status('pushing docker container to gcr.io'), async () => {
	await $`docker push asia.gcr.io/donew-mentoring-api-sandbox/server:latest`
})
logger.success('sucessfully pushed image')
await spinner(logger.status('deploying function to google cloud'), async () => {
	await $`gcloud run deploy donew-mentoring-api-sandbox --project donew-mentoring-api-sandbox --image asia.gcr.io/donew-mentoring-api-sandbox/server:latest --region asia-south1 --platform managed --allow-unauthenticated --quiet`
})
logger.success('sucessfully deployed function')

// Cleanup the environment.
logger.info('cleaning up')
// Re-install the node modules using pnpm.
await spinner(logger.status('cleaning up'), async () => {
	await $`rm -rf node_modules`
	await $`pnpm install`
})
logger.success('succesfully restored environment')

logger.end()
