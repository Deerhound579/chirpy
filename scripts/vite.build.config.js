const path = require('path');
require('dotenv').config({ path: `.env` });
require('dotenv').config({ path: `.env.production` });

module.exports = {
  root: 'public',
  build: {
    lib: {
      entry: path.resolve(__dirname, '..', 'src', 'external', 'index.ts'),
      name: 'comment',
      fileName: () => 'comment.js',
      formats: ['umd'],
    },
    outDir: path.resolve(__dirname, '..', 'public', 'bootstrap'),
  },
  define: {
    'process.env.NEXT_PUBLIC_APP_NAME': JSON.stringify(process.env.NEXT_PUBLIC_APP_NAME),
    'process.env.NEXT_PUBLIC_APP_URL': JSON.stringify(process.env.NEXT_PUBLIC_APP_URL),
  },
};
