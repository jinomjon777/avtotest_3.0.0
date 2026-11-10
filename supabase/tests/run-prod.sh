#!/bin/sh
# Production sxemasi (supabase/tests/prod/schema.sql) ustida deploy migratsiyalarini tekshiradi:
#   1) supabase/deploy-migrations.txt dagi fayllar production kabi (-1, ON_ERROR_STOP) IKKI MARTA qo'llanadi (idempotentlik)
#   2) test fayllari ishga tushiriladi (standart: 80 va 90)
#   sh supabase/tests/run-prod.sh [test.sql ...]        (root sifatida)
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$HERE/../.."
WORK="$(mktemp -d /tmp/sqlprod.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT
cp "$HERE"/*.sql "$HERE"/prod/*.sql "$WORK/"
grep -vE '^\s*(#|$)' "$ROOT/supabase/deploy-migrations.txt" > "$WORK/list.txt"
while read -r f; do cp "$ROOT/supabase/migrations/$f" "$WORK/m_$f"; done < "$WORK/list.txt"
chmod -R a+rX "$WORK"
service postgresql start >/dev/null 2>&1; sleep 3
su postgres -c "psql -q -c 'DROP DATABASE IF EXISTS prodlike;' -c 'CREATE DATABASE prodlike;'" >/dev/null 2>&1
su postgres -c "psql -d prodlike -q -f '$WORK/00_supabase_stub.sql'" 2>&1 | grep -i error
su postgres -c "psql -d prodlike -q -v ON_ERROR_STOP=1 -f '$WORK/schema.sql'" 2>&1 | grep -iE "error|fatal" && echo "MIGRATSIYA XATOSI: prod/schema.sql"
su postgres -c "psql -d prodlike -q -v ON_ERROR_STOP=1 -f '$WORK/extra.sql'" 2>&1 | grep -iE "error|fatal" && echo "MIGRATSIYA XATOSI: prod/extra.sql"
for pass in 1 2; do
  while read -r f; do
    out=$(su postgres -c "psql -d prodlike -q -v ON_ERROR_STOP=1 -1 -f '$WORK/m_$f'" 2>&1 | grep -iE "error|fatal")
    [ -n "$out" ] && echo "MIGRATSIYA XATOSI ($pass-marta) $f: $out"
  done < "$WORK/list.txt"
done
echo "== production sxemasiga deploy migratsiyalari qo'llandi (2 marta) =="
[ $# -eq 0 ] && set -- "$HERE/80_hardening_test.sql" "$HERE/90_prod_drift_test.sql"
for t in "$@"; do
  cp "$t" "$WORK/__run.sql"; chmod a+r "$WORK/__run.sql"
  su postgres -c "cd '$WORK' && psql -d prodlike -q -f '$WORK/__run.sql'" 2>&1
done
