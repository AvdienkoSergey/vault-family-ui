const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const JDK_MAJOR = "17";

function getJavaVersion(javaHome) {
  try {
    const bin = path.join(javaHome, "bin", "java");
    const out = execSync(`"${bin}" -version 2>&1`, { encoding: "utf8" });
    const match = out.match(/"(\d+)\./);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function scanDir(dir, prefix) {
  try {
    return fs
      .readdirSync(dir)
      .filter((e) => e.startsWith(prefix))
      .map((e) => path.join(dir, e))
      .filter((p) => fs.statSync(p).isDirectory());
  } catch {
    return [];
  }
}

function findFromRegistry() {
  if (process.platform !== "win32") return [];
  const results = [];
  const keys = [
    "HKLM\\SOFTWARE\\JavaSoft\\JDK",
    "HKLM\\SOFTWARE\\Eclipse Adoptium\\JDK",
    "HKLM\\SOFTWARE\\Azul Systems\\Zulu",
    "HKLM\\SOFTWARE\\Microsoft\\JDK",
    "HKLM\\SOFTWARE\\Amazon\\JDK",
    "HKLM\\SOFTWARE\\BellSoft\\Liberica",
  ];
  for (const key of keys) {
    try {
      const out = execSync(`reg query "${key}" /s /v JavaHome 2>nul`, { encoding: "utf8" });
      const matches = out.matchAll(/JavaHome\s+REG_SZ\s+(.+)/g);
      for (const m of matches) {
        const p = m[1].trim();
        if (fs.existsSync(p)) results.push(p);
      }
    } catch {}
  }
  return results;
}

function findFromWhereis() {
  try {
    const cmd = process.platform === "win32" ? "where java 2>nul" : "which -a java 2>/dev/null";
    const out = execSync(cmd, { encoding: "utf8" });
    return out
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((javaBin) => {
        // java bin -> jdk home: .../bin/java -> ...
        const binDir = path.dirname(javaBin);
        return path.dirname(binDir);
      })
      .filter((p) => fs.existsSync(path.join(p, "bin")));
  } catch {
    return [];
  }
}

function findJdk17() {
  // 1. JAVA_HOME if already set and is JDK 17
  if (process.env.JAVA_HOME && getJavaVersion(process.env.JAVA_HOME) === JDK_MAJOR) {
    return process.env.JAVA_HOME;
  }

  const candidates = new Set();

  // 2. Windows registry
  for (const p of findFromRegistry()) candidates.add(p);

  // 3. Common install directories
  const scanPaths =
    process.platform === "win32"
      ? [
          ["C:\\Program Files\\Microsoft", "jdk-17"],
          ["C:\\Program Files\\Eclipse Adoptium", "jdk-17"],
          ["C:\\Program Files\\Java", "jdk-17"],
          ["C:\\Program Files\\Java", "jdk17"],
          ["C:\\Program Files\\Zulu", "zulu-17"],
          ["C:\\Program Files\\Amazon Corretto", "jdk17"],
          ["C:\\Program Files\\BellSoft", "jdk-17"],
          [path.join(process.env.USERPROFILE || "", ".jdks"), "temurin-17"],
          [path.join(process.env.USERPROFILE || "", ".jdks"), "corretto-17"],
          [path.join(process.env.LOCALAPPDATA || "", "Programs", "Eclipse Adoptium"), "jdk-17"],
        ]
      : process.platform === "darwin"
        ? [
            ["/Library/Java/JavaVirtualMachines", "temurin-17"],
            ["/Library/Java/JavaVirtualMachines", "zulu-17"],
            ["/Library/Java/JavaVirtualMachines", "adoptopenjdk-17"],
            ["/Library/Java/JavaVirtualMachines", "amazon-corretto-17"],
            [path.join(process.env.HOME || "", ".sdkman/candidates/java"), "17."],
          ]
        : [
            ["/usr/lib/jvm", "java-17"],
            ["/usr/lib/jvm", "jdk-17"],
            [path.join(process.env.HOME || "", ".sdkman/candidates/java"), "17."],
          ];

  for (const [dir, prefix] of scanPaths) {
    for (const p of scanDir(dir, prefix)) candidates.add(p);
  }

  // macOS: Contents/Home inside .jdk bundles
  if (process.platform === "darwin") {
    const expanded = new Set();
    for (const c of candidates) {
      const home = path.join(c, "Contents", "Home");
      expanded.add(fs.existsSync(home) ? home : c);
    }
    candidates.clear();
    for (const c of expanded) candidates.add(c);
  }

  // 4. PATH-based discovery
  for (const p of findFromWhereis()) candidates.add(p);

  // 5. Pick first that is actually JDK 17
  for (const candidate of candidates) {
    if (getJavaVersion(candidate) === JDK_MAJOR) return candidate;
  }

  return null;
}

// --- Main ---
const jdk = findJdk17();

if (!jdk) {
  console.error(`
=== JDK ${JDK_MAJOR} not found ===

React Native requires JDK ${JDK_MAJOR} to build Android.

Install it from one of:
  - https://adoptium.net/temurin/releases/?version=${JDK_MAJOR}  (Eclipse Temurin)
  - https://learn.microsoft.com/java/openjdk/download#openjdk-${JDK_MAJOR}  (Microsoft Build)
  - https://www.azul.com/downloads/?version=java-${JDK_MAJOR}-lts  (Azul Zulu)

Or set JAVA_HOME manually:
  export JAVA_HOME="/path/to/jdk-${JDK_MAJOR}"
  npm run build:android
`);
  process.exit(1);
}

console.log(`Using JDK ${JDK_MAJOR}: ${jdk}\n`);

const isWin = process.platform === "win32";
const androidDir = path.join(__dirname, "..", "android");
const gradlew = isWin ? path.join(androidDir, "gradlew.bat") : "./gradlew";

try {
  execSync(`"${gradlew}" assembleRelease`, {
    cwd: androidDir,
    stdio: "inherit",
    env: { ...process.env, JAVA_HOME: jdk },
  });

  const apkPath = path.join(androidDir, "app", "build", "outputs", "apk", "release", "app-release.apk");
  if (fs.existsSync(apkPath)) {
    const size = (fs.statSync(apkPath).size / 1024 / 1024).toFixed(1);
    console.log(`\nAPK ready (${size} MB): ${apkPath}`);
  }
} catch {
  process.exit(1);
}
