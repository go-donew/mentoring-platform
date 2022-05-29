// source/main.tsx
// Render the application.

import { render } from 'preact'

import { App } from './app'

// Print some stuff in the console
console.log(`
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░█▀▄░█▀█░█▀█░█▀▀░█░█░░░█▄█░█▀▀░█▀█░▀█▀░█▀█░█▀▄░▀█▀░█▀█░█▀▀░
░█░█░█░█░█░█░█▀▀░█▄█░░░█░█░█▀▀░█░█░░█░░█░█░█▀▄░░█░░█░█░█░█░
░▀▀░░▀▀▀░▀░▀░▀▀▀░▀░▀░░░▀░▀░▀▀▀░▀░▀░░▀░░▀▀▀░▀░▀░▀▀▀░▀░▀░▀▀▀░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

Hello there, human being! Trying to check out the code, are we?

Let me make it easier for you - you can check out the entire
source code on GitHub:
  https://github.com/donew-innovations/mentoring-platform

· Found a bug? Please open an issue:
  https://github.com/donew-innovations/mentoring-platform/issues/new

· Want to contribute? Take a look at the contributing guide:
  https://github.com/donew-innovations/mentoring-platform/blob/main/contributing.md

· Still want to poke around the code on this page? You're welcome
  to, but the code you see here is the compiled output, and will
  be more difficult to understand than the code on GitHub.

Also, thanks for keeping the spirit of poking around alive :P
`)

// Render the preact application as a child of the document's `body` element.
render(<App />, document.body)
