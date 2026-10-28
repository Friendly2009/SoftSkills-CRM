// Run from repository root with backend stopped and no external writers.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const [mode,folder]=process.argv.slice(2);
if(!['backup','verify-restore'].includes(mode)||!folder)throw new Error('Usage: node scripts/backup.mjs backup|verify-restore backups/name');
const composeArgs=process.argv.includes('--production')?['-f','compose.production.yml','--env-file','.env.production']:[];
function command(service,sql,input){
 const r=spawnSync('docker',['compose',...composeArgs,'exec','-T',service,'sh','-c',sql],{input,maxBuffer:256*1024*1024});
 if(r.status!==0)throw new Error(r.stderr?.toString()||String(r.error));return r.stdout;
}
const mysql='MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot --batch --skip-column-names "$MYSQL_DATABASE"';
function counts(service){
 const names=command(service,mysql,Buffer.from('SHOW TABLES;\n')).toString().trim().split('\n').sort();
 const queries=names.map(n=>`SELECT '${n}',COUNT(*) FROM \`${n.replaceAll('`','``')}\`;`).join('\n');
 return command(service,mysql,Buffer.from(queries)).toString();
}
if(mode==='backup'){
 mkdirSync(folder,{recursive:true});
 const dump=command('mysql','MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines --events --triggers --hex-blob --no-tablespaces --set-gtid-purged=OFF "$MYSQL_DATABASE"');
 writeFileSync(folder+'/database.sql',dump,{flag:'wx',mode:0o600});
 writeFileSync(folder+'/manifest.json',JSON.stringify({sha256:createHash('sha256').update(dump).digest('hex'),counts:counts('mysql')},null,2),{flag:'wx',mode:0o600});
 console.log('Backup and row-count manifest created. Verify on isolated restore service before resuming writes.');
}else{
 const dump=readFileSync(folder+'/database.sql');const manifest=JSON.parse(readFileSync(folder+'/manifest.json','utf8'));
 if(createHash('sha256').update(dump).digest('hex')!==manifest.sha256)throw new Error('Backup checksum mismatch');
 // Dedicated tmpfs service only; never restores over the main mysql service.
 command('mysql-restore',mysql,dump);
 if(counts('mysql-restore')!==manifest.counts)throw new Error('Restored table counts differ');
 command('mysql-restore','MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqlcheck -uroot --check "$MYSQL_DATABASE"');
 console.log('Restore verified: SHA256, table counts, mysqlcheck. Run API checks on the restored DB before disaster recovery cutover.');
}
