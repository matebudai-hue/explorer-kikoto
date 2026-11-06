// A bolt megnyitása a képzési napokhoz igazodik; a már megvett tárgyakat nem módosítja.
export const releaseGroups=[
 ['chair','table','modular','flipchart','markers','plant','rug','window','water','mug','open-shelf','wall-clock','picture','coat','timer','cushion'],
 ['cart','sticky-notes','beanbag','armchair','side','lamp','flowers-pot','chess','ball','whiteboard','bookshelf','stool'],
 ['pinboard','wall-whiteboard','picture-cards','emotion-cards','conversation-cards','building-blocks','colored-tokens','dice-set','talking-stick','talking-ball','trainer-case','screen-divider'],
 ['bench','sofa','pouf','hanging-chair','tea-table','rug-large','curtain','flowers-vase','hanging-plant','tree-ficus','coat-wall'],
 ['supply-cabinet','coffee','projector-screen','standing','ac','acoustic','tree-palm','ship','plush-bear','plush-fox','plush-octopus'],
 ['own-book','trophy','certificate','photo-frame','compass-globe','guitar','decor-sculpture','fireplace','terrace','sign']
];
const tiers=new Map(releaseGroups.flatMap((g,i)=>g.map(id=>[id,i+1])));
export function shopLevel(catalog,fullyOpen=false){if(fullyOpen)return 6;return Math.min(6,Math.max(1,(catalog?.days||[]).filter(d=>d.open===true).length));}
export function productLevel(id){return tiers.get(id)??6;}
export function itemAvailable(id,level){return level>=productLevel(id);}
export function upgradeAvailable(id,targetTier,level){return level>=Math.min(6,productLevel(id)+targetTier);}
