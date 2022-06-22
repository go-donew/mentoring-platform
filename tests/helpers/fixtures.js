// tests/helpers/fixtures.ts
// Exports a helper function to load fixtures.

import { readFileSync } from 'node:fs'

/**
 * Loads a fixture with the given name from the `tests/fixtures/` folder.
 *
 * @param {string} name - The name of the fixture.
 *
 * @returns {object} The fixture stored in the file.
 */
export const loadFixture = (name) => readFileSync(`tests/fixtures/${name}.json`)
