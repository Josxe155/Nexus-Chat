import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pollOptionCounts,pollVoterCount} from '../src/features/pollPrivacy.ts';
import type {Message} from '../src/types.ts';
const base={question:'Pregunta',options:[{id:'a',text:'Uno'},{id:'b',text:'Dos'}],optionIds:['a','b'],multiple:true,votes:{alice:['a','b'],bob:['b'],carol:[]}} as NonNullable<Message['poll']>;
test('las encuestas ordinarias cuentan opciones y participantes distintos',()=>{assert.deepEqual(pollOptionCounts(base),{a:1,b:2});assert.equal(pollVoterCount(base),2);});
test('las encuestas privadas usan agregados sin depender de identidades',()=>{const poll={...base,anonymousVersion:1 as const,hideVoterNames:true,votes:{},counts:{a:2,b:3},voterCount:4};assert.deepEqual(pollOptionCounts(poll),{a:2,b:3});assert.equal(pollVoterCount(poll),4);assert.deepEqual(poll.votes,{});});
test('no se inventan resultados si faltan agregados',()=>{const poll={...base,anonymousVersion:1 as const};assert.deepEqual(pollOptionCounts(poll),{});assert.equal(pollVoterCount(poll),0);});
test('el ocultamiento histórico no se presenta como una migración de votos',()=>{assert.deepEqual(pollOptionCounts({...base,hideVoterNames:true}),{a:1,b:2});assert.equal(pollVoterCount({...base,hideVoterNames:true}),2);});
