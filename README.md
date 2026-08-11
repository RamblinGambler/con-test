# conexus-build-target

A deliberately small repository used to verify that Conexus build runs can clone
a repo, implement a change, run tests, push a branch, and open a pull request.

There are no dependencies. Everything runs on the Node standard library.

## Running the tests

```bash
npm test
```

## Conventions

Anything added here should match what is already in `src/`:

- One exported function per file, named the same as the file.
- ES modules with `.js` extensions in import paths.
- A JSDoc block on each exported function covering what it does, its parameters,
  and anything surprising about its behaviour.
- Input validation throws `TypeError` with a plain-language message.
- Every source file has a sibling `*.test.js` using `node:test` and
  `node:assert/strict`, with one behaviour per `test()` and a descriptive name.
