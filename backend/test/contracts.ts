import assert from 'node:assert/strict';
import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { definitions } from '../src/core/api.js';
const ajv = new Ajv2020({ strict: false, allErrors: true });
(addFormats as unknown as (a: Ajv2020) => void)(ajv);
const validators = new Map();
export function checkResponse(method: string, path: string, payload: unknown) {
  const template = Object.keys(definitions).find(p => new RegExp('^'+p.replace(/\{[^}]+\}/g,'[^/]+')+'$').test('/api/v1'+path.split('?')[0]) && definitions[p][method.toLowerCase()]);
  assert.ok(template, `Undocumented route ${method} ${path}`);
  const key = method+template;
  if (!validators.has(key)) validators.set(key,ajv.compile(definitions[template][method.toLowerCase()].responses['200'].content['application/json'].schema));
  const validate = validators.get(key);
  assert.ok(validate(payload),`${method} ${path}: ${JSON.stringify(validate.errors)} payload=${JSON.stringify(payload)}`);
}
