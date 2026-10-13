#!/usr/bin/env bash
# Runs every migration on a clean PostgreSQL database, twice (to prove they are re-runnable),
# then runs the SQL test suites. Each check prints "| t" when it passes; any "| f" fails the run.
# Usage: PGURL=postgres://postgres:postgres@localhost:5432/postgres scripts/test-db.sh
set -euo pipefail
PGURL="${PGURL:?set PGURL}"
export PGOPTIONS="--client-min-messages=warning"
cd "$(dirname "$0")/.."
psql "$PGURL" -q -v ON_ERROR_STOP=1 -f supabase/tests/00_supabase_stub.sql >/dev/null
for pass in 1 2; do
  # Before the second pass, add existing records (as on a live site) so re-running every file is tested against real data.
  if [ "$pass" = 2 ]; then psql "$PGURL" -q -v ON_ERROR_STOP=1 -f supabase/tests/05_existing_data.sql >/dev/null || { echo "Seeding existing data failed"; exit 1; }; fi
  for f in supabase/schema.sql supabase/migrations/*.sql; do
    psql "$PGURL" -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null || { echo "Migration failed: $f (pass $pass)"; exit 1; }
  done
done
echo "Migrations applied twice (second time over existing records): OK"
psql "$PGURL" -q -v ON_ERROR_STOP=1 -c "delete from auth.users where id = '00000000-0000-0000-0000-00000000e0e0'" >/dev/null
fails=0; total=0
for t in supabase/tests/*.test.sql; do
  out=$(psql "$PGURL" -f "$t" 2>&1 | grep -E '^ [A-Z][0-9]+ ' || true)
  n=$(echo "$out" | grep -c '|' || true); f=$(echo "$out" | grep -cE '\| f( |$)' || true)
  expected=$(grep -cE "^select '[A-Z][0-9]+ " "$t" || true)
  if [ "$n" -lt "$expected" ]; then echo "$(basename "$t"): only $n of $expected checks produced a result (a check errored)"; fails=$((fails + expected - n)); fi
  total=$((total + n)); fails=$((fails + f))
  echo "$(basename "$t"): $((n - f))/$n passed"
  echo "$out" | grep -E '\| f( |$)' || true
done
[ "$total" -gt 0 ] || { echo "No checks ran"; exit 1; }
[ "$fails" -eq 0 ] || { echo "$fails database check(s) failed"; exit 1; }
echo "All $total database checks passed"
