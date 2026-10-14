import { spawnSync } from "node:child_process";

export function resolveNextArgs(
  command,
  userArgs = [],
  env = process.env,
  platform = process.platform
) {
  const isTermux = platform === "android" || Boolean(env.TERMUX_VERSION);
  const isVercel = Boolean(env.VERCEL);
  const isProduction = env.NODE_ENV === "production";

  const nextArgs = [command];

  // Di Termux (Android ARM64), native Turbopack/SWC bindings tidak tersedia,
  // sehingga wajib memakai fallback --webpack.
  // Di Vercel atau produksi non-Termux, jangan tambahkan flag --webpack.
  if (isTermux && !isVercel && (command === "dev" || command === "build")) {
    if (!userArgs.includes("--webpack")) {
      nextArgs.push("--webpack");
    }
  }

  nextArgs.push(...userArgs);

  const shouldDisableWasm = isVercel || (isProduction && !isTermux);

  return {
    args: nextArgs,
    shouldDisableWasm,
  };
}

// Eksekusi jika dijalankan sebagai CLI entry point
if (process.argv[1]?.endsWith("next-runner.mjs")) {
  const [command = "build", ...userArgs] = process.argv.slice(2);
  const { args, shouldDisableWasm } = resolveNextArgs(command, userArgs);

  if (shouldDisableWasm) {
    process.env.NEXT_DISABLE_SWC_WASM = "1";
  }

  const result = spawnSync("next", args, {
    stdio: "inherit",
    env: process.env,
  });

  process.exit(result.status ?? 0);
}
