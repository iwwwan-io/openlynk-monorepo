import { spawnSync } from "node:child_process";

export function resolveNextArgs(
  command,
  userArgs = [],
  env = process.env,
  platform = process.platform
) {
  // Deteksi eksplisit Vercel: jika di Vercel, jangan pernah gunakan flag --webpack
  const isVercel = Boolean(env.VERCEL);
  const isTermux = platform === "android" || Boolean(env.TERMUX_VERSION);

  const nextArgs = [command];

  // Pada Vercel atau lingkungan cloud standar, gunakan compiler bawaan Next.js tanpa flag --webpack.
  // Flag --webpack hanya disisipkan jika berjalan secara lokal di Android/Termux dan bukan di Vercel.
  if (!isVercel && isTermux && (command === "dev" || command === "build")) {
    if (!userArgs.includes("--webpack")) {
      nextArgs.push("--webpack");
    }
  }

  nextArgs.push(...userArgs);

  return {
    args: nextArgs,
  };
}

if (process.argv[1]?.endsWith("next-runner.mjs")) {
  const [command = "build", ...userArgs] = process.argv.slice(2);
  const { args } = resolveNextArgs(command, userArgs);

  const isWindows = process.platform === "win32";
  const result = spawnSync("next", args, {
    stdio: "inherit",
    env: process.env,
    shell: isWindows,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}
