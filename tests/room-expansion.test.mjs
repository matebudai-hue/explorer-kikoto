import assert from 'node:assert/strict';
import {products} from '../explorer/room-catalog.mjs';
import {migrateRoom,buy,placeOnContainer,storeItem,restoreItem,undoRoom,validateRoomState} from '../explorer/room-engine.mjs';
import {roomSVG} from '../explorer/room-art.mjs';
const ids=['open-shelf','supply-cabinet','screen-divider','sofa','pouf','hanging-chair','tea-table','coat-wall','projector-screen','patio-corner','picture-cards','emotion-cards','conversation-cards','building-blocks','colored-tokens','dice-set','talking-stick','talking-ball','sticky-notes','trainer-case','own-book','certificate','trophy','photo-frame','compass-globe'];
assert.equal(ids.length,25);
for(const id of ids){assert(products.some(p=>p.id===id),id);const s=migrateRoom({items:[],earned:10000,spent:0});buy(s,id);validateRoomState(s);assert.match(roomSVG(s),/<svg/);}
let s=migrateRoom({items:[],earned:10000,spent:0});const shelf=buy(s,'open-shelf'),pen=buy(s,'markers'),mug=buy(s,'mug');const spent=s.spent;
placeOnContainer(s,pen.id,shelf.id);placeOnContainer(s,mug.id,shelf.id);assert.equal(s.spent,spent);assert.equal(pen.parentId,shelf.id);assert.equal(mug.parentId,shelf.id);validateRoomState(s);
storeItem(s,shelf.id);assert(pen.stored&&mug.stored);restoreItem(s,shelf.id);assert(!pen.stored&&!mug.stored);assert.equal(pen.parentId,shelf.id);assert.equal(mug.parentId,shelf.id);validateRoomState(s);
const copy=structuredClone(s);migrateRoom(copy);validateRoomState(copy);assert.equal(copy.items.length,3);assert.equal(copy.spent,spent);assert.match(roomSVG(copy),/<svg/);
console.log('25 tárgy, vásárlás, mentés, tárolás és visszaállítás: rendben');
