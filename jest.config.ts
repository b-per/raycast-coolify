import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testPathIgnorePatterns: ["/node_modules/", "fixtures\\.ts$"],
  moduleNameMapper: {
    "^node-fetch$": "<rootDir>/src/__mocks__/node-fetch.ts",
  },
};

export default config;
