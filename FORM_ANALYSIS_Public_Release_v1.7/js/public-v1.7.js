/* FORM ANALYSIS Public Preview v1.7
 * Single-pass 2D kinematics. Foot force allocation uses the filed/
 * patent-pending support-point + approximate-center + acceleration model.
 * Simple sequential 2D foot motion and relative foot-height heuristics estimate contact candidates.
 * The public release provides reference estimates, not validated measurements.
 * MediaPipe tasks-vision runs entirely on client from same-origin assets.
 */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const video=$('video'), canvas=$('overlay'),fileInput=$('videoFile');
const G=9.80665, KEY_MIN=.30, MAX_ANALYSIS_SECONDS=20;
const COLORS={leadResultant:'#f39b33',driveResultant:'#499ff4',leadVertical:'#df851b',driveVertical:'#317fd4',leadHorizontal:'#b76b17',driveHorizontal:'#225faf',comSpeed:'#078d79',pelvisSpeed:'#9d59cb',thoraxSpeed:'#3286d3',shoulderL:'#ac62d2',shoulderR:'#ea9550',elbowL:'#2377b8',elbowR:'#d3637a',wristL:'#00a09a',wristR:'#d28d39',headSpeed:'#369bad',handTipL:'#126f8b',handTipR:'#c34b68',releasePoint:'#168db1',releaseX:'#078d79',releaseY:'#3388cb',comEnergy:'#008f7a',pelvisEnergy:'#9d59cb',shoulderEnergyL:'#b060c9',shoulderEnergyR:'#eb8c4c',elbowEnergyL:'#ad6ada',elbowEnergyR:'#d36a80',wristEnergyL:'#21a4aa',wristEnergyR:'#d6a455',tipEnergyL:'#15b3a4',tipEnergyR:'#e59553',forceTotal:'#2a7398',forceVertical:'#ed9636',forceHorizontal:'#9c60d5',upperAngular:'#237eb8',lowerAngular:'#9e68d7',twistAngular:'#e9913b',upperAngle:'#237eb8',lowerAngle:'#9e68d7',twistAngle:'#e9913b',stride:'#0b9299',wristTravel:'#267aa2',energy:'#8f68ce'};
const LABELS={leadResultant:'踏込足 床反力（合力）',driveResultant:'軸足 床反力（合力）',leadVertical:'踏込足 鉛直（参考配分）',driveVertical:'軸足 鉛直（参考配分）',leadHorizontal:'踏込足 水平（重心向き＋・参考）',driveHorizontal:'軸足 水平（重心向き＋・参考）',comSpeed:'重心速度',headSpeed:'頭部中心速度',pelvisSpeed:'骨盤速度',thoraxSpeed:'胸郭中心速度',shoulderL:'左肩',shoulderR:'右肩',elbowL:'左肘',elbowR:'右肘',wristL:'左手首',wristR:'右手首',forceTotal:'全身参考合力',forceVertical:'参考鉛直反力',forceHorizontal:'参考水平反力',stride:'足首間前後距離',wristTravel:'投球手首の水平移動量',energy:'重心の参考エネルギー',comEnergy:'重心並進エネルギー',pelvisEnergy:'骨盤並進エネルギー',shoulderEnergyL:'左肩並進エネルギー',shoulderEnergyR:'右肩並進エネルギー',elbowEnergyL:'左肘並進エネルギー',elbowEnergyR:'右肘並進エネルギー',wristEnergyL:'左手首並進エネルギー',wristEnergyR:'右手首並進エネルギー',tipEnergyL:'左手先並進エネルギー',tipEnergyR:'右手先並進エネルギー',handTipL:'左手先',handTipR:'右手先',upperAngular:'上胴角速度（投影推定）',lowerAngular:'下胴角速度（投影推定）',twistAngular:'捻転角速度（投影推定）',upperAngle:'上胴角度（2D投影推定）',lowerAngle:'下胴角度（2D投影推定）',twistAngle:'捻転角度（上胴−下胴・2D投影推定）',releasePoint:'推定リリースポイント（軸足→投球指先の前方距離）',releaseX:'リリース候補水平位置',releaseY:'リリース候補鉛直位置'};
const PAGE={speed:{cards:[
 {id:'com',name:'重心速度',keys:['comSpeed'],unit:'m/s',icon:'◉'},
 {id:'head',name:'頭部中心速度',keys:['headSpeed'],unit:'m/s',icon:'◌'},
 {id:'thorax',name:'胸部中心速度',keys:['thoraxSpeed'],unit:'m/s',icon:'⌁'},
 {id:'pelvis',name:'骨盤中心速度',keys:['pelvisSpeed'],unit:'m/s',icon:'⌖'},
 {id:'shoulders',name:'両肩速度',keys:['shoulderL','shoulderR'],unit:'m/s',icon:'⌁'},
 {id:'elbows',name:'両肘速度',keys:['elbowL','elbowR'],unit:'m/s',icon:'⌁'},
 {id:'wrists',name:'両手首速度',keys:['wristL','wristR'],unit:'m/s',icon:'⌁'},
 {id:'tips',name:'両手先速度',keys:['handTipL','handTipR'],unit:'m/s',icon:'⌁'}
 ]},forces:{cards:[
 {id:'drive-resultant',name:'軸足 合力',tab:'軸足 合力',keys:['driveResultant'],unit:'N',icon:'↗'},
 {id:'lead-resultant',name:'踏込足 合力',tab:'踏込 合力',keys:['leadResultant'],unit:'N',icon:'↗'},
 {id:'drive-vertical',name:'軸足 鉛直反力',tab:'軸足 鉛直',keys:['driveVertical'],unit:'N',icon:'↑'},
 {id:'lead-vertical',name:'踏込足 鉛直反力',tab:'踏込 鉛直',keys:['leadVertical'],unit:'N',icon:'↑'},
 {id:'drive-horizontal',name:'軸足 水平反力',tab:'軸足 水平',keys:['driveHorizontal'],unit:'N',icon:'↔'},
 {id:'lead-horizontal',name:'踏込足 水平反力',tab:'踏込 水平',keys:['leadHorizontal'],unit:'N',icon:'↔'}
 ]},dynamics:{cards:[
 {id:'stride',name:'推定ストライド',keys:['stride'],unit:'m',icon:'↔'},
 {id:'release',name:'推定リリースポイント',keys:['releasePoint'],unit:'m',icon:'◆'},
 {id:'energy-com',name:'重心並進エネルギー',keys:['comEnergy'],unit:'J',icon:'◈'},
 {id:'energy-pelvis',name:'骨盤並進エネルギー',keys:['pelvisEnergy'],unit:'J',icon:'◈'},
 {id:'energy-shoulder',name:'両肩並進エネルギー',keys:['shoulderEnergyL','shoulderEnergyR'],unit:'J',icon:'◈'},
 {id:'energy-elbow',name:'両肘並進エネルギー',keys:['elbowEnergyL','elbowEnergyR'],unit:'J',icon:'◈'},
 {id:'energy-wrist',name:'両手首並進エネルギー',keys:['wristEnergyL','wristEnergyR'],unit:'J',icon:'◈'},
 {id:'energy-tip',name:'両手先並進エネルギー',keys:['tipEnergyL','tipEnergyR'],unit:'J',icon:'◈'}
 ]},angular:{cards:[
 {id:'upper-angle',name:'上胴角度',keys:['upperAngle'],unit:'°',icon:'⟳'},
 {id:'lower-angle',name:'下胴角度',keys:['lowerAngle'],unit:'°',icon:'⟳'},
 {id:'twist-angle',name:'捻転角度',keys:['twistAngle'],unit:'°',icon:'⟲'},
 {id:'upper',name:'上胴角速度',keys:['upperAngular'],unit:'°/s',icon:'⟳'},
 {id:'lower',name:'下胴角速度',keys:['lowerAngular'],unit:'°/s',icon:'⟳'},
 {id:'twist',name:'捻転角速度',keys:['twistAngular'],unit:'°/s',icon:'⟲'}
 ]}};
const DEFAULTS={height:175,weight:70,sex:'unspecified',hand:'right',direction:'right',mirrorSides:'no',model:'heavy',smoothing:3,fps:30,startTime:0,endTime:0,scale:'auto',manualScale:.002};
const state={config:{...DEFAULTS},page:'speed',selected:{speed:new Set(['com','thorax','pelvis']),forces:new Set(['lead-resultant','drive-resultant']),dynamics:new Set(['stride']),angular:new Set(['upper-angle','lower-angle','twist-angle'])},showForces:true,fileURL:null,mode:'empty',analysis:null,t:0,playing:false,analyzing:false,abort:null,showPose:true,showVideo:true,showArrows:true,guide:true};
const safe=n=>Number.isFinite(n)?n:null;
const lookup=(pose,index)=>{const v=pose?.[index];return v&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&Math.min(v.visibility??1,v.presence??1)>=KEY_MIN?v:null;};
const middle=(a,b)=>a&&b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2}:null;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const moment=(arr,i,times)=>{
  if(!arr[i])return null;
  let p=i-1,q=i+1;
  while(p>=0&&!arr[p])p--;
  while(q<arr.length&&!arr[q])q++;
  if(p<0||q>=arr.length||q-p>4)return null;
  const dt=times[q]-times[p];if(!(dt>0))return null;
  return {x:(arr[q].x-arr[p].x)/dt,y:(arr[q].y-arr[p].y)/dt};
};
function parseMeasurements(poses,{height,manualScale,scale},width,heightPx){
  if(scale==='manual'&&manualScale>0)return {metersPerPixel:manualScale,method:'manual'};
  // Simple conventional height-to-pixels approximation from early upright frames.
  const estimates=[];
  for(const frame of poses.slice(0,Math.max(3,Math.ceil(poses.length*.18)))){
    const p=frame.pose,nose=lookup(p,0),ankL=lookup(p,27),ankR=lookup(p,28);
    const feet=[ankL,ankR].filter(Boolean);
    if(!nose||!feet.length)continue;
    const apparentPx=(Math.max(...feet.map(f=>f.y))-nose.y)*heightPx;
    if(apparentPx>heightPx*.15)estimates.push(apparentPx);
  }
  estimates.sort((a,b)=>a-b);
  const pixels=estimates[Math.floor(estimates.length/2)];
  if(!Number.isFinite(pixels))return {metersPerPixel:null,method:'insufficient-height-landmarks'};
  return {metersPerPixel:(height/100)/pixels,method:'single-height-reference'};
}

// Experimental 2D anthropometric CoM: Chandler segment masses adjusted by
// sex-specific de Leva segment fractions. This is a projected COM estimate,
// not a measured or validated 3D whole-body CoM.
const DELEVA={
 male:{mass:{head:.0694,trunk:.4346,ua:.0271,fa:.0162,hand:.0061,thigh:.1416,shank:.0433,foot:.0137},
   com:{trunk:.4486,ua:.5772,fa:.4574,hand:.7900,thigh:.4095,shank:.4459,foot:.4415}},
 female:{mass:{head:.0668,trunk:.4257,ua:.0255,fa:.0138,hand:.0056,thigh:.1478,shank:.0481,foot:.0129},
   com:{trunk:.4151,ua:.5754,fa:.4559,hand:.7474,thigh:.3612,shank:.4416,foot:.4014}}
};
const SEGMENT_KEYS=['head','trunk','ua','fa','hand','thigh','shank','foot'];
function chandlerMasses(bw){
  if(!Number.isFinite(bw)||bw<10||bw>250)throw new Error('体重が有効な範囲にありません');
  const m={head:1.9074+.0319*bw,trunk:-.7076+.5324*bw,ua:.4852+.0215*bw,
    fa:.2477+.0129*bw,hand:.0759+.0045*bw,thigh:-1.5112+.1271*bw,
    shank:-.1792+.0437*bw,foot:.2529+.0089*bw};
  for(const k of SEGMENT_KEYS)m[k]=Math.max(0,m[k]);
  return m;
}
function adjustedMasses(bodyWeight,sex='unspecified'){
  const raw=chandlerMasses(bodyWeight);
  const m={};
  for(const key of SEGMENT_KEYS){
    const mean=(DELEVA.male.mass[key]+DELEVA.female.mass[key])/2;
    const sexRatio=sex==='male'||sex==='female'?DELEVA[sex].mass[key]/mean:1;
    m[key]=raw[key]*sexRatio;
  }
  // Normalize EXACTLY to measured total body weight. Limb values are per side.
  const sum=m.head+m.trunk+2*(m.ua+m.fa+m.hand+m.thigh+m.shank+m.foot);
  for(const key of SEGMENT_KEYS)m[key]*=bodyWeight/sum;
  return m;
}
function segmentFraction(key,sex){
  if(sex==='male'||sex==='female')return DELEVA[sex].com[key];
  return (DELEVA.male.com[key]+DELEVA.female.com[key])/2;
}

const blend=(a,b,r)=>a&&b?{x:a.x+(b.x-a.x)*r,y:a.y+(b.y-a.y)*r}:null;
function chandlerCom2D(p,bodyWeight,sex){
  const mass=adjustedMasses(bodyWeight,sex);
  const shoulder=middle(lookup(p,11),lookup(p,12));
  const hip=middle(lookup(p,23),lookup(p,24));
  if(!shoulder||!hip)return null;
  const parts=[];
  const push=(point,weight)=>{if(point&&weight>0)parts.push({point,weight});};
  const headPoints=[0,7,8].map(i=>lookup(p,i)).filter(Boolean);
  const head=headPoints.length?{x:headPoints.reduce((a,v)=>a+v.x,0)/headPoints.length,y:headPoints.reduce((a,v)=>a+v.y,0)/headPoints.length}:null;
  push(head,mass.head);push(blend(shoulder,hip,segmentFraction('trunk',sex)),mass.trunk);
  for(const [sh,el,wr,fi,hi,kn,an,he,to] of [[11,13,15,19,23,25,27,29,31],[12,14,16,20,24,26,28,30,32]]){
    const [S,E,W,F,H,K,A,He,T]=[sh,el,wr,fi,hi,kn,an,he,to].map(i=>lookup(p,i));
    push(blend(S,E,segmentFraction('ua',sex)),mass.ua);
    push(blend(E,W,segmentFraction('fa',sex)),mass.fa);
    push(blend(W,F,segmentFraction('hand',sex))||W,mass.hand);
    push(blend(H,K,segmentFraction('thigh',sex)),mass.thigh);
    push(blend(K,A,segmentFraction('shank',sex)),mass.shank);
    push(blend(He,T,segmentFraction('foot',sex))||blend(A,T,.5)||A,mass.foot);
  }
  const observed=parts.reduce((a,v)=>a+v.weight,0);
  if(observed/bodyWeight<.93)return null;
  return {x:parts.reduce((a,v)=>a+v.point.x*v.weight,0)/observed,
          y:parts.reduce((a,v)=>a+v.point.y*v.weight,0)/observed};
}

// PUBLIC preview contact heuristic (not the unreleased research detector).
// Initial double support -> lead liftoff -> lead touchdown -> drive liftoff
// -> optional drive touchdown. Complementary bilateral foot-height evidence
// can flag the upper foot as airborne independently of event order.
// These are 2D provisional candidates, not measured ground contacts.
function detectContactSequence(frames,params,width,heightPx,scale){
  const t=frames.map(f=>f.t),n=frames.length;
  const sign=params.direction==='left'?-1:1;
  const flip=params.mirrorSides==='yes';
  const remap=i=>flip?({27:28,28:27,29:30,30:29,31:32,32:31}[i]??i):i;
  // Local pixel-scale fallback only for contact event heuristics, not for GRF.
  const mx=Number.isFinite(scale)&&scale>0?scale:1.7/Math.max(heightPx*.65,1);
  const my=mx;
  const read=(f,isLead)=>{
    const left=(params.hand==='right')===isLead;
    const ankle=lookup(f.pose,remap(left?27:28));
    const heel=lookup(f.pose,remap(left?29:30));
    const toe=lookup(f.pose,remap(left?31:32));
    if(!toe||!heel)return null; // no foot-contact guess from ankle alone
    const mid={x:(toe.x+heel.x)/2,y:(toe.y+heel.y)/2};
    return {x:mid.x,y:mid.y,toeY:toe.y,heelY:heel.y,ankleY:ankle?.y??null};
  };
  const lead=frames.map(f=>read(f,true)),drive=frames.map(f=>read(f,false));
  const med=a=>{const b=a.filter(Number.isFinite).sort((u,v)=>u-v);return b.length?b[Math.floor(b.length/2)]:null;};
  function baseline(rows){
    const first=t[0]??0;
    const head=rows.filter((r,i)=>r&&t[i]-first<=.42).slice(0,16);
    return head.length>=3?{x:med(head.map(r=>r.x)),y:med(head.map(r=>r.y)),
      toeY:med(head.map(r=>r.toeY)),heelY:med(head.map(r=>r.heelY))}:null;
  }
  const baselines={lead:baseline(lead),drive:baseline(drive)};
  function kinematics(rows,base){
    return rows.map((r,i)=>{
      if(!r||!base)return null;
      // Foot landmarks were already temporally smoothed once before this
      // function. Do not median-filter any derived foot tracks again.
      const x=r.x,toeY=r.toeY,heelY=r.heelY;
      const up=Math.min((base.toeY-toeY)*heightPx*my,(base.heelY-heelY)*heightPx*my);
      const travel=(x-base.x)*sign*width*mx;
      const prev=rows[Math.max(0,i-2)],dt=t[i]-t[Math.max(0,i-2)];
      const vx=prev&&dt>.001?(r.x-prev.x)*sign*width*mx/dt:null;
      return {up,travel,vx};
    });
  }
  const L=kinematics(lead,baselines.lead),D=kinematics(drive,baselines.drive);
  // Conventional p5.js-style bilateral foot-height comparison. A foot must
  // appear higher at BOTH toe and heel; an elevated heel alone still permits
  // toe-ground contact. The ankle height, when visible, is a cross-check.
  // The same-frame relative heights avoid dependence on a fixed camera origin.
  // These thresholds are heuristic (not experimentally calibrated).
  const HEIGHT_ENTER_M=.075, HEIGHT_EXIT_M=.042, ANKLE_ENTER_M=.045;
  function relativeHeightEvidence(l,d,threshold){
    if(!l||!d)return null;
    const toeDiff=(d.toeY-l.toeY)*heightPx*my;
    const heelDiff=(d.heelY-l.heelY)*heightPx*my;
    const ankleDiff=Number.isFinite(l.ankleY)&&Number.isFinite(d.ankleY)
      ?(d.ankleY-l.ankleY)*heightPx*my:null;
    const enough=(sign)=>toeDiff*sign>threshold&&heelDiff*sign>threshold&&
      (ankleDiff===null||ankleDiff*sign>ANKLE_ENTER_M*(threshold/HEIGHT_ENTER_M));
    if(enough(1))return 'lead';
    if(enough(-1))return 'drive';
    return null;
  }
  // Three consecutive reliable observations to enter OR exit the state.
  // Hysteresis prevents rapid toggling near the height threshold.
  const heightUpper=Array(n).fill(null),heightDifferenceM=Array(n).fill(null);
  let activeUpper=null,pendingUpper=null;
  for(let i=0;i<n;i++){
    const l=lead[i],d=drive[i];
    if(l&&d){
      const tDiff=(d.toeY-l.toeY)*heightPx*my;
      const hDiff=(d.heelY-l.heelY)*heightPx*my;
      heightDifferenceM[i]=(tDiff+hDiff)/2; // positive = lead foot higher
    }
    // If already classified, retain the state until the weaker EXIT test
    // also disappears for three observations.
    let raw=relativeHeightEvidence(l,d,activeUpper?HEIGHT_EXIT_M:HEIGHT_ENTER_M);
    if(activeUpper){
      const stay=relativeHeightEvidence(l,d,HEIGHT_EXIT_M);
      if(stay===activeUpper)raw=activeUpper;
      else raw=relativeHeightEvidence(l,d,HEIGHT_ENTER_M);
    }
    if(raw===activeUpper){pendingUpper=null;heightUpper[i]=activeUpper;continue;}
    if(!pendingUpper||pendingUpper.value!==raw||pendingUpper.last!==i-1)
      pendingUpper={value:raw,start:i,last:i,count:1};
    else{pendingUpper.last=i;pendingUpper.count++;}
    heightUpper[i]=activeUpper;
    if(pendingUpper.count>=3){
      activeUpper=raw;
      for(let j=pendingUpper.start;j<=i;j++)heightUpper[j]=activeUpper;
      pendingUpper=null;
    }
  }
  const motionEvents=[];
  let stage=0,candidate=null,leadPeakUp=0,drivePeakUp=0;
  const requireFrames=3; // >=3 stable video observations (~0.1s at 30fps)
  const note=(foot,type,next,index)=>motionEvents.push({t:t[index],index,foot,type,phase:next,confidence:'candidate'});
  for(let i=0;i<n;i++){
    const l=L[i],d=D[i];if(l)leadPeakUp=Math.max(leadPeakUp,l.up);
    if(d)drivePeakUp=Math.max(drivePeakUp,d.up);
    let match=false,foot='',type='',next=stage;
    if(stage===0&&l&&baselines.lead){
      // A lifted toe alone, a change of perspective, or forward foot sliding
      // alone must NOT trigger liftoff.
      match=l.up>.075&&l.travel>.07;
      foot='lead';type='takeoff';next=1;
    }else if(stage===1&&l){
      // Landing follows the first sizable foot flight and a forward stride.
      // Near ground + foot slowdown; permit a slight downhill mound landing.
      match=leadPeakUp>.10&&l.travel>.18&&l.up<.055&&Number.isFinite(l.vx)&&Math.abs(l.vx)<.42;
      foot='lead';type='touchdown';next=2;
    }else if(stage===2&&d){
      // Drive-foot departure requires the lead-foot touchdown first.
      match=d.up>.070&&d.travel>.045;
      foot='drive';type='takeoff';next=3;
    }else if(stage===3&&d){
      match=drivePeakUp>.09&&d.travel>.14&&d.up<.065&&Number.isFinite(d.vx)&&Math.abs(d.vx)<.42;
      foot='drive';type='touchdown';next=4;
    }
    if(!match){candidate=null;continue;}
    if(!candidate||candidate.stage!==stage||candidate.last!==i-1){candidate={stage,start:i,last:i,count:1};}
    else {candidate.last=i;candidate.count++;}
    if(candidate.count>=requireFrames){
      note(foot,type,next,candidate.start);stage=next;candidate=null;
    }
  }
  const motionPhases=Array(n).fill(0);
  for(const e of motionEvents)for(let i=e.index;i<n;i++)motionPhases[i]=e.phase;
  // Explicit relative-height evidence takes precedence over the simplified
  // fixed event sequence (which may miss a lift with little horizontal travel).
  // 1: lead airborne; 3: drive airborne. Remaining states come from motion.
  const phases=motionPhases.map((phase,i)=>heightUpper[i]==='lead'?1:heightUpper[i]==='drive'?3:phase);
  const contactAt=(phase,foot)=>foot==='lead'?phase!==1:phase!==3;
  // Emit graph/CSV candidate markers from the EFFECTIVE contact state, so
  // events match force allocation even when a height override occurs.
  const events=[];
  for(let i=1;i<n;i++){
    if(phases[i]===phases[i-1])continue;
    for(const foot of ['lead','drive']){
      const before=contactAt(phases[i-1],foot),after=contactAt(phases[i],foot);
      if(before===after)continue;
      events.push({t:t[i],index:i,foot,type:after?'touchdown':'takeoff',
        phase:phases[i],confidence:'candidate',
        method:heightUpper[i]||heightUpper[i-1]?'relative-foot-height':'foot-motion'});
    }
  }
  const heightUsed=heightUpper.some(Boolean);
  return {events,phases,heightUpper,heightDifferenceM,
    contactSources:phases.map((phase,i)=>heightUpper[i]?'relative-foot-height':
      motionPhases[i]===1||motionPhases[i]===3?'foot-motion':'assumed-both-supported'),
    assumption:heightUsed?'foot-motion-and-relative-foot-height-heuristics':
      motionEvents.length?'foot-motion-heuristic':'both-supported-no-event',
    baselines,diagnostics:{lead:L,drive:D}};
}

// Support-point force partition based on previously filed ground-reaction concept.
// This release uses ONLY the ordinary 2D pelvis midpoint, and distributes
// the resultant according to the provisional foot-contact heuristic.
// All forces are provisional: unmodeled contacts, camera projection, and
// independent right/left foot moments can invalidate this approximation.
function allocateFootForcesFiled({fzTotal,fxTotal,pelvis,leadFoot,driveFoot,scale,width,heightPx,mass,direction,contactPhase=0}){
  const empty={leadVertical:null,driveVertical:null,leadHorizontal:null,
    driveHorizontal:null,leadResultant:null,driveResultant:null,shareLead:null,
    leadHorizontalWorld:null,driveHorizontalWorld:null,
    allocationMethod:'unavailable'};
  if(!Number.isFinite(fzTotal)||!Number.isFinite(fxTotal)||!pelvis||!leadFoot||!driveFoot||
     !Number.isFinite(scale)||!(scale>0))return empty;
  // Normalize all horizontal positions to increasing pitch direction.
  const sign=direction==='left'?-1:1;
  const pX=pelvis.x*sign,leadX=leadFoot.x*sign,driveX=driveFoot.x*sign;
  const sep=leadX-driveX;
  let share;
  if(Math.abs(sep)<.025){
    share=.5; // Both points are projected onto almost the same x position.
  }else{
    const staticShare=(pX-driveX)/sep;
    const separationM=sep*width*scale;
    // Approximate COM height above the support level, from HIP midpoint only.
    const contactY=Math.max(leadFoot.y,driveFoot.y);
    const heightM=Math.max(0,Math.min(2.5,(contactY-pelvis.y)*heightPx*scale));
    // Sagittal-plane point-mass moment balance about rear support:
    // F1z * L = FzTotal * d - (m*ax)*h
    // Here fxTotal=m*ax, and L,d,h are in metres.
    const dynamicN=Math.abs(separationM)>.08 ? fxTotal*heightM/separationM : 0;
    const leadN=Math.max(0,Math.min(fzTotal,fzTotal*staticShare-dynamicN));
    share=fzTotal>1e-6?leadN/fzTotal:Math.max(0,Math.min(1,staticShare));
  }
  // Contact-phase constraints override the double-support load share.
  // 1: lead airborne, 3: drive airborne. 0,2,4: both supported.
  if(contactPhase===1)share=0;
  if(contactPhase===3)share=1;
  share=Math.max(0,Math.min(1,share));
  const leadVertical=fzTotal*share,driveVertical=fzTotal-leadVertical;
  const leadHorizontalWorld=fxTotal*share,driveHorizontalWorld=fxTotal-leadHorizontalWorld;
  // DISPLAY convention (public, simplified visualization): the positive
  // horizontal direction for EACH foot is from its support point TOWARD the
  // pelvis midpoint, matching the displayed support-to-pelvis arrows.
  // This public model estimates a shared net horizontal force, then divides
  // it by load share; it does NOT independently identify the actual direction
  // of each foot's tangential reaction. Therefore show each foot's horizontal
  // magnitude as an INWARD-POSITIVE *reference* value rather than implying
  // that its shared world-direction estimate determines a foot's local sign.
  // Preserve signed pitch-direction components (*HorizontalWorld) separately
  // for force-balance auditing; do not change the estimated magnitudes.
  const leadHorizontal=contactPhase===1?0:Math.abs(leadHorizontalWorld);
  const driveHorizontal=contactPhase===3?0:Math.abs(driveHorizontalWorld);
  // Frame-level invariant: F_i^2 == F_ix^2 + F_iz^2.

  return {leadVertical,driveVertical,leadHorizontal,driveHorizontal,
    leadHorizontalWorld,driveHorizontalWorld,
    leadResultant:Math.hypot(leadVertical,leadHorizontal),
    driveResultant:Math.hypot(driveVertical,driveHorizontal),
    shareLead:share,allocationMethod:contactPhase===1?'lead-airborne':contactPhase===3?'drive-airborne':'filed-support-point-proxy-both-supported'};
}
// The ONLY temporal smoothing in public v1.7: once on each valid MediaPipe
// 2D keypoint (x/y), before any composite landmarks, CoM, angles or derivatives.
// Missing/unreliable center landmarks stay missing; we never fill gaps, and
// visibility/presence at the center frame remain the original observations.
function smoothKeypointFrames(frames,windowSize=3){
  const n=Math.max(1,Math.min(5,Math.round(Number(windowSize)||3)));
  const before=Math.floor((n-1)/2),after=n-1-before;
  const times=frames.map(frame=>frame.t);
  const tracks=Array.from({length:33},(_,id)=>frames.map(frame=>lookup(frame.pose,id)));
  const smoothed=tracks.map(track=>track.map((point,i)=>{
    if(!point)return null;
    if(n===1)return {...point};
    let sx=0,sy=0,count=0;
    for(let j=Math.max(0,i-before);j<=Math.min(track.length-1,i+after);j++){
      const p=track[j];
      if(!p||!Number.isFinite(times[j])||Math.abs(times[j]-times[i])>.16)continue;
      sx+=p.x;sy+=p.y;count++;
    }
    return count?{...point,x:sx/count,y:sy/count}:{...point};
  }));
  return frames.map((frame,i)=>({...frame,pose:Array.isArray(frame.pose)?smoothed.map(track=>track[i]):null}));
}
// A release distance proxy using the same reference and peak-search convention
// as the research version. It is NOT direct detection of ball separation.
function quantileSorted(values,q){
  if(!values.length)return null;
  const v=values.slice().sort((a,b)=>a-b),x=(v.length-1)*q,i=Math.floor(x),f=x-i;
  return v[i]*(1-f)+v[Math.min(i+1,v.length-1)]*f;
}
function scalarMedian(values){return quantileSorted(values.filter(Number.isFinite),.5);}
function firstMeaningfulReleasePeak(distances,times,lo=0,hi=distances.length){
  lo=Math.max(0,lo|0);hi=Math.min(distances.length,hi|0);
  if(hi-lo<5)return -1;
  // Work directly on the distance derived from the once-smoothed keypoints.
  // No independent time-series smoothing is applied to release distances.
  const series=distances;
  const valid=series.slice(lo,hi).filter(Number.isFinite);
  if(valid.length<5)return -1;
  const top=Math.max(...valid),base=scalarMedian(series.slice(lo,Math.min(hi,lo+6)))??0;
  const gate=Math.max(.35,base+.20,top*.32),rise=Math.max(.17,top*.09),fall=Math.max(.065,top*.035);
  const nearby=(i,seconds,before)=>{
    const xs=[];
    for(let j=before?i-1:i+1;
        j>=lo&&j<hi&&(before?times[i]-times[j]<=seconds:times[j]-times[i]<=seconds);
        j+=before?-1:1){
      if(Number.isFinite(series[j]))xs.push(series[j]);
    }
    return xs;
  };
  // The first valid local peak takes priority over a larger follow-through peak.
  for(let i=lo+2;i<hi-2;i++){
    const v=series[i],a=series[i-1],b=series[i+1];
    if(!Number.isFinite(v)||!Number.isFinite(a)||!Number.isFinite(b)||v<gate)continue;
    if(!(v>=a&&v>b))continue;
    const earlier=nearby(i,.42,true),later=nearby(i,.28,false);
    if(earlier.length&&later.length&&v-Math.min(...earlier)>=rise&&v-Math.min(...later)>=fall)return i;
  }
  // If the clip ends on a well-supported plateau, accept its first valid start.
  for(let i=lo+2;i<hi-3;i++){
    const v=series[i];if(!Number.isFinite(v)||v<gate)continue;
    const earlier=nearby(i,.42,true),later=nearby(i,.16,false);
    if(earlier.length<2||later.length<2)continue;
    if(v-Math.min(...earlier)<rise)continue;
    if(Math.max(...later.map(x=>Math.abs(x-v)))<=Math.max(.035,top*.02))return i;
  }
  return -1;
}


// v1.7: Public 2D apparent axial-turn rate (not measured 3D yaw).
// Motivated by MotionCheck p5.js shoulder/waist projected-width angle and by
// conventional angular differentiation. Only horizontal joint separation is
// observed; the signed turning direction is constrained by throw hand + pitch
// direction. Outliers/gaps are not silently replaced by invented measurements.
function angularProjectedWidths(frames,times,params){
  const n=frames.length;
  const hand=params.hand==='left'?'left':'right';
  const direction=params.direction==='left'?-1:1;
  const mirror=params.mirrorSides==='yes';
  function onePair(leftIndex,rightIndex){
    // These are already once-smoothed keypoints. Do NOT smooth projected widths,
    // ratios, angles or angular velocities again.
    const sep=frames.map(f=>{
      const left=lookup(f.pose,mirror?rightIndex:leftIndex),right=lookup(f.pose,mirror?leftIndex:rightIndex);
      if(!left||!right)return null;
      const throwing=hand==='left'?left:right,other=hand==='left'?right:left;
      return (other.x-throwing.x)*direction;
    });
    // Clip-level quantile defines projection scale; it is not temporal filtering.
    const nonnull=sep.filter(Number.isFinite);
    const w=quantileSorted(nonnull.map(Math.abs),.98);
    if(nonnull.length<5||!Number.isFinite(w)||w<.018)return Array(n).fill(null);
    return sep.map(v=>{
      if(!Number.isFinite(v))return null;
      const ratio=v/w;
      if(Math.abs(ratio)>1.2)return null; // impossible outliers: missing, never replaced
      return Math.acos(clamp(ratio,-1,1))*180/Math.PI;
    });
  }
  const upperAngles=onePair(11,12),lowerAngles=onePair(23,24);
  const rateOf=angles=>angles.map((v,i)=>{
    if(!Number.isFinite(v)||i===0||i===n-1)return null;
    const prev=angles[i-1],next=angles[i+1],dt=times[i+1]-times[i-1];
    if(!Number.isFinite(prev)||!Number.isFinite(next)||!(dt>0&&dt<=.30))return null;
    if(Math.abs(next-prev)>175)return null;
    return (next-prev)/dt;
  });
  const twistAngles=upperAngles.map((v,i)=>Number.isFinite(v)&&Number.isFinite(lowerAngles[i])?v-lowerAngles[i]:null);
  const upper=rateOf(upperAngles),lower=rateOf(lowerAngles);
  const twist=upper.map((v,i)=>Number.isFinite(v)&&Number.isFinite(lower[i])?v-lower[i]:null);
  return {upper,lower,twist,upperAngles,lowerAngles,twistAngles};
}

function computePublicMetrics(inputFrames,params,width,heightPx){
  const smoothingFrames=Math.max(1,Math.min(5,Math.round(Number(params.smoothing)||3)));
  // Single common keypoint smoothing pass used by ALL outputs and overlays.
  const frames=smoothKeypointFrames(inputFrames,smoothingFrames);
  const times=frames.map(f=>f.t),flipX=params.direction==='left'?-1:1;
  const angular=angularProjectedWidths(frames,times,params);
  const measured=parseMeasurements(frames,params,width,heightPx),scale=measured.metersPerPixel;
  const pointNames={pelvis:[23,24],thorax:[11,12],shoulderL:[11],shoulderR:[12],elbowL:[13],elbowR:[14],wristL:[15],wristR:[16],handTipL:[19],handTipR:[20]};
  // CoM and all composite positions are computed from smoothed keypoints ONCE.
  // They are NOT time-smoothed after their construction.
  const comTrack=frames.map(f=>chandlerCom2D(f.pose,params.weight,params.sex));
  const points={};
  for(const [k,ids] of Object.entries(pointNames)){
    points[k]=frames.map(f=>ids.length===2?middle(lookup(f.pose,ids[0]),lookup(f.pose,ids[1])):lookup(f.pose,ids[0]));
  }
  // Contact estimates also consume these same smoothed source keypoints.
  const mirrored=params.mirrorSides==='yes';
  const flipSide=index=>mirrored?(index===27?28:index===28?27:index===31?32:index===32?31:index):index;
  const ankleTracks={};const supportTracks={};
  for(const [side,ankleIndex,toeIndex] of [['left',27,31],['right',28,32]]){
    const ankleId=flipSide(ankleIndex),toeId=flipSide(toeIndex);
    ankleTracks[side]=frames.map(f=>lookup(f.pose,ankleId));
    supportTracks[side]=frames.map(f=>{
      const ankle=lookup(f.pose,ankleId),toe=lookup(f.pose,toeId);
      return ankle&&toe?middle(ankle,toe):(toe||ankle);
    });
  }
  // Head center: midpoint of visible ears, falling back to eyes; no invented landmark.
  const headRaw=frames.map(f=>{
    const p=f.pose;
    return middle(lookup(p,7),lookup(p,8)) || middle(lookup(p,2),lookup(p,5)) || null;
  });
  points.head=headRaw;
  points.com=comTrack;
  const pixelVelocity={};for(const k of Object.keys(points))pixelVelocity[k]=times.map((_,i)=>moment(points[k],i,times));
  // Position/CoM, velocity, acceleration, GRF, distances, energies and angles
  // are derived directly from the ONE smoothed-keypoint pass; no extra filtering.
  const speeds={};
  for(const k of Object.keys(points)){
    speeds[k]=pixelVelocity[k].map(v=>v&&scale!=null?Math.hypot(v.x*width,v.y*heightPx)*scale:null);
  }
  const vx=pixelVelocity.com.map(v=>v&&scale!=null?v.x*width*scale:null);
  const vy=pixelVelocity.com.map(v=>v&&scale!=null?-v.y*heightPx*scale:null);
  function diffNumeric(values,i){
    let p=i-1,q=i+1;
    while(p>=0&&!Number.isFinite(values[p]))p--;
    while(q<values.length&&!Number.isFinite(values[q]))q++;
    if(p<0||q>=values.length||q-p>4||!Number.isFinite(values[i]))return null;
    const dt=times[q]-times[p];return dt>0?(values[q]-values[p])/dt:null;
  }
  const ax=vx.map((_,i)=>diffNumeric(vx,i));
  const az=vy.map((_,i)=>diffNumeric(vy,i));
  const wristTrack=points[params.hand==='left'?'wristL':'wristR'];
  const wristAnchor=wristTrack.find(Boolean)?.x??null;
  const contact=detectContactSequence(frames,params,width,heightPx,scale);
  const mapped=frames.map((frame,i)=>{
    const p=frame.pose,wa=wristTrack[i],la=ankleTracks.left[i],ra=ankleTracks.right[i];
    const stride=la&&ra&&scale!=null?Math.abs(la.x-ra.x)*width*scale:null;
    const wristTravel=wa&&scale!=null&&Number.isFinite(wristAnchor)?Math.abs(wa.x-wristAnchor)*width*scale:null;
    const forceHorizontal=Number.isFinite(ax[i])?params.weight*ax[i]*flipX:null;
    // This expression assumes the only net vertical external contact force is ground support.
    // It is NOT valid when a subject is airborne or external contacts are present.
    const forceVertical=Number.isFinite(az[i])?Math.max(0,params.weight*(G+az[i])):null;
    const forceTotal=Number.isFinite(forceHorizontal)&&Number.isFinite(forceVertical)?Math.hypot(forceHorizontal,forceVertical):null;
    // Foot labels respect the thrower's handedness; smoothed support points
    // share the centered averaging convention of the 2D pelvis proxy.
    const leadSide=params.hand==='right'?'left':'right';
    const driveSide=leadSide==='left'?'right':'left';
    const feet={lead:supportTracks[leadSide][i],drive:supportTracks[driveSide][i]};
    const allocation=allocateFootForcesFiled({
      fzTotal:forceVertical,fxTotal:forceHorizontal,pelvis:points.com[i],
      leadFoot:feet.lead,driveFoot:feet.drive,scale,width,heightPx,
      mass:params.weight,direction:params.direction,contactPhase:contact.phases[i]});
    const {leadVertical,driveVertical,leadHorizontal,driveHorizontal,
      leadResultant,driveResultant,leadHorizontalWorld,driveHorizontalWorld,shareLead,allocationMethod}=allocation;
    const obj={upperAngular:angular.upper[i],lowerAngular:angular.lower[i],twistAngular:angular.twist[i],upperAngle:angular.upperAngles[i],lowerAngle:angular.lowerAngles[i],twistAngle:angular.twistAngles[i],t:frame.t,pose:p,center:points.com[i],stride,wristTravel,energy:Number.isFinite(speeds.com[i])?0.5*params.weight*speeds.com[i]**2:null,forceHorizontal,forceVertical,forceTotal,leadVertical,driveVertical,leadHorizontal,driveHorizontal,leadHorizontalWorld,driveHorizontalWorld,leadResultant,driveResultant,shareLead,allocationMethod,contactPhase:contact.phases[i],contactSource:contact.contactSources[i],footHeightDiffM:contact.heightDifferenceM[i],leadContact:contact.phases[i]===1?0:1,driveContact:contact.phases[i]===3?0:1};
    for(const k of Object.keys(points))obj[k==='com'?'comSpeed':k==='pelvis'?'pelvisSpeed':k==='thorax'?'thoraxSpeed':k==='head'?'headSpeed':k]=speeds[k][i];
    // Segment kinetic energy uses approximate mass fractions; not measured mechanical energy.
    const massFraction={pelvis:.142,shoulder:.027,elbow:.016,wrist:.006,tip:.006};
    obj.comEnergy=Number.isFinite(speeds.com[i])?.5*params.weight*speeds.com[i]**2:null;
    obj.pelvisEnergy=Number.isFinite(speeds.pelvis[i])?.5*params.weight*massFraction.pelvis*speeds.pelvis[i]**2:null;
    for(const [part,fraction] of [['shoulder',massFraction.shoulder],['elbow',massFraction.elbow],['wrist',massFraction.wrist],['tip',massFraction.tip]]){
      const base=part==='tip'?'handTip':part;
      for(const side of ['L','R']){
        const speed=speeds[base+side]?.[i];
        obj[part+'Energy'+side]=Number.isFinite(speed)?.5*params.weight*fraction*speed**2:null;
      }
    }
    return obj;
  });
  // Research-version release point convention: forward distance from the
  // backward-most reliable drive-ankle position to the throwing index fingertip.
  // The wrist is used only where the index landmark is missing. The observed
  // distance is graphed at EVERY frame; the first salient extension peak marks
  // the estimated release event. This proxy is not verified ball separation.
  const leadSide=params.hand==='right'?'left':'right';
  const driveSide=leadSide==='left'?'right':'left';
  const driveLandmark=flipSide(driveSide==='left'?27:28);
  const throwingTip=params.hand==='left'?19:20;
  const throwingWrist=params.hand==='left'?15:16;
  const earlyLimit=Math.max(5,Math.min(frames.length,Math.round(frames.length*.6)));
  const anchorXs=frames.slice(0,earlyLimit).map(f=>lookup(f.pose,driveLandmark)?.x).filter(Number.isFinite);
  const driveAnchorX=quantileSorted(anchorXs,params.direction==='left'?.80:.20);
  const tipXs=frames.map(f=>lookup(f.pose,throwingTip)?.x??null);
  const wristXs=frames.map(f=>lookup(f.pose,throwingWrist)?.x??null);
  const extensionX=frames.map((_,i)=>{
    const x=Number.isFinite(tipXs[i])?tipXs[i]:wristXs[i];
    return Number.isFinite(x)&&Number.isFinite(driveAnchorX)&&Number.isFinite(scale)?
      (x-driveAnchorX)*flipX*width*scale:null;
  });
  // Detect a candidate directly on keypoint-derived distance (no further
  // moving average); stable-event tests are not signal smoothing.
  const lo=Math.min(frames.length-1,Math.floor(frames.length*.12));
  const hi=Math.max(lo+1,Math.min(frames.length,Math.ceil(frames.length*.98)));
  const releaseIndex=firstMeaningfulReleasePeak(extensionX,times,lo,hi);
  const releaseEvent=releaseIndex>=0?{
    time:times[releaseIndex],frame:releaseIndex,
    value:extensionX[releaseIndex],
    method:'first-prominent-fingertip-forward-extension-peak',
    point:Number.isFinite(tipXs[releaseIndex])?'index-landmark':'wrist-fallback',
    reference:'drive-ankle-backward-quantile',
    confirmed:false
  }:null;
  for(let i=0;i<mapped.length;i++){
    mapped[i].releasePoint=extensionX[i];
  }
  // Include every metric key shown by a card, even when it has no chart-label alias.
  // This prevents summary cards (e.g., left/right fingertips) from showing a dash
  // while their time-series graph contains valid observations.
  const summaryKeys=new Set([...Object.keys(LABELS),...Object.values(PAGE).flatMap(page=>page.cards.flatMap(card=>card.keys))]);
  const summary={};for(const k of summaryKeys){
    const vals=mapped.map(s=>s[k]).filter(Number.isFinite);
    summary[k]=vals.length?(k==='leadHorizontal'||k==='driveHorizontal'||k==='forceHorizontal'?vals.reduce((a,b)=>Math.abs(b)>Math.abs(a)?b:a):Math.max(...vals.map(Math.abs))):null;
  }
  // The summary is the distance AT the estimated release event, not the
  // potentially larger late follow-through distance.
  summary.releasePoint=releaseEvent?releaseEvent.value:null;
  return {samples:mapped,duration:Math.max(0,times.at(-1)??0),summary,scale:measured,quality:{detected:frames.filter(f=>Array.isArray(f.pose)).length,all:frames.length},events:contact.events,releaseEvent,contactAssumption:contact.assumption,model:'single-pass-filed-grf-support-point-plus-relative-foot-height'};
}

// ---- Same-origin MediaPipe PoseLandmarker with a reusable instance ----
const vendorRoot=new URL('./vendor/',document.baseURI);
let detector=null,loadedModel=null,lastTimestamp=-1;
const vendor=path=>new URL(path,vendorRoot).href;
async function setupModel(model){
  if(detector&&loadedModel===model)return detector;
  const localPaths=['vision_bundle.mjs','wasm/vision_wasm_internal.js','wasm/vision_wasm_internal.wasm',`pose_landmarker_${model}.task`];
  for(const path of localPaths){const res=await fetch(vendor(path),{method:'HEAD'});if(!res.ok)throw Error('同梱モデルが見つかりません: '+path);}
  if(!state.analyzing)notify('姿勢推定モデルを準備しています…',true);
  const imports=await import(vendor('vision_bundle.mjs'));
  const api=[imports,imports.default,imports.default?.default].find(m=>m?.PoseLandmarker&&m?.FilesetResolver);
  if(!api)throw Error('MediaPipeの形式に互換性がありません');
  const fileset=await api.FilesetResolver.forVisionTasks(vendor('wasm'));
  if(detector){try{detector.close()}catch{}}
  const options={baseOptions:{modelAssetPath:vendor(`pose_landmarker_${model}.task`),delegate:'GPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.30,minPosePresenceConfidence:.30,minTrackingConfidence:.30};
  try{detector=await api.PoseLandmarker.createFromOptions(fileset,options)}catch{options.baseOptions.delegate='CPU';detector=await api.PoseLandmarker.createFromOptions(fileset,options)}
  loadedModel=model;lastTimestamp=-1;return detector;
}
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
async function seekTo(second,abort){
  if(abort.aborted)throw Error('解析が中止されました');
  const pos=clamp(second,0,Math.max(0,video.duration-.003));
  if(Math.abs(video.currentTime-pos)<.004 && video.readyState>=2)return;
  await new Promise((resolve,reject)=>{
    let finished=false;const complete=error=>{if(finished)return;finished=true;clearTimeout(timer);video.removeEventListener('seeked',success);video.removeEventListener('error',fail);abort.removeEventListener('abort',cancel);error?reject(error):resolve();};
    const success=()=>complete(),fail=()=>complete(Error('動画デコードに失敗しました')),cancel=()=>complete(Error('解析が中止されました'));
    const timer=setTimeout(()=>complete(Error('動画フレームを読み込めませんでした')),10000);
    video.addEventListener('seeked',success);video.addEventListener('error',fail);abort.addEventListener('abort',cancel,{once:true});video.currentTime=pos;
  });
}
async function inferVideo(config,abort,onProgress=()=>{}){
  if(!Number.isFinite(video.duration)||video.duration<=0)throw Error('動画を読み込めていません');
  const begin=clamp(config.startTime,0,video.duration-.05);
  const end=config.endTime>0?Math.min(video.duration,config.endTime,begin+MAX_ANALYSIS_SECONDS):Math.min(video.duration,begin+MAX_ANALYSIS_SECONDS);
  if(end-begin<.1)throw Error('解析範囲が短すぎます');
  const count=Math.max(2,Math.ceil((end-begin)*config.fps)+1);
  // Set up a determinate total before model load so the UI can show preparation.
  onProgress({phase:'model',done:0,total:count});
  const landmarker=await setupModel(config.model);
  const restored=video.currentTime;video.pause();
  const startStamp=lastTimestamp+1000,frames=[];
  try{
    for(let i=0;i<count;i++){
      if(abort.aborted)throw Error('解析が中止されました');
      const sec=Math.min(video.duration-.003,begin+(end-begin)*i/(count-1));await seekTo(sec,abort);
      const timestamp=Math.max(lastTimestamp+1,startStamp+Math.round((sec-begin)*1000));
      const result=landmarker.detectForVideo(video,timestamp);lastTimestamp=timestamp;
      const pose=result.landmarks?.[0]?.map(pt=>({x:pt.x,y:pt.y,visibility:pt.visibility??1,presence:pt.presence??1}))??null;
      frames.push({t:sec,pose});
      if(i%4===0||i===count-1){onProgress({phase:'frames',done:i+1,total:count});await pause(0);}
    }
  }finally{try{await seekTo(restored,new AbortController().signal)}catch{}}
  return frames;
}

// ---- App and chart ----
const stateReady=()=>state.analysis?.samples?.length;
let toastTimer;
function showAnalysisProgress(){
  $('viewer').classList.add('is-analyzing');
  $('actionbar').classList.add('transient');
  $('analysisProgress').hidden=false;
  $('analysisProgressTitle').textContent='動画を解析しています';
  $('analysisProgressStage').textContent='姿勢推定モデルを準備しています…';
  $('analysisProgressTrack').setAttribute('aria-valuenow','0');
  $('analysisProgressFill').style.width='0%';
  $('analysisProgressPercent').textContent='0%';
  $('analysisProgressCounts').textContent='準備中';
}
function updateAnalysisProgress({phase,done,total}){
  const pct=Math.min(100,Math.max(0,Math.floor(100*done/Math.max(1,total))));
  $('analysisProgressStage').textContent=phase==='model'?'モデル準備中…':'姿勢推定中…';
  $('analysisProgressTrack').setAttribute('aria-valuenow',String(pct));
  $('analysisProgressFill').style.width=`${pct}%`;
  $('analysisProgressPercent').textContent=`${pct}%`;
  $('analysisProgressCounts').textContent=`${done} / ${total} フレーム処理`;
}
function hideAnalysisProgress(){
  $('analysisProgress').hidden=true;
  $('viewer').classList.remove('is-analyzing');
}
function notify(text,persistent=false){$('message').textContent=text;$('actionbar').classList.remove('transient');$('runAnalysis').hidden=true;$('cancelAnalysis').hidden=!state.analyzing;$('dismissMessage').hidden=false;clearTimeout(toastTimer);if(!persistent)toastTimer=setTimeout(()=>$('actionbar').classList.add('transient'),5000);}
const timeLabel=v=>`00:${String(Math.floor(Math.max(0,v))).padStart(2,'0')}.${String(Math.floor((v%1)*100)).padStart(2,'0')}`;
const timing=()=>Number.isFinite(video.duration)?video.duration:0;
const nearest=()=>state.analysis?.samples?.reduce((a,b)=>Math.abs(b.t-state.t)<Math.abs(a.t-state.t)?b:a);
const chartDefs=()=>PAGE[state.page].cards;
// Only show a playback value while the current time is inside the analyzed clip.
// Outside a selected <=20s interval, reusing the nearest sample would be misleading.
function sampleAtPlaybackTime(){
  const samples=state.analysis?.samples;
  if(!samples?.length)return null;
  const first=samples[0].t,last=samples[samples.length-1].t;
  if(state.t<first-.015 || state.t>last+.015)return null;
  // Samples are ordered by time. Binary search avoids scanning all frames on playback.
  let lo=0,hi=samples.length-1;
  while(lo<hi){const mid=(lo+hi)>>1;if(samples[mid].t<state.t)lo=mid+1;else hi=mid;}
  if(lo===0)return samples[0];
  return Math.abs(samples[lo].t-state.t)<Math.abs(samples[lo-1].t-state.t)?samples[lo]:samples[lo-1];
}
function liveNumber(value,unit){
  if(!Number.isFinite(value))return '—';
  const decimals=unit==='m'?2:1;
  const v=Math.abs(value)<0.5*(10**-decimals)?0:value;
  return v.toLocaleString('ja-JP',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
}
function updateSeriesTabs(){
  const sample=sampleAtPlaybackTime();
  for(const c of chartDefs()){
    const node=$('tab_'+c.id);if(!node)continue;
    const plottedKeys=c.chartKeys||c.keys;
    const unit=c.chartUnit||c.unit;
    const values=plottedKeys.map((key,i)=>{
      const number=liveNumber(sample?.[key],unit);
      return plottedKeys.length>1?`${c.keyLabels?.[i]||(i===0?'左':'右')} ${number}`:number;
    });
    const text=values.join(' · ');
    const display=text+(values.every(v=>v==='—'||v.endsWith(' —'))?'':` ${unit}`);
    if(node.textContent!==display)node.textContent=display;
    const tab=node.parentElement;
    tab.setAttribute('aria-label',`${c.chartKeys?c.name.replace('角速度','角度'):c.name}：${values.join('、')} ${unit}（再生位置での参考値）`);
  }
}

function pickPage(name){if(!PAGE[name])return;state.page=name;buildCards();render();}
function toggleCard(id){const current=state.selected[state.page];if(current.has(id))current.delete(id);else{
  const selectedDef=PAGE[state.page].cards.find(c=>current.has(c.id));const selectedUnit=selectedDef?.chartUnit||selectedDef?.unit;
  const def=PAGE[state.page].cards.find(c=>c.id===id);
  if(selectedUnit&&selectedUnit!==(def.chartUnit||def.unit)){current.clear();notify('グラフの単位を切り替えました');}current.add(id);
}buildCards();render();}
function seriesKeys(){return chartDefs().filter(c=>state.selected[state.page].has(c.id)).flatMap(c=>c.chartKeys||c.keys);}
function styleSeries(element,c){const primary=COLORS[c.keys[0]]||'#196d83';element.dataset.series='true';element.style.setProperty('--series-color',primary);element.style.setProperty('--series-secondary',COLORS[c.keys.at(-1)]||primary);element.style.setProperty('--series-ink','#fff');}
function buildCards(){
  $('metrics').replaceChildren();$('tabs').replaceChildren();$('metrics').dataset.page=state.page;document.querySelector('.results').dataset.page=state.page;
  document.querySelectorAll('#pageSwitch button').forEach(b=>{const active=b.dataset.page===state.page;b.classList.toggle('selected',active);b.setAttribute('aria-selected',String(active));});
  for(const c of chartDefs()){
    const active=state.selected[state.page].has(c.id);
    const m=document.createElement('div');m.className='metric'+(active?' is-selected':'');m.tabIndex=0;m.setAttribute('role','button');m.setAttribute('aria-pressed',String(active));styleSeries(m,c);
    const symbol=document.createElement('span');symbol.className='metric-symbol green';symbol.textContent=c.icon;
    const body=document.createElement('div');body.className='metric-body';
    const title=document.createElement('label');title.textContent=c.name;
    const measure=document.createElement('div');measure.className=c.keys.length>1?'measure dual':'measure';
    c.keys.forEach((key,i)=>{const span=document.createElement('span');span.className='measure-pair';if(c.keys.length>1){const side=document.createElement('span');side.className='side-name';side.textContent=c.keyLabels?.[i]||(i?'右':'左');span.append(side);}const val=document.createElement('strong');val.id='v_'+key;val.textContent='—';span.append(val);measure.append(span);});
    const unit=document.createElement('small');unit.textContent=c.unit;measure.append(unit);
    // Compact two-line indicators: title, then value with unit.
    // Explanation remains in the help text; do not add a third visible line.
    body.append(title,measure);m.append(symbol,body);m.onclick=()=>toggleCard(c.id);m.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleCard(c.id);}};$('metrics').append(m);
    const tab=document.createElement('button');styleSeries(tab,c);
    tab.className='series-tab'+(active?' selected':'')+(c.keys.length>1?' has-dual-value':'');
    tab.setAttribute('aria-pressed',String(active));
    // Current-frame figures are separate from the summary/maximum values in metric cards.
    const tabLabel=document.createElement('span');tabLabel.className='series-tab-name';
    tabLabel.textContent=state.page==='angular'?c.name:(c.tab||c.name.replace('速度','').replace('参考','').replace('全身',''));
    const tabValue=document.createElement('span');tabValue.className='series-tab-value';
    tabValue.id='tab_'+c.id;tabValue.textContent='—';
    tab.append(tabLabel,tabValue);
    tab.onclick=()=>toggleCard(c.id);$('tabs').append(tab);
  }
  $('pageHelp').textContent=state.page==='angular'?'【2D投影参考推定】上胴・下胴・捻転の角度（°）と角速度（°/s）を、カード選択で切り替えます。異なる単位の系列は同時に表示せず、縦軸を切り替えます。角速度カードはピーク（°/s）です。捻転角度＝上胴角度−下胴角度（同一フレーム）。肩・骨盤の投影幅から得る見かけの角度で、絶対的な3D軸回旋角度ではありません。カメラ方向・遮蔽・身体の傾きに左右され、欠測はゼロとして扱いません。':state.page==='forces'?'【参考推定】足部動作と左右足の高さ差から接地候補を推測し、支持点・推定重心・加速度から床反力を配分。脚別水平値は重心向きを正とする参考表示で、各足の実際の作用方向は独立には推定していません。▲離地、▼接地（候補）。':state.page==='dynamics'?'推定リリースポイントは、軸足足首の後方基準位置から投球側人差し指先（欠測時は手首）までの前方距離です。グラフの◆は投球期に最初に現れる有意な伸展ピークの推定時刻です。実際のボール離手点ではありません。部位エネルギーは概算質量比と速度による参考値です。':'速度は画像内2D位置の変化から求めています。重心はChandler身体部分質量モデルによる2D参考推定です。';
  $('pageHelp').title=$('pageHelp').textContent;
  // Keep the same force visibility control in all four chart pages.
  // In 02 it controls the selected force curves themselves; in the other
  // pages it controls the separate F1/F2 resultant overlay on the N axis.
  const forceToggle=$('forceLayerToggle');
  const forceLabel=forceToggle.closest('label');
  forceLabel.hidden=false;
  const forceHint=state.page==='forces'
    ? '02 床反力：選択中の床反力系列をまとめて表示／非表示（選択は保持）'
    : '踏込足 F1 と軸足 F2 の床反力（各合力）を右側 N 軸に重ねて表示／非表示';
  forceLabel.title=forceHint;
  forceToggle.setAttribute('aria-label',forceHint);
}
const svgNode=(name,props={},str)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(props).forEach(([k,v])=>n.setAttribute(k,v));if(str!==undefined)n.textContent=str;return n;};
function axisRange(nums,min=1){const v=nums.filter(Number.isFinite);if(!v.length)return [0,min];let lower=Math.min(0,...v),upper=Math.max(0,...v);const pad=Math.max((upper-lower)*.1,.1);lower=lower<0?lower-pad:0;upper=Math.max(min,upper+pad);return [lower,upper];}
function chart(){
  const svg=$('plot'),legend=$('legend');svg.replaceChildren();legend.replaceChildren();
  const rows=state.analysis?.samples??[];
  // Page 02 consists entirely of force series; OFF hides the plotted
  // force curves while retaining the user's series selections.
  const forceSeriesHidden=state.page==='forces'&&!state.showForces;
  const keys=forceSeriesHidden?[]:seriesKeys();
  if(!rows.length){svg.append(svgNode('text',{x:Math.max(160,svg.getBoundingClientRect().width/2),y:79,'text-anchor':'middle','font-size':13,fill:'#799199'},'動画を読み込んで解析してください'));return;}
  // Single toggle overlays two separately estimated foot-resultant magnitudes on the same N scale.
  const overlay=state.showForces&&state.page!=='forces'?['driveResultant','leadResultant']:[];
  const vals=rows.flatMap(r=>keys.map(k=>r[k])),v2=rows.flatMap(r=>overlay.map(k=>r[k]));
  const [low,high]=axisRange(vals,1),[fLow,fHigh]=axisRange(v2,100);
  // Recompute chart geometry from the actual container width; keep labels in bounds.
  const actualWidth=Math.max(280,svg.getBoundingClientRect().width||520);
  const actualHeight=Math.max(160,svg.getBoundingClientRect().height||170);
  const viewW=Math.max(320,Math.round(actualWidth));
  const viewH=Math.max(170,Math.round(actualHeight));
  svg.setAttribute('viewBox',`0 0 ${viewW} ${viewH}`);
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  const bounds={x0:Math.min(62,Math.max(45,viewW*.12)),x1:viewW-(overlay.length?58:18),y0:19,y1:viewH-36},dur=Math.max(.1,rows.at(-1).t-rows[0].t);
  const fx=t=>bounds.x0+(t-rows[0].t)/dur*(bounds.x1-bounds.x0);
  const fy=(v,force)=>bounds.y1-(v-(force?fLow:low))/((force?fHigh-fLow:high-low)||1)*(bounds.y1-bounds.y0);
  const defs=svgNode('defs'),clipping=svgNode('clipPath',{id:'plot-clip'});clipping.append(svgNode('rect',{x:bounds.x0,y:bounds.y0,width:bounds.x1-bounds.x0,height:bounds.y1-bounds.y0}));defs.append(clipping);svg.append(defs);
  for(let i=0;i<=4;i++){
    const cy=bounds.y1-i/4*(bounds.y1-bounds.y0),cx=bounds.x0+i/4*(bounds.x1-bounds.x0);
    svg.append(svgNode('line',{x1:bounds.x0,y1:cy,x2:bounds.x1,y2:cy,stroke:'#dde8e8'}));
    svg.append(svgNode('line',{x1:cx,y1:bounds.y0,x2:cx,y2:bounds.y1,stroke:'#e6eeee','stroke-dasharray':'3 6'}));
    const l=low+i/4*(high-low);if(!forceSeriesHidden)svg.append(svgNode('text',{x:bounds.x0-6,y:cy+4,'text-anchor':'end','font-size':10,fill:'#607886'},Math.abs(l)>=20?String(Math.round(l)):l.toFixed(1)));
    if(overlay.length){const v=fLow+i/4*(fHigh-fLow);svg.append(svgNode('text',{x:bounds.x1+6,y:cy+4,'font-size':10,fill:'#c77a27'},String(Math.round(v))));}
    svg.append(svgNode('text',{x:cx,y:viewH-8,'text-anchor':'middle','font-size':10,fill:'#667d89'},(rows[0].t+i/4*dur).toFixed(2)));
  }
  const selectedCard=chartDefs().find(c=>state.selected[state.page].has(c.id));
  const unit=selectedCard?(selectedCard.chartUnit||selectedCard.unit):state.page==='angular'?'°':'';
  if(!forceSeriesHidden)svg.append(svgNode('text',{x:bounds.x0,y:10,'font-size':10,fill:'#718998'},unit));
  if(forceSeriesHidden)svg.append(svgNode('text',{
    x:(bounds.x0+bounds.x1)/2,y:(bounds.y0+bounds.y1)/2,
    'text-anchor':'middle','font-size':13,fill:'#718998'
  },'床反力は非表示です（床反力 N をONで再表示）'));
  if(overlay.length)svg.append(svgNode('text',{x:bounds.x1+3,y:10,'font-size':10,fill:'#c77a27'},'床反力 (N)'));
  for(const key of [...keys,...overlay]){
    const isForce=overlay.includes(key),parts=[];let started=false;
    for(const r of rows){const v=r[key];if(!Number.isFinite(v)){started=false;continue;}
      parts.push(`${started?'L':'M'}${fx(r.t).toFixed(2)},${fy(v,isForce).toFixed(2)}`);started=true;}
    svg.append(svgNode('path',{d:parts.join(' '),stroke:COLORS[key]||'#4d8190','stroke-width':isForce?2.1:2.5,fill:'none','stroke-linejoin':'round','clip-path':'url(#plot-clip)',...(isForce?{'stroke-dasharray':'5,3'}:{})}));
    const item=document.createElement('span'),dot=document.createElement('i');dot.className='dot';dot.style.background=COLORS[key];item.append(dot,document.createTextNode(LABELS[key]||key));legend.append(item);
  }
  // Compact markers: orange=lead, blue=drive; ▲ takeoff / ▼ touchdown.
  const evts=state.analysis?.events||[];
  for(const e of evts){
    if(e.t<rows[0].t||e.t>rows.at(-1).t)continue;
    const x=fx(e.t),color=e.foot==='lead'?'#f39b33':'#499ff4';
    svg.append(svgNode('line',{x1:x,y1:bounds.y0,x2:x,y2:bounds.y1,stroke:color,'stroke-width':1.35,'stroke-dasharray':'3,5',opacity:.85}));
    const mark=svgNode('text',{x,y:bounds.y1+11,'text-anchor':'middle','font-size':12,'font-weight':800,fill:color},e.type==='takeoff'?'▲':'▼');
    mark.append(svgNode('title',{},`${e.foot==='lead'?'踏込足':'軸足'}${e.type==='takeoff'?'離地':'接地'} 候補 ${e.t.toFixed(2)}秒`));
    svg.append(mark);
  }
  if(state.page==='dynamics'&&keys.includes('releasePoint')&&Number.isFinite(state.analysis?.releaseEvent?.time)){
    const ev=state.analysis.releaseEvent;
    if(ev.time>=rows[0].t&&ev.time<=rows.at(-1).t){
      const x=fx(ev.time),color=COLORS.releasePoint;
      svg.append(svgNode('line',{x1:x,y1:bounds.y0,x2:x,y2:bounds.y1,stroke:color,'stroke-width':1.6,opacity:.9}));
      const marker=svgNode('text',{x,y:bounds.y1+12,'text-anchor':'middle','font-size':13,'font-weight':850,fill:color},'◆');
      marker.append(svgNode('title',{},`推定リリース ${ev.time.toFixed(2)}秒／軸足→指先 ${Number.isFinite(ev.value)?ev.value.toFixed(2)+'m':'不明'}`));
      svg.append(marker);
      const item=document.createElement('span'),dot=document.createElement('i');
      dot.textContent='◆';dot.style.color=color;item.append(dot,document.createTextNode('リリース（推定）'));legend.append(item);
    }
  }
  if(evts.length){
    for(const [color,name] of [['#f39b33','踏込足'],['#499ff4','軸足']]){
      const item=document.createElement('span'),dot=document.createElement('i');
      dot.className='dot';dot.style.background=color;item.append(dot,document.createTextNode(`${name} ▲離地／▼接地候補`));legend.append(item);
    }
  }
  const cursor=fx(clamp(state.t,rows[0].t,rows.at(-1).t));svg.append(svgNode('line',{x1:cursor,y1:bounds.y0,x2:cursor,y2:bounds.y1,stroke:'#183b4a','stroke-width':1.5}));svg.append(svgNode('circle',{cx:cursor,cy:bounds.y0,r:3,fill:'#183b4a'}));
}
function updateVideoLayers(){
  const media=$('media');
  media.classList.toggle('video-hidden',!state.showVideo);
  media.classList.toggle('pose-hidden',!state.showPose);
  const videoButton=$('videoDisplayButton'),poseButton=$('displayButton');
  videoButton.textContent=state.showVideo?'動画 ON':'動画 OFF';
  poseButton.textContent=state.showPose?'骨格 ON':'骨格 OFF';
  videoButton.setAttribute('aria-pressed',String(state.showVideo));
  poseButton.setAttribute('aria-pressed',String(state.showPose));
  videoButton.setAttribute('aria-label',state.showVideo?'動画を非表示にする':'動画を表示する');
  poseButton.setAttribute('aria-label',state.showPose?'骨格フレームを非表示にする':'骨格フレームを表示する');
  const arrowButton=$('arrowsDisplayButton');
  arrowButton.textContent=state.showArrows?'反力矢印 ON':'反力矢印 OFF';
  arrowButton.setAttribute('aria-pressed',String(state.showArrows));
  arrowButton.setAttribute('aria-label',state.showArrows?'反力矢印を非表示にする':'反力矢印を表示する');
}
// Face landmarks 0-10 are already returned by MediaPipe Pose Landmarker.
// Facial keypoints and light connecting segments only; no synthetic head contour.
// Each marker and segment is drawn only when its own landmarks pass lookup().
function drawHeadOverlay(ctx, position, dpr){
  const p=Array.from({length:11},(_,i)=>position(i));
  const face=p.map((v,i)=>({v,i})).filter(q=>q.v);
  const line=(a,b)=>{
    if(!p[a]||!p[b])return;
    ctx.beginPath();ctx.moveTo(p[a].x,p[a].y);ctx.lineTo(p[b].x,p[b].y);ctx.stroke();
  };
  ctx.save();
  ctx.strokeStyle='rgba(193,255,157,.8)';
  ctx.lineWidth=Math.max(1,1.35*dpr);
  ctx.lineCap='round';ctx.lineJoin='round';
  // Light facial skeleton, intentionally less prominent than the body skeleton.
  for(const [a,b] of [[7,3],[3,2],[2,1],[1,0],[0,4],[4,5],[5,6],[6,8],[9,10]])line(a,b);
  for(const {v,i} of face){
    ctx.beginPath();ctx.arc(v.x,v.y,(i===0?2.8:2.05)*dpr,0,2*Math.PI);
    ctx.fillStyle=i===0?'#d9ffad':'#a2f96b';ctx.fill();
    ctx.strokeStyle='#0b3341';ctx.lineWidth=1.05*dpr;ctx.stroke();
  }
  ctx.restore();
}
function drawOverlay(){
  const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
  if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);
  if(!state.analysis||!video.videoWidth||( !state.showPose && !state.showArrows ))return;
  const sample=nearest();if(!sample?.pose)return;
  const scale=Math.min(w/video.videoWidth,h/video.videoHeight),ww=video.videoWidth*scale,hh=video.videoHeight*scale,ox=(w-ww)/2,oy=(h-hh)/2;
  const position=i=>{const p=lookup(sample.pose,i);return p?{x:ox+p.x*ww,y:oy+p.y*hh}:null;};
  if(state.showPose){
  drawHeadOverlay(ctx,position,dpr);
  const joins=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[27,31],[24,26],[26,28],[28,32]];
  ctx.strokeStyle='#b2f765';ctx.lineWidth=Math.max(2,2.1*dpr);
  for(const [a,b] of joins){const pa=position(a),pb=position(b);if(!pa||!pb)continue;ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();}
  for(const i of [11,12,13,14,15,16,23,24,25,26,27,28,31,32]){const p=position(i);if(!p)continue;ctx.fillStyle='#a2f96b';ctx.strokeStyle='#0b3341';ctx.lineWidth=1.7*dpr;ctx.beginPath();ctx.arc(p.x,p.y,3*dpr,0,Math.PI*2);ctx.fill();ctx.stroke();}
  const c=sample.center;if(c){const x=ox+c.x*ww,y=oy+c.y*hh;ctx.fillStyle='#17b4e4';ctx.strokeStyle='#fff';ctx.lineWidth=2*dpr;ctx.beginPath();ctx.arc(x,y,7*dpr,0,2*Math.PI);ctx.fill();ctx.stroke();}
  }
  if(state.showArrows){
    const mass=Number(state.config.weight)||70;
    // Diagram arrow: the direction ALWAYS goes from each foot to the
    // simplified center (2D pelvis midpoint). This is NOT the measured GRF
    // vector direction; magnitude is scaled to 1 BW at the center.
    const simplifiedCoM=sample.center;
    if(!simplifiedCoM)return;
    const center={x:ox+simplifiedCoM.x*ww,y:oy+simplifiedCoM.y*hh};
    const flip=state.config.mirrorSides==='yes';
    const sideIndex=anatomicalLeft=>anatomicalLeft!==flip ? [27,31] : [28,32];
    const drawFoot=(isLead,color)=>{
      const anatomicalLeft=(state.config.hand==='right')===isLead;
      const [ankle,foot]=sideIndex(anatomicalLeft),a=position(ankle),f=position(foot);
      const anchor=a&&f?{x:(a.x+f.x)/2,y:(a.y+f.y)/2}:(f||a);
      if(!anchor)return;
      const mag=sample[isLead?'leadResultant':'driveResultant'];
      if(!Number.isFinite(mag)||mag<5)return;
      // 1 body weight -> arrow reaches the center, 2 BW -> twice the
      // foot-to-center displacement. Clamp only drawn size for readability.
      const fraction=Math.min(1.7,mag/(mass*G));
      const tip={x:anchor.x+(center.x-anchor.x)*fraction,
                 y:anchor.y+(center.y-anchor.y)*fraction};
      const dx=tip.x-anchor.x,dy=tip.y-anchor.y,theta=Math.atan2(dy,dx),wing=Math.min(14*dpr,Math.max(6*dpr,Math.hypot(dx,dy)*.24));
      ctx.strokeStyle='#112735';ctx.lineWidth=5*dpr;ctx.beginPath();ctx.moveTo(anchor.x,anchor.y);ctx.lineTo(tip.x,tip.y);ctx.stroke();
      ctx.strokeStyle=color;ctx.lineWidth=3*dpr;ctx.beginPath();ctx.moveTo(anchor.x,anchor.y);ctx.lineTo(tip.x,tip.y);ctx.stroke();
      ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.lineTo(tip.x-wing*Math.cos(theta-.48),tip.y-wing*Math.sin(theta-.48));ctx.lineTo(tip.x-wing*Math.cos(theta+.48),tip.y-wing*Math.sin(theta+.48));ctx.closePath();ctx.fill();
      ctx.font=`${Math.max(11*dpr,12)}px sans-serif`;ctx.textAlign='center';
      const label=`${isLead?'踏込':'軸足'} ${Math.round(mag)}N`;
      ctx.strokeStyle='#112735';ctx.lineWidth=3*dpr;ctx.strokeText(label,tip.x,tip.y-8*dpr);ctx.fillText(label,tip.x,tip.y-8*dpr);
    };
    drawFoot(true,'#f39b33');drawFoot(false,'#499ff4');
  }
}
function currentSummary(){
  for(const c of chartDefs())for(const k of c.keys){const el=$('v_'+k);if(!el)continue;const n=state.analysis?.summary?.[k];el.textContent=Number.isFinite(n)?(c.unit==='N'?Math.round(n).toLocaleString('ja-JP'):n.toFixed(c.unit==='m'?2:1)):'—';}
}
function render(){
  const d=timing();$('seek').max=d||1;$('seek').value=clamp(state.t,0,d||1);$('currentTime').textContent=timeLabel(state.t);$('duration').textContent=timeLabel(d);
  $('chartTitle').textContent=state.page==='forces'?'脚別推定床反力（N）':state.page==='angular'?((chartDefs().find(c=>state.selected.angular.has(c.id))?.unit==='°/s')?'回旋角速度の推移（°/s）':'回旋角度の推移（°）'):(chartDefs().find(c=>state.selected[state.page].has(c.id))?.unit||'')+'の推移';
  $('modeNote').textContent=state.analysis?`参考計算・${state.analysis.events.length}候補イベント`:'未解析';
  const phase=nearest()?.contactPhase??0;
  const phaseText=['両足支持（仮定）','踏込足 離地','両足支持（候補）','軸足 離地','軸足再接地（候補）'][phase];
  $('videoMeta').textContent=state.loadingVideo?(state.videoLoadStatus||'動画読み込み中…'):(state.analysis?`解析済み・${phaseText}（参考値）`:'動画読込済み・解析待ち');
  $('mediaTag').textContent=state.loadingVideo?'◉ 動画読み込み中':(state.analysis?'◉ 解析済み':'◉ 動画読込済み');
  $('watermark').textContent='出願済み荷重配分｜足部の動き・左右高さ差は接地候補（参考値）';
  currentSummary();updateSeriesTabs();chart();updateVideoLayers();drawOverlay();
  $('forceLayerToggle').checked=state.showForces;
  updateExportToolbar();
}
// Fullscreen shows the complete preview, including transport controls.
// The CSS fallback keeps the custom skeleton/force overlays on iPhone Safari,
// where arbitrary-element Fullscreen API availability varies.
const viewer=$('viewer');
function viewerIsFullscreen(){
  return document.fullscreenElement===viewer || document.webkitFullscreenElement===viewer
    || viewer.classList.contains('simulated-fullscreen');
}
function syncViewerFullscreen(){
  const active=viewerIsFullscreen(),button=$('expandButton');
  document.documentElement.classList.toggle('viewer-fullscreen-active',active);
  button.textContent=active?'⤡':'⛶';
  button.setAttribute('aria-label',active?'通常表示に戻す':'全画面表示にする');
  button.setAttribute('title',active?'通常表示に戻す':'全画面表示にする');
  button.setAttribute('aria-pressed',String(active));
}
function resizeViewerOverlay(){
  // Viewport and grid sizes settle after fullscreenchange / CSS transition.
  requestAnimationFrame(()=>{drawOverlay();requestAnimationFrame(drawOverlay);});
}
function enterSimulatedFullscreen(){
  viewer.classList.add('simulated-fullscreen');
  document.documentElement.classList.add('fullscreen-fallback-active');
  syncViewerFullscreen();resizeViewerOverlay();
}
function exitSimulatedFullscreen(){
  viewer.classList.remove('simulated-fullscreen');
  document.documentElement.classList.remove('fullscreen-fallback-active');
  syncViewerFullscreen();resizeViewerOverlay();
}
async function toggleViewerFullscreen(){
  if(viewer.classList.contains('simulated-fullscreen')){
    exitSimulatedFullscreen();return;
  }
  if(document.fullscreenElement===viewer || document.webkitFullscreenElement===viewer){
    try{
      if(document.exitFullscreen)await document.exitFullscreen();
      else if(document.webkitExitFullscreen)await document.webkitExitFullscreen();
    }catch(error){console.warn('全画面解除に失敗しました',error);}
    syncViewerFullscreen();resizeViewerOverlay();return;
  }
  const request=viewer.requestFullscreen || viewer.webkitRequestFullscreen;
  if(request){
    try{
      // Request during the user click (required by browser activation rules).
      await request.call(viewer);
      if(document.fullscreenElement===viewer || document.webkitFullscreenElement===viewer){
        syncViewerFullscreen();resizeViewerOverlay();return;
      }
    }catch(error){console.info('標準全画面が利用できないため画面内全画面に切替',error);}
  }
  enterSimulatedFullscreen();
}

function stopPlay(){state.playing=false;video.pause();$('play').textContent='▶';}
function seek(t){state.t=clamp(t,0,timing());if(video.readyState>=1){try{video.currentTime=state.t}catch{}}render();}
function togglePlay(){if(state.analyzing||state.mode==='empty')return;if(state.playing){stopPlay();return;}if(state.t>=timing()-.02)seek(0);state.playing=true;$('play').textContent='Ⅱ';video.play().catch(e=>{stopPlay();notify('再生失敗：'+e.message);});}
function advance(){if(state.playing){state.t=video.currentTime;if(video.ended)stopPlay();render();}requestAnimationFrame(advance);}
function guide(){stopPlay();state.guide=true;$('welcome').classList.remove('hidden');$('workspace').classList.add('hidden');$('navHome').classList.add('active');$('navAnalyze').classList.remove('active');$('guideResume').classList.toggle('hidden',!state.fileURL);setGuideInputs();}
function resultView(){state.guide=false;$('welcome').classList.add('hidden');$('workspace').classList.remove('hidden');$('navHome').classList.remove('active');$('navAnalyze').classList.add('active');render();}
function setGuideInputs(){$('guideHeight').value=state.config.height;$('guideWeight').value=state.config.weight;$('guideSex').value=state.config.sex;$('guideDirection').value=state.config.direction;$('guideHand').value=state.config.hand;}
function acceptGuide(){const height=Number($('guideHeight').value),weight=Number($('guideWeight').value);if(!(height>=80&&height<=230&&weight>=10&&weight<=250))return false;Object.assign(state.config,{height,weight,sex:$('guideSex').value,direction:$('guideDirection').value,hand:$('guideHand').value});return true;}
function fillSettings(){for(const k of Object.keys(DEFAULTS)){const input=$(k+'Input');if(input)input.value=state.config[k];}$('manualScaleWrap').classList.toggle('hidden',state.config.scale!=='manual');}
function saveSettings(){if(!$('settingsForm').reportValidity())return false;for(const k of Object.keys(DEFAULTS)){const input=$(k+'Input');if(!input)continue;state.config[k]=['height','weight','fps','smoothing','startTime','endTime','manualScale'].includes(k)?Number(input.value):input.value;}
  if(state.config.endTime>0&&state.config.endTime<=state.config.startTime+.1){notify('解析時刻の範囲を確認してください',true);return false;}
  if(state.config.endTime>0&&state.config.endTime-state.config.startTime>MAX_ANALYSIS_SECONDS+.0001){notify('1回の解析は最大20秒です。終了時刻を調整してください',true);return false;}
  setGuideInputs();state.analysis=null;if(state.fileURL)state.mode='video';notify('設定を保存しました。変更を反映するには再解析してください');render();return true;}
let videoLoadSerial=0;
let pendingVideoController=null;
const VIDEO_LOAD_MARK='form-analysis-public-video-loading-v165';
function rememberVideoLoading(){
  try{sessionStorage.setItem(VIDEO_LOAD_MARK,String(Date.now()));}catch{/* Storage may be unavailable in private browsing. */}
}
function clearVideoLoading(){
  try{sessionStorage.removeItem(VIDEO_LOAD_MARK);}catch{/* Storage may be unavailable. */}
}
function reportInterruptedVideoLoading(){
  try{
    const since=Number(sessionStorage.getItem(VIDEO_LOAD_MARK));
    clearVideoLoading();
    if(since>0 && Date.now()-since<600000){
      const message='動画の読み込み中にページが再起動された可能性があります。動画を端末に保存し、もう一度選択してください。';
      $('guideStatus').classList.add('error');$('guideStatus').textContent=message;
      notify(message,true);
    }
  }catch{/* Storage may be unavailable. */}
}
const VIDEO_LOAD_MAX_MS=180000;
// In iPhone Safari an off-screen or display:none video, especially with
// preload="metadata", may never advance to HAVE_METADATA for a local MOV.
// The successful v1.6.1 release used preload="auto". Keep the player visible
// while waiting instead of gating the entire analysis screen on metadata.
function awaitVideoMetadata(token,signal,onProgress,diagnostics){
  return new Promise((resolve,reject)=>{
    const begin=Date.now();let finished=false,poll=null,timeout=null;
    const events=['loadedmetadata','loadeddata','canplay','durationchange','resize','error','abort','stalled','suspend'];
    const cleanup=()=>{
      clearInterval(poll);clearTimeout(timeout);
      for(const name of events)video.removeEventListener(name,check);
      signal.removeEventListener('abort',cancel);
    };
    const finish=(error)=>{if(finished)return;finished=true;cleanup();error?reject(error):resolve();};
    const cancel=()=>finish(Error('動画の読み込みを中止しました'));
    const check=(event)=>{
      if(signal.aborted||token!==videoLoadSerial){cancel();return;}
      // Follow v1.6.1: metadata is sufficient; do not require dimensions,
      // duration, or a decoded first frame to finish importing.
      if(video.readyState>=1 || (event?.type==='loadedmetadata' && video.videoWidth>0)){
        finish();return;
      }
      if(video.error){finish(Error(`Safariのメディアエラー ${video.error.code}（${video.error.message||'詳細なし'}）`));}
    };
    for(const name of events)video.addEventListener(name,check);
    signal.addEventListener('abort',cancel,{once:true});
    poll=setInterval(()=>{
      if(finished)return;
      onProgress(Math.min(180,Math.floor((Date.now()-begin)/1000)),diagnostics());
      check();
    },1000);
    timeout=setTimeout(()=>finish(Error(`180秒経過しても動画情報を取得できませんでした（${diagnostics()}）。MOVの形式・iOSの動画読み込み状態を確認してください`)),VIDEO_LOAD_MAX_MS);
    // The source can still be the previously loaded video here; first check
    // only after the new source has been assigned and load() called.
  });
}
let restoreVideoSnapshot=null;
async function openVideo(file){
  if(!file)return;
  if(!(file.type.startsWith('video/')||/\.(mp4|mov|webm|m4v)$/i.test(file.name))){
    notify('動画ファイルを選択してください',true);return;
  }
  // Retain the last SUCCESSFULLY loaded video when repeated imports overlap.
  if(!state.loadingVideo){
    restoreVideoSnapshot={url:state.fileURL,mode:state.mode,analysis:state.analysis,t:state.t};
  }
  pendingVideoController?.abort();
  const token=++videoLoadSerial,controller=new AbortController(),previous=restoreVideoSnapshot;
  pendingVideoController=controller;
  if(state.abort)state.abort.abort();
  stopPlay();
  let url;
  try{url=URL.createObjectURL(file);}catch(e){notify('動画を開けませんでした：'+e.message,true);return;}
  rememberVideoLoading();state.loadingVideo=true;
  const fileLabel=file.name.length>36?file.name.slice(0,33)+'…':file.name;
  let fileProbe='未確認';
  try{
    Promise.resolve(file.slice(0,32).arrayBuffer()).then(b=>{
      fileProbe=b.byteLength>0?'ファイル読み取りOK':'空ファイル';
    }).catch(e=>{fileProbe='ファイル読取エラー '+(e?.name||'');});
  }catch(e){fileProbe='ファイル読取エラー '+e.name;}
  const diagnostics=()=>`ファイル:${(file.size/1048576).toFixed(1)}MiB ${file.type||'形式不明'}、ファイル:${fileProbe}、メディア状態:${video.readyState}/${video.networkState}${video.error?'、エラー:'+video.error.code:''}`;
  const progress=(elapsed,diag)=>{
    const msg=`${fileLabel}：動画情報を取得中 ${elapsed}秒 / 180秒`;
    state.videoLoadStatus=msg;
    $('guideStatus').classList.remove('error');$('guideStatus').textContent=msg;
    $('videoMeta').textContent=msg;
    $('mediaTag').textContent='◉ 動画読み込み中';
    // Keep errors and status visible; tell the user how to permit native
    // playback if Safari does not start preloading the MOV.
    $('message').textContent=elapsed>=12?`${msg}。進まない場合は動画画面の▶を押してください（${diag}）`:msg;
  };
  let success=false;
  try{
    // Start the media request with the same preload strategy as v1.6.1.
    video.preload='auto';
    const waiting=awaitVideoMetadata(token,controller.signal,progress,diagnostics);
    video.src=url;
    state.fileURL=url;state.analysis=null;state.mode='video';state.t=0;
    state.showVideo=true;state.showPose=true;
    updateVideoLayers();
    // Critical iOS change: make the player visible while metadata is pending.
    // Keeping its ancestor display:none can defer MOV loading indefinitely.
    resultView();
    video.load();
    $('navAnalyze').disabled=true;
    progress(0,diagnostics());
    notify(`${fileLabel}：読み込み中です。進まないときは動画画面の▶を押してください。`,true);
    await waiting;
    if(token!==videoLoadSerial||controller.signal.aborted)return;
    success=true;
    state.loadingVideo=false;state.videoLoadStatus='';
    state.fileURL=url;state.analysis=null;state.mode='video';state.t=0;
    $('navAnalyze').disabled=false;
    $('guideStatus').classList.remove('error');
    $('guideStatus').textContent=file.name+' を読み込みました';
    render();
    notify('動画を読み込みました。解析ボタンを押してください。',true);
    if(previous?.url && previous.url!==url)URL.revokeObjectURL(previous.url);
  }catch(e){
    if(token!==videoLoadSerial)return;
    const msg='動画を読み込めませんでした：'+e.message;
    state.fileURL=previous?.url||null;
    state.mode=previous?.url?previous.mode:'empty';
    state.analysis=previous?.analysis||null;
    state.t=previous?.t||0;
    state.loadingVideo=false;state.videoLoadStatus='';
    $('navAnalyze').disabled=false;
    try{video.removeAttribute('src');video.load();if(previous?.url){video.preload='auto';video.src=previous.url;video.load();}}catch{}
    $('guideStatus').classList.add('error');$('guideStatus').textContent=msg;
    $('videoMeta').textContent=msg;
    if(!previous?.url)guide();else render();
    notify(msg,true);
    console.error('動画読込エラー',e,diagnostics());
  }finally{
    if(!success)URL.revokeObjectURL(url);
    if(token===videoLoadSerial){
      clearVideoLoading();state.loadingVideo=false;state.videoLoadStatus='';
      pendingVideoController=null;restoreVideoSnapshot=null;
    }
  }
}
async function analyze(){
  if(state.loadingVideo){notify('動画の情報取得を待っています。読み込みが進まない場合は再生▶を押してください。',true);return;}if(state.analyzing||state.mode==='empty'){if(state.mode==='empty'){guide();notify('動画を先に選んでください');}return;}
  state.analyzing=true;state.abort=new AbortController();stopPlay();$('navAnalyze').disabled=true;resultView();showAnalysisProgress();
  try{notify('解析を開始しています…',true);
    if(state.config.endTime>0&&state.config.endTime-state.config.startTime>MAX_ANALYSIS_SECONDS+.0001)throw Error('解析範囲は最大20秒です。設定を調整してください');
    const frames=await inferVideo(state.config,state.abort.signal,updateAnalysisProgress);
    if(state.abort.signal.aborted)throw Error('解析は中止されました');
    state.analysis=computePublicMetrics(frames,state.config,video.videoWidth,video.videoHeight);
    state.mode='real';state.t=frames[0]?.t||0;seek(state.t);
    notify(`解析が完了しました（${state.analysis.quality.detected}/${state.analysis.quality.all}フレーム・イベント候補${state.analysis.events.length}件）。結果は参考値です。`);
  }catch(e){notify('解析エラー：'+e.message,true);console.error(e);}
  finally{hideAnalysisProgress();state.analyzing=false;state.abort=null;$('navAnalyze').disabled=false;$('cancelAnalysis').hidden=true;render();}
}
// Video export: on-device compositing with optional source-video audio.
// MediaElementAudioSourceNode works without video.captureStream() (unavailable
// in some Safari versions). It is created lazily, only on an explicit audio-on
// save click, and reused because an element can only have one MediaElementSource.
let activeVideoExport=null, lastVideoExportURL=null, exportAudioGraph=null;
function exportMimeType(withAudio=false){
  if(typeof MediaRecorder==='undefined')return null;
  const candidates=withAudio?
    // Generic MP4 can result in unusual VP9+Opus in MP4 on Chromium.
    // Prefer explicit H.264/AAC; otherwise WebM+Opus before generic MP4.
    ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
     'video/webm;codecs="vp8,opus"','video/webm;codecs="vp9,opus"',
     'video/mp4','video/webm']:
    ['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'];
  return candidates.find(t=>MediaRecorder.isTypeSupported(t))||'';
}
function prepareExportAudio(){
  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtor)throw Error('このブラウザは動画の音声録音に対応していません。音声なしで保存してください。');
  if(!exportAudioGraph){
    const context=new AudioCtor();
    try{
      const source=context.createMediaElementSource(video);
      const monitor=context.createGain();
      // Preserve a playback output path after the first sound-enabled export.
      source.connect(monitor);monitor.connect(context.destination);
      exportAudioGraph={context,source,monitor};
    }catch(e){void context.close().catch(()=>{});throw e;}
  }
  const {context,source,monitor}=exportAudioGraph;
  const sink=context.createMediaStreamDestination();
  source.connect(sink);
  const track=sink.stream.getAudioTracks()[0];
  if(!track){source.disconnect(sink);throw Error('動画の音声トラックを録画用に作成できませんでした');}
  // Keep the speakers quiet during export; audio continues to the recording sink.
  monitor.gain.value=0;
  // Called synchronously from the save button's user gesture, before any await.
  const ready=context.resume();
  return {track,ready,release(){
    try{source.disconnect(sink)}catch{}
    try{track.stop()}catch{}
    monitor.gain.value=0;
  }};
}
function updateExportToolbar(){
  const button=$('saveVideo');
  const busy=!!activeVideoExport;
  $('recordAudio').disabled=busy;
  button.disabled=state.analyzing||state.loadingVideo||state.mode==='empty'||!video.videoWidth||(!busy&&(typeof MediaRecorder==='undefined'||typeof HTMLCanvasElement.prototype.captureStream!=='function'));
  button.classList.toggle('is-recording',busy);
  button.textContent=busy?'■ 保存を中止':'↓ 動画保存';
  button.setAttribute('aria-label',busy?'動画の保存を中止する':'動画・骨格・床反力矢印の現在の表示状態で動画を保存');
}
function compositedVideoFrame(ctx,exportCanvas){
  const w=exportCanvas.width,h=exportCanvas.height;
  ctx.fillStyle='#11272e';ctx.fillRect(0,0,w,h);
  if(state.showVideo&&video.readyState>=2){ctx.drawImage(video,0,0,w,h);}
  if((state.showPose||state.showArrows)&&state.analysis){
    // Overlay canvas is sized to the displayed letterboxed video; extract its
    // actual image rectangle so the exported drawing aligns with native pixels.
    drawOverlay();
    const sw=canvas.width,sh=canvas.height;
    if(sw>0&&sh>0&&video.videoWidth>0&&video.videoHeight>0){
      const scale=Math.min(sw/video.videoWidth,sh/video.videoHeight);
      const rw=video.videoWidth*scale,rh=video.videoHeight*scale;
      ctx.drawImage(canvas,(sw-rw)/2,(sh-rh)/2,rw,rh,0,0,w,h);
    }
  }
}
function videoExportRange(){
  const rows=state.analysis?.samples;
  if(rows?.length>1){return [rows[0].t,rows[rows.length-1].t];}
  const start=clamp(Number(state.config.startTime)||0,0,Math.max(0,video.duration-.1));
  return [start,Math.min(video.duration,start+MAX_ANALYSIS_SECONDS)];
}
async function exportVideo(){
  if(activeVideoExport){activeVideoExport.cancel();return;}
  if(state.analyzing||state.loadingVideo||state.mode==='empty'||!video.videoWidth){notify('先に動画を読み込んでください');return;}
  if(typeof MediaRecorder==='undefined'||typeof HTMLCanvasElement.prototype.captureStream!=='function'){
    $('recordStatus').textContent='このブラウザは動画保存に対応していません';
    notify('動画保存が利用できません。Safari / Chromeの最新版でお試しください。',true);return;
  }
  const [start,end]=videoExportRange(),duration=end-start;
  if(!Number.isFinite(duration)||duration<.1){notify('保存する動画区間がありません',true);return;}
  if(!state.showVideo&&!state.showPose&&!state.showArrows){notify('動画・骨格・反力矢印がすべてOFFです。少なくとも1つをONにしてください',true);return;}
  if(!state.showVideo&&!state.analysis){notify('動画OFFでの保存には解析結果が必要です',true);return;}
  const withAudio=$('recordAudio').checked;
  const audioLabel=withAudio?'音声あり':'音声なし';
  const mime=exportMimeType(withAudio);
  // Keep longest side <=1280px to reduce iPhone memory and encoding failures.
  const srcW=video.videoWidth,srcH=video.videoHeight,shrink=Math.min(1,1280/Math.max(srcW,srcH));
  const exportCanvas=document.createElement('canvas');
  exportCanvas.width=Math.max(2,Math.floor(srcW*shrink/2)*2);
  exportCanvas.height=Math.max(2,Math.floor(srcH*shrink/2)*2);
  const context=exportCanvas.getContext('2d',{alpha:false});
  if(!context){notify('動画保存用のCanvasを作成できませんでした',true);return;}
  const oldTime=video.currentTime;
  stopPlay();
  if(lastVideoExportURL){URL.revokeObjectURL(lastVideoExportURL);lastVideoExportURL=null;}
  const anchor=$('recordDownload');anchor.hidden=true;anchor.removeAttribute('href');
  let recorder,stream,audioSetup=null,raf=0,interval=0,watchdog=0,saveError=null,finishResolve;
  const previousMuted=video.muted;
  let canceled=false,finishing=false,lastProgress=0,lastMediaTime=-1,lastAdvance=performance.now();
  const session={cancel(){canceled=true;if(recorder?.state==='recording')recorder.stop();}};
  activeVideoExport=session;
  $('viewer').classList.add('is-exporting');$('app').classList.add('is-exporting');
  $('recordStatus').textContent='動画を準備しています…';updateExportToolbar();
  const disableIds=['videoDisplayButton','displayButton','arrowsDisplayButton','expandButton','play','seek','backFrame','nextFrame','navAnalyze'];
  const previousDisabled=new Map(disableIds.map(id=>[id,$(id).disabled]));
  for(const id of disableIds)$(id).disabled=true;
  const stopRecorder=()=>{if(finishing)return;finishing=true;cancelAnimationFrame(raf);if(recorder?.state==='recording')recorder.stop();};
  try{
    // AudioContext.resume must be initiated in the same user gesture that
    // initiated export; do not move this below the first async seek.
    if(withAudio)audioSetup=prepareExportAudio();
    await seekTo(start,new AbortController().signal);
    if(audioSetup){
      await Promise.race([audioSetup.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('音声処理の起動がタイムアウトしました。音声なしで保存してください。')),10000))]);
      if(exportAudioGraph.context.state!=='running')throw Error('音声処理を開始できませんでした。もう一度保存ボタンを押してください。');
      // The media element must be unmuted while recording. Muted sources
      // produce silence in Web Audio even if a destination track exists.
      video.muted=false;
    }
    state.t=video.currentTime;compositedVideoFrame(context,exportCanvas);
    stream=exportCanvas.captureStream(30);
    if(!stream?.getVideoTracks().length)throw Error('動画を録画するトラックを作成できませんでした');
    if(audioSetup)stream.addTrack(audioSetup.track);
    if(withAudio&&!stream.getAudioTracks().length)throw Error('録画用の音声トラックを取得できませんでした');
    const chunks=[];
    const options=mime?{mimeType:mime,videoBitsPerSecond:2500000}:{videoBitsPerSecond:2500000};
    recorder=new MediaRecorder(stream,options);
    const recorded= new Promise((resolve,reject)=>{
      finishResolve=resolve;
      recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
      recorder.onerror=e=>{saveError=e.error||Error('動画のエンコードに失敗しました');stopRecorder();};
      recorder.onstop=()=>{
        if(saveError){reject(saveError);return;}
        const finalType=recorder.mimeType||mime||'video/webm';
        resolve(new Blob(chunks,{type:finalType}));
      };
    });
    recorder.start(1000);
    $('recordStatus').textContent=`録画中：0%（${audioLabel}）`;
    const paint=now=>{
      if(finishing||canceled)return;
      if(video.readyState>=2){
        state.t=video.currentTime;
        compositedVideoFrame(context,exportCanvas);
        if(now-lastProgress>250){
          const pct=Math.floor(100*clamp((state.t-start)/duration,0,1));
          $('recordStatus').textContent=`録画中 ${pct}% / ${duration.toFixed(1)}秒（${audioLabel}）`;
          lastProgress=now;
        }
        if(state.t>lastMediaTime+.001){lastAdvance=now;lastMediaTime=state.t;}
        if(state.t>=end-.03||video.ended){stopRecorder();return;}
      }
      if(now-lastAdvance>16000){saveError=Error('動画再生が進まなかったため保存を中止しました');stopRecorder();return;}
      raf=requestAnimationFrame(paint);
    };
    raf=requestAnimationFrame(paint);
    // Without an explicit stop, a decode or Safari background interruption
    // should never leave the Save button indefinitely disabled.
    watchdog=setTimeout(()=>{if(!finishing){saveError=Error('動画保存が時間内に完了しませんでした');stopRecorder();}},Math.max(30000,Math.ceil(duration*3000+15000)));
    if(canceled){stopRecorder();}
    else {try{await video.play();}catch(e){if(withAudio)throw Error('ブラウザが音声付き再生を許可しませんでした。音声なしにして保存するか、Safariの再生制限を確認してください。');throw e;}state.playing=true;$('play').textContent='Ⅱ';}
    const blob=await recorded;
    if(canceled){$('recordStatus').textContent='保存を中止しました';return;}
    if(!blob.size)throw Error('録画ファイルが空でした');
    const mp4=/mp4/i.test(blob.type),ext=mp4?'mp4':'webm';
    const name=`FORM_ANALYSIS_Public_v1.7_${Date.now()}.${ext}`;
    lastVideoExportURL=URL.createObjectURL(blob);
    anchor.href=lastVideoExportURL;anchor.download=name;anchor.hidden=false;
    $('recordStatus').textContent=`${ext.toUpperCase()}・${(blob.size/1048576).toFixed(1)} MB・${audioLabel}`;
    // Automatic download where supported. Keep an explicit link for iOS Safari.
    anchor.click();
    notify(`動画を作成しました（${ext.toUpperCase()}）。保存されない場合は「保存した動画を開く」を押してください。`);
  }catch(e){
    $('recordStatus').textContent='保存に失敗しました';
    notify('動画を保存できません：'+(e?.message||String(e)),true);
    if(recorder?.state==='recording'){try{recorder.stop()}catch{}}
  }finally{
    cancelAnimationFrame(raf);clearTimeout(watchdog);clearInterval(interval);
    try{stream?.getTracks().forEach(track=>track.stop())}catch{}
    try{audioSetup?.release()}catch{}
    video.muted=previousMuted;
    if(exportAudioGraph)exportAudioGraph.monitor.gain.value=previousMuted?0:1;
    if(state.playing)stopPlay();
    try{await seekTo(oldTime,new AbortController().signal)}catch{}
    state.t=Number.isFinite(video.currentTime)?video.currentTime:oldTime;
    activeVideoExport=null;
    $('viewer').classList.remove('is-exporting');$('app').classList.remove('is-exporting');
    for(const [id,disabled] of previousDisabled)$(id).disabled=disabled;
    updateExportToolbar();render();
  }
}
async function snapshot(){
  try{
    if(!video.videoWidth)throw Error('動画がありません');
    const out=document.createElement('canvas');
    out.width=video.videoWidth;out.height=video.videoHeight;
    const ctx=out.getContext('2d');
    ctx.fillStyle='#11272e';ctx.fillRect(0,0,out.width,out.height);
    if(state.showVideo){
      if(video.readyState<2)throw Error('動画フレームをデコード中です');
      ctx.drawImage(video,0,0,out.width,out.height);
    }
    if((state.showPose||state.showArrows)&&state.analysis){
      // Crop the letterboxed overlay to its video-image rectangle before export.
      const sw=canvas.width,sh=canvas.height;
      const scale=Math.min(sw/out.width,sh/out.height);
      const regionW=out.width*scale,regionH=out.height*scale;
      ctx.drawImage(canvas,(sw-regionW)/2,(sh-regionH)/2,regionW,regionH,0,0,out.width,out.height);
    }
    out.toBlob(b=>{
      if(!b){notify('画像の作成に失敗しました');return;}
      const u=URL.createObjectURL(b),a=document.createElement('a');
      a.href=u;a.download='FORM_ANALYSIS_Public_v1.7_frame.png';a.click();
      setTimeout(()=>URL.revokeObjectURL(u),800);
    },'image/png');
  }catch(e){notify('PNGを保存できません：'+e.message);}
}
function exportCsv(){if(!stateReady()){notify('先に解析を実行してください');return;}
  const keys=['t','contactPhase','contactSource','footHeightDiffM','leadContact','driveContact','comSpeed','headSpeed','pelvisSpeed','thoraxSpeed','shoulderL','shoulderR','elbowL','elbowR','wristL','wristR','handTipL','handTipR','forceTotal','forceVertical','forceHorizontal','leadResultant','driveResultant','leadVertical','driveVertical','leadHorizontal','driveHorizontal','leadHorizontalWorld','driveHorizontalWorld','stride','wristTravel','energy','releasePoint','upperAngle','lowerAngle','twistAngle','upperAngular','lowerAngular','twistAngular','comEnergy','pelvisEnergy','shoulderEnergyL','shoulderEnergyR','elbowEnergyL','elbowEnergyR','wristEnergyL','wristEnergyR','tipEnergyL','tipEnergyR','shareLead'];
  const lines=['# FORM ANALYSIS Public Preview v1.7','# Chandler segment-mass based 2D projected CoM (sex-stratified de Leva correction), research estimate; NOT measured 3D CoM',`# MediaPipe keypoints x/y ONLY: selected smoothing_frames=${state.config.smoothing} (1=none; max 5; no missing-center imputation); all derived quantities computed afterward without extra smoothing`,'# Keypoint-only single-pass smoothing: no separate temporal filtering of CoM, velocity, acceleration, forces, projected angles/angular velocity or release distance; NOT measured foot GRF',`# height_cm=${state.config.height} weight_kg=${state.config.weight} sex(anthropometric)=${state.config.sex}`,'# Contact candidates: sequential foot motion + relative bilateral toe/heel/ankle height difference, 3 stable observations; 2D unvalidated heuristic', '# footHeightDiffM: positive means lead foot appears higher than drive; camera perspective, steps and mounds can misclassify support', '# leadHorizontal/driveHorizontal: inward-positive reference magnitudes (foot -> CoM); each resultant equals hypot(vertical,horizontal) within the SAME frame', '# *HorizontalWorld: signed pitch-direction allocation, sums to forceHorizontal (not the inward-display convention)', '# releasePoint: estimated forward distance (m) from drive-ankle backward quantile to throwing index fingertip (wrist fallback); diamond = first prominent extension peak, NOT measured ball release', '# upperAngle/lowerAngle: apparent projected shoulder/hip angles in deg (NOT true 3D yaw); plotted on 04', '# twistAngle = upperAngle - lowerAngle in deg at the SAME frame (may be negative)', '# upperAngular/lowerAngular: apparent angular velocities in deg/s derived from the angle tracks; switchable graph with degree/s axis; card values are absolute peaks', '# twistAngular = upperAngular - lowerAngular at the same frame; NOT measured 3D torso torsion',`# contact_assumption=${state.analysis.contactAssumption}`,...state.analysis.events.map(e=>`# event=${e.foot}_${e.type},time_s=${e.t.toFixed(3)},quality=candidate`),keys.join(',')];
  for(const row of state.analysis.samples)lines.push(keys.map(k=>
    Number.isFinite(row[k])?row[k].toFixed(5):typeof row[k]==='string'?row[k]:'').join(','));
  const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='FORM_ANALYSIS_PUBLIC_v1.7.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('CSVを保存しました');
}
async function cacheOffline(){const status=$('runtimeStatus');if(!('serviceWorker'in navigator)||!/^https?:$/.test(location.protocol)){status.textContent='HTTP(S)経由で起動してください';return;}
  try{const reg=await navigator.serviceWorker.register('./service-worker.js');await navigator.serviceWorker.ready;const active=reg.active||navigator.serviceWorker.controller;
    if(!active){status.textContent='端末キャッシュの準備中';return;}
    const channel=new MessageChannel();channel.port1.onmessage=e=>{status.textContent=e.data?.ok?'オフライン用の同一配信元資産を保存しました':'モデル資産のキャッシュに失敗しました。ネット接続時に再度開いてください';};
    active.postMessage({type:'CACHE_ALL_LOCAL_ASSETS'},[channel.port2]);
  }catch(e){status.textContent='キャッシュ登録に失敗しました：'+e.message;}
}
function attach(){
  window.addEventListener('unhandledrejection',e=>{console.error(e.reason);notify('予期しないエラー：'+String(e.reason?.message||e.reason),true);});
  fileInput.onchange=e=>{const file=e.target.files?.[0];e.target.value='';if(activeVideoExport){notify('動画保存の完了後に別の動画を選んでください');return;}if(file)void openVideo(file);};
  for(const id of ['guideImport','navImport','importHere'])$(id).addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fileInput.click();}});
  $('guideResume').onclick=()=>{acceptGuide();resultView();};
  for(const id of ['guideHeight','guideWeight','guideSex','guideDirection','guideHand'])$(id).onchange=acceptGuide;
  $('navHome').onclick=guide;
  $('navSettings').onclick=()=>{fillSettings();$('settingsDialog').showModal();requestAnimationFrame(()=>{$('settingsDialog').querySelector('.settings-scroll').scrollTop=0;});};
  $('navInfo').onclick=()=>{$('statusDetails').textContent=state.analysis?`解析有効フレーム：${state.analysis.quality.detected}/${state.analysis.quality.all}`:'解析待ち';$('helpDialog').showModal();};
  $('navAnalyze').onclick=()=>{resultView();analyze();};
  $('settingsForm').addEventListener('submit',e=>{if(e.submitter?.id==='saveSettings'&&!saveSettings())e.preventDefault();});
  $('scaleInput').onchange=()=>{$('manualScaleWrap').classList.toggle('hidden',$('scaleInput').value!=='manual');};
  $('runAnalysis').onclick=analyze;$('cancelAnalysis').onclick=()=>state.abort?.abort();$('analysisProgressCancel').onclick=()=>state.abort?.abort();$('dismissMessage').onclick=()=>{clearTimeout(toastTimer);$('actionbar').classList.add('transient');};
  $('forceLayerToggle').onchange=e=>{state.showForces=e.target.checked;render();};$('exportCsv').onclick=exportCsv;$('exportPng').onclick=snapshot;$('saveVideo').onclick=()=>void exportVideo();
  $('play').onclick=togglePlay;$('backFrame').onclick=()=>{stopPlay();seek(state.t-1/Math.max(10,state.config.fps));};$('nextFrame').onclick=()=>{stopPlay();seek(state.t+1/Math.max(10,state.config.fps));};
  $('seek').oninput=e=>{stopPlay();seek(Number(e.target.value));};
  video.addEventListener('timeupdate',()=>{if(!state.analyzing&&state.mode!=='empty'){state.t=video.currentTime;if(!state.playing)render();}});
  $('videoDisplayButton').onclick=()=>{state.showVideo=!state.showVideo;updateVideoLayers();};
  $('displayButton').onclick=()=>{state.showPose=!state.showPose;updateVideoLayers();drawOverlay();};
  $('arrowsDisplayButton').onclick=()=>{state.showArrows=!state.showArrows;updateVideoLayers();drawOverlay();};
  $('expandButton').onclick=toggleViewerFullscreen;
  for(const eventName of ['fullscreenchange','webkitfullscreenchange']){
    document.addEventListener(eventName,()=>{syncViewerFullscreen();resizeViewerOverlay();});
  }

  document.querySelectorAll('#pageSwitch button').forEach(b=>b.onclick=()=>pickPage(b.dataset.page));
  window.addEventListener('resize',()=>{drawOverlay();chart();});
  if('ResizeObserver'in window){const plotObserver=new ResizeObserver(()=>chart());plotObserver.observe($('plot'));}
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&viewer.classList.contains('simulated-fullscreen')){e.preventDefault();exitSimulatedFullscreen();return;}if(e.target.matches('input,select,textarea')||document.querySelector('dialog[open]'))return;if(e.code==='Space'){e.preventDefault();togglePlay();}else if(e.key==='ArrowRight'){e.preventDefault();seek(state.t+1/30);}else if(e.key==='ArrowLeft'){e.preventDefault();seek(state.t-1/30);}});
}
buildCards();attach();guide();render();reportInterruptedVideoLoading();void cacheOffline();requestAnimationFrame(advance);
})();
