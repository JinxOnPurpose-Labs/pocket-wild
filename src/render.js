import{WIDTH,HEIGHT,daylight}from'./world.js';
export const TILE=16;
const hash=(x,y,seed)=>((Math.imul(x+seed,374761393)^Math.imul(y+31,668265263))>>>0)/4294967296;
const sprites={bug:['.w..w.','www.w.','.yky..','..k...'],snail:['...ss...','..soos..','..soos..','.tssss.t','tttttttt'],frog:['.ee..ee.','eggeegge','gggggggg','.gllggg.','..gggg..','g.g..g.g']};
function sprite(ctx,type,x,y,flip,phase){const scale=type==='bug'?1.5:2,art=sprites[type],colors={w:'#eee8c6',y:'#dba549',k:'#433f2a',s:'#ba8059',o:'#754c3d',t:'#d5c59c',e:'#d6e4ad',g:'#78a74b',l:'#b7cd7d'};ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);if(type==='bug')ctx.rotate(Math.sin(phase)*.1);for(let yy=0;yy<art.length;yy++)for(let xx=0;xx<art[yy].length;xx++){const c=colors[art[yy][xx]];if(c){ctx.fillStyle=c;ctx.fillRect(Math.round((xx-art[yy].length/2)*scale),Math.round((yy-art.length/2)*scale),scale,scale);}}ctx.restore();}
export function render(ctx,w,view={}){
 ctx.imageSmoothingEnabled=false;const sun=daylight(w),night=1-sun;ctx.fillStyle='#78975d';ctx.fillRect(0,0,WIDTH*TILE,HEIGHT*TILE);
 for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
  const c=w.cells[y*WIDTH+x],px=x*TILE,py=y*TILE,n=hash(x,y,w.seed);
  if(c.water>.02){ctx.fillStyle=c.water>.55?'#3d797b':c.water>.25?'#558e87':'#779f86';ctx.fillRect(px,py,TILE,TILE);if(n>.7){ctx.fillStyle='#94c4ae';ctx.globalAlpha=.35+.2*Math.sin(w.time*2+x+y);ctx.fillRect(px+3,py+7,7,1);ctx.fillRect(px+6,py+9,4,1);ctx.globalAlpha=1;}
   for(const[dx,dy,sx,sy,sw,sh]of[[0,-1,0,0,16,2],[0,1,0,14,16,2],[-1,0,0,0,2,16],[1,0,14,0,2,16]]){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<WIDTH&&ny<HEIGHT&&w.cells[ny*WIDTH+nx].water<=.02){ctx.fillStyle='#adb280';ctx.fillRect(px+sx,py+sy,sw,sh);}}
  }else{ctx.fillStyle=c.moisture>.65?(n>.5?'#6d925d':'#71945f'):(n>.72?'#89a269':n>.3?'#829e63':'#7c995e');ctx.fillRect(px,py,TILE,TILE);if(n>.92&&!c.plant){ctx.fillStyle='#b0ad87';ctx.fillRect(px+5,py+7,5,3);ctx.fillStyle='#c4c1a0';ctx.fillRect(px+5,py+6,4,2);}else if(n<.22){ctx.fillStyle='#6e8955';ctx.fillRect(px+3,py+8,2,1);ctx.fillRect(px+11,py+4,1,1);}}
  if(c.plant){const g=c.growth,ox=px+8,oy=py+13,h=Math.round(3+g*8),sway=Math.round(Math.sin(w.time*.7+x*.8+y)*g);ctx.fillStyle='#4b723e';
   if(c.plant==='grass'){ctx.fillRect(ox,oy-h+sway,2,h);ctx.fillRect(ox-3,oy-h+3,2,h-2);ctx.fillStyle='#b0bd72';ctx.fillRect(ox+3,oy-h+1,1,h-1);ctx.fillRect(ox-2,oy-3,4,2);}
   if(c.plant==='flower'){ctx.fillStyle='#4d7a40';ctx.fillRect(ox+sway,oy-h,1,h);ctx.fillRect(ox-3,oy-4,3,2);ctx.fillRect(ox+1,oy-6,3,2);if(g>.25){ctx.fillStyle=c.food<.1?'#b89d72':['#e7b774','#e6c5aa','#b7b4d3'][Math.floor(n*3)];ctx.fillRect(ox-3+sway,oy-h-2,7,3);ctx.fillRect(ox-1+sway,oy-h-4,3,7);ctx.fillStyle='#f6e3a2';ctx.fillRect(ox+sway,oy-h-1,2,2);}}
   if(c.plant==='reed'){ctx.fillStyle='#496f40';for(let a=-3;a<=3;a+=3){ctx.fillRect(ox+a+sway,oy-h-3,1,h+3);ctx.fillStyle='#815b3a';ctx.fillRect(ox+a+sway-1,oy-h-6,3,5);ctx.fillStyle='#496f40';}}
  }
 }
 const creatures=[...w.creatures].sort((a,b)=>a.y-b.y);
 for(const c of creatures){const x=c.x*TILE,y=c.y*TILE,hop=c.type==='frog'?Math.max(0,Math.sin(w.time*5+c.id))*3:c.type==='bug'?4+Math.sin(w.time*8+c.id)*1.4:0;ctx.fillStyle='#24473440';ctx.fillRect(Math.round(x-5),Math.round(y+4),10,3);sprite(ctx,c.type,x,y-hop,c.dx<0,w.time*8+c.id);}
 if(night>.05){ctx.fillStyle=`rgba(16,32,57,${night*.6})`;ctx.fillRect(0,0,WIDTH*TILE,HEIGHT*TILE);if(night>.5)for(const c of creatures.filter(x=>x.type==='bug')){ctx.fillStyle='#e5e9a4';ctx.globalAlpha=(.5+.5*Math.sin(w.time*4+c.id))*night;ctx.fillRect(Math.round(c.x*TILE),Math.round(c.y*TILE-5),2,2);ctx.globalAlpha=1;}}
 if(w.weather==='cloud'||w.weather==='rain'){ctx.fillStyle=w.weather==='rain'?'#36555f26':'#c7cbb718';ctx.fillRect(0,0,WIDTH*TILE,HEIGHT*TILE);}
 if(w.weather==='rain'){ctx.strokeStyle='#d4e7e96b';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<70;i++){const x=(i*137.3+w.time*90)%(WIDTH*TILE),y=(i*71.7+w.time*170)%(HEIGHT*TILE);ctx.moveTo(x,y);ctx.lineTo(x-3,y+7);}ctx.stroke();}
 // Soft warm edge of the sun, not a physics model.
 if(sun>.3&&w.weather==='clear'){const light=ctx.createLinearGradient(0,0,WIDTH*TILE,HEIGHT*TILE);light.addColorStop(0,'#fff2b81a');light.addColorStop(.6,'#fff2b800');ctx.fillStyle=light;ctx.fillRect(0,0,WIDTH*TILE,HEIGHT*TILE);}
 if(view.cursor){const{x,y}=view.cursor;ctx.strokeStyle=view.tool==='erase'?'#f7bb9c':'#f7f2d6';ctx.lineWidth=1;ctx.strokeRect(Math.floor(x)*TILE+.5,Math.floor(y)*TILE+.5,TILE-1,TILE-1);ctx.fillStyle='#ffffff12';ctx.fillRect(Math.floor(x)*TILE,Math.floor(y)*TILE,TILE,TILE);}
}
