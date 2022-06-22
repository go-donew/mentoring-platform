// scripts/clean
// Deletes generated files.

import { logger } from './utilities/logger.js'

logger.title('scripts/clean')

await $`rm -rf *.log *.tgz *.bak *.tmp .cache/`
await $`rm -rf package-lock.json firebase.json`
await $`rm -rf coverage/`

logger.end()
