import assert from 'node:assert/strict';
import {products,footprint} from '../explorer/room-catalog.mjs';
import {art,roomSVG} from '../explorer/room-art.mjs';
import {migrateRoom,checkPlacement,moveItem,rotateItem,placeOnContainer,size,undoRoom,validateRoomState} from '../explorer/room-engine.mjs';
assert.equal(products.length,72);
for(const p of products){
 const variants=[0,1,2].map(t=>art(p,'#32959a',t,{view:'water'}));assert.notEqual(variants[0],variants[1],p.name+' 1→2');assert.notEqual(variants[1],variants[2],p.name+' 2→3');
 let bounds=footprint(p), v=variants[0].match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);assert(v,p.name);assert(Math.abs(+v[1]/+v[2]-bounds.w/bounds.h)<.001,p.name+' képarány');
 for(const rotation of [0,90,180,270]){let item={id:'t',product:p.id,tier:0,tone:'theme',x:12,y:p.layer==='wall'?.65:9,rotation,stored:false,parentId:null};let state=migrateRoom({roomVersion:2,items:[item],earned:1000,spent:0});let z=size(item);assert.deepEqual(z,rotation%180?{w:bounds.h,h:bounds.w}:bounds,p.name+' méret');if(p.layer!=='tabletop')assert(checkPlacement(state,item,item.x,item.y).ok,p.name+' elhelyezés '+rotation);assert(validateRoomState(state));let svg=roomSVG(state,{selected:'t'});assert(svg.includes('data-room-item="t"'),p.name+' ábra');}
}
for(const hostId of ['trainer-case','open-shelf','supply-cabinet','modular','standing','cart','coffee','tea-table']){
 const host={id:'host',product:hostId,tier:0,tone:'theme',x:12,y:9,rotation:0,stored:false,parentId:null};const child={id:'child',product:'markers',tier:0,tone:'theme',x:2,y:4,rotation:0,stored:true,parentId:null};let s=migrateRoom({roomVersion:2,items:[host,child],earned:1000,spent:0});placeOnContainer(s,'child','host');let original={x:child.x,y:child.y,rotation:child.rotation};rotateItem(s,'host');assert.equal(child.x,-original.y,hostId+' gyermek x');assert.equal(child.y,original.x,hostId+' gyermek y');assert.equal(child.rotation,90,hostId+' gyermek forgatás');assert.equal(child.parentId,'host');assert(validateRoomState(s));assert(undoRoom(s));assert.equal(child.x,original.x);assert.equal(child.y,original.y);assert.equal(child.rotation,0);
}
console.log('72 tárgy × 3 grafika × 4 irány, keretek, valamint 8 tároló forgatása és visszavonása: rendben');
// A frissen vásárolt széles asztal a terem felső szélénél is elforgatható.
const edge=migrateRoom({roomVersion:2,items:[{id:'edge',product:'modular',tier:0,tone:'theme',x:4,y:3,rotation:0,stored:false,parentId:null}],earned:100,spent:0});rotateItem(edge,'edge');assert.equal(edge.items[0].rotation,90);assert(edge.items[0].y>=4);assert(undoRoom(edge));assert.equal(edge.items[0].y,3);
