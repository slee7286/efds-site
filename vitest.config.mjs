import { fileURLToPath, URL } from "node:url";

const vitestConfig = {
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)), "server-only": fileURLToPath(new URL("./tests/server-only.ts", import.meta.url)) } },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
};

export default vitestConfig;
