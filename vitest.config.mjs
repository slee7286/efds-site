import { fileURLToPath, URL } from "node:url";

const vitestConfig = {
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
};

export default vitestConfig;
