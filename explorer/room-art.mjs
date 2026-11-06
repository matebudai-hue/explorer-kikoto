import{product,themes,walls,floors,toneColor,footprint}from'./room-catalog.mjs?v=19';
import{position,visible}from'./room-engine.mjs?v=20';
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R=(x,y,w,h,fill,rx=5,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const C=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const L=(x1,y1,x2,y2,stroke='#46616b',width=4)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
export function art(p,tone='#32959a',tier=0,settings={}){const wood=tier===2?'#a7754e':tier===1?'#bd9169':'#d6b58b',ink='#294858',light='#f7f4e9',white='#fbfcf8';
// Ezek a tárgyak saját, méretarányos rajzot kapnak, a többi megőrzi az eredeti alakját.
if(p.id==='bookshelf'){
 let books='';for(let i=0;i<12;i++)books+=R(12+i*15,9,11,20,[tone,'#e6c47a','#82a388','#50738a'][i%4],1);
 const detail=tier>0?L(8,35,192,35,ink,2):'';
 return `<svg viewBox="0 0 200 50" aria-hidden="true" focusable="false">${R(2,3,196,44,wood,3,'stroke="#725842" stroke-width="3"')}${R(7,7,186,34,'#f5ecda',1)}${books}${detail}${L(7,41,193,41,ink,3)}${tier===2?L(10,5,190,5,'#f7dc95',3):''}</svg>`;
}
if(p.id==='fireplace'){
 const surround=tier===2?'#a7754e':tier===1?'#b1aca4':'#899a9b';
 return `<svg viewBox="0 0 160 80" aria-hidden="true" focusable="false">${R(2,3,156,74,surround,5,'stroke="#6d7776" stroke-width="3"')}${R(17,10,126,58,ink,4)}${R(24,14,112,48,'#20363d',2)}<path d="M51 58Q42 43 58 32Q57 45 68 44Q82 30 75 20Q103 36 100 53Q113 45 111 37Q126 58 107 60Z" fill="#e89943"/><path d="M67 59Q59 49 72 41Q73 50 80 49Q89 42 86 36Q103 47 96 59Z" fill="#ffe2a1"/>${tier>0?L(12,68,148,68,'#d8c6ac',4):''}${tier===2?R(10,4,140,6,'#e0c39c',2):''}</svg>`;
}
if(p.id==='modular'){
 return `<svg viewBox="0 0 175 100" aria-hidden="true" focusable="false">${R(2,4,171,92,wood,5,'stroke="#725842" stroke-width="3"')}${R(8,11,159,77,tier===2?tone:tone+'55',3)}${tier>0?C(11,90,4,ink)+C(164,90,4,ink):''}${tier>1?R(20,20,30,13,light,2)+R(130,20,24,13,'#d6a344',2):''}</svg>`;
}
// Széles bútorok: külön rajz, valódi alak, a részletek nem nyúlnak meg.
const wide=new Set(['bench','sofa','standing','cart','coffee','open-shelf','supply-cabinet','tea-table','trainer-case','coat-wall','screen-divider','projector-screen','rug','rug-large']);
if(wide.has(p.id)){
 const W=100*p.w/p.h,H=100,mid=W/2;let g='';
 const box=(fill=wood)=>R(3,5,W-6,90,fill,8,`stroke="#725842" stroke-width="3"`);
 if(p.id==='rug'||p.id==='rug-large'){
  g=R(2,2,W-4,96,tone,4,'stroke="#ffffff80" stroke-width="3"')+R(9,10,W-18,80,'none',2,'stroke="#ffffff90" stroke-width="2"');
  if(tier>0)for(let x=24;x<W-10;x+=35)g+=`<path d="M${x} 20l12 30-12 30-12-30z" fill="#ffffff35"/>`;
  if(tier>1)g+=L(10,16,W-10,16,light,3)+L(10,84,W-10,84,light,3);
 }else if(p.id==='bench'||p.id==='sofa'){
  g=box()+R(10,18,W-20,64,tone,10)+R(14,22,W-28,48,'#ffffff22',7);
  if(p.id==='sofa')g+=L(mid,25,mid,77,'#ffffff77',3);
  if(tier>0)g+=R(18,28,22,20,light,5)+R(W-40,28,22,20,light,5);
  if(tier>1)g+=R(mid-16,53,32,15,'#bd7560',4)+C(mid,35,6,'#e8a3bd');
 }else if(p.id==='open-shelf'||p.id==='supply-cabinet'){
  g=box()+R(9,11,W-18,78,p.id==='open-shelf'?'#f5ecda':tone,3)+L(mid,12,mid,88,ink,3);
  if(p.id==='open-shelf')g+=L(10,50,W-10,50,ink,3)+R(20,18,18,23,tone,2)+R(mid+12,58,23,20,'#d6a344',2);
  else g+=C(mid-8,50,3,light)+C(mid+8,50,3,light);
  if(tier>0)g+=R(19,17,25,10,light,2)+R(W-44,17,25,10,light,2);
  if(tier>1)g+=L(13,8,W-13,8,'#f4d986',6)+R(mid-12,59,24,18,'#e8a3bd',2);
 }else if(p.id==='trainer-case'){
  g=R(4,17,W-8,77,ink,8)+R(11,24,W-22,63,wood,4)+L(mid-18,17,mid-18,7,ink,5)+L(mid-18,7,mid+18,7,ink,5)+L(mid+18,7,mid+18,17,ink,5)+R(20,32,22,40,tone,3)+R(W-55,33,30,23,light,2);
  if(tier>0)g+=R(48,31,10,38,'#d6a344',2)+R(62,31,10,38,'#bd7560',2)+R(76,31,10,38,'#8caa8b',2);
  if(tier>1)g+=C(W-33,72,9,'#d6a344')+R(mid-10,70,22,10,'#8ebee3',2);
 }else if(p.id==='standing'||p.id==='tea-table'){
  g=box()+R(10,13,W-20,74,tier===2?tone:'#dce8db',4);
  if(p.id==='tea-table')g+=C(mid-25,40,13,'#6f5038')+C(mid+25,50,13,'#6f5038');
  if(tier>0)g+=C(12,88,5,ink)+C(W-12,88,5,ink);
  if(tier>1)g+=p.id==='tea-table'?R(mid-18,65,36,13,light,3)+C(mid,72,4,'#bd7560'):L(12,15,W-12,15,light,5);
 }else if(p.id==='cart'||p.id==='coffee'){
  g=box(p.id==='coffee'?wood:ink)+R(10,13,W-20,74,p.id==='coffee'?'#f0e7d9':wood,4);
  if(p.id==='cart')g+=C(14,92,7,ink)+C(W-14,92,7,ink)+L(12,52,W-12,52,ink,3);
  else g+=R(18,23,38,47,ink,5)+C(37,45,10,tone)+C(W-30,63,12,tone);
  if(tier>0)g+=R(mid-12,20,24,17,'#e7c876',2)+C(W-22,30,8,light);
  if(tier>1)g+=R(20,61,16,15,'#8ebee3',2)+R(W-42,65,18,13,'#bd7560',2);
 }else if(p.id==='coat-wall'){
  g=box()+[.2,.4,.6,.8].map(f=>C(W*f,32,5,ink)+L(W*f,37,W*f,70,tone,6)).join('');
  if(tier>0)g+=R(W*.2-8,42,16,32,'#355b78',4)+R(W*.6-8,42,16,27,'#bd7560',4);
  if(tier>1)g+=R(W*.8-7,56,18,20,'#d6a344',3);
 }else{
  g=box(ink)+R(8,10,W-16,60,light,2)+L(12,76,W-12,76,ink,4);
  if(p.id==='projector-screen')g+=R(mid-18,80,36,14,tone,3)+C(mid+10,87,3,light);else g+=L(W/3,10,W/3,70,wood,3)+L(W*2/3,10,W*2/3,70,wood,3);
  if(tier>0)g+=L(18,50,mid,27,tone,4)+L(mid,27,W-20,50,tone,4);
  if(tier>1)g+=R(18,17,20,14,'#f0cd50',2)+R(W-38,48,20,14,'#a4d8c2',2);
 }
 return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${g}</svg>`;
}
let g='';switch(p.art){
case'chair':g=R(13,14,74,70,wood,12)+R(19,25,62,48,tier?tone:'#f0e3cd',10)+R(15,8,70,tier?23:15,tone,8)+L(18,85,18,93)+L(82,85,82,93);if(tier===2)g+=L(25,52,75,52,'#ffffff70',2);break;
case'armchair':g=R(8,8,84,85,wood,20)+R(18,15,64,69,tone,15)+R(2,18,16,65,tier===2?'#294858':tone,8)+R(82,18,16,65,tier===2?'#294858':tone,8)+R(24,35,52,44,'#ffffff28',10);break;
case'cushion':case'beanbag':g=`<ellipse cx="50" cy="52" rx="${p.art==='cushion'?43:46}" ry="${p.art==='cushion'?37:43}" fill="${tone}" stroke="${wood}" stroke-width="${tier+2}"/>`+L(30,28,70,74,'#ffffff55',2);if(tier)g+=C(50,51,4,wood);break;
case'bench':g=R(3,10,94,80,wood,8)+R(7,23,86,50,tone,5)+L(10,88,10,98)+L(90,88,90,98);if(tier===2)g+=R(2,2,96,16,tone);break;
case'stool':g=L(50,50,12,92)+L(50,50,88,92)+L(50,50,50,5)+C(50,50,33,tier?tone:wood)+C(50,50,23,'#ffffff25');break;
case'roundtable':case'side':g=C(50,50,46,wood,'stroke="#725842" stroke-width="3"')+C(50,50,38,tier===2?tone:tone+'55');if(tier)g+=C(50,50,5,ink);break;
case'table':case'standing':g=R(2,4,96,92,wood,5,'stroke="#725842" stroke-width="3"')+R(8,11,84,77,tier===2?tone:tone+'55',3);if(tier)g+=C(9,92,4,ink)+C(91,92,4,ink);break;
case'flipchart':g=L(22,70,10,98)+L(78,70,90,98)+R(9,2,82,82,tier?ink:wood)+R(15,8,70,65,white,2)+L(25,25,75,25,tone,5)+L(25,40,61,40,tone,4)+L(25,55,70,55,tone,3);if(tier===2)g+=R(75,10,20,65,'#d8e7e7',2);break;
case'whiteboard':g=R(3,4,94,75,tier?ink:wood)+R(8,9,84,64,white,2)+L(20,30,70,30,tone)+L(20,49,55,49,tone)+L(15,80,8,97)+L(85,80,92,97);if(tier===2)g+=C(79,24,6,'#d6a344');break;
case'pinboard':g=R(2,2,96,96,wood,4)+R(7,8,86,84,'#b99165',2);for(let i=0;i<3+tier;i++)g+=R(13+(i%3)*26,18+Math.floor(i/3)*37,20,28,[tone,'#eed37e','#b1cebe'][i%3],1)+C(22+(i%3)*26,20+Math.floor(i/3)*37,2,ink);break;
case'cart':g=R(7,5,86,80,ink,8)+R(14,11,72,65,wood,4)+L(10,50,90,50,ink);if(tier)g+=R(22,17,18,22,tone)+R(48,22,25,15,'#eed37e');g+=C(16,91,7,ink)+C(84,91,7,ink);break;
case'timer':g=tier===2?R(3,8,94,84,ink,10)+`<text x="50" y="62" text-anchor="middle" font-size="29" fill="${tone}">12:00</text>`:C(50,50,43,light,`stroke="${tone}" stroke-width="7"`)+L(50,50,50,20,ink)+L(50,50,73,62,ink);break;
case'markers':g=R(1,3,98,94,wood,8);for(let i=0;i<3+tier*2;i++)g+=R(8+i*(80/(3+tier*2)),12,8,76,[tone,'#d6a344','#bd7560','#355b78','#8caa8b','#b78e9f','#444'][i],2);break;
case'coffee':g=R(2,2,96,96,wood,5)+R(7,10,86,80,'#f0e7d9',2)+R(15,15,tier?45:25,53,tier?ink:tone,6)+C(tier?39:28,37,10,tone)+R(61,55,25,24,tone);if(tier===2)g+=C(73,24,11,wood)+C(22,79,8,white);break;
case'water':g=R(12,4,76,90,tier===2?ink:white,10)+R(23,11,54,38,'#91cedd',10)+C(50,29,15,'#d5f1ef')+R(28,60,44,20,tone,3);break;
case'ac':g=R(2,4,96,92,white,12,'stroke="#89a5ad" stroke-width="3"')+L(12,60,88,60,ink,3)+L(12,75,88,75,ink,3);if(tier)g+=C(82,25,5,tone);if(tier===2)g+=L(18,25,52,25,tone);break;
case'coat':g=C(50,50,30,wood)+L(50,50,50,7,ink,5)+L(50,50,13,76,ink,5)+L(50,50,87,76,ink,5);if(tier)g+=R(20,30,20,38,tone,5);break;
case'acoustic':g=R(1,2,98,96,tier===2?wood:tone,4);for(let i=1;i<7;i++)g+=L(i*14,8,i*14,92,tier===2?ink:'#ffffff35',tier===2?6:2);break;
case'plant':g=C(50,50,25,tone);for(let i=0;i<5+tier*2;i++){const a=i*2.399,x=50+Math.cos(a)*26,y=50+Math.sin(a)*28;g+=`<ellipse cx="${x}" cy="${y}" rx="13" ry="23" fill="${i%2?'#4b7c62':'#78a481'}" transform="rotate(${i*137} ${x} ${y})"/>`;}g+=C(50,50,10,'#90b28a');break;
case'rug':g=R(1,2,98,96,tone,4,'stroke="#ffffff70" stroke-width="3"')+R(8,10,84,80,'none',2,'stroke="#ffffff65" stroke-width="2"');if(tier)for(let i=0;i<4;i++)g+=`<path d="M${15+i*22} 17l12 33-12 33-12-33z" fill="#ffffff22"/>`;if(tier===2)for(let y=18;y<90;y+=8)g+=L(7,y,93,y,'#ffffff35',1);break;
case'lamp':g=C(50,50,43,tier===2?'#f7d98c55':'#fff1bc55')+C(50,50,28,tone)+C(50,50,15,'#fff2c1');break;
case'curtain':g=R(1,3,98,94,tone,1);for(let i=1;i<7;i++)g+=L(i*14,9,i*14,92,'#ffffff45',5);if(tier===2)g+=R(2,2,96,15,wood,1);break;
case'picture':g=R(2,1,96,98,tier?wood:ink,2)+R(9,10,82,79,'#e4eee7',1)+`<path d="M10 76l24-40 16 20 20-29 20 49z" fill="${tone}"/>`+C(68,26,9,'#d6a344');break;
case'bookshelf':g=R(1,4,98,92,wood,2);for(let row=0;row<2+tier;row++){const y=12+row*22;g+=L(5,y+18,95,y+18,ink,2);for(let i=0;i<7;i++)g+=R(9+i*12,y,8,16,[tone,'#eed37e','#8caa8b','#355b78'][i%4],1);}break;
case'window':case'terrace':{const sky={water:'#a5d4e0',garden:'#b7d9b0',forest:'#a9c8b4',city:'#b7c8d9'}[settings.view]||'#a5d4e0';g=R(1,1,98,98,wood,2)+R(6,7,88,85,sky,1)+R(7,57,86,33,settings.view==='water'?'#69a6be':'#86ad87',1);if(settings.view==='city')for(let i=0;i<5;i++)g+=R(10+i*17,15+(i%2)*13,13,54,'#698491',1);if(settings.view==='forest')for(let i=0;i<4;i++)g+=`<path d="M${15+i*22} 17l15 58h-30z" fill="#417760"/>`;g+=L(50,5,50,95,wood,4);if(tier<2)g+=L(5,48,95,48,wood,4);if(p.art==='terrace')g+=R(15,80,70,12,tone,1);break;}
case'fireplace':g=R(1,1,98,98,tier===2?wood:'#8b9697',4)+R(14,12,72,72,ink,3)+`<path d="M30 77q-9-24 10-32-4 16 9 12 15-21 6-30 40 33 16 50z" fill="#e89b46"/>`+`<path d="M45 76q-6-14 7-25 21 12 10 25z" fill="#ffe1a0"/>`;break;
case'sign':g=R(2,2,96,96,tier===2?ink:wood,4)+R(8,10,84,80,tier===2?tone:light,2)+`<text x="50" y="42" text-anchor="middle" font-size="11" fill="${tier===2?white:ink}">${esc((settings.motto||'EXPLORER').slice(0,23))}</text><text x="50" y="65" text-anchor="middle" font-size="11" fill="${tier===2?white:ink}">${esc((settings.motto||'').slice(23,46))}</text>`;break;
case'mug':g=C(48,50,33,tone)+`<ellipse cx="48" cy="50" rx="24" ry="26" fill="#6f5038"/>`+R(75,31,20,37,'none',8,`stroke="${tone}" stroke-width="8"`);if(tier)g+=C(48,50,7,light);break;
case'ship':g=`<path d="M4 28h68l25 22-25 22H4z" fill="${tone}" stroke="${ink}" stroke-width="3"/>`+R(20,35,40,30,white,2)+R(26,39,27,21,wood,1);if(tier)g+=L(12,21,76,21,wood,4);if(tier===2)g+=R(0,82,100,12,wood,2);break;
case'guitar':g=`<ellipse cx="48" cy="66" rx="33" ry="29" fill="${wood}" stroke="${tone}" stroke-width="4"/>`+R(43,1,11,53,tier===2?ink:wood,2)+C(48,62,10,ink)+L(48,8,48,86,light,2);break;
case'chess':g=R(1,1,98,98,wood,1);for(let y=0;y<6;y++)for(let x=0;x<6;x++)if((x+y)%2===0)g+=R(6+x*15,6+y*15,15,15,tone,0);for(let i=0;i<4;i++)g+=C(15+i*22,22,6,tier===2?'#e3bf6d':white)+C(15+i*22,78,6,ink);break;
case'ball':g=C(50,50,42,tone,`stroke="${tier===2?wood:ink}" stroke-width="${tier===2?8:3}"`)+`<path d="M50 23l24 17-9 28H35l-9-28z" fill="${tier?light:ink}"/>`+L(50,23,50,9,ink,2)+L(65,68,80,83,ink,2)+L(35,68,20,83,ink,2);break;
case'bear':g=C(25,23,16,tone)+C(75,23,16,tone)+C(50,54,40,tone)+C(50,63,21,light)+C(35,47,4,ink)+C(65,47,4,ink)+C(50,60,5,ink)+L(45,73,55,73,ink,2);if(tier)g+=R(18,80,64,10,'#d6a344',4);break;
case'fox':g=`<path d="M10 9l31 21h18L90 9l-4 53-36 34L14 62z" fill="${tone}"/>`+`<path d="M15 52l35 20 35-20-35 39z" fill="${light}"/>`+C(34,48,4,ink)+C(66,48,4,ink)+C(50,74,5,ink);if(tier)g+=L(20,17,30,33,light,5)+L(80,17,70,33,light,5);break;
case'octopus':for(let i=0;i<5;i++)g+=C(14+i*18,78+(i%2)*8,13,tone);g+=C(50,42,36,tone)+C(37,43,4,ink)+C(63,43,4,ink)+`<path d="M38 58q12 ${tier?16:9} 24 0" stroke="${ink}" stroke-width="3" fill="none"/>`;break;
case'flowers':case'vase':g=C(50,52,25,tone)+C(50,52,17,wood);for(let i=0;i<3+tier*2;i++){const a=i*2.399,x=50+Math.cos(a)*25,y=48+Math.sin(a)*29;g+=L(50,60,x,y,'#4b7c62',4);for(let petal=0;petal<5;petal++){const angle=petal*Math.PI*2/5;g+=C(x+Math.cos(angle)*6,y+Math.sin(angle)*6,6,i%2?tone:'#e8a3bd');}g+=C(x,y,4,'#f0cd50');}break;
case'tree':g=C(50,50,29,tone)+C(50,50,21,wood);for(let i=0;i<9+tier*4;i++){const a=i*2.399,r=18+(i%3)*9;g+=C(50+Math.cos(a)*r,50+Math.sin(a)*r,14+(i%2)*3,i%2?'#4b7c62':'#8aac79');}g+=C(50,50,12,'#b2c691');break;
case'palm':g=C(50,50,23,tone)+C(50,50,13,wood);for(let i=0;i<7+tier*2;i++){const a=i*Math.PI*2/(7+tier*2),x=50+Math.cos(a)*43,y=50+Math.sin(a)*43;g+=`<path d="M50 50Q${x+14} ${y-13} ${x} ${y}Q${x-14} ${y+13} 50 50" fill="${i%2?'#4c866b':'#82ad80'}"/>`;}break;
case'hanging':g=R(20,10,60,38,tone,10)+L(22,10,50,1,wood,3)+L(78,10,50,1,wood,3);for(let i=0;i<3+tier;i++){const x=27+i*12;g+=`<path d="M${x} 35q-13 25 4 57" stroke="#4b7c62" stroke-width="5" fill="none"/>`+C(x-4,55,9,'#8aac79')+C(x+3,79,8,'#5d9275');}break;
case'wallboard':g=R(1,1,98,98,tier?ink:tone,4)+R(6,7,88,81,white,2)+L(16,28,72,28,tone)+L(16,46,56,46,tone)+L(16,65,77,65,tone)+R(8,90,84,7,wood,1);if(tier===2)g+=R(74,12,15,20,'#f0cd50',1);break;
case'clock':g=C(50,50,46,tone)+C(50,50,38,white)+L(50,50,50,22,ink,4)+L(50,50,71,62,ink,4);for(let i=0;i<12;i++){const a=i*Math.PI/6;g+=C(50+Math.sin(a)*31,50+Math.cos(a)*31,tier?2:1.5,ink);}break;
case'sculpture':g=C(50,60,35,wood)+R(22,76,56,15,ink,3)+`<path d="M27 68Q10 5 51 11Q92 16 68 66Q36 95 33 42" stroke="${tone}" stroke-width="${10+tier*2}" fill="none"/>`;break;
default:g=R(5,5,90,90,tone);}
const icons={
 'open-shelf':()=>R(4,4,92,92,wood,3)+R(10,10,80,80,'#f5ecda',2)+L(10,36,90,36,ink,3)+L(10,64,90,64,ink,3)+R(16,15,18,15,tone,2)+R(41,41,22,16,'#d6a344',2),
 'supply-cabinet':()=>R(3,4,94,92,wood,3)+R(8,9,39,82,tone,2)+R(53,9,39,82,tone,2)+C(42,50,3,light)+C(58,50,3,light),
 'screen-divider':()=>R(4,10,92,70,wood,5)+R(9,15,82,60,light,2)+L(35,15,35,75,tone,3)+L(65,15,65,75,tone,3)+C(16,88,7,ink)+C(84,88,7,ink),
 'sofa':()=>R(3,14,94,72,wood,14)+R(8,20,84,58,tone,10)+R(13,25,35,45,'#ffffff33',5)+R(52,25,35,45,'#ffffff33',5),
 'pouf':()=>C(50,50,43,tone)+C(50,50,33,'#ffffff25')+L(22,22,78,78,light,2),
 'hanging-chair':()=>C(50,50,45,wood)+C(50,50,36,tone)+C(50,50,27,light)+L(50,4,50,18,ink,3),
 'tea-table':()=>R(4,6,92,88,wood,6)+R(10,12,80,76,light,4)+C(30,35,13,tone)+C(60,52,14,'#8caa8b')+R(65,19,14,20,ink,3),
 'coat-wall':()=>R(4,18,92,64,wood,3)+[18,36,54,72].map(x=>C(x,36,5,ink)+L(x,41,x,64,tone,6)).join(''),
 'projector-screen':()=>R(3,7,94,57,ink,2)+R(8,12,84,47,white,1)+L(25,76,75,76,ink,3)+R(34,78,32,16,tone,3)+C(59,86,4,light),
 'picture-cards':()=>R(12,14,68,68,wood,2)+R(19,7,68,68,light,2)+`<path d="M23 63l18-27 12 14 15-24 13 37z" fill="${tone}"/>`+C(66,24,6,'#d6a344'),
 'emotion-cards':()=>R(10,12,80,76,wood,6)+C(50,50,30,'#f0cd50')+C(39,43,3,ink)+C(61,43,3,ink)+`<path d="M37 60q13 13 26 0" stroke="${ink}" stroke-width="4" fill="none"/>`,
 'conversation-cards':()=>R(10,12,80,76,tone,6)+R(18,20,64,50,light,6)+`<path d="M33 68l-5 13 20-13" fill="${light}"/>`+L(28,36,70,36,ink,3)+L(28,49,58,49,ink,3),
 'building-blocks':()=>R(4,4,92,92,wood,5)+R(13,15,32,32,tone,3)+R(52,15,32,32,'#d6a344',3)+R(13,54,32,30,'#8caa8b',3)+R(52,54,32,30,'#bd7560',3),
 'colored-tokens':()=>R(7,8,86,84,light,7)+C(30,30,13,tone)+C(68,30,13,'#d6a344')+C(30,68,13,'#bd7560')+C(68,68,13,'#8caa8b'),
 'dice-set':()=>R(10,12,52,52,white,7,`stroke="${ink}" stroke-width="3"`)+C(24,26,4,ink)+C(48,50,4,ink)+R(43,40,45,45,tone,6)+C(56,53,4,white)+C(75,72,4,white)+C(65,63,4,white),
 'talking-stick':()=>R(8,37,84,26,wood,12)+R(15,39,15,22,tone,5)+R(38,39,8,22,ink,3)+R(54,39,8,22,light,3),
 'talking-ball':()=>C(50,50,42,tone)+C(50,50,29,light)+`<path d="M31 48q19-20 38 0-19 20-38 0" fill="${tone}"/>`+C(50,48,5,ink),
 'sticky-notes':()=>R(10,10,75,75,'#f0cd50',2)+R(19,18,68,68,'#e8a3bd',2)+R(26,26,60,60,'#a4d8c2',2)+L(35,43,70,43,ink,2),
 'trainer-case':()=>R(5,20,90,68,ink,7)+R(11,26,78,56,wood,3)+L(34,20,34,11,ink,5)+L(34,11,66,11,ink,5)+L(66,11,66,20,ink,5)+R(18,32,20,33,tone,2)+R(47,35,28,25,light,2),
 'own-book':()=>R(15,8,70,84,tone,4)+R(23,12,5,76,wood,1)+L(34,31,73,31,light,4)+L(34,44,68,44,light,3),
 'certificate':()=>R(9,7,82,86,wood,3)+R(15,13,70,74,light,1)+L(26,33,74,33,ink,3)+L(26,45,68,45,ink,2)+C(67,69,9,tone),
 'trophy':()=>R(32,82,36,10,wood,2)+L(50,55,50,82,ink,5)+`<path d="M21 14h58v20q-4 27-29 29T21 34z" fill="#d6a344" stroke="${ink}" stroke-width="3"/>`+L(21,22,10,22,ink,4)+L(79,22,90,22,ink,4),
 'photo-frame':()=>R(5,7,90,86,wood,3)+R(12,14,76,72,'#c3e0e2',2)+C(50,37,13,tone)+`<path d="M22 82q3-29 28-29t28 29z" fill="${tone}"/>`,
 'compass-globe':()=>C(50,45,37,'#9dd0d4',`stroke="${ink}" stroke-width="3"`)+`<path d="M33 19l18 3 7 13-13 6-4 18-15-9-7-15zM62 43l17 8-7 15-14-3z" fill="#6fa37d"/>`+L(50,82,50,94,ink,5)+L(30,94,70,94,ink,5)
 };if(icons[p.id])g=icons[p.id]();
 if(p.id==='compass-globe'&&tier===0)g=C(50,50,43,wood,`stroke="${ink}" stroke-width="3"`)+C(50,50,34,light)+`<path d="M50 18l10 24-10 39-10-39z" fill="${tone}"/>`+C(50,50,4,ink);

// A fejlesztési szintek jól látható, tárgyspecifikus részletei.
const details={
 'stool':[()=>C(50,50,20,'#ffffff22'),()=>C(50,50,24,'none','stroke="#f7f4e9" stroke-width="5"')+C(50,50,6,'#d6a344')],
 'timer':[()=>`<path d="M50 12A38 38 0 0 1 87 50H50Z" fill="#e8a3bd88"/>`,()=>C(82,18,7,'#d6a344')],
 'acoustic':[()=>L(10,20,90,80,'#ffffff77',5)+L(10,48,60,90,'#ffffff77',4),()=>L(8,12,92,12,'#f4d986',4)],
 'lamp':[()=>C(50,50,36,'none','stroke="#f7dc95" stroke-width="6"'),()=>L(18,18,10,10,'#d6a344',4)+L(82,18,90,10,'#d6a344',4)+L(50,5,50,14,'#d6a344',4)],
 'curtain':[()=>L(14,16,86,16,light,5)+L(14,84,86,84,light,5),()=>L(10,49,90,49,'#d6a344',5)],
 'mug':[()=>C(48,50,8,light),()=>C(48,50,20,'none','stroke="#f7f4e9" stroke-width="4"')+C(48,50,7,'#e8a3bd')],
 'plush-bear':[()=>R(20,78,60,12,'#d6a344',5)+R(56,80,12,17,'#d6a344',4),()=>C(25,23,7,light)+C(75,23,7,light)+C(50,65,4,'#bd7560')],
 'plush-fox':[()=>L(20,17,30,33,light,5)+L(80,17,70,33,light,5),()=>C(25,24,8,'#f7d98c')+C(75,24,8,'#f7d98c')],
 'plush-octopus':[()=>C(20,75,6,'#ffffff80')+C(80,75,6,'#ffffff80'),()=>C(37,43,7,light)+C(63,43,7,light)+C(37,43,3,ink)+C(63,43,3,ink)],
 'wall-clock':[()=>C(50,50,34,'none','stroke="#d6a344" stroke-width="4"'),()=>C(50,50,5,'#d6a344')+R(44,6,12,7,wood,2)],
 'open-shelf':[()=>R(12,11,76,18,tone,2),()=>L(13,8,87,8,'#f4d986',6)+C(17,9,4,'#fff4bc')+C(82,9,4,'#fff4bc')],
 'supply-cabinet':[()=>R(17,19,22,10,light,1)+R(61,19,22,10,light,1),()=>R(17,46,22,30,'#d6a344',2)+R(61,46,22,30,'#9fbca6',2)],
 'screen-divider':[()=>L(14,29,86,67,tone,4)+L(14,48,64,75,tone,4),()=>R(17,20,23,20,'#f0cd50',2)+R(54,42,24,19,'#a4d8c2',2)],
 'sofa':[()=>R(15,25,22,21,light,6)+R(63,25,22,21,light,6)+R(37,60,28,12,'#bd7560',3),()=>R(18,50,20,18,'#e8a3bd',5)+R(61,50,20,18,'#d6a344',5)+C(50,35,5,light)],
 'pouf':[()=>L(26,36,74,36,light,2)+L(26,54,74,54,light,2)+L(35,24,35,76,light,2)+L(65,24,65,76,light,2),()=>C(20,84,5,wood)+C(80,84,5,wood)+C(35,35,3,'#d6a344')+C(65,65,3,'#d6a344')],
 'hanging-chair':[()=>C(40,51,12,light)+C(60,51,12,light),()=>C(14,18,9,'#78a481')+C(86,18,9,'#4b7c62')+C(20,35,7,'#8caa8b')],
 'tea-table':[()=>C(25,29,9,'#6f5038')+C(65,51,9,'#6f5038')+R(65,17,13,18,tone,4),()=>R(32,67,34,14,light,3)+C(40,74,4,'#bd7560')+C(52,74,4,'#d6a344')],
 'coat-wall':[()=>R(22,39,14,29,'#355b78',4)+R(56,40,14,25,'#bd7560',4),()=>R(73,49,16,22,'#d6a344',3)+L(75,49,80,42,ink,2)+L(80,42,86,49,ink,2)],
 'projector-screen':[()=>L(19,48,34,30,tone,3)+L(34,30,48,39,tone,3)+L(48,39,70,20,tone,3),()=>R(15,17,15,10,'#f0cd50',1)+R(65,42,15,10,'#a4d8c2',1)+C(54,29,4,'#bd7560')],
 'picture-cards':[()=>R(8,65,25,23,'#d6a344',2)+R(68,65,23,23,'#a4d8c2',2),()=>R(12,67,20,6,ink,1)+R(69,67,20,6,ink,1)],
 'emotion-cards':[()=>C(20,75,11,'#bd7560')+C(80,75,11,'#8caa8b'),()=>C(20,25,10,'#8ebee3')+C(80,25,10,'#e8a3bd')],
 'conversation-cards':[()=>R(8,72,25,15,'#d6a344',3)+R(66,72,25,15,'#8caa8b',3),()=>R(7,8,86,6,wood,2)+C(18,11,2,light)+C(82,11,2,light)],
 'building-blocks':[()=>C(28,30,5,light)+C(68,30,5,light)+C(28,68,5,light),()=>R(37,35,26,42,tone,2)+R(31,28,38,8,'#d6a344',2)],
 'colored-tokens':[()=>C(48,19,8,'#e8a3bd')+C(50,79,8,'#8ebee3'),()=>C(50,50,10,'#d6a344')+L(30,30,70,70,ink,1)+L(70,30,30,70,ink,1)],
 'dice-set':[()=>C(50,80,4,'#d6a344')+C(84,46,4,'#bd7560'),()=>R(62,70,28,20,wood,8)+L(65,76,87,76,ink,2)],
 'talking-stick':[()=>L(37,60,24,88,'#bd7560',5)+L(55,60,70,88,'#8ebee3',5),()=>L(20,47,80,47,light,2)+C(48,50,4,'#d6a344')],
 'talking-ball':[()=>C(28,30,8,'#d6a344')+C(74,67,8,'#bd7560'),()=>C(39,43,4,ink)+C(61,43,4,ink)+`<path d="M37 61q13 11 26 0" fill="none" stroke="${ink}" stroke-width="4"/>`],
 'sticky-notes':[()=>R(7,67,23,23,'#e8a3bd',1)+R(70,8,22,22,'#8ebee3',1),()=>R(4,4,92,6,wood,1)+R(5,91,90,5,wood,1)],
 'trainer-case':[()=>R(14,34,12,31,'#d6a344',2)+R(32,34,12,31,tone,2)+R(56,34,23,18,light,2),()=>C(70,69,8,'#bd7560')+R(49,58,12,20,'#8caa8b',2)],
 'own-book':[()=>R(12,8,6,84,wood,1)+L(34,60,75,60,light,2),()=>R(13,7,74,5,'#d6a344',1)+R(13,88,74,5,'#d6a344',1)+L(36,72,68,67,light,2)],
 'certificate':[()=>R(12,10,76,80,'none',2,'stroke="#f5e9c6" stroke-width="5"'),()=>C(69,68,11,'#d6a344')+C(69,68,6,'#bd7560')],
 'trophy':[()=>R(33,80,34,12,wood,1)+R(39,83,22,5,light,1),()=>R(26,89,48,7,ink,2)+C(50,33,7,light)],
 'photo-frame':[()=>R(8,9,84,82,'none',2,`stroke="${tone}" stroke-width="5"`),()=>C(18,77,5,'#e8a3bd')+C(80,20,5,'#d6a344')+C(78,78,4,'#8caa8b')],
 'compass-globe':[()=>L(50,80,50,94,wood,6)+L(27,94,73,94,wood,6),()=>C(15,78,11,'#d6a344')+L(15,70,15,86,ink,2)+L(7,78,23,78,ink,2)],
 'chair':[()=>R(25,31,50,38,tone,8),()=>R(19,10,62,17,wood,6)+L(28,59,72,59,light,2)],
 'beanbag':[()=>C(50,52,27,'#ffffff20'),()=>L(25,30,75,70,light,3)+L(25,70,75,30,light,3)],
 'table':[()=>C(50,50,28,'#d6b58b'),()=>C(50,50,30,'none',`stroke="${light}" stroke-width="3"`)+C(50,50,6,tone)],
 'modular':[()=>C(12,90,6,ink)+C(88,90,6,ink),()=>R(14,17,24,16,light,2)+R(62,17,22,16,'#d6a344',2)],
 'standing':[()=>R(44,38,12,25,ink,2),()=>L(9,14,91,14,ink,5)+L(9,86,91,86,ink,5)],
 'side':[()=>L(18,72,82,72,ink,5),()=>R(18,27,24,30,tone,2)+C(70,37,13,'#f7d98c')],
 'markers':[()=>R(15,13,8,70,'#bd7560',2)+R(28,13,8,70,'#d6a344',2)+R(41,13,8,70,'#8caa8b',2),()=>R(5,7,90,6,ink,2)+R(5,87,90,6,ink,2)],
 'water':[()=>C(50,30,15,'#d5f1ef')+L(31,48,69,48,'#8ebee3',3),()=>R(17,72,15,16,light,2)+R(68,72,15,16,light,2)],
 'ac':[()=>C(80,25,5,'#8caa8b'),()=>R(15,16,43,18,ink,3)+L(21,25,50,25,'#a4d8c2',3)],
 'rug-large':[()=>L(20,20,80,80,light,3)+L(80,20,20,80,light,3),()=>L(5,6,5,94,wood,3)+L(95,6,95,94,wood,3)+L(10,8,10,92,light,2)],
 'fireplace':[()=>R(6,6,88,88,'none',2,`stroke="${wood}" stroke-width="8"`),()=>L(12,88,35,88,wood,6)+L(65,88,88,88,wood,6)+C(50,55,8,'#ffe8a5')]
};
if(tier>0&&details[p.id])g+=details[p.id][0]();
if(tier>1&&details[p.id])g+=details[p.id][1]();
return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${g}</svg>`;}
export function roomSVG(s,{selected=null,camera={x:0,y:0,w:960,h:720},ghost=null,pixelWidth=640}={}){const settings=s.roomSettings,theme=themes[settings.theme],wall=walls[settings.wall].value,floor=floors[settings.floor].value;const scale=pixelWidth/camera.w;let items=s.items.filter(i=>visible(s,i)&&product(i.product)).sort((a,b)=>({floor:0,furniture:1,wall:2,tabletop:3}[product(a.product).layer]-{floor:0,furniture:1,wall:2,tabletop:3}[product(b.product).layer]));
 const draw=(item,isGhost=false)=>{const p=product(item.product),pos=isGhost?{x:ghost.x,y:ghost.y}:position(s,item),tone=toneColor(item.tone,theme.accent),w=p.w*40,h=p.h*40,box=footprint(p),fw=box.w*40,fh=box.h*40,hitW=Math.max(fw,44/scale),hitH=Math.max(fh,44/scale);return `<g ${isGhost?'class="placement-ghost"':`data-room-item="${esc(item.id)}" tabindex="0" role="button" aria-label="${esc(p.name)}, ${esc(p.levels[item.tier])}"`} transform="translate(${pos.x*40} ${pos.y*40}) rotate(${item.rotation})" ${isGhost?'opacity=".65" pointer-events="none"':item.parentId?'pointer-events="none"':''}><title>${esc(p.name)} · ${esc(p.levels[item.tier])}</title>${!isGhost?R(-hitW/2,-hitH/2,hitW,hitH,'transparent',0,'class="item-hit"'):''}<svg x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" overflow="visible">${art(p,tone,item.tier,settings)}${item.product==='own-book'&&item.label?`<title>${esc(item.label)}</title>`:''}</svg>${selected===item.id&&!isGhost?R(-fw/2-6,-fh/2-6,fw+12,fh+12,'none',5,'stroke="#102e3e" stroke-width="4" stroke-dasharray="9 5" pointer-events="none"'):''}${isGhost?R(-fw/2-4,-fh/2-4,fw+8,fh+8,'none',4,`stroke="${ghost.ok?'#087f60':'#c0473c'}" stroke-width="5"`):''}</g>`;};
 return `<svg class="room-scene" id="room-scene" viewBox="${camera.x} ${camera.y} ${camera.w} ${camera.h}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="${esc(s.roomName)} – felülnézet"><defs><clipPath id="room-floor-clip"><rect x="14" y="65" width="932" height="641"/></clipPath><pattern id="floorboards" width="80" height="120" patternUnits="userSpaceOnUse"><rect width="80" height="120" fill="${floor}"/><path d="M0 0h80v120M0 60h40M40 120V0" fill="none" stroke="#102e3e" stroke-opacity=".09" stroke-width="2"/></pattern></defs><rect width="960" height="720" fill="${wall}"/><rect x="14" y="65" width="932" height="641" rx="2" fill="url(#floorboards)"/><path d="M14 65h932v641H14z" fill="none" stroke="#102e3e" stroke-opacity=".15" stroke-width="6"/><text x="30" y="690" fill="#102e3e" opacity=".35" font-family="system-ui" font-size="11" letter-spacing="2">${esc(s.roomName.toUpperCase().slice(0,60))}</text>${items.map(i=>product(i.product).layer==='floor'?'<g clip-path="url(#room-floor-clip)">'+draw(i)+'</g>':draw(i)).join('')}${ghost?(product(ghost.item.product).layer==='floor'?'<g clip-path="url(#room-floor-clip)">'+draw({...ghost.item,id:'preview'},true)+'</g>':draw({...ghost.item,id:'preview'},true)):''}</svg>`;
}

