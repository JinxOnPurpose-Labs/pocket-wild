export const WIDTH=48,HEIGHT=28,DAY=180,MAX_CREATURES=90;
export const TYPES=['bug','snail','frog'],PLANTS=['grass','flower','reed'];
const caps={bug:60,snail:18,frog:12},speeds={bug:1.05,snail:.18,frog:.52},lifespans={bug:360,snail:720,frog:600};
const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
export function random(w){w.rng=(Math.imul(w.rng,1664525)+1013904223)>>>0;return w.rng/4294967296;}
export function cellAt(w,x,y){return w.cells[Math.max(0,Math.min(HEIGHT-1,Math.floor(y)))*WIDTH+Math.max(0,Math.min(WIDTH-1,Math.floor(x)))];}
export function note(w,text){w.events.unshift({at:w.time,text});w.events.length=Math.min(6,w.events.length);}
export function count(w,type){return w.creatures.filter(c=>c.type===type).length;}
export function spawn(w,type,x,y){
 if(!TYPES.includes(type)||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=WIDTH||y>=HEIGHT)return null;
 if(w.creatures.length>=MAX_CREATURES||count(w,type)>=caps[type])return null;
 const angle=random(w)*Math.PI*2,c={id:w.nextId++,type,x,y,energy:.65+random(w)*.12,age:0,cooldown:25+random(w)*20,dx:Math.cos(angle),dy:Math.sin(angle),turn:2+random(w)*4};w.creatures.push(c);return c;
}
export function createWorld(seed=12345,starter=true){
 const w={version:1,seed:seed>>>0,rng:seed>>>0,time:DAY*7/24,weather:'clear',weatherUntil:DAY*7/24+35,weatherMode:'auto',ecology:0,nextId:1,births:0,losses:0,meals:0,cells:[],creatures:[],events:[]};
 for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
  const c={water:0,moisture:.4+random(w)*.15,plant:null,growth:0,food:0};
  if(starter){
   const pond=((x-30)/7)**2+((y-15)/5)**2;if(pond<.85+random(w)*.15){c.water=clamp((1-pond)*.9+.18);c.moisture=1;}
   else if(random(w)<.34){c.plant='grass';c.growth=.4+random(w)*.6;c.food=.7;}
   if(c.water===0&&((x-13)**2+(y-12)**2<27||(x-25)**2+(y-18)**2<12)&&random(w)<.5){c.plant='flower';c.growth=.65+random(w)*.35;c.food=.8;}
   if(c.water>0&&c.water<.48&&random(w)<.6){c.plant='reed';c.growth=.65;c.food=.5;}
  }
  w.cells.push(c);
 }
 if(starter){for(const[x,y]of[[12,12],[16,10],[22,17],[26,19],[29,14],[9,15]])spawn(w,'bug',x+.5,y+.5);spawn(w,'snail',10.5,17.5);spawn(w,'snail',23.5,9.5);spawn(w,'frog',27.5,16.5);spawn(w,'frog',32.5,13.5);}
 note(w,starter?'A pond, a few plants, and several questionable life choices.':'Fresh ground. Try a pond, some flowers, then a few bugs.');return w;
}
export function applyTool(w,tool,x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=WIDTH||y>=HEIGHT)return{ok:false,message:'Choose a spot inside the meadow.'};
 const gx=Math.floor(x),gy=Math.floor(y),c=cellAt(w,gx,gy);
 if(TYPES.includes(tool)){
  if(tool==='snail'&&c.water>.6)return{ok:false,message:'Snails prefer dry land. Try the pond edge.'};
  const a=spawn(w,tool,gx+.5,gy+.5);return a?{ok:true,message:`One ${tool}, zero paperwork.`}:{ok:false,message:`This meadow has enough ${tool}s for now.`};
 }
 if(tool==='water'||tool==='grass'){
  for(let yy=gy-1;yy<=gy+1;yy++)for(let xx=gx-1;xx<=gx+1;xx++)if(xx>=0&&yy>=0&&xx<WIDTH&&yy<HEIGHT&&(xx-gx)**2+(yy-gy)**2<=1){const t=cellAt(w,xx,yy);if(tool==='water'){t.water=.82;t.moisture=1;t.plant=null;t.growth=0;t.food=0;}else{t.water=0;t.plant='grass';t.growth=.7;t.food=.7;t.moisture=Math.max(t.moisture,.45);}}
  return{ok:true};
 }
 if(tool==='flower'||tool==='reed'){
  if(c.water>.6)return{ok:false,message:'Too deep to plant. Try the shore or lay meadow first.'};c.plant=tool;c.growth=.6;c.food=.7;if(tool==='reed')c.moisture=Math.max(c.moisture,.65);return{ok:true};
 }
 if(tool==='erase'){
  const near=w.creatures.findIndex(a=>(a.x-x)**2+(a.y-y)**2<.65**2);if(near>=0)w.creatures.splice(near,1);else{c.water=0;c.plant=null;c.growth=0;c.food=0;}return{ok:true};
 }
 return{ok:false,message:'Choose a painting tool.'};
}
export function setWeather(w,mode){if(!['auto','clear','cloud','rain'].includes(mode))return false;w.weatherMode=mode;if(mode!=='auto')w.weather=mode;return true;}
export function daylight(w){return clamp(Math.sin(((w.time%DAY)/DAY-.25)*Math.PI*2));}
function nearest(list,c,max=Infinity){let best=null,d=max*max;for(const p of list){const n=(p.x-c.x)**2+(p.y-c.y)**2;if(n<d){best=p;d=n;}}return best;}
function ecology(w){
 const sun=daylight(w),rain=w.weather==='rain',cloud=w.weather==='cloud',spread=[];
 for(let i=0;i<w.cells.length;i++){
  const c=w.cells[i],x=i%WIDTH,y=Math.floor(i/WIDTH);let near=false;
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(x+dx>=0&&y+dy>=0&&x+dx<WIDTH&&y+dy<HEIGHT&&cellAt(w,x+dx,y+dy).water>.15)near=true;
  if(c.water>0){c.water=clamp(c.water+(rain?.0025:-.0003*sun));c.moisture=1;}
  else c.moisture=clamp(c.moisture+(rain?.018:near?.008:-.0016*(.25+sun)));
  if(c.plant){
   const suitable=c.plant==='reed'?(near||c.water>.05||c.moisture>.7):c.water<.45;
   const growth=suitable&&c.moisture>.12?.0025*(.25+sun)*(cloud?.8:1):-.004;
   c.growth=clamp(c.growth+growth);c.food=clamp(c.food+Math.max(0,growth)*1.5);
   if(c.growth<=0){c.plant=null;c.food=0;continue;}
   if(c.growth>.8&&random(w)<.0014){const dx=Math.floor(random(w)*3)-1,dy=Math.floor(random(w)*3)-1;if(x+dx>=0&&y+dy>=0&&x+dx<WIDTH&&y+dy<HEIGHT)spread.push({x:x+dx,y:y+dy,plant:c.plant});}
  }
 }
 for(const p of spread){const c=cellAt(w,p.x,p.y);if(!c.plant&&c.moisture>.2&&c.water<.4){c.plant=p.plant;c.growth=.18;c.food=.2;}}
}
export function step(w,dt=.2){
 if(!Number.isFinite(dt)||dt<=0||dt>1)throw Error('Simulation step must be between0 and1 second.');
 w.time+=dt;if(w.weatherMode==='auto'&&w.time>=w.weatherUntil){w.weather=['clear','clear','cloud','rain'][Math.floor(random(w)*4)];w.weatherUntil=w.time+30+random(w)*45;note(w,{clear:'The clouds break. The meadow warms.',cloud:'Clouds drift over the pond.',rain:'Rain arrives. The plants approve.'}[w.weather]);}else if(w.weatherMode!=='auto')w.weather=w.weatherMode;
 w.ecology+=dt;while(w.ecology>=1){ecology(w);w.ecology-=1;}
 const flowers=[],greens=[],water=[];
 for(let i=0;i<w.cells.length;i++){const c=w.cells[i],p={x:i%WIDTH+.5,y:Math.floor(i/WIDTH)+.5,cell:c};if(c.plant==='flower'&&c.food>.12&&c.growth>.25)flowers.push(p);if(c.plant&&c.plant!=='flower'&&c.food>.1)greens.push(p);if(c.water>.15)water.push(p);}
 const bugs=w.creatures.filter(c=>c.type==='bug'),dead=new Set(),babies=[];
 for(const c of w.creatures){
  if(dead.has(c.id))continue;c.age+=dt;c.cooldown=Math.max(0,c.cooldown-dt);c.energy-=dt*({bug:.0016,snail:.0009,frog:.0014}[c.type]);c.turn=Math.max(0,c.turn-dt);
  const pond=c.type==='frog'?nearest(water,c,15):null;let target=null;
  if(c.type==='bug')target=nearest(flowers,c,9);if(c.type==='snail')target=nearest(greens,c,10);
  if(c.type==='frog'){target=nearest(bugs.filter(b=>!dead.has(b.id)),c,5);if(!target&&pond&&((pond.x-c.x)**2+(pond.y-c.y)**2>4))target=pond;if(!water.length)c.energy-=dt*.001;}
  if(target){const dx=target.x-c.x,dy=target.y-c.y,d=Math.hypot(dx,dy);if(d>.1){c.dx=dx/d;c.dy=dy/d;}if(d<.58){if(c.type==='frog'&&target.type==='bug'){dead.add(target.id);c.energy=clamp(c.energy+.35);w.meals++;}else if(target.cell&&target.cell.food>.08&&target.cell.plant){const bite=Math.min(target.cell.food,dt*.16);target.cell.food-=bite;c.energy=clamp(c.energy+bite*1.7);if(c.type==='snail')target.cell.growth=Math.max(.06,target.cell.growth-bite*.16);}}}
  else if(c.turn<=0){const a=random(w)*Math.PI*2;c.dx=Math.cos(a);c.dy=Math.sin(a);c.turn=2+random(w)*6;}
  const speed=speeds[c.type]*(c.type==='frog'?(Math.sin(w.time*5+c.id)>0?1.5:.1):1),nx=clamp(c.x+c.dx*speed*dt,.05,WIDTH-.05),ny=clamp(c.y+c.dy*speed*dt,.05,HEIGHT-.05);
  if(c.type==='snail'&&cellAt(w,nx,ny).water>.62){c.dx=-c.dx;c.dy=-c.dy;c.turn=0;}else{c.x=nx;c.y=ny;}
  if(c.x<=.05||c.x>=WIDTH-.05||c.y<=.05||c.y>=HEIGHT-.05){c.dx=-c.dx;c.dy=-c.dy;c.turn=0;}
  if(c.energy<=0||c.age>lifespans[c.type]){dead.add(c.id);w.losses++;const cell=cellAt(w,c.x,c.y);cell.moisture=clamp(cell.moisture+.08);continue;}
  if(c.energy>.9&&c.cooldown===0&&c.age>18){babies.push({type:c.type,x:clamp(c.x+(random(w)-.5),.05,WIDTH-.05),y:clamp(c.y+(random(w)-.5),.05,HEIGHT-.05)});c.energy-=.24;c.cooldown=40+random(w)*30;}
 }
 w.creatures=w.creatures.filter(c=>!dead.has(c.id));for(const b of babies)if(spawn(w,b.type,b.x,b.y)){w.births++;if(w.births===1||w.births%8===0)note(w,`A new ${b.type} joins the neighbourhood.`);}
}
export function summary(w){let plants=0,flowers=0,pond=0;for(const c of w.cells){if(c.plant)plants++;if(c.plant==='flower')flowers++;if(c.water>.1)pond++;}return{plants,flowers,pond,bug:count(w,'bug'),snail:count(w,'snail'),frog:count(w,'frog'),day:Math.floor(w.time/DAY)+1,hour:Math.floor(w.time%DAY/DAY*24),minute:Math.floor(w.time%DAY/DAY*24*60)%60,weather:w.weather};}
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
export function validateWorld(input){
 const fail=()=>{throw Error('That save is not a valid Pocket Wild world.');};if(!input||input.version!==1||!Number.isInteger(input.seed)||!finite(input.seed,0,4294967295)||!Number.isInteger(input.rng)||!finite(input.rng,0,4294967295)||!finite(input.time,0,1e9)||!finite(input.ecology,0,1)||!['clear','cloud','rain'].includes(input.weather)||!['auto','clear','cloud','rain'].includes(input.weatherMode)||!finite(input.weatherUntil,0,1e9)||!Array.isArray(input.cells)||input.cells.length!==WIDTH*HEIGHT||!Array.isArray(input.creatures)||input.creatures.length>MAX_CREATURES||!Number.isSafeInteger(input.nextId)||!finite(input.nextId,1,1e9))fail();
 const w={version:1,seed:input.seed,rng:input.rng,time:input.time,weather:input.weather,weatherMode:input.weatherMode,weatherUntil:input.weatherUntil,ecology:input.ecology,nextId:input.nextId,cells:[],creatures:[],events:[]};for(const k of ['births','losses','meals']){if(!Number.isSafeInteger(input[k])||!finite(input[k],0,1e9))fail();w[k]=input[k];}
 for(const c of input.cells){if(!c||![null,...PLANTS].includes(c.plant)||!['water','moisture','growth','food'].every(k=>finite(c[k],0,1)))fail();w.cells.push({water:c.water,moisture:c.moisture,plant:c.plant,growth:c.growth,food:c.food});}
 const ids=new Set();for(const c of input.creatures){if(!c||!TYPES.includes(c.type)||!Number.isSafeInteger(c.id)||c.id<1||c.id>=w.nextId||ids.has(c.id)||!finite(c.x,0,WIDTH)||!finite(c.y,0,HEIGHT)||!finite(c.energy,0,1)||!finite(c.age,0,1e9)||!finite(c.cooldown,0,600)||!finite(c.dx,-1.00001,1.00001)||!finite(c.dy,-1.00001,1.00001)||!finite(c.turn,-1,20))fail();ids.add(c.id);w.creatures.push({id:c.id,type:c.type,x:c.x,y:c.y,energy:c.energy,age:c.age,cooldown:c.cooldown,dx:c.dx,dy:c.dy,turn:c.turn});}
 for(const type of TYPES)if(count(w,type)>caps[type])fail();if(!Array.isArray(input.events)||input.events.length>6)fail();for(const e of input.events){if(!e||typeof e.text!=='string'||e.text.length>180||!finite(e.at,0,1e9))fail();w.events.push({at:e.at,text:e.text});}return w;
}
export function serialize(w){return JSON.stringify(validateWorld(w));}
