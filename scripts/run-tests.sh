#!/usr/bin/env bash
# scripts/run-tests.sh
#
# Run the Postman collection with Newman and produce CLI + HTML reports.
#
# Prerequisites:
#   npm install -g newman newman-reporter-htmlextra
#
# Usage:
#   bash scripts/run-tests.sh [--env <env-file>] [--folder <folder-name>]
#
# Examples:
#   bash scripts/run-tests.sh
#   bash scripts/run-tests.sh --folder Auth
#   bash scripts/run-tests.sh --env postman/postman_environment.staging.json

set -euo pipefail

# ─── Defaults ──────────────────────────────────────────────────────────────
COLLECTION="postman/postman_collection.json"
ENVIRONMENT="postman/postman_environment.json"
REPORT_DIR="postman/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
HTML_REPORT="${REPORT_DIR}/report_${TIMESTAMP}.html"
JUNIT_REPORT="${REPORT_DIR}/junit_${TIMESTAMP}.xml"
FOLDER_FLAG=""

# ─── Argument parsing ──────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)      ENVIRONMENT="$2"; shift 2 ;;
    --folder)   FOLDER_FLAG="--folder $2"; shift 2 ;;
    *)          echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# ─── Sanity checks ────────────────────────────────────────────────────────
if ! command -v newman &> /dev/null; then
  echo "❌  Newman not found. Install it with:"
  echo "    npm install -g newman newman-reporter-htmlextra"
  exit 1
fi

if [[ ! -f "$COLLECTION" ]]; then
  echo "❌  Collection not found: $COLLECTION"
  exit 1
fi

if [[ ! -f "$ENVIRONMENT" ]]; then
  echo "❌  Environment not found: $ENVIRONMENT"
  exit 1
fi

mkdir -p "$REPORT_DIR"

# ─── Run ──────────────────────────────────────────────────────────────────
echo ""
echo "🚀  Running Postman collection: $COLLECTION"
echo "    Environment : $ENVIRONMENT"
echo "    HTML report : $HTML_REPORT"
[[ -n "$FOLDER_FLAG" ]] && echo "    Folder      : $FOLDER_FLAG"
echo ""

newman run "$COLLECTION" \
  --environment "$ENVIRONMENT" \
  --reporters cli,htmlextra,junit \
  --reporter-htmlextra-export "$HTML_REPORT" \
  --reporter-htmlextra-title "Ecommerce API Test Report" \
  --reporter-htmlextra-browserTitle "Ecommerce API Tests" \
  --reporter-htmlextra-showOnlyFails false \
  --reporter-junit-export "$JUNIT_REPORT" \
  --color on \
  --timeout-request 10000 \
  $FOLDER_FLAG

EXIT_CODE=$?

echo ""
if [[ $EXIT_CODE -eq 0 ]]; then
  echo "✅  All tests passed."
else
  echo "❌  Some tests failed. Exit code: $EXIT_CODE"
fi

echo "📄  HTML report : $HTML_REPORT"
echo "📄  JUnit report: $JUNIT_REPORT"
echo ""

exit $EXIT_CODE
