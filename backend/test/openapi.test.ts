import './env.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/app.js';
import {openapi} from '../src/core/api.js';
test('OpenAPI covers every registered route with concrete responses, security and headers',()=>{
 const app=createApp();const spec=openapi();
 const actual=new Set<string>();
 for(const layer of (app as any).router.stack){
  if(!layer.route)continue;
  const path=layer.route.path.replace(/:([A-Za-z]+)/g,'{$1}');
  for(const method of Object.keys(layer.route.methods)){
   actual.add(method+' '+path);
   const operation=(spec.paths as any)[path]?.[method];
   assert.ok(operation,`Undocumented ${method} ${path}`);
   const response=operation.responses['200'].content['application/json'].schema;
   assert.ok(response.type || response.$ref);
   if(response.properties?.data)assert.ok(response.properties.data.type||response.properties.data.anyOf,`${method} ${path} untyped data`);
   if(method!=='get' && path.startsWith('/api/v1/'))assert.ok(operation.parameters.some((p:any)=>p.name==='X-CSRF-Token'));
  }
 }
 const documented=new Set(Object.entries(spec.paths).flatMap(([p,ms])=>Object.keys(ms).map(m=>m+' '+p)));
 assert.deepEqual(documented,actual);
});
