<!--
	~/contributing.md
	Tells everyone how they can contribute code to the library.
-->

# Contributing Guide

Thanks for your interest in contributing to `mentoring-api`! This guide will
show you how to set up your environment and contribute to this library.

## Set Up

First, you need to install and be familiar the following:

- `git`: [Here](https://github.com/git-guides) is a great guide by GitHub on
  installing and getting started with Git.
- `node` and `npm`:
  [This guide](https://nodejs.org/en/download/package-manager/) will help you
  install Node and npm. The recommended method is using the `n` version manager
  if you are on MacOS or Linux. Make sure you are using the
  [active LTS version](https://github.com/nodejs/Release#release-schedule) of
  Node.
- `pnpm`: [This guide](https://pnpm.io/installation) will help you install PNPM.

Once you have installed the above, follow
[these instructions](https://docs.github.com/en/get-started/quickstart/fork-a-repo)
to
[`fork`](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks)
and [`clone`](https://github.com/git-guides/git-clone) the repository
(`donew-innovations/mentoring-api`).

Once you have forked and cloned the repository, you can
[pick out an issue](https://github.com/donew-innovations/mentoring-api/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc)
you want to fix/implement!

## Making Changes

Once you have cloned the repository to your computer (say, in
`~/Code/mentoring-api`) and picked the issue you want to tackle, create a
branch:

```sh
> git checkout -b branch-name
```

While naming your branch, try to follow the below guidelines:

1. Prefix the branch name with the type of change being made:
   - `fix`: For a bug fix.
   - `feat`: For a new feature.
   - `test`: For any change related to tests.
   - `perf`: For a performance related change.
   - `meta`: Anything related to the build process, workflows, issue templates,
     etc.
   - `refc`: For any refactoring work.
   - `docs`: For any documentation related changes.
2. Make the branch name short but self-explanatory.

An example branch name that adds the delete user endpoint is
`feat/add-delete-user-endpoint`.

Once you have created a branch, you can start coding!

The library is written in
[Typescript](https://github.com/microsoft/TypeScript#readme) and
[runs on the active LTS version](https://github.com/nodejs/Release#release-schedule)
of Node. The code is arranged as follows:

```sh
.
├── config
│  ├── husky
│  │  ├── _
│  │  ├── pre-commit
│  │  └── prepare-commit-message
│  ├── firebase.json
│  └── tsconfig.json
├── docs
│  ├── api.html
│  ├── changelog.md
│  └── contributing.md
├── patches
│  └── firebase-tools@10.2.0+verbosity.patch
├── source
│  ├── errors
│  │  └── index.ts
│  ├── loaders
│  │  ├── express
│  │  │  ├── docs.ts
│  │  │  ├── middleware.ts
│  │  │  └── routes.ts
│  │  ├── provider
│  │  │  └── index.ts
│  │  └── index.ts
│  ├── middleware
│  │  ├── authentication.ts
│  │  ├── authorization.ts
│  │  └── logger.ts
│  ├── models
│  │  └── ...
│  ├── provider
│  │  ├── auth
│  │  │  └── ...
│  │  ├── data
│  │  │  └── ...
│  │  └── init
│  │  │  └── ...
│  ├── routes
│  ├── services
│  ├── utilities
│  │  ├── index.ts
│  │  ├── logger.ts
│  │  └── lua.ts
│  ├── app.ts
│  └── types.ts
├── tests
│  ├── data
│  │  └── ...
│  ├── helpers
│  │  ├── request.ts
│  │  └── test-data.ts
│  ├── integration
│  │  └── index.test.ts
│  ├── setup.d.ts
│  └── setup.ts
├── license.md
├── package.json
├── pnpm-lock.yaml
└── readme.md
```

> Most files have a little description of what they do at the top.

When adding a new endpoint or changing the behaviour of an existing endpoint,
please add/update the TSDoc comments in the route definition files
(`source/routes/{endpoint}.ts`) that define the request and responses that the
endpoint returns, the service files (`source/services/{endpoint}.ts`) that
define the required request payload and data that will be returned, as well as
add/update the tests for the same.

Also make sure your code has been linted and that existing tests pass. You can
run the linter using `pnpm lint`, the tests using `pnpm test` and try to
automatically fix most lint issues using `pnpm format`.

Once you have made changes to the code, you will want to
[`commit`](https://github.com/git-guides/git-commit) (basically, Git's version
of save) the changes. To commit the changes you have made locally:

```sh
> git add this/folder that/file
> git commit
```

Pick the correct type of change and enter a short message that clearly states
the changes introduced in the commit in present tense.

When you commit files, the git hooks will run the linter to lint the code and
fix most issues. In case an error is not automatically fixable, they will cancel
the commit. Please fix the errors before committing the changes.

## Contributing Changes

Once you have committed your changes, you will want to
[`push`](https://github.com/git-guides/git-push) (basically, publish your
changes to GitHub) your commits. To push your changes to your fork:

```sh
> git push origin branch-name
```

If there are changes made to the `main` branch of the
`donew-innovations/mentoring-api` repository, you may wish to
[`rebase`](https://docs.github.com/en/get-started/using-git/about-git-rebase)
your branch to include those changes. To rebase, or include the changes from the
`main` branch of the `donew-innovations/mentoring-api` repository:

```
> git fetch upstream main
> git rebase upstream/main
```

This will automatically add the changes from `main` branch of the
`donew-innovations/mentoring-api` repository to the current branch. If you
encounter any merge conflicts, follow
[this guide](https://docs.github.com/en/get-started/using-git/resolving-merge-conflicts-after-a-git-rebase)
to resolve them.

Once you have pushed your changes to your fork, follow
[these instructions](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork)
to open a
[`pull request`](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests):

Once you have submitted a pull request, the maintainers of the repository will
review your pull requests. Whenever a maintainer reviews a pull request they may
request changes. These may be small, such as fixing a typo, or may involve
substantive changes. Such requests are intended to be helpful, but at times may
come across as abrupt or unhelpful, especially if they do not include concrete
suggestions on how to change them. Try not to be discouraged. If you feel that a
review is unfair, say so or seek the input of another project contributor. Often
such comments are the result of a reviewer having taken insufficient time to
review and are not ill-intended. Such difficulties can often be resolved with a
bit of patience. That said, reviewers should be expected to provide helpful
feedback.

In order to land, a pull request needs to be reviewed and approved by at least
one maintainer and pass CI. After that, if there are no objections from other
contributors, the pull request can be merged.

#### Congratulations and thanks for your contribution!
