#!/usr/bin/env sh
set -eu

if [ ! -f package.json ]; then
  echo "Execute na raiz do projeto."
  exit 1
fi

rm -f package-lock.json
rm -rf node_modules
npm cache clean --force
npm install --no-audit --no-fund --registry=https://registry.npmjs.org
npm run build

echo "Correção concluída. Envie .npmrc, vercel.json e o novo package-lock.json."
