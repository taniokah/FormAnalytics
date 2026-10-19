/* FORM ANALYSIS Public Preview v1.6.6
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
const COLORS={leadResultant:'#f39b33',driveResultant:'#499ff4',leadVertical:'#df851b',driveVertical:'#317fd4',leadHorizontal:'#b76b17',driveHorizontal:'#225faf',pelvisSpeed:'#078d79',thoraxSpeed:'#3286d3',shoulderL:'#ac62d2',shoulderR:'#ea9550',elbowL:'#2377b8',elbowR:'#d3637a',wristL:'#00a09a',wristR:'#d28d39',handTipL:'#9d59cb',handTipR:'#db725c',forceTotal:'#2a7398',forceVertical:'#ed9636',forceHorizontal:'#9c60d5',stride:'#0b9299',wristTravel:'#267aa2',energy:'#8f68ce'};
const LABELS={leadResultant:'踏込足 床反力（合力）',driveResultant:'軸足 床反力（合力）',leadVertical:'踏込足 鉛直（参考配分）',driveVertical:'軸足 鉛直（参考配分）',leadHorizontal:'踏込足 水平（骨盤中心向き＋・参考）',driveHorizontal:'軸足 水平（骨盤中心向き＋・参考）',pelvisSpeed:'骨盤中心速度',thoraxSpeed:'胸郭中心速度',shoulderL:'左肩',shoulderR:'右肩',elbowL:'左肘',elbowR:'右肘',wristL:'左手首',wristR:'右手首',handTipL:'左手先（人差し指）',handTipR:'右手先（人差し指）',forceTotal:'全身参考合力',forceVertical:'参考鉛直反力',forceHorizontal:'参考水平反力',stride:'足首間前後距離',wristTravel:'投球手首の水平移動量',energy:'骨盤中心の参考エネルギー'};
const PAGE={speed:{cards:[
 {id:'pelvis',name:'骨盤中心速度',keys:['pelvisSpeed'],unit:'m/s',icon:'⌖',hint:'左右股関節中点（全身重心ではありません）'},
 {id:'thorax',name:'胸郭中心速度',keys:['thoraxSpeed'],unit:'m/s',icon:'⌁',hint:'左右肩中点'},
 {id:'shoulders',name:'両肩速度',keys:['shoulderL','shoulderR'],unit:'m/s',icon:'⌁',hint:'左右別'},
 {id:'elbows',name:'両肘速度',keys:['elbowL','elbowR'],unit:'m/s',icon:'⌁',hint:'左右別'},
 {id:'wrists',name:'両手首速度',keys:['wristL','wristR'],unit:'m/s',icon:'⌁',hint:'左右別'},
 {id:'hand-tips',name:'両手先速度',keys:['handTipL','handTipR'],unit:'m/s',icon:'⇢',hint:'左右人差し指先（MediaPipe 19・20）'}
 ]},forces:{cards:[
 {id:'lead-resultant',name:'踏込足 合力',tab:'踏込 合力',keys:['leadResultant'],unit:'N',icon:'↗',hint:'接地候補と支持点配分による参考値'},
 {id:'drive-resultant',name:'軸足 合力',tab:'軸足 合力',keys:['driveResultant'],unit:'N',icon:'↗',hint:'接地候補と支持点配分による参考値'},
 {id:'lead-vertical',name:'踏込足 鉛直反力',tab:'踏込 鉛直',keys:['leadVertical'],unit:'N',icon:'↑',hint:'接地候補と支持点配分による参考値'},
 {id:'drive-vertical',name:'軸足 鉛直反力',tab:'軸足 鉛直',keys:['driveVertical'],unit:'N',icon:'↑',hint:'接地候補と支持点配分による参考値'},
 {id:'lead-horizontal',name:'踏込足 水平反力',tab:'踏込 水平',keys:['leadHorizontal'],unit:'N',icon:'↔',hint:'骨盤中心向き＋の参考表示（方向は独立推定していません）'},
 {id:'drive-horizontal',name:'軸足 水平反力',tab:'軸足 水平',keys:['driveHorizontal'],unit:'N',icon:'↔',hint:'骨盤中心向き＋の参考表示（方向は独立推定していません）'}
 ]},dynamics:{cards:[
 {id:'stride',name:'足首間前後距離',keys:['stride'],unit:'m',icon:'↔',hint:'画面内の左右足首間隔'},
 {id:'wristTravel',name:'投球手首の移動量',keys:['wristTravel'],unit:'m',icon:'⇢',hint:'開始フレームからの水平移動距離'},
 {id:'energy',name:'骨盤中心の参考エネルギー',keys:['energy'],unit:'J',icon:'◈',hint:'½ × 体重 × 骨盤中心速度²'}
 ]}};
const DEFAULTS={height:175,weight:70,sex:'unspecified',hand:'right',direction:'right',mirrorSides:'no',model:'heavy',fps:30,startTime:0,endTime:0,scale:'auto',manualScale:.002};
const state={config:{...DEFAULTS},page:'speed',selected:{speed:new Set(['pelvis','thorax']),forces:new Set(['lead-resultant','drive-resultant']),dynamics:new Set(['stride','wristTravel'])},showForces:true,fileURL:null,mode:'empty',analysis:null,t:0,playing:false,analyzing:false,abort:null,showPose:true,showVideo:true,showArrows:true,guide:true};
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
      // Three-frame median rejects isolated poor keypoints but never fills a
      // completely absent joint (no hidden contact or force imputation).
      const window=rows.slice(Math.max(0,i-1),Math.min(n,i+2)).filter(Boolean);
      const x=window.length>=2?med(window.map(q=>q.x)):r.x;
      const toeY=window.length>=2?med(window.map(q=>q.toeY)):r.toeY;
      const heelY=window.length>=2?med(window.map(q=>q.heelY)):r.heelY;
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
  return {leadVertical,driveVertical,leadHorizontal,driveHorizontal,
    leadHorizontalWorld,driveHorizontalWorld,
    leadResultant:Math.hypot(leadVertical,leadHorizontalWorld),
    driveResultant:Math.hypot(driveVertical,driveHorizontalWorld),
    shareLead:share,allocationMethod:contactPhase===1?'lead-airborne':contactPhase===3?'drive-airborne':'filed-support-point-proxy-both-supported'};
}
// Public, conventional centered moving average of up to five observed 2D positions.
// Use current frame +/-2 only, and exclude temporally remote neighbors. A missing
// center remains missing; this never invents a keypoint or repeats pose inference.
function smoothPositionTrack(track,times){
  return track.map((point,i)=>{
    if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
    let sx=0,sy=0,count=0;
    for(let j=Math.max(0,i-2);j<=Math.min(track.length-1,i+2);j++){
      const near=track[j];
      if(!near||!Number.isFinite(near.x)||!Number.isFinite(near.y))continue;
      if(!Number.isFinite(times[j])||Math.abs(times[j]-times[i])>.16)continue;
      sx+=near.x;sy+=near.y;count++;
    }
    return count>0?{x:sx/count,y:sy/count}:{x:point.x,y:point.y};
  });
}
function computePublicMetrics(frames,params,width,heightPx){
  const times=frames.map(f=>f.t),flipX=params.direction==='left'?-1:1;
  const measured=parseMeasurements(frames,params,width,heightPx),scale=measured.metersPerPixel;
  // Hip midpoint is an accessible marker, not an anthropometric center of mass.
  const pointNames={pelvis: [23,24],thorax:[11,12],shoulderL:[11],shoulderR:[12],elbowL:[13],elbowR:[14],wristL:[15],wristR:[16],handTipL:[19],handTipR:[20]};
  // Smooth positions BEFORE numerical differentiation, rather than smoothing
  // inferred poses repeatedly. Pelvis midpoint remains only a 2D CoM proxy.
  const points={};
  for(const [k,ids] of Object.entries(pointNames)){
    const raw=frames.map(f=>ids.length===2?middle(lookup(f.pose,ids[0]),lookup(f.pose,ids[1])):lookup(f.pose,ids[0]));
    points[k]=smoothPositionTrack(raw,times);
  }
  // Foot support positions and ankle spacing use the same five-frame rule.
  // Candidate contact events remain calculated from original pose observations.
  const mirrored=params.mirrorSides==='yes';
  const flipSide=index=>mirrored?(index===27?28:index===28?27:index===31?32:index===32?31:index):index;
  const ankleTracks={};const supportTracks={};
  for(const [side,ankleIndex,toeIndex] of [['left',27,31],['right',28,32]]){
    const ankleId=flipSide(ankleIndex),toeId=flipSide(toeIndex);
    ankleTracks[side]=smoothPositionTrack(frames.map(f=>lookup(f.pose,ankleId)),times);
    supportTracks[side]=smoothPositionTrack(frames.map(f=>{
      const ankle=lookup(f.pose,ankleId),toe=lookup(f.pose,toeId);
      return ankle&&toe?middle(ankle,toe):(toe||ankle);
    }),times);
  }
  const pixelVelocity={};for(const k of Object.keys(points))pixelVelocity[k]=times.map((_,i)=>moment(points[k],i,times));
  // Basic three-point average is a conventional low-pass approximation, not a specialized estimator.
  function smooth(v){return v.map((x,i)=>{
    if(!Number.isFinite(x))return null;
    const nearby=v.slice(Math.max(0,i-1),Math.min(v.length,i+2)).filter(Number.isFinite);
    return nearby.reduce((a,b)=>a+b,0)/nearby.length;
  });}
  const speeds={};for(const k of Object.keys(points))speeds[k]=smooth(pixelVelocity[k].map(v=>v&&scale!=null?Math.hypot(v.x*width,v.y*heightPx)*scale:null));
  const vx=pixelVelocity.pelvis.map(v=>v&&scale!=null?v.x*width*scale:null);
  const vy=pixelVelocity.pelvis.map(v=>v&&scale!=null?-v.y*heightPx*scale:null);
  function diffNumeric(values,i){
    let p=i-1,q=i+1;
    while(p>=0&&!Number.isFinite(values[p]))p--;
    while(q<values.length&&!Number.isFinite(values[q]))q++;
    if(p<0||q>=values.length||q-p>4||!Number.isFinite(values[i]))return null;
    const dt=times[q]-times[p];return dt>0?(values[q]-values[p])/dt:null;
  }
  const ax=smooth(vx.map((_,i)=>diffNumeric(vx,i)));
  const az=smooth(vy.map((_,i)=>diffNumeric(vy,i)));
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
      fzTotal:forceVertical,fxTotal:forceHorizontal,pelvis:points.pelvis[i],
      leadFoot:feet.lead,driveFoot:feet.drive,scale,width,heightPx,
      mass:params.weight,direction:params.direction,contactPhase:contact.phases[i]});
    const {leadVertical,driveVertical,leadHorizontal,driveHorizontal,
      leadResultant,driveResultant,leadHorizontalWorld,driveHorizontalWorld,shareLead,allocationMethod}=allocation;
    const obj={t:frame.t,pose:p,center:points.pelvis[i],stride,wristTravel,energy:Number.isFinite(speeds.pelvis[i])?0.5*params.weight*speeds.pelvis[i]**2:null,forceHorizontal,forceVertical,forceTotal,leadVertical,driveVertical,leadHorizontal,driveHorizontal,leadHorizontalWorld,driveHorizontalWorld,leadResultant,driveResultant,shareLead,allocationMethod,contactPhase:contact.phases[i],contactSource:contact.contactSources[i],footHeightDiffM:contact.heightDifferenceM[i],leadContact:contact.phases[i]===1?0:1,driveContact:contact.phases[i]===3?0:1};
    for(const k of Object.keys(points))obj[k==='pelvis'?'pelvisSpeed':k==='thorax'?'thoraxSpeed':k]=speeds[k][i];
    return obj;
  });
  const summary={};for(const k of Object.keys(LABELS)){
    const vals=mapped.map(s=>s[k]).filter(Number.isFinite);
    summary[k]=vals.length?(k==='leadHorizontal'||k==='driveHorizontal'||k==='forceHorizontal'?vals.reduce((a,b)=>Math.abs(b)>Math.abs(a)?b:a):Math.max(...vals.map(Math.abs))):null;
  }
  return {samples:mapped,duration:Math.max(0,times.at(-1)??0),summary,scale:measured,quality:{detected:frames.filter(f=>Array.isArray(f.pose)).length,all:frames.length},events:contact.events,contactAssumption:contact.assumption,model:'single-pass-filed-grf-support-point-plus-relative-foot-height'};
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
    const values=c.keys.map((key,i)=>{
      const number=liveNumber(sample?.[key],c.unit);
      return c.keys.length>1?`${i===0?'左':'右'} ${number}`:number;
    });
    const text=values.join(' · ');
    const display=text+(values.every(v=>v==='—'||v.endsWith(' —'))?'':` ${c.unit}`);
    if(node.textContent!==display)node.textContent=display;
    const tab=node.parentElement;
    tab.setAttribute('aria-label',`${c.name}：${values.join('、')} ${c.unit}（再生位置での参考値）`);
  }
}

function pickPage(name){if(!PAGE[name])return;state.page=name;buildCards();render();}
function toggleCard(id){const current=state.selected[state.page];if(current.has(id))current.delete(id);else{
  const selectedDef=PAGE[state.page].cards.find(c=>current.has(c.id));const selectedUnit=selectedDef?.unit;
  const def=PAGE[state.page].cards.find(c=>c.id===id);
  if(selectedUnit&&selectedUnit!==def.unit){current.clear();notify('グラフの単位を切り替えました');}current.add(id);
}buildCards();render();}
function seriesKeys(){return chartDefs().filter(c=>state.selected[state.page].has(c.id)).flatMap(c=>c.keys);}
function styleSeries(element,c){const primary=COLORS[c.keys[0]];element.dataset.series='true';element.style.setProperty('--series-color',primary);element.style.setProperty('--series-secondary',COLORS[c.keys.at(-1)]);element.style.setProperty('--series-ink','#fff');}
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
    c.keys.forEach((key,i)=>{const span=document.createElement('span');span.className='measure-pair';if(c.keys.length>1){const side=document.createElement('span');side.className='side-name';side.textContent=i?'右':'左';span.append(side);}const val=document.createElement('strong');val.id='v_'+key;val.textContent='—';span.append(val);measure.append(span);});
    const unit=document.createElement('small');unit.textContent=c.unit;measure.append(unit);
    // Compact two-line indicators: title, then value with unit.
    // Explanation remains in the help text; do not add a third visible line.
    body.append(title,measure);m.append(symbol,body);m.onclick=()=>toggleCard(c.id);m.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleCard(c.id);}};$('metrics').append(m);
    const tab=document.createElement('button');styleSeries(tab,c);
    tab.className='series-tab'+(active?' selected':'')+(c.keys.length>1?' has-dual-value':'');
    tab.setAttribute('aria-pressed',String(active));
    // Current-frame figures are separate from the summary/maximum values in metric cards.
    const tabLabel=document.createElement('span');tabLabel.className='series-tab-name';
    tabLabel.textContent=c.tab||c.name.replace('速度','').replace('参考','').replace('全身','');
    const tabValue=document.createElement('span');tabValue.className='series-tab-value';
    tabValue.id='tab_'+c.id;tabValue.textContent='—';
    tab.append(tabLabel,tabValue);
    tab.onclick=()=>toggleCard(c.id);$('tabs').append(tab);
  }
  $('pageHelp').textContent=state.page==='forces'?'【参考推定】足部動作と左右足の高さ差から接地候補を推測し、支持点・骨盤中心・加速度から床反力を配分。脚別水平値は骨盤中心向きを正とする参考表示で、各足の実際の作用方向は独立には推定していません。▲離地、▼接地（候補）。':state.page==='dynamics'?'手首の移動量はリリース位置ではありません。距離・エネルギーは画像内の簡易推定です。':'速度は画像内2D位置の変化から求めています。骨盤中点は全身重心ではありません。';
  $('forceLayerToggle').closest('label').hidden=state.page==='forces';
}
const svgNode=(name,props={},str)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(props).forEach(([k,v])=>n.setAttribute(k,v));if(str!==undefined)n.textContent=str;return n;};
function axisRange(nums,min=1){const v=nums.filter(Number.isFinite);if(!v.length)return [0,min];let lower=Math.min(0,...v),upper=Math.max(0,...v);const pad=Math.max((upper-lower)*.1,.1);lower=lower<0?lower-pad:0;upper=Math.max(min,upper+pad);return [lower,upper];}
function chart(){
  const svg=$('plot'),legend=$('legend');svg.replaceChildren();legend.replaceChildren();
  const rows=state.analysis?.samples??[],keys=seriesKeys();
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
    const l=low+i/4*(high-low);svg.append(svgNode('text',{x:bounds.x0-6,y:cy+4,'text-anchor':'end','font-size':10,fill:'#607886'},Math.abs(l)>=20?String(Math.round(l)):l.toFixed(1)));
    if(overlay.length){const v=fLow+i/4*(fHigh-fLow);svg.append(svgNode('text',{x:bounds.x1+6,y:cy+4,'font-size':10,fill:'#c77a27'},String(Math.round(v))));}
    svg.append(svgNode('text',{x:cx,y:viewH-8,'text-anchor':'middle','font-size':10,fill:'#667d89'},(rows[0].t+i/4*dur).toFixed(2)));
  }
  const unit=chartDefs().find(c=>state.selected[state.page].has(c.id))?.unit||'';
  svg.append(svgNode('text',{x:bounds.x0,y:10,'font-size':10,fill:'#718998'},unit));
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
function drawOverlay(){
  const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
  if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);
  if(!state.analysis||!video.videoWidth||( !state.showPose && !state.showArrows ))return;
  const sample=nearest();if(!sample?.pose)return;
  const scale=Math.min(w/video.videoWidth,h/video.videoHeight),ww=video.videoWidth*scale,hh=video.videoHeight*scale,ox=(w-ww)/2,oy=(h-hh)/2;
  const position=i=>{const p=lookup(sample.pose,i);return p?{x:ox+p.x*ww,y:oy+p.y*hh}:null;};
  if(state.showPose){
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
  $('chartTitle').textContent=state.page==='forces'?'脚別推定床反力（N）':(chartDefs().find(c=>state.selected[state.page].has(c.id))?.unit||'')+'の推移';
  $('modeNote').textContent=state.analysis?`参考計算・${state.analysis.events.length}候補イベント`:'未解析';
  const phase=nearest()?.contactPhase??0;
  const phaseText=['両足支持（仮定）','踏込足 離地','両足支持（候補）','軸足 離地','軸足再接地（候補）'][phase];
  $('videoMeta').textContent=state.loadingVideo?(state.videoLoadStatus||'動画読み込み中…'):(state.analysis?`解析済み・${phaseText}（参考値）`:'動画読込済み・解析待ち');
  $('mediaTag').textContent=state.loadingVideo?'◉ 動画読み込み中':(state.analysis?'◉ 解析済み':'◉ 動画読込済み');
  $('watermark').textContent='出願済み荷重配分｜足部の動き・左右高さ差は接地候補（参考値）';
  currentSummary();updateSeriesTabs();chart();updateVideoLayers();drawOverlay();
  $('forceLayerToggle').checked=state.showForces;
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
function saveSettings(){if(!$('settingsForm').reportValidity())return false;for(const k of Object.keys(DEFAULTS)){const input=$(k+'Input');if(!input)continue;state.config[k]=['height','weight','fps','startTime','endTime','manualScale'].includes(k)?Number(input.value):input.value;}
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
      a.href=u;a.download='FORM_ANALYSIS_Public_v1.6.5_frame.png';a.click();
      setTimeout(()=>URL.revokeObjectURL(u),800);
    },'image/png');
  }catch(e){notify('PNGを保存できません：'+e.message);}
}
function exportCsv(){if(!stateReady()){notify('先に解析を実行してください');return;}
  const keys=['t','contactPhase','contactSource','footHeightDiffM','leadContact','driveContact','pelvisSpeed','thoraxSpeed','shoulderL','shoulderR','elbowL','elbowR','wristL','wristR','handTipL','handTipR','forceTotal','forceVertical','forceHorizontal','leadResultant','driveResultant','leadVertical','driveVertical','leadHorizontal','driveHorizontal','leadHorizontalWorld','driveHorizontalWorld','stride','wristTravel','energy','shareLead'];
  const lines=['# FORM ANALYSIS Public Preview v1.6.6','# Simple single-pass, 2D hip-center proxy: NOT anatomical CoM','# Position tracks: centered moving mean of current +/-2 frames (up to 5, within 0.16 seconds, no missing-center imputation); derivatives computed afterward','# Filed support-point load partition: projected pelvis-center and acceleration, adjusted for candidate foot contact; NOT measured foot GRF',`# height_cm=${state.config.height} weight_kg=${state.config.weight} sex(record-only)=${state.config.sex}`,'# Contact candidates: sequential foot motion + relative bilateral toe/heel/ankle height difference, 3 stable observations; 2D unvalidated heuristic', '# footHeightDiffM: positive means lead foot appears higher than drive; camera perspective, steps and mounds can misclassify support', '# leadHorizontal/driveHorizontal: inward-positive reference magnitudes (foot -> pelvis); actual per-foot horizontal direction NOT independently estimated', '# *HorizontalWorld: signed pitch-direction allocation, sums to forceHorizontal (not the inward-display convention)',`# contact_assumption=${state.analysis.contactAssumption}`,...state.analysis.events.map(e=>`# event=${e.foot}_${e.type},time_s=${e.t.toFixed(3)},quality=candidate`),keys.join(',')];
  for(const row of state.analysis.samples)lines.push(keys.map(k=>
    Number.isFinite(row[k])?row[k].toFixed(5):typeof row[k]==='string'?row[k]:'').join(','));
  const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='FORM_ANALYSIS_PUBLIC_v1.6.5.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('CSVを保存しました');
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
  fileInput.onchange=e=>{const file=e.target.files?.[0];e.target.value='';if(file)void openVideo(file);};
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
  $('forceLayerToggle').onchange=e=>{state.showForces=e.target.checked;render();};$('exportCsv').onclick=exportCsv;$('exportPng').onclick=snapshot;
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
