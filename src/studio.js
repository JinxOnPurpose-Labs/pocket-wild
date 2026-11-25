import {createWorld,validateWorld,serialize,applyTool,random,WIDTH,HEIGHT} from './world.js';
export const PRESETS=['meadow','islands','marsh','empty'];
export const KEY='pocket-wild:world:v1', SLOT_KEY='pocket-wild:slots:v1', MAX_SAVE=500000, MAX_SLOTS=3;
export function createBiome(seed,preset='meadow'){
 if(!Number.isInteger(seed)||seed<0||seed>4294967295||!PRESETS.includes(preset))throw Error('Invalid starting seed');
 const w=createWorld(seed,preset!=='empty');w.origin={generator:1,seed,preset};
 if(preset==='islands'){
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
   const c=w.cells[y*WIDTH+x],land=Math.min(((x-12)/9)**2+((y-11)/8)**2,((x-33)/9)**2+((y-17)/7)**2,((x-28)/5)**2+((y-5)/3)**2);
   if(land>1){c.water=.7+random(w)*.2;c.plant=null;c.growth=0;c.food=0;c.moisture=1;}
   else{c.water=0;c.terrain=land>.72?'sand':'meadow';if(c.terrain==='sand'){c.plant=null;c.growth=0;c.food=0;}}
  }
  for(const a of w.creatures){a.x=a.type==='frog'?20.5:11.5+random(w)*3;a.y=10.5+random(w)*3;}
 }
 if(preset==='marsh'){
  for(const c of w.cells){c.moisture=.85;if(c.water>.05&&c.water<.6){c.plant='reed';c.growth=.7;c.food=.7;}}
  w.weatherMode='rain';w.weather='rain';
 }
 if(preset!=='empty')for(const[x,y,decor]of[[8,8,'rock'],[19,22,'log'],[37,10,'rock']]){const c=w.cells[y*WIDTH+x];if(c.water<.25){c.decor=decor;c.plant=null;c.growth=0;c.food=0;}}
 return w;
}
export function seedFragment(origin){
 if(!origin||origin.generator!==1||!PRESETS.includes(origin.preset)||!Number.isInteger(origin.seed)||origin.seed<0||origin.seed>4294967295)throw Error('Legacy origin unavailable');
 return `#pw1:${origin.preset}:${origin.seed}`;
}
export function parseSeed(hash){
 if(!hash)return null;
 if(typeof hash!=='string'||hash.length>60)throw Error('Invalid seed link');
 const m=/^#pw1:(meadow|islands|marsh|empty):(0|[1-9][0-9]{0,9})$/.exec(hash);
 if(!m||Number(m[2])>4294967295)throw Error('Invalid seed link');
 return {generator:1,preset:m[1],seed:Number(m[2])};
}
export function decodeSave(raw){
 if(typeof raw!=='string'||raw.length>MAX_SAVE)throw Error('Invalid save size');
 const p=JSON.parse(raw);if(p.schema!==1)throw Error('Invalid save schema');return validateWorld(p.world);
}
export function encodeSave(world){const raw=JSON.stringify({schema:1,savedAt:new Date().toISOString(),world:JSON.parse(serialize(world))});if(raw.length>MAX_SAVE)throw Error('Save too large');return raw;}
export function decodeSlots(raw){
 if(raw===null)return [null,null,null];
 if(typeof raw!=='string'||raw.length>MAX_SAVE*MAX_SLOTS)throw Error('Invalid slots size');
 const p=JSON.parse(raw);if(p.schema!==1||!Array.isArray(p.slots)||p.slots.length!==MAX_SLOTS)throw Error('Invalid slots');
 return p.slots.map(s=>{if(s===null)return null;if(!s||typeof s.name!=='string'||s.name.length<1||s.name.length>32||typeof s.save!=='string')throw Error('Invalid slot');decodeSave(s.save);return {name:s.name,save:s.save};});
}
export function storeSlot(storage,index,name,world){
 if(!Number.isInteger(index)||index<0||index>=MAX_SLOTS||typeof name!=='string'||!name.trim()||name.length>32)throw Error('Invalid slot');
 const slots=decodeSlots(storage.getItem(SLOT_KEY));slots[index]={name:name.trim(),save:encodeSave(world)};
 const raw=JSON.stringify({schema:1,slots});if(raw.length>MAX_SAVE*MAX_SLOTS)throw Error('Slots too large');storage.setItem(SLOT_KEY,raw);return slots;
}
export function applyBrush(world,tool,x,y,size=1){
 if(![1,3,5].includes(size)||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=WIDTH||y>=HEIGHT)return{ok:false};
 if(['bug','snail','frog'].includes(tool))return applyTool(world,tool,x,y,true);
 let ok=false,message='';const r=(size-1)/2;
 for(let yy=Math.floor(y)-r;yy<=Math.floor(y)+r;yy++)for(let xx=Math.floor(x)-r;xx<=Math.floor(x)+r;xx++)if((xx-Math.floor(x))**2+(yy-Math.floor(y))**2<=r*r){const result=applyTool(world,tool,xx+.5,yy+.5,true);ok||=result.ok;if(result.message)message=result.message;}
 return{ok,message};
}
export class EditHistory{
 constructor(){this.undo=[];this.redo=[];this.pending=null;}
 clear(){this.undo=[];this.redo=[];this.pending=null;}
 begin(world,paused){if(paused&&!this.pending)this.pending=serialize(world);}
 commit(world){if(this.pending&&this.pending!==serialize(world)){this.undo.push(this.pending);if(this.undo.length>12)this.undo.shift();this.redo=[];}this.pending=null;}
 cancel(){const p=this.pending;this.pending=null;return p?validateWorld(JSON.parse(p)):null;}
 move(world,direction,paused){if(!paused||this.pending)return null;const from=direction==='undo'?this.undo:this.redo,to=direction==='undo'?this.redo:this.undo;if(!from.length)return null;to.push(serialize(world));return validateWorld(JSON.parse(from.pop()));}
}
