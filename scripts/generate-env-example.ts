import fs from "fs";
import dotenv from "dotenv";

const ENV_FILE = ".env";
const EXAMPLE_FILE = ".env.example";

const envContent = fs.readFileSync(ENV_FILE, "utf-8");
const parsed = dotenv.parse(envContent);

const output = Object.keys(parsed)
  .map((key) => `${key}=`)
  .join("\n");

fs.writeFileSync(EXAMPLE_FILE, output);
console.log(`✅ ${EXAMPLE_FILE} generated from ${ENV_FILE}`);
