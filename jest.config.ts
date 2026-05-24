import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
  ],
  collectCoverageFrom: [
    "services/**/*.ts",
    "app/api/**/*.ts",
    "lib/**/*.ts",
    "components/**/*.tsx",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  // Glue files that are framework bootstrap / SDK initialization only — they
  // execute on every cold start but contain no testable branching logic.
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/lib/auth\\.ts$",
    "<rootDir>/lib/auth\\.config\\.ts$",
    "<rootDir>/lib/db\\.ts$",
    "<rootDir>/lib/openapi\\.ts$",
  ],
  // Enforce the bar we already clear (98%+ statements/lines, 93%+ branches) so
  // a future regression breaks CI instead of silently slipping past review.
  coverageThreshold: {
    global: {
      statements: 95,
      lines: 95,
      functions: 90,
      branches: 90,
    },
  },
};

export default createJestConfig(config);
