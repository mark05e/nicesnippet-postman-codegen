import { defineConfig } from 'vite'
const path = require('path');

export default defineConfig({
    root: 'src',
    build: {
      outDir: '../dist',
      lib: {
        entry: path.resolve(__dirname, 'src/main.js'),
        name: '[name]',
        fileName: (format) => `[name].${format}.js`
      }
    }
})