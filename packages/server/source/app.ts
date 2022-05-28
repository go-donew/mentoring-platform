// @/app.ts
// Exports the server so it can be run by anyone

import createServer from 'express'

import { load } from '@/loaders'

// Create an Express `Application`
const server = createServer()
// Load the middleware and endpoints as well as initialize all services
await load(server)

export { server }
