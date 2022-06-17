// source/provider/database.js
// Defines and exports the database used by the server.

import { Firestore } from '@bountyrush/firestore'

import { config } from '../utilities/config.js'

export const database = new Firestore(config.database)
