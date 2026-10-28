#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
mysql_root=${MYSQL_BASE:-/usr}
# Fail before starting if the test port is occupied; never attach to an existing database.
node --input-type=module -e "import net from 'node:net'; const s=net.createServer();s.on('error',()=>process.exit(1));s.listen(3307,'127.0.0.1',()=>s.close());"
export LD_LIBRARY_PATH="$mysql_root/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
run_dir=$(mktemp -d /tmp/crm-audit-XXXXXX)
"$mysql_root/sbin/mysqld" --no-defaults --initialize-insecure --user="$(id -un)" --datadir="$run_dir" --basedir="$mysql_root" --log-error="$run_dir/init.log"
"$mysql_root/sbin/mysqld" --no-defaults --user="$(id -un)" --datadir="$run_dir" --basedir="$mysql_root" --socket= --port=3307 --bind-address=127.0.0.1 --pid-file="$run_dir/server.pid" --log-error="$run_dir/server.log" --mysqlx=OFF --secure-file-priv=NULL &
mysql_pid=$!
trap 'kill "$mysql_pid" 2>/dev/null; wait "$mysql_pid"; rm -rf "$run_dir"' EXIT
for i in $(seq 1 100); do "$mysql_root/bin/mysql" --protocol=TCP -h127.0.0.1 -P3307 -uroot -e 'SELECT 1' >/dev/null 2>&1 && break; sleep .2; done
"$mysql_root/bin/mysql" --protocol=TCP -h127.0.0.1 -P3307 -uroot -e "SELECT VERSION(); CREATE DATABASE crm_readiness_test; CREATE USER 'crm_test'@'127.0.0.1' IDENTIFIED BY 'local-audit-only-password'; GRANT ALL ON crm_readiness_test.* TO 'crm_test'@'127.0.0.1';"
export DB_HOST=127.0.0.1 DB_PORT=3307 DB_USER=crm_test DB_PASSWORD=local-audit-only-password DB_NAME=crm_readiness_test SESSION_SECRET=local-audit-only-session-32-characters
npm run migrate:prod | tee ../docs/readiness-migrations.txt
npm run migrate:prod | tee -a ../docs/readiness-migrations.txt
set +e
result=0
if [ "${SKIP_API_TESTS:-false}" != true ]; then
  npm run test:integration > ../docs/readiness-integration-results.txt 2>&1
  result=$?
fi
tail -75 ../docs/readiness-integration-results.txt
if [ "$result" = 0 ] && [ "${RUN_BROWSER_TESTS:-false}" = true ]; then
  (cd ../frontend && node tests/browser.mjs) > ../docs/browser-results.txt 2>&1
  result=$?
  tail -60 ../docs/browser-results.txt
fi
if [ "$result" = 0 ]; then
  set -e
  "$mysql_root/bin/mysqldump" --protocol=TCP -h127.0.0.1 -P3307 -uroot --single-transaction --routines --events --triggers --hex-blob --no-tablespaces --set-gtid-purged=OFF --skip-comments --order-by-primary crm_readiness_test > "$run_dir/backup.sql"
  "$mysql_root/bin/mysql" --protocol=TCP -h127.0.0.1 -P3307 -uroot -e 'CREATE DATABASE crm_restore_test;'
  "$mysql_root/bin/mysql" --protocol=TCP -h127.0.0.1 -P3307 -uroot crm_restore_test < "$run_dir/backup.sql"
  "$mysql_root/bin/mysql" --protocol=TCP -h127.0.0.1 -P3307 -uroot -e "GRANT SELECT ON crm_restore_test.* TO 'crm_test'@'127.0.0.1';"
  RESTORE_DB_NAME=crm_restore_test node --import tsx test/restore-check.ts > ../docs/restore-results.txt
  "$mysql_root/bin/mysqlcheck" --protocol=TCP -h127.0.0.1 -P3307 -uroot --check crm_restore_test >> ../docs/restore-results.txt
  cat ../docs/restore-results.txt
fi
exit "$result"
