// Test-only restore check: compare semantic schema and every restored value.
import assert from 'node:assert/strict';
import {pool} from '../src/core/db.js';
const source=process.env.DB_NAME!;
const restored=process.env.RESTORE_DB_NAME!;
assert.ok(/^[a-zA-Z0-9_]+_test$/.test(source));
assert.ok(/^[a-zA-Z0-9_]+_test$/.test(restored));
assert.notEqual(source,restored);
try {
 for(const query of [
   'SELECT TABLE_NAME,ENGINE,TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME',
   'SELECT TABLE_NAME,COLUMN_NAME,ORDINAL_POSITION,COLUMN_DEFAULT,IS_NULLABLE,COLUMN_TYPE,CHARACTER_SET_NAME,COLLATION_NAME,EXTRA,GENERATION_EXPRESSION FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,ORDINAL_POSITION',
   'SELECT TABLE_NAME,INDEX_NAME,NON_UNIQUE,SEQ_IN_INDEX,COLUMN_NAME,SUB_PART,INDEX_TYPE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX',
   'SELECT TABLE_NAME,CONSTRAINT_NAME,COLUMN_NAME,ORDINAL_POSITION,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,CONSTRAINT_NAME,ORDINAL_POSITION',
   'SELECT TABLE_NAME,CONSTRAINT_NAME,UPDATE_RULE,DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=? ORDER BY TABLE_NAME,CONSTRAINT_NAME',
   'SELECT CONSTRAINT_NAME,CHECK_CLAUSE FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=? ORDER BY CONSTRAINT_NAME',
 ]){
  const [a]=await pool.execute(query,[source]);const [b]=await pool.execute(query,[restored]);assert.deepEqual(b,a,'Restored schema mismatch');
 }
 const [tables]=await pool.execute<any[]>('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME',[source]);
 let total=0;
 for(const {TABLE_NAME:table} of tables){
  const [keys]=await pool.execute<any[]>('SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND CONSTRAINT_NAME=\'PRIMARY\' ORDER BY ORDINAL_POSITION',[source,table]);
  assert.ok(keys.length,'Every test table must have a primary key');
  const quote=(s:string)=>'`'+s.replaceAll('`','``')+'`';
  const sql=(db:string)=>`SELECT * FROM ${quote(db)}.${quote(table)} ORDER BY ${keys.map(k=>quote(k.COLUMN_NAME)).join(',')}`;
  const [a]=await pool.query<any[]>(sql(source));const [b]=await pool.query<any[]>(sql(restored));
  assert.deepEqual(b,a,`Restored rows mismatch: ${table}`);total+=a.length;
 }
 console.log(`PASS: restored semantic schema and every value match: ${tables.length} tables, ${total} rows.`);
} finally {await pool.end();}
