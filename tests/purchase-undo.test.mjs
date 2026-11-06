import assert from 'node:assert/strict';
import {migrateRoom,buy,undoPurchase,moveItem,upgrade} from '../explorer/room-engine.mjs';
let s=migrateRoom({items:[],earned:500,spent:0});let a=buy(s,'chair'), entry=s.ledger.at(-1), signature=JSON.stringify(a);assert.equal(s.spent,15);undoPurchase(s,a.id,entry.id,signature);assert.equal(s.spent,0);assert.equal(s.items.length,0);assert.equal(s.ledger.length,0);
a=buy(s,'chair');entry=s.ledger.at(-1);signature=JSON.stringify(a);moveItem(s,a.id,12,9);assert.throws(()=>undoPurchase(s,a.id,entry.id,signature));assert.equal(s.items.length,1);assert.equal(s.spent,15);
a=buy(s,'chair');entry=s.ledger.at(-1);signature=JSON.stringify(a);upgrade(s,a.id);assert.throws(()=>undoPurchase(s,a.id,entry.id,signature));
console.log('Vásárlás visszavonása és megváltoztatott tárgy védelme: rendben');
