#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PARAMS_FILE="${ROOT_DIR}/infrastructure/environments/${ENV}/params.env"
STACK_NAME="chapterquest-root-${ENV}"

if [[ -z "${ARTIFACTS_BUCKET:-}" ]]; then
  echo "ERROR: Set ARTIFACTS_BUCKET to your bootstrap artifacts bucket name."
  exit 1
fi

# shellcheck disable=SC1090
source "${PARAMS_FILE}"

TEMPLATES_BASE_URL="https://${ARTIFACTS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${ENV}/templates"

echo "==> Building Lambda functions"
pnpm --filter @chapterquest/functions build

echo "==> Syncing templates to s3://${ARTIFACTS_BUCKET}/${ENV}/templates/"
aws s3 sync "${ROOT_DIR}/infrastructure/cloudformation/" \
  "s3://${ARTIFACTS_BUCKET}/${ENV}/templates/" \
  --exclude "*/.git/*" \
  --delete

echo "==> Uploading Lambda artifacts (zip packages)"
aws s3 sync "${ROOT_DIR}/functions/dist/" \
  "s3://${ARTIFACTS_BUCKET}/${ENV}/lambdas/" \
  --exclude "*" \
  --include "*.zip" \
  --delete

echo "==> Deploying ${STACK_NAME}"
aws cloudformation deploy \
  --template-file "${ROOT_DIR}/infrastructure/cloudformation/root/template.yaml" \
  --stack-name "${STACK_NAME}" \
  --parameter-overrides \
    "Env=${Env}" \
    "TemplatesBaseUrl=${TEMPLATES_BASE_URL}" \
    "LambdaArtifactsBucket=${ARTIFACTS_BUCKET}" \
    "EnableCustomDomain=${EnableCustomDomain}" \
    "DomainName=${DomainName}" \
    "HostedZoneId=${HostedZoneId}" \
    "FrontendOrigin=${FrontendOrigin}" \
    "LocalDevOrigin=${LocalDevOrigin:-}" \
    "LibraryPrefix=${LibraryPrefix:-library/}" \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --no-fail-on-empty-changeset \
  --region "${AWS_REGION}"

echo "==> Stack outputs:"
aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs" \
  --output table \
  --region "${AWS_REGION}"
