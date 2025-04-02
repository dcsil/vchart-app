/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  clearMocks: true,

  collectCoverage: true,

  coverageDirectory: "coverage",

  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/_*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!**/.next/**"
  ],

  coverageProvider: "v8",

  testEnvironment: "jsdom",

  moduleNameMapper: {
    "^@/app/(.*)$": "<rootDir>/src/app/$1",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@/src/(.*)$": "<rootDir>/src/$1",
  },

  moduleDirectories: ["node_modules", "<rootDir>"],

  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};

export default createJestConfig(config);
