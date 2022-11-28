// tests/end-to-end/api.js
// Tests all the REST API endpoints in order.

import { auth } from './auth/index.js'
import { users } from './users.js'
import { misc } from './misc.js'

describe('auth', auth)
describe('users', users)
describe('misc', misc)
