module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  moduleNameMapper: {
    d3: '<rootDir>/node_modules/d3/dist/d3.min.js',
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom']
};
