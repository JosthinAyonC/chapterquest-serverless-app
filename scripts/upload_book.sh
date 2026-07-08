#!/usr/bin/env bash
set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-litcircle}"
AWS_REGION="${AWS_REGION:-us-east-1}"
LIBRARY_PREFIX="${LIBRARY_PREFIX:-library/}"

ENV=""
BOOK_NAME=""
BOOK_DESCRIPTION=""
BOOK_AUTHOR=""
BOOK_LANG=""
BOOK_AUDIENCE=""
PDF_PATH=""
COVER_PATH=""

usage() {
  cat <<'EOF'
Usage:
  sh scripts/upload_book.sh \
    --env dev \
    --bookname 'El pepe' \
    --bookdescription 'el libro del pepe' \
    --bookauthor 'j wild' \
    --booklang 'EN' \
    --bookaudience '+12 anos' \
    --path './mybook.pdf' \
    --cover './portada.png'

Required flags: --env --bookname --bookdescription --bookauthor --booklang --bookaudience --path --cover
EOF
}

slugify() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g' \
    | cut -c1-80
}

content_type_for() {
  case "${1##*.}" in
    pdf) echo 'application/pdf' ;;
    png) echo 'image/png' ;;
    jpg|jpeg) echo 'image/jpeg' ;;
    webp) echo 'image/webp' ;;
    gif) echo 'image/gif' ;;
    *) echo 'application/octet-stream' ;;
  esac
}

sanitize_metadata() {
  # S3 user metadata must be ASCII-only; aws cli map breaks on commas/quotes too.
  local value="$1"
  value="${value//,/;}"
  value="${value//\'/}"
  value="${value//\"/}"
  value="${value//—/-}"
  value="${value//–/-}"
  printf '%s' "$value" | LC_ALL=C tr -cd '\11\12\15\40-\176'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENV="$2"; shift 2 ;;
    --bookname) BOOK_NAME="$2"; shift 2 ;;
    --bookdescription) BOOK_DESCRIPTION="$2"; shift 2 ;;
    --bookauthor) BOOK_AUTHOR="$2"; shift 2 ;;
    --booklang) BOOK_LANG="$2"; shift 2 ;;
    --bookaudience) BOOK_AUDIENCE="$2"; shift 2 ;;
    --path) PDF_PATH="$2"; shift 2 ;;
    --cover) COVER_PATH="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1"; usage; exit 1 ;;
  esac
done

missing=()
[[ -z "${ENV}" ]] && missing+=("--env")
[[ -z "${BOOK_NAME}" ]] && missing+=("--bookname")
[[ -z "${BOOK_DESCRIPTION}" ]] && missing+=("--bookdescription")
[[ -z "${BOOK_AUTHOR}" ]] && missing+=("--bookauthor")
[[ -z "${BOOK_LANG}" ]] && missing+=("--booklang")
[[ -z "${BOOK_AUDIENCE}" ]] && missing+=("--bookaudience")
[[ -z "${PDF_PATH}" ]] && missing+=("--path")
[[ -z "${COVER_PATH}" ]] && missing+=("--cover")

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "ERROR: Missing required flags: ${missing[*]}"
  usage
  exit 1
fi

if [[ ! -f "${PDF_PATH}" ]]; then
  echo "ERROR: PDF not found: ${PDF_PATH}"
  exit 1
fi

if [[ ! -f "${COVER_PATH}" ]]; then
  echo "ERROR: Cover image not found: ${COVER_PATH}"
  exit 1
fi

if [[ "${ENV}" != "dev" && "${ENV}" != "prod" ]]; then
  echo "ERROR: --env must be dev or prod"
  exit 1
fi

STACK_NAME="chapterquest-root-${ENV}"
BUCKET="$(
  AWS_PROFILE="${AWS_PROFILE}" AWS_REGION="${AWS_REGION}" \
    aws cloudformation describe-stacks \
      --stack-name "${STACK_NAME}" \
      --query "Stacks[0].Outputs[?OutputKey=='LibraryBucketName'].OutputValue" \
      --output text \
      --region "${AWS_REGION}" 2>/dev/null || true
)"

if [[ -z "${BUCKET}" || "${BUCKET}" == "None" ]]; then
  BUCKET="${ENV}-chapterquest-library"
  echo "WARN: Could not read stack output; using fallback bucket ${BUCKET}"
fi

SLUG="$(slugify "${BOOK_NAME}")"
if [[ -z "${SLUG}" ]]; then
  echo "ERROR: Could not derive slug from book name"
  exit 1
fi

COVER_EXT="${COVER_PATH##*.}"
COVER_KEY="${LIBRARY_PREFIX}covers/${SLUG}.${COVER_EXT}"
PDF_KEY="${LIBRARY_PREFIX}${SLUG}.pdf"

# S3 user metadata ~2 KB total — keep description bounded.
if [[ ${#BOOK_DESCRIPTION} -gt 900 ]]; then
  BOOK_DESCRIPTION="${BOOK_DESCRIPTION:0:897}..."
  echo "WARN: Description truncated to fit S3 metadata limits"
fi

PDF_CONTENT_TYPE="$(content_type_for "${PDF_PATH}")"
COVER_CONTENT_TYPE="$(content_type_for "${COVER_PATH}")"

META_TITLE="$(sanitize_metadata "${BOOK_NAME}")"
META_AUTHOR="$(sanitize_metadata "${BOOK_AUTHOR}")"
META_LANG="$(sanitize_metadata "${BOOK_LANG}")"
META_DESC="$(sanitize_metadata "${BOOK_DESCRIPTION}")"
META_AUDIENCE="$(sanitize_metadata "${BOOK_AUDIENCE}")"

echo "==> Uploading cover to s3://${BUCKET}/${COVER_KEY}"
AWS_PROFILE="${AWS_PROFILE}" AWS_REGION="${AWS_REGION}" \
  aws s3 cp "${COVER_PATH}" "s3://${BUCKET}/${COVER_KEY}" \
    --content-type "${COVER_CONTENT_TYPE}" \
    --region "${AWS_REGION}"

echo "==> Uploading PDF to s3://${BUCKET}/${PDF_KEY}"
AWS_PROFILE="${AWS_PROFILE}" AWS_REGION="${AWS_REGION}" \
  aws s3 cp "${PDF_PATH}" "s3://${BUCKET}/${PDF_KEY}" \
    --content-type "${PDF_CONTENT_TYPE}" \
    --metadata "title=${META_TITLE},author=${META_AUTHOR},language=${META_LANG},description=${META_DESC},audience=${META_AUDIENCE},cover=${COVER_KEY}" \
    --region "${AWS_REGION}"

echo ""
echo "Upload complete."
echo "  Bucket:  ${BUCKET}"
echo "  PDF key: ${PDF_KEY}"
echo "  Cover:   ${COVER_KEY}"
echo "  Slug:    ${SLUG}"
echo "  Audience:${BOOK_AUDIENCE}"
echo ""
echo "Verify with: curl \"\${VITE_API_BASE_URL}/library\" (after Lambda deploy)"
