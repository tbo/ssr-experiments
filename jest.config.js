const { join } = require('path');
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [join(__dirname, '/tests/**/*.ts')],
};

