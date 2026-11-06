import assert from 'node:assert/strict';
import{products}from'../explorer/room-catalog.mjs';
import{shopLevel,productLevel,itemAvailable,upgradeAvailable,releaseGroups}from'../explorer/shop-unlocks.mjs';
const all=releaseGroups.flat(),ids=products.map(p=>p.id);
assert.equal(all.length,72);assert.equal(new Set(all).size,72);assert.deepEqual([...all].sort(),[...ids].sort());
for(let n=1;n<=6;n++){let c={days:Array.from({length:6},(_,i)=>({open:i<n}))};assert.equal(shopLevel(c),n);assert.equal(shopLevel(c,true),6);for(const p of products){const stage=productLevel(p.id);assert.equal(itemAvailable(p.id,n),stage<=n);for(let t=0;t<=2;t++)assert.equal(upgradeAvailable(p.id,t,n),n>=Math.min(6,stage+t));}}
assert.equal(shopLevel({days:[{open:true},{open:true},{open:true},{open:false}]}),3);
assert.equal(productLevel('sofa'),4);assert(!itemAvailable('sofa',3));assert(itemAvailable('sofa',4));assert(!upgradeAvailable('sofa',1,4));assert(upgradeAvailable('sofa',1,5));assert(upgradeAvailable('sofa',2,6));
assert.equal(shopLevel({days:[]},true),6);assert.equal(shopLevel({days:Array.from({length:8},()=>({open:true}))}),6);
console.log('72 tárgy, 6 lépcső, Alumni, vásárlás és fejlesztési szintek: rendben');
