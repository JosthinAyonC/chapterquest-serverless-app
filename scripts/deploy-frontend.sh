#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Fetching stack outputs for ${ENV}"
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "chapterquest-root-${ENV}" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text \
  --region "${AWS_REGION}")

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name "chapterquest-root-${ENV}" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text \
  --region "${AWS_REGION}")

echo "==> Building frontend"
pnpm --filter @chapterquest/frontend build

echo "==> Syncing to s3://${FRONTEND_BUCKET}"
aws s3 sync "${ROOT_DIR}/frontend/dist/" "s3://${FRONTEND_BUCKET}/" --delete

echo "==> Invalidating CloudFront ${DISTRIBUTION_ID}"
aws cloudfront create-invalidation \
  --distribution-id "${DISTRIBUTION_ID}" \
  --paths "/*"

echo "==> Frontend deploy complete"
