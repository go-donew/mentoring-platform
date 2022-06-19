// source/provider/database.js
// Defines and exports the database service used by the server.

import { Firestore } from '@bountyrush/firestore'

import { config } from '../utilities/config.js'

// If we are in a development environment, connect to the emulator. In the
// Cloud Functions environment, we will be provided project info via the
// `GOOGLE_APPLICATION_CREDENTIALS` environment variable.
const options = config.services.database

export const database = new Firestore(options)
