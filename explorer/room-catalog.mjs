// All prices, variants and placement rules live here; existing product ids stay stable.
export const categories=[['seat','Ülőhelyek'],['surface','Asztalok'],['tools','Táblák és eszközök'],['plants','Növények és virágok'],['textiles','Szőnyegek és textilek'],['comfort','Terem és kényelem'],['personal','Dekoráció és saját tárgyak'],['play','Játékok és hangszerek']];
export const tones={theme:{name:'A terem színe',value:null},teal:{name:'Türkiz',value:'#32959a'},navy:{name:'Éjkék',value:'#355b78'},mustard:{name:'Mustár',value:'#d6a344'},terracotta:{name:'Terrakotta',value:'#bd7560'},sage:{name:'Zsálya',value:'#8caa8b'},cream:{name:'Krém',value:'#e7ddc7'},graphite:{name:'Grafit',value:'#555f68'},rose:{name:'Mályva',value:'#b78e9f'}};
Object.assign(tones,{white:{name:'Fehér',value:'#f5f5f0'},black:{name:'Fekete',value:'#24282d'},red:{name:'Piros',value:'#c94b4b'},coral:{name:'Korall',value:'#ed8878'},orange:{name:'Narancs',value:'#e79c43'},yellow:{name:'Napsárga',value:'#f0cd50'},lime:{name:'Lime',value:'#b1c85c'},emerald:{name:'Smaragd',value:'#31816a'},forest:{name:'Erdőzöld',value:'#345b43'},mint:{name:'Menta',value:'#a4d8c2'},cyan:{name:'Élénk türkiz',value:'#28b9c6'},sky:{name:'Égkék',value:'#8ebee3'},cobalt:{name:'Királykék',value:'#3d5bb5'},purple:{name:'Lila',value:'#8063a6'},lavender:{name:'Levendula',value:'#b6a5d3'},pink:{name:'Rózsaszín',value:'#e8a3bd'}});
export const validTone=t=>Object.hasOwn(tones,t)||typeof t==='string'&&/^#[0-9a-f]{6}$/i.test(t);
export const toneColor=(tone,fallback='#32959a')=>tones[tone]?.value||(/^#[0-9a-f]{6}$/i.test(tone)?tone:fallback);
export const themes={ice:{name:'Jégtörő',accent:'#32959a',wall:'#c4e0e3',floor:'oak'},workshop:{name:'Műhely',accent:'#d6a344',wall:'#cbd2d5',floor:'concrete'},living:{name:'Nappali',accent:'#bd7560',wall:'#e4d4bf',floor:'walnut'},minimal:{name:'Letisztult',accent:'#555f68',wall:'#e8e9e5',floor:'light'}};
export const walls={ice:{name:'Jégkék',value:'#c4e0e3'},sand:{name:'Homok',value:'#e4d4bf'},white:{name:'Törtfehér',value:'#e8e9e5'},sage:{name:'Zsálya',value:'#c6d3c1'},slate:{name:'Palaszürke',value:'#b8c4cb'}};
export const floors={oak:{name:'Világos tölgy',value:'#dbc5a2'},walnut:{name:'Dió',value:'#a98569'},light:{name:'Világos padló',value:'#ece8dd'},concrete:{name:'Beton',value:'#cdd2d1'}};
export const views={water:'Vízpart',garden:'Kert',forest:'Erdő',city:'Város'};
const data=[
['chair','Tréningszék','seat',15,12,1.4,1.4,'furniture','chair',['Vászonszék', 'Párnázott tréningszék', 'Támlás, kényelmes szék'],[20,35]],
['armchair','Karosszék','seat',45,4,2,2,'furniture','armchair',['Kényelmes','Puha kárpit','Lounge'],[35,60]],
['cushion','Ülőpárna','seat',15,8,1.4,1.4,'furniture','cushion',['Pamut','Vastag párna','Szövött huzat'],[15,25]],
['beanbag','Babzsák','seat',35,4,2,2,'furniture','beanbag',['Klasszikus babzsák', 'Nagy, süppedős babzsák', 'Mintás huzatos babzsák'],[25,45]],
['bench','Pad','seat',40,3,3.2,1.3,'furniture','bench',['Fa','Párnázott','Támlás'],[30,50]],
['stool','Gurulós tréneri szék','seat',30,2,1.4,1.4,'furniture','stool',['Gurulós','Párnázott','Ergonomikus'],[25,45]],
['table','Kerek asztal','surface',30,4,3.2,3.2,'furniture','roundtable',['Egyszerű kerek asztal', 'Faasztal', 'Betétes, díszes faasztal'],[30,50]],
['modular','Összetolható asztal','surface',40,6,3.5,2,'furniture','table',['Egyszerű asztal', 'Gurulós asztal', 'Rendszerezett workshopasztal'],[30,55]],
['standing','Állóasztal','surface',45,3,2.6,1.6,'furniture','standing',['Magas asztal', 'Állítható asztal', 'Fa- és fémvázas állóasztal'],[35,60]],
['side','Lerakóasztal','surface',20,4,1.8,1.8,'furniture','side',['Kis asztal', 'Polcos lerakó', 'Lerakó könyvvel és lámpával'],[20,35]],
['flipchart','Flipchart','tools',25,3,2,1.7,'furniture','flipchart',['Állványos','Gurulós','Kétoldalas mágneses'],[25,45]],
['whiteboard','Mobil írótábla','tools',45,3,3,1.4,'furniture','whiteboard',['Írható','Mágneses','Kétoldalas'],[30,55]],
['pinboard','Parafatábla','tools',35,2,3.4,1,'wall','pinboard',['Parafa','Kártyakészlettel','Teljes ötletfal'],[30,50]],
['cart','Eszközöskocsi','tools',35,2,2,1.6,'furniture','cart',['Kis kocsi','Kétpolcos','Felszerelt'],[25,45]],
['timer','Időmérő','tools',15,2,1,0.8,'tabletop','timer',['Analóg','Színes időjelző','Digitális'],[15,30]],
['markers','Filckészlet','tools',10,3,1,0.7,'tabletop','markers',['Három filc', 'Színes filckészlet', 'Rendezett tréneri filckészlet'],[15,25]],
['coffee','Kávésarok','comfort',70,1,3,2,'furniture','coffee',['Termosz és tálca','Kávépult','Kávéállomás'],[60,110]],
['water','Vízadagoló','comfort',35,1,1.5,1.7,'furniture','water',['Víztartály', 'Hűtött vízadagoló', 'Vízállomás poharakkal'],[30,50]],
['ac','Klíma','comfort',40,1,3,0.9,'wall','ac',['Faliklíma', 'Csendes klíma', 'Kijelzős, modern klíma'],[40,70]],
['coat','Kabátállvány','comfort',25,2,1.5,1.5,'furniture','coat',['Fa','Állítható','Öltözősarok'],[20,40]],
['acoustic','Akusztikai panel','comfort',40,3,2.8,1,'wall','acoustic',['Filc','Mintázott','Fa lamellás'],[35,60]],
['plant','Zöld sarok','plants',15,6,1.5,1.5,'furniture','plant',['Kis növény','Dús növény','Nagy dézsa'],[20,35]],
['rug','Puha szőnyeg','textiles',35,2,5,3.5,'floor','rug',['Sima','Mintás','Szövött'],[30,50]],
['rug-large','Nagy szőnyeg · 4 × 4 m','textiles',90,0,8,8,'floor','rug',['Puha szőnyeg', 'Geometrikus mintás', 'Szövött, rojtos szőnyeg'],[45,70]],
['lamp','Állólámpa','comfort',25,3,1.3,1.3,'furniture','lamp',['Olvasólámpa','Meleg fény','Hangulatfény'],[25,40]],
['curtain','Függöny','textiles',30,2,3,1,'wall','curtain',['Könnyű','Sötétítő','Réteges'],[25,45]],
['picture','Falikép','personal',20,3,2.4,1,'wall','picture',['Nyomat','Keretezett','Galériakép'],[20,40]],
['bookshelf','Könyvespolc','comfort',40,2,3,1.2,'furniture','bookshelf',['Kis polc','Könyvespolc','Szakmai könyvtár'],[40,70]],
['window','Panorámaablak','comfort',40,2,4,1,'wall','window',['Ablak','Nagy ablak','Panoráma'],[60,100]],
['terrace','Teraszajtó','comfort',180,1,4.5,1,'wall','terrace',['Kijárat','Franciaajtó','Panorámaterasz'],[90,160]],
['fireplace','Kandalló','comfort',120,1,3,1.5,'furniture','fireplace',['Egyszerű kandalló', 'Kőburkolatos kandalló', 'Kandalló fával és otthonos fénnyel'],[65,110]],
['sign','Saját trénertábla','personal',25,1,3,1,'wall','sign',['Felirat','Keretezett','Világító tábla'],[25,45]],
['mug','Saját bögre','personal',10,2,0.8,0.8,'tabletop','mug',['Kerámia','Saját jel','Kézműves'],[15,25]],
['ship','Jégtörő hajómodell','personal',30,1,1.5,0.8,'tabletop','ship',['Hajómodell','Részletes modell','Gyűjtői darab'],[30,50]],
['guitar','Hangszer','play',35,1,1.3,2,'furniture','guitar',['Akusztikus','Díszes','Mesterdarab'],[30,50]],
['chess','Sakk-készlet','play',25,1,1.4,1.4,'tabletop','chess',['Fa készlet','Faragott','Gyűjtői'],[25,40]],
['ball','Saját labda','play',15,2,1.2,1.2,'furniture','ball',['Labda','Klubszínek','Dísztalppal'],[20,35]],
['plush-bear','Dobálható plüssmackó','play',15,0,1.1,1.1,'furniture','bear',['Puha mackó','Sálas mackó','Nagy ölelés'],[15,25]],
['plush-fox','Dobálható plüssróka','play',15,0,1.1,1.1,'furniture','fox',['Puha róka','Bolyhos róka','Nagy fülek'],[15,25]],
['plush-octopus','Dobálható plüsspolip','play',15,0,1.2,1.2,'furniture','octopus',['Kis polip','Színes polip','Óriás mosoly'],[15,25]],
['flowers-pot','Cserepes virág','plants',15,0,1.2,1.2,'furniture','flowers',['Kis virág','Virágzó csokor','Dús virágkompozíció'],[20,30]],
['flowers-vase','Virágváza az asztalra','plants',15,0,.8,.8,'tabletop','vase',['Egy szál virág','Csokor','Díszváza'],[15,25]],
['tree-ficus','Szobafa','plants',40,0,2.4,2.4,'furniture','tree',['Kis fikusz','Lombos fa','Nagy szobafa'],[35,55]],
['tree-palm','Pálma','plants',45,0,2.8,2.8,'furniture','palm',['Kis pálma','Dús pálma','Trópusi sarok'],[35,60]],
['hanging-plant','Fali futónövény','plants',25,0,1.6,1,'wall','hanging',['Fali kaspó','Futónövény','Zöld falrészlet'],[20,40]],
['wall-whiteboard','Falra szerelt whiteboard','tools',40,0,4,1,'wall','wallboard',['Írótábla','Mágneses tábla','Nagy ötletfal'],[35,60]],
['wall-clock','Falióra','personal',20,0,1.2,1,'wall','clock',['Klasszikus','Letisztult','Díszes'],[20,35]],
['decor-sculpture','Dekorszobor','personal',25,0,1.2,1.2,'furniture','sculpture',['Absztrakt forma','Kompozíció','Galériadarab'],[25,40]],
['open-shelf', 'Nyitott tárolópolc', 'comfort', 65, 0, 4, 2, 'furniture', 'bookshelf', ['Egyszerű fapolc', 'Színes hátfalas polc', 'Megvilágított műhelypolc'], [15, 25]]
,
['supply-cabinet', 'Tréneri eszközszekrény', 'comfort', 75, 0, 4, 2, 'furniture', 'bookshelf', ['Kétajtós szekrény', 'Címkézett rekeszek', 'Rendszerezett trénerközpont'], [15, 25]]
,
['screen-divider', 'Gurulós paraván', 'comfort', 45, 0, 3, 1.3, 'furniture', 'whiteboard', ['Egyszínű térelválasztó', 'Mintás vászonparaván', 'Kétoldalas ötletfal'], [15, 25]]
,
['sofa', 'Kanapé', 'seat', 85, 0, 3.2, 2, 'furniture', 'bench', ['Kétszemélyes kanapé', 'Párnákkal és pléddel', 'Beszélgetősarok díszpárnákkal'], [15, 25]]
,
['pouf', 'Puff', 'seat', 25, 0, 1.5, 1.5, 'furniture', 'cushion', ['Kerek puff', 'Steppelt puff', 'Mintás, lábas puff'], [15, 25]]
,
['hanging-chair', 'Függőfotel', 'seat', 70, 0, 2, 2, 'furniture', 'armchair', ['Vászonfüggőfotel', 'Párnás fészekfotel', 'Lombos, párnás pihenőfészek'], [15, 25]]
,
['tea-table', 'Teázóasztal', 'surface', 45, 0, 3, 2, 'furniture', 'table', ['Kis teásasztal', 'Teáskanna és csészék', 'Délutáni teasarok süteménnyel'], [15, 25]]
,
['coat-wall', 'Mobil fogasfal', 'comfort', 40, 0, 3, 1.5, 'furniture', 'coat', ['Kampós fogasfal', 'Kabátokkal és táskával', 'Rendezett vendégfogadó fogas'], [15, 25]]
,
['projector-screen', 'Projektor és vetítővászon', 'tools', 80, 0, 3, 1.5, 'furniture', 'whiteboard', ['Vetítővászon és projektor', 'Vászon tréningábrával', 'Kivetített csoportmunka'], [15, 25]]
,
['picture-cards', 'Képkártyapakli', 'tools', 15, 0, 0.5, 0.5, 'tabletop', 'picture', ['Képkártyák dobozban', 'Szétterített képkártyák', 'Témák szerint rendezett képkártyák'], [15, 25]]
,
['emotion-cards', 'Érzelemkártyák', 'tools', 15, 0, 0.5, 0.5, 'tabletop', 'pinboard', ['Egyszerű arckártyák', 'Színes érzelemkészlet', 'Teljes érzelemtérkép-készlet'], [15, 25]]
,
['conversation-cards', 'Beszélgetőkártyák', 'tools', 15, 0, 0.5, 0.5, 'tabletop', 'pinboard', ['Kérdéskártyák', 'Színes témakörök', 'Dobozos beszélgetésindító készlet'], [15, 25]]
,
['building-blocks', 'Építőkockás doboz', 'tools', 20, 0, 0.6, 0.6, 'tabletop', 'chess', ['Maréknyi kocka', 'Színes építőkészlet', 'Felépített közös alkotás'], [15, 25]]
,
['colored-tokens', 'Színes korongok készlete', 'tools', 15, 0, 0.5, 0.5, 'tabletop', 'ball', ['Néhány korong', 'Többszínű készlet', 'Mintába rendezett játékkészlet'], [15, 25]]
,
['dice-set', 'Dobókockakészlet', 'play', 10, 0, 0.5, 0.5, 'tabletop', 'chess', ['Két dobókocka', 'Színes kockakészlet', 'Dobókockák vászonzsákkal'], [15, 25]]
,
['talking-stick', 'Beszélőbot', 'tools', 10, 0, 0.5, 0.5, 'tabletop', 'markers', ['Egyszerű fabot', 'Színes szalagokkal', 'Faragott, egyedi beszélőbot'], [15, 25]]
,
['talking-ball', 'Beszélőlabda', 'tools', 15, 0, 0.5, 0.5, 'tabletop', 'ball', ['Egyszínű labda', 'Színes mintás labda', 'Vidám, arcos beszélőlabda'], [15, 25]]
,
['sticky-notes', 'Post-it- és cetlikészlet', 'tools', 10, 0, 0.5, 0.5, 'tabletop', 'pinboard', ['Egy tömb cetli', 'Többszínű cetlikészlet', 'Rendszerezett cetli- és jelölőkészlet'], [15, 25]]
,
['trainer-case', 'Nyitott tréneri bőrönd', 'tools', 45, 0, 3, 2, 'furniture', 'cart', ['Nyitott bőrönd', 'Bőrönd rendezett eszközökkel', 'Utazó tréneri műhely'], [15, 25]]
,
['own-book', 'Saját könyv', 'personal', 20, 0, 0.5, 0.5, 'tabletop', 'bookshelf', ['Kézirat spirálozva', 'Megjelent, puhakötésű könyv', 'Díszkiadás dedikált példánnyal'], [15, 25]]
,
['certificate', 'Keretezett oklevél', 'personal', 20, 0, 0.5, 0.5, 'tabletop', 'picture', ['Oklevél egyszerű keretben', 'Paszpartus oklevél', 'Oklevél pecséttel és díszkeretben'], [15, 25]]
,
['trophy', 'Serleg vagy díj', 'personal', 30, 0, 0.5, 0.5, 'tabletop', 'sculpture', ['Kis serleg', 'Gravírozott díj', 'Dísztalpas, aranyszínű trófea'], [15, 25]]
,
['photo-frame', 'Fényképkeret', 'personal', 20, 0, 0.5, 0.5, 'tabletop', 'picture', ['Egyszerű keret', 'Képes, színes keret', 'Képes keret személyes díszekkel'], [15, 25]]
,
['compass-globe', 'Iránytű vagy földgömb', 'personal', 25, 0, 0.5, 0.5, 'tabletop', 'clock', ['Asztali iránytű', 'Földgömb faállványon', 'Rézszínű, térképes utazóasztalka'], [15, 25]]
];
export const products=data.map(([id,name,category,price,max,w,h,layer,art,levels,upgrades])=>({id,name,category,price,max:null,w,h,layer,art,levels,upgrades,surface:['table','modular','standing','side','cart','coffee','open-shelf','supply-cabinet','tea-table','trainer-case'].includes(id)}));
export const product=id=>products.find(p=>p.id===id);
export const defaultSettings=()=>({theme:'ice',wall:'ice',floor:'oak',view:'water',motto:'Itt lehet újrapróbálni.'});

