import{mkdir,copyFile,readdir,rm}from'node:fs/promises';
import{fileURLToPath}from'node:url';
import path from'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'dist');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await copyFile(path.join(root,'index.html'),path.join(out,'index.html'));
for(const dir of['portal','explorer']){
 await mkdir(path.join(out,dir),{recursive:true});
 for(const entry of await readdir(path.join(root,dir),{withFileTypes:true})){
  // The initial catalog is already in the protected database. Never publish question
  // banks, cases, reading materials, SQL snapshots or test fixtures as site files.
  if(entry.isFile()&&entry.name!=='content.json'&&/\.(html|css|mjs|js|json)$/.test(entry.name))await copyFile(path.join(root,dir,entry.name),path.join(out,dir,entry.name));
 }
}
await copyFile(path.join(root,'.nojekyll'),path.join(out,'.nojekyll'));
console.log('A statikus próbafelület elkészült.');
