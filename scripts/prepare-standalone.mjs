import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const copies = [
  [".next/static", ".next/standalone/.next/static"],
  ["public", ".next/standalone/public"],
];

for (const [sourcePath, destinationPath] of copies) {
  const source = resolve(root, sourcePath);

  if (!existsSync(source)) {
    continue;
  }

  cpSync(source, resolve(root, destinationPath), {
    force: true,
    recursive: true,
  });
}
