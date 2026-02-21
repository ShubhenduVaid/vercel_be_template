#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SERVICE_NAME=""
PACKAGE_NAME=""
SERVICE_VERSION="0.1.0"

usage() {
  cat <<'USAGE'
Usage:
  scripts/bootstrap-service.sh --service-name <name> [--package-name <name>] [--version <semver>]

Examples:
  scripts/bootstrap-service.sh --service-name payments-api
  scripts/bootstrap-service.sh --service-name otp-api --package-name @acme/otp-api --version 1.0.0
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -s|--service-name)
      SERVICE_NAME="${2:-}"
      shift 2
      ;;
    -p|--package-name)
      PACKAGE_NAME="${2:-}"
      shift 2
      ;;
    -v|--version)
      SERVICE_VERSION="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$SERVICE_NAME" ]]; then
  echo "--service-name is required." >&2
  usage
  exit 1
fi

if [[ -z "$PACKAGE_NAME" ]]; then
  PACKAGE_NAME="$SERVICE_NAME"
fi

if [[ ! "$SERVICE_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][A-Za-z0-9.-]+)?$ ]]; then
  echo "--version must look like semver (example: 1.0.0)." >&2
  exit 1
fi

export ROOT_DIR SERVICE_NAME PACKAGE_NAME SERVICE_VERSION

node <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const rootDir = process.env.ROOT_DIR;
const serviceName = process.env.SERVICE_NAME;
const packageName = process.env.PACKAGE_NAME;
const version = process.env.SERVICE_VERSION;

const replaceSingleLine = (content, key, value) => {
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  }
  return `${content.trimEnd()}\n${key}=${value}\n`;
};

const updateJsonFile = (filePath, updater) => {
  const absolutePath = path.join(rootDir, filePath);
  const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  updater(parsed);
  fs.writeFileSync(absolutePath, `${JSON.stringify(parsed, null, 2)}\n`);
};

const updateTextFile = (filePath, updater) => {
  const absolutePath = path.join(rootDir, filePath);
  const current = fs.readFileSync(absolutePath, "utf8");
  const next = updater(current);
  fs.writeFileSync(absolutePath, next);
};

updateJsonFile("package.json", (pkg) => {
  pkg.name = packageName;
  pkg.version = version;
});

updateJsonFile("package-lock.json", (lock) => {
  lock.name = packageName;
  lock.version = version;
  if (lock.packages && lock.packages[""]) {
    lock.packages[""].name = packageName;
    lock.packages[""].version = version;
  }
});

const updateEnvFile = (filePath, envVersion) => {
  updateTextFile(filePath, (content) => {
    let next = replaceSingleLine(content, "SERVICE_NAME", serviceName);
    next = replaceSingleLine(next, "SERVICE_VERSION", envVersion);
    return next;
  });
};

updateEnvFile(".env.example", version);
updateEnvFile(".env.local.example", `${version}-local`);
updateEnvFile(".env.preview.example", `${version}-preview`);
updateEnvFile(".env.production.example", version);

updateTextFile("test/setup-env.ts", (content) => {
  let next = content.replace(
    /^process\.env\.SERVICE_NAME = ".*";$/m,
    `process.env.SERVICE_NAME = "${serviceName}-test";`,
  );
  next = next.replace(
    /^process\.env\.SERVICE_VERSION = ".*";$/m,
    `process.env.SERVICE_VERSION = "${version}-test";`,
  );
  return next;
});

updateTextFile("README.md", (content) => {
  const lines = content.split("\n");
  lines[0] = `# ${serviceName}`;
  return lines.join("\n");
});
NODE

echo "Bootstrap complete."
echo "service name : $SERVICE_NAME"
echo "package name : $PACKAGE_NAME"
echo "version      : $SERVICE_VERSION"
