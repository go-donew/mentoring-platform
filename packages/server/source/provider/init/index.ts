// @/provider/init/startup.ts
// Exports the server so it can be accessed by Firebase Functions.

import { https } from 'firebase-functions'

import { server } from '@/app'

const registerHandlers = https.onRequest

// This type of export is required for Firebase Functions to detect the
// function and deploy it
export const app = registerHandlers(server)
