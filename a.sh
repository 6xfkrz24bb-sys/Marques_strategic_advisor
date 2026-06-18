#!/usr/bin/env bash
set -euo pipefail

echo "== Marques Advisor: migracao Next.js =="

git checkout -B nextjs-saas-upgrade

rm -rf /tmp/marques-upgrade
mkdir -p /tmp/marques-upgrade

ZIP_FILE=$(ls -1 marques-strategic-advisor*.zip marques-strate*.zip *.zip 2>/dev/null | head -n 1 || true)

if [ -z "${ZIP_FILE:-}" ]; then
  echo "ERRO: nenhum ZIP encontrado na raiz do projeto."
  echo "Carregue o arquivo marques-strategic-advisor-nextjs-upgrade.zip e rode novamente: bash a.sh"
  exit 1
fi

echo "ZIP encontrado: $ZIP_FILE"
unzip -o "$ZIP_FILE" -d /tmp/marques-upgrade

SRC_DIR=$(find /tmp/marques-upgrade -type f -name package.json -exec dirname {} \; | head -n 1 || true)

if [ -z "${SRC_DIR:-}" ]; then
  echo "ERRO: nao encontrei package.json dentro do ZIP."
  find /tmp/marques-upgrade -maxdepth 3 -type f | head -n 50
  exit 1
fi

echo "Copiando projeto de: $SRC_DIR"
cp -R "$SRC_DIR"/. .

rm -f "$ZIP_FILE"
rm -f tsconfig.tsbuildinfo

echo "Status antes do commit:"
git status --short

git add .

if git diff --cached --quiet; then
  echo "Nada novo para commitar."
else
  git commit -m "feat: migrate Marques Advisor to Next.js SaaS platform"
fi

git push -u origin nextjs-saas-upgrade

echo "PRONTO: branch nextjs-saas-upgrade enviada ao GitHub. Agora abra o Pull Request no site do GitHub."
