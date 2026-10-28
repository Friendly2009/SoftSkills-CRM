import {randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const secret=()=>randomBytes(32).toString('hex');
writeFileSync('.env',`NODE_ENV=development\nDB_NAME=crm_local\nDB_USER=crm\nDB_PASSWORD=${secret()}\nMYSQL_ROOT_PASSWORD=${secret()}\nSESSION_SECRET=${secret()}\nAPP_ORIGIN=http://localhost:5173\nCOOKIE_SECURE=false\nCOOKIE_SAME_SITE=lax\nTRUST_PROXY=0\n`,{flag:'wx',mode:0o600});
console.log('Created local .env with random secrets; existing files are never overwritten.');
