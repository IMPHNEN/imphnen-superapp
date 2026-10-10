#!/usr/bin/env bash
# Prints a JSON array of the apps whose deploy output a git range can change.
# A change to packages/ or to the workspace manifests redeploys every app that
# uses the shared packages; imphnenos and infra only depend on their own folders.
set -euo pipefail

range="$1"
apps=(landing backoffice dimentorin gacha hackathon imphnenos infra qrcampaign)
shared_users=(landing backoffice dimentorin gacha hackathon qrcampaign)

changed=$(git diff --name-only "$range")
selected=()

global=false
if grep -qE '^(pnpm-lock\.yaml|pnpm-workspace\.yaml|package\.json|tsconfig\.base\.json|\.github/)' <<<"$changed"; then
  global=true
fi
shared=false
if grep -qE '^packages/' <<<"$changed"; then
  shared=true
fi

for app in "${apps[@]}"; do
  if $global || grep -qE "^apps/$app/" <<<"$changed"; then
    selected+=("$app")
  elif $shared && [[ " ${shared_users[*]} " == *" $app "* ]]; then
    selected+=("$app")
  fi
done

printf '%s\n' "${selected[@]}" | jq -R . | jq -cs 'map(select(length > 0))'
