#!/bin/sh
# Bo'sh Postgres'da BARCHA migratsiyalarni qo'llab, test to'plamini ishga tushiradi.
#   sh supabase/tests/run.sh [test_fayl.sql]
# Talab: lokal PostgreSQL (postgres foydalanuvchisi bilan psql). Faqat lokal sinov uchun.
HERE="$(cd "$(dirname "$0")" && pwd)"; MIG="$HERE/../migrations"
service postgresql start >/dev/null 2>&1; sleep 3
su postgres -c "psql -q -c 'DROP DATABASE IF EXISTS fresh;' -c 'CREATE DATABASE fresh;'" >/dev/null 2>&1
su postgres -c "psql -d fresh -q -f '$HERE/00_supabase_stub.sql'" 2>&1 | grep -i error
for f in $(ls "$MIG" | sort); do
  out=$(su postgres -c "psql -d fresh -q -f '$MIG/$f'" 2>&1 | grep -iE "error|fatal")
  [ -n "$out" ] && echo "MIGRATSIYA XATOSI $f: $out"
done
echo "== migratsiyalar qo'llandi: $(ls "$MIG" | wc -l) =="
su postgres -c "psql -d fresh -q -f '${1:-$HERE/10_learning_core_test.sql}'" 2>&1
