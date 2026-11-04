#!/bin/sh
# Bo'sh Postgres'da BARCHA migratsiyalarni qo'llab, test to'plamini ishga tushiradi.
#   sh supabase/tests/run.sh [test_fayl.sql]        (root sifatida: postgres foydalanuvchisiga o'tadi)
# Har migratsiya production kabi bitta tranzaksiyada va birinchi xatoda to'xtab qo'llanadi.
# Fayllar postgres foydalanuvchisi o'qiy oladigan vaqtinchalik papkaga nusxalanadi.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$(mktemp -d /tmp/sqlrun.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/migrations" "$WORK/tests"
cp "$HERE"/../migrations/*.sql "$WORK/migrations/"
cp "$HERE"/*.sql "$WORK/tests/"
TEST="${1:-$HERE/10_learning_core_test.sql}"
if [ "$TEST" != "/dev/null" ]; then cp "$TEST" "$WORK/tests/__run.sql"; else : > "$WORK/tests/__run.sql"; fi
chmod -R a+rX "$WORK"

service postgresql start >/dev/null 2>&1; sleep 3
su postgres -c "psql -q -c 'DROP DATABASE IF EXISTS fresh;' -c 'CREATE DATABASE fresh;'" >/dev/null 2>&1
su postgres -c "psql -d fresh -q -f '$WORK/tests/00_supabase_stub.sql'" 2>&1 | grep -i error
for f in $(ls "$WORK/migrations" | sort); do
  out=$(su postgres -c "psql -d fresh -q -v ON_ERROR_STOP=1 -1 -f '$WORK/migrations/$f'" 2>&1 | grep -iE "error|fatal")
  [ -n "$out" ] && echo "MIGRATSIYA XATOSI $f: $out"
done
echo "== migratsiyalar qo'llandi: $(ls "$WORK/migrations" | wc -l) =="
# Testlar \ir bilan boshqa fayllarni chaqirmaydi; nisbiy yo'llar uchun tests papkasidan ishga tushiriladi
su postgres -c "cd '$WORK/tests' && psql -d fresh -q -f '$WORK/tests/__run.sql'" 2>&1
