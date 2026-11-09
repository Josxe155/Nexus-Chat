import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchesDashboardOwner} from '../src/dashboard/ownerPolicy.ts';
const owner={uid:'owner-test',email:'owner@example.org',enabled:true};
test('solo permite al UID y correo verificado del propietario por Google o contraseña',()=>{
 for(const provider of ['google.com','password'])assert.equal(matchesDashboardOwner('owner-test','Owner@Example.org',true,provider,owner),true);
 for(const [uid,email,verified,provider,policy] of [
  ['other','owner@example.org',true,'google.com',owner],['owner-test','other@example.org',true,'google.com',owner],
  ['owner-test','owner@example.org',false,'password',owner],['owner-test','owner@example.org',true,'anonymous',owner],
  ['owner-test','owner@example.org',true,'google.com',{...owner,enabled:false}],['owner-test','owner@example.org',true,'google.com',undefined],
 ] as const)assert.equal(matchesDashboardOwner(uid,email,verified,provider,policy),false);
});
