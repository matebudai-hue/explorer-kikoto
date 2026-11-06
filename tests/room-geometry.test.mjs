import assert from 'node:assert/strict';
import {migrateRoom,buy,moveItem,rotateItem,checkPlacement,size,placeOnContainer,position,validateRoomState} from '../explorer/room-engine.mjs';
import {art,roomSVG} from '../explorer/room-art.mjs';
import {product} from '../explorer/room-catalog.mjs';
const s=migrateRoom({items:[],earned:10000,spent:0});
const a=buy(s,'modular'),b=buy(s,'modular');moveItem(s,a.id,6,6);moveItem(s,b.id,9.5,6);assert.equal(b.x-a.x,3.5);assert.equal(checkPlacement(s,b,b.x,b.y).ok,true);rotateItem(s,b.id);assert.equal(b.rotation,90);assert.deepEqual(size(b),{w:2,h:3.5});
const shelf=product('bookshelf'),fire=product('fireplace');assert.deepEqual([shelf.w,shelf.h],[4,1]);assert.deepEqual([fire.w,fire.h],[4,2]);assert.match(art(shelf),/viewBox="0 0 200 50"/);assert.doesNotMatch(art(product('sofa')),/preserveAspectRatio="none"/);
const box=buy(s,'trainer-case'),markers=buy(s,'markers');placeOnContainer(s,markers.id,box.id);const old=position(s,markers);let moved=false;for(let y=4;y<16&&!moved;y++)for(let x=3;x<22&&!moved;x++){if(checkPlacement(s,box,x,y).ok&&(Math.abs(x-box.x)>1||Math.abs(y-box.y)>1)){moveItem(s,box.id,x,y);moved=true}}assert(moved);assert.equal(markers.parentId,box.id);assert.notDeepEqual(position(s,markers),old);assert.doesNotMatch(roomSVG(s),/preserveAspectRatio="none"/);assert(validateRoomState(s));
console.log('Asztalok illesztése és forgatása, polc, kandalló, tároló és mentés: rendben');
