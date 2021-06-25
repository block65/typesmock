export default function factory() {
  return {
    verbose: true,
    files: ['./__tests__/**/*.ava.js', './__tests__/**/*.ava.ts'],
    extensions: {
      ts: 'module', // esm
      js: true, // esm
    },
    nodeArguments: [
      '--experimental-import-meta-resolve',
      '--loader=./dist/lib/loader.js',
    ],
  };
}
