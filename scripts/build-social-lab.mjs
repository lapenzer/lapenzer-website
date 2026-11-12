import {createHash} from "node:crypto";
import {existsSync,readFileSync,writeFileSync,mkdirSync,rmSync,cpSync,readdirSync} from "node:fs";
import {join,dirname,relative} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import {deflateRawSync} from "node:zlib";

const root=fileURLToPath(new URL("../",import.meta.url));
const lab=join(root,"src/social-lab");
const target=join(root,"public/social-lab");
const fingerprint=createHash("sha256").update(readFileSync(join(lab,"package.json"))).update(readFileSync(join(lab,"package-lock.json"))).digest("hex");
const marker=join(lab,"node_modules/.lapenzer-dependencies");
function run(args){const result=spawnSync(process.platform==="win32"?"npm.cmd":"npm",args,{cwd:lab,stdio:"inherit",env:process.env});if(result.status!==0)process.exit(result.status??1);}
if(!existsSync(marker)||readFileSync(marker,"utf8")!==fingerprint){run(["ci","--no-audit","--no-fund"]);writeFileSync(marker,fingerprint);}
run(["run","build"]);

// A standard ZIP archive keeps the source download independent of the server runtime.
const ignored=new Set(["node_modules","dist","build","data",".git",".venv",".pytest_cache","__pycache__"]);
const extensions=new Set(["ts","tsx","css","py","json","md","yaml","yml","html","txt"]);
const files=[];
function visit(directory){for(const item of readdirSync(directory,{withFileTypes:true})){if(item.isSymbolicLink()||ignored.has(item.name)||item.name.startsWith(".env"))continue;const path=join(directory,item.name);if(item.isDirectory()){if(!item.name.startsWith("."))visit(path);}else if(extensions.has(item.name.split(".").at(-1))||["Dockerfile",".gitignore",".dockerignore"].includes(item.name))files.push(path);}}
visit(lab);
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(bytes){let c=0xffffffff;for(const value of bytes)c=crcTable[(c^value)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
const locals=[],centrals=[];let offset=0;
for(const path of files.sort()){
 const name=Buffer.from("lapenzer-social-network-laboratory/"+relative(lab,path).replaceAll("\\","/"));const raw=readFileSync(path),compressed=deflateRawSync(raw),crc=crc32(raw);
 const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt16LE(33,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(raw.length,22);local.writeUInt16LE(name.length,26);
 locals.push(local,name,compressed);
 const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt16LE(8,10);central.writeUInt16LE(33,14);central.writeUInt32LE(crc,16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(raw.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(offset,42);centrals.push(central,name);offset+=local.length+name.length+compressed.length;
}
const central=Buffer.concat(centrals),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(central.length,12);end.writeUInt32LE(offset,16);
const archive=Buffer.concat([...locals,central,end]);
writeFileSync(join(lab,"dist/lapenzer-social-lab-source.zip"),archive);
mkdirSync(dirname(target),{recursive:true});rmSync(target,{recursive:true,force:true});cpSync(join(lab,"dist"),target,{recursive:true});
const index=join(target,"index.html");writeFileSync(index,readFileSync(index,"utf8").replace("</head>",`<meta name="lapenzer-release" content="${fingerprint.slice(0,12)}"/></head>`));
console.log(`LAPENZER laboratory: ${files.length} source files, browser worker and downloadable archive prepared.`);
