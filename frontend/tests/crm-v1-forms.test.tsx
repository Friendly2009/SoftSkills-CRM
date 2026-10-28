import {afterEach,it,expect,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {Fields} from '../src/real/Fields';
import {initialValues,payload,operation} from '../src/real/schema';
afterEach(cleanup);
it('allows an open-ended enrollment while requiring its start',()=>{
 const schema=operation('POST','/enrollments')!.body!;
 // Keep the actual nullable date schema without fetching relation options.
 render(<Fields schema={{type:'object',properties:{startsAt:schema.properties!.startsAt,endsAt:schema.properties!.endsAt},required:schema.required}} model={{startsAt:'2026-10-01T12:00',endsAt:''}} onChange={vi.fn()}/>);
 expect((screen.getByLabelText('Окончание') as HTMLInputElement).checkValidity()).toBe(true);
 expect((screen.getByLabelText('Начало *') as HTMLInputElement).required).toBe(true);
});
it('preserves a percentage discount without resubmitting its calculated fixed amount',()=>{
 const schema=operation('POST','/lessons/11111111-1111-4111-8111-111111111111/complete')!.body!;
 const initial=initialValues(schema,{expectedRevision:2,reason:'Correction',attendance:[{student_id:'11111111-1111-4111-8111-111111111111',status:'present',price:'10000',discount:'1250',discount_percent:1250,subscription_id:'22222222-2222-4222-8222-222222222222'}]});
 const row=payload(schema,initial).attendance[0];
 expect(row.discountPercent).toBe(1250);expect(row.discount).toBeUndefined();expect(row.subscriptionId).toBe('22222222-2222-4222-8222-222222222222');expect(row.price).toBe('10000');
});
