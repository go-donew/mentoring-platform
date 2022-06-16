// @/provider/data/firestore.ts
// Creates and exports an instance of a Firestore client.

// @ts-expect-error No type definitions
import { Firestore } from '@bountyrush/firestore'

export const firestore = new Firestore({ ignoreUndefinedProperties: true })
