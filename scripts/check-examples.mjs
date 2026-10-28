#!/usr/bin/env node
// Runs the repository's reviewed, self-contained examples. This is not a sandbox for untrusted submissions.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { format } from 'node:util';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));
const examples = new Map();
let snippets = 0, checks = 0, groups = 0;
const failures = [];
function context(output = []) {
  return vm.createContext({ TextEncoder, TextDecoder, console: { log: (...args) => output.push(format(...args)) },
    check: (condition, message = 'property failed') => { checks++; assert.ok(condition, message); },
    equal: (actual, expected) => { checks++; assert.equal(JSON.stringify(actual), JSON.stringify(expected)); }
  }, { microtaskMode: 'afterEvaluate', codeGeneration: { strings: false, wasm: false } });
}
for (const lesson of catalog.lessons) {
  const source = fs.readFileSync(path.join(root, lesson.path), 'utf8');
  const blocks = [...source.matchAll(/^```ts\n([\s\S]*?)^```/gm)].map(m => m[1]);
  examples.set(lesson.id, blocks);
  blocks.forEach((block, index) => {
    try {
      const output = [];
      const compiled = stripTypeScriptTypes(block, { mode: 'strip' });
      new vm.Script(compiled, { filename: `${lesson.path}#${index + 1}` }).runInContext(context(output), { timeout: 2000 });
      assert.ok(output.length, 'example produced no output (including async microtasks)');
      snippets++;
      if (lesson.id === 'locks-and-concurrency') assert.equal(output[0], '[ true, true ] 0');
    } catch (error) { failures.push(`${lesson.id} example ${index + 1}: ${error.message}`); }
  });
}
const helpers = `
let seed = 19283;
function rand(n) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed >>> 8) % n; }
function array(n, max = 11) { return Array.from({length:n}, () => rand(max) - Math.floor(max/2)); }
function sorted(a) { return [...a].sort((x,y)=>x-y); }
function throws(fn) { let caught=false; try { fn(); } catch { caught=true; } check(caught, 'expected rejection'); }
`;
function test(id, name, properties) {
  try {
    const block = examples.get(id)?.find(b => new RegExp('(?:function|class) ' + name + '\\b').test(b));
    assert.ok(block, `missing example defining ${name}`);
    const compiled = stripTypeScriptTypes(block, { mode: 'strip' });
    new vm.Script(compiled + '\n;(() => {\n' + helpers + properties + '\n})();', { filename: `${id}:properties` })
      .runInContext(context(), { timeout: 5000 });
    groups++;
  } catch (error) { failures.push(`${id} properties: ${error.message}`); }
}
for (const [id, fn] of [['two-sum','pairIndices'],['hash-maps','pairByPrice']]) test(id, fn, `
for(let trial=0;trial<300;trial++) {
 const a=array(rand(9)), target=rand(21)-10;
 const pairs=[]; for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(a[i]+a[j]===target)pairs.push([i,j]);
 const got=${fn}(a,target); check((got===null)===(pairs.length===0));
 if(got)check(got[0]!==got[1] && a[got[0]]+a[got[1]]===target);
}
`);
test('two-pointers','cartPair',`
for(let t=0;t<300;t++) { const a=sorted(array(rand(9))), target=rand(21)-10; let exists=false;
 for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(a[i]+a[j]===target)exists=true;
 const got=cartPair(a,target); check((got!==null)===exists); if(got)check(got[0]+got[1]===target);
}
`);
test('three-sum','balanceTriples',`
for(let t=0;t<300;t++) { const a=array(rand(10)); const expected=new Set();
 for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)for(let k=j+1;k<a.length;k++)if(a[i]+a[j]+a[k]===0)expected.add(JSON.stringify(sorted([a[i],a[j],a[k]])));
 const got=balanceTriples(a).map(x=>JSON.stringify(sorted(x))).sort(); equal(got,[...expected].sort());
}
equal(balanceTriples([9,-4,5,-5,2,7,-7,0]).map(x=>JSON.stringify(sorted(x))).sort(), ['[-7,0,7]','[-7,2,5]','[-5,-4,9]','[-5,0,5]'].sort());
`);
test('heaps-top-k','topK',`
for(let t=0;t<300;t++){const a=array(rand(15));for(let k=0;k<=a.length;k++)equal(sorted(topK(a,k)), k===0?[]:sorted(a).slice(-k));}
throws(()=>topK([1],-1)); throws(()=>topK([1],2));
`);
test('kth-largest','kthBusiest',`
for(let t=0;t<200;t++){const a=array(1+rand(15));for(let k=1;k<=a.length;k++)equal(kthBusiest(a,k),sorted(a)[a.length-k]);}
throws(()=>kthBusiest([],1)); throws(()=>kthBusiest([1],0));
`);
test('binary-search-on-answer','minSpeed',`
for(let t=0;t<300;t++){const a=Array.from({length:rand(8)},()=>1+rand(20)); const hours=rand(24); let expected=-1;
 if(a.length===0)expected=0; else for(let speed=1;speed<=Math.max(...a);speed++){if(a.reduce((n,x)=>n+Math.ceil(x/speed),0)<=hours){expected=speed;break;}}
 equal(minSpeed(a,hours),expected);
}
`);
for (const [id,fn] of [['sliding-window','longestUniqueRun'],['longest-unique-window','longestUnique']]) test(id,fn,`
for(let t=0;t<300;t++){const s=Array.from({length:rand(12)},()=>String.fromCharCode(97+rand(5))).join('');let best=0;
 for(let i=0;i<=s.length;i++)for(let j=i;j<=s.length;j++){const q=s.slice(i,j);if(new Set(q).size===q.length)best=Math.max(best,q.length);}
 equal(${fn}(s),best);
}
`);
for (const [id,fn] of [['monotonic-stack','hoursUntilWarmer'],['next-hotter','daysUntilHotter']]) test(id,fn,`
for(let t=0;t<300;t++){const a=array(rand(15));const expected=a.map((x,i)=>{for(let j=i+1;j<a.length;j++)if(a[j]>x)return j-i;return 0;});equal(${fn}(a),expected);}
`);
test('skip-bay','maxNonAdjacent',`
for(let t=0;t<300;t++){const a=Array.from({length:rand(10)},()=>rand(12));let best=0;
 for(let mask=0;mask<2**a.length;mask++){if(mask&(mask<<1))continue;let sum=0;for(let i=0;i<a.length;i++)if(mask&(1<<i))sum+=a[i];best=Math.max(best,sum);}
 equal(maxNonAdjacent(a),best);
}
`);
test('one-trade','oneLot',`
for(let t=0;t<300;t++){const a=Array.from({length:rand(12)},()=>rand(20));let best=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)best=Math.max(best,a[j]-a[i]);equal(oneLot(a),best);}
`);
test('tarp-span','tarpRain',`
for(let t=0;t<300;t++){const a=Array.from({length:rand(12)},()=>rand(12));let best=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)best=Math.max(best,(j-i)*Math.min(a[i],a[j]));equal(tarpRain(a),best);}
`);
for(const id of ['coin-change','dp-1d'])test(id,'fewestTokens',`
for(let t=0;t<200;t++){const tokens=[...new Set(Array.from({length:rand(5)},()=>1+rand(10)))]; const target=rand(35);
 const dist=Array(target+1).fill(-1);dist[0]=0;const queue=[0];for(let h=0;h<queue.length;h++)for(const c of tokens){const n=queue[h]+c;if(n<=target&&dist[n]===-1){dist[n]=dist[queue[h]]+1;queue.push(n);}}
 equal(fewestTokens(tokens,target),dist[target]);
}
`);
test('dp-2d','aisleWays',`
for(let t=0;t<200;t++){const rows=rand(5),cols=rand(5);const a=Array.from({length:rows},()=>Array.from({length:cols},()=>rand(4)===0?'#':'.'));
 const count=(r,c)=>r>=rows||c>=cols||a[r][c]==='#'?0:r===rows-1&&c===cols-1?1:count(r+1,c)+count(r,c+1);
 equal(aisleWays(a),count(0,0));
}
`);
test('desk-paths','walksToDesk',`
for(let rows=0;rows<=7;rows++)for(let cols=0;cols<=7;cols++){const count=(r,c)=>r>=rows||c>=cols?0:r===rows-1&&c===cols-1?1:count(r+1,c)+count(r,c+1);equal(walksToDesk(rows,cols),count(0,0));}
`);
test('merge-intervals','mergeSlots',`
equal(mergeSlots([[1,4],[4,6]]),[[1,4],[4,6]]);
for(let t=0;t<200;t++){const a=Array.from({length:rand(9)},()=>{let lo=rand(12);return [lo,lo+1+rand(5)];});const seen=new Set(),expected=[];
 for(let i=0;i<a.length;i++){if(seen.has(i))continue;const q=[i];seen.add(i);let lo=a[i][0],hi=a[i][1];for(let h=0;h<q.length;h++){const x=q[h];lo=Math.min(lo,a[x][0]);hi=Math.max(hi,a[x][1]);for(let j=0;j<a.length;j++)if(!seen.has(j)&&Math.max(a[x][0],a[j][0])<Math.min(a[x][1],a[j][1])){seen.add(j);q.push(j);}}expected.push([lo,hi]);}
 equal(mergeSlots(a),expected.sort((x,y)=>x[0]-y[0]));
}
`);
for(const [id,fn,cycle] of [['course-order','moduleOrder','[]'],['topological-sort','studyOrder','null']])test(id,fn,`
for(let t=0;t<200;t++){const n=rand(10),edges=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(rand(3)===0)edges.push([i,j]);const order=${fn}(n,edges);check(order!==null&&order.length===n&&new Set(order).size===n);for(const [a,b] of edges)check(order.indexOf(a)<order.indexOf(b));}
equal(${fn}(3,[[0,1],[1,0],[1,2]]),${cycle});
`);
test('rotated-index','rotatedIndex',`
for(let n=0;n<15;n++)for(let pivot=0;pivot<=n;pivot++){const a=Array.from({length:n},(_,i)=>i*3);const rotated=a.slice(pivot).concat(a.slice(0,pivot));for(let target=-1;target<=n*3;target++)equal(rotatedIndex(rotated,target),rotated.indexOf(target));}
`);
test('lru-cache','LruCache',`
for(let cap=0;cap<6;cap++){const actual=new LruCache(cap),ref=new Map();for(let t=0;t<300;t++){const key='k'+rand(10);if(rand(2)){const val=rand(100);actual.put(key,val);ref.delete(key);ref.set(key,val);if(ref.size>cap)ref.delete(ref.keys().next().value);}else{const expected=ref.has(key)?ref.get(key):-1;if(ref.has(key)){ref.delete(key);ref.set(key,expected);}equal(actual.get(key),expected);}}}
`);
test('valid-brackets','strapsOk',`
equal(strapsOk('[{()}]()'),true);equal(strapsOk('[({)]'),false);equal(strapsOk(''),true);
for(let t=0;t<500;t++){const s=Array.from({length:rand(14)},()=>'()[]{}'[rand(6)]).join('');let reduced=s,prev;do{prev=reduced;reduced=reduced.split('()').join('').split('[]').join('').split('{}').join('');}while(prev!==reduced);equal(strapsOk(s),reduced.length===0);}
`);
test('ranged-download','planRanges',`
for(let total=0;total<200;total++)for(const part of [1,3,16,250]){const p=planRanges(total,part);equal(p.length,Math.ceil(total/part));let next=0;for(const [i,r]of p.entries()){check(r.index===i&&r.start===next&&r.end>=r.start&&r.end-r.start+1<=part);next=r.end+1;}equal(next,total);}
const partial=planRanges(8388700,1048576);equal(partial.length,9);equal(partial[8],{index:8,start:8388608,end:8388699});throws(()=>planRanges(10,0));
`);
test('file-download','nextRange',`equal(nextRange({total:48000,got:18000}),'bytes=18000-');equal(nextRange({total:0,got:0}),'done');equal(nextRange({total:4,got:5}),'restart');equal(nextRange({total:4,got:-1}),'restart');`);
test('encoding-unicode','preview',`equal(preview('e\u0301clair',1),'e\u0301');equal(preview('👨‍👩‍👧‍👦x',1),'👨‍👩‍👧‍👦');equal(preview('A🧇B',2),'A🧇');equal(preview('abc',0),'');throws(()=>preview('x',-1));`);
test('floating-point','splitCents',`
for(let total=0;total<100;total++)for(let people=1;people<8;people++){const a=splitCents(total,people);check(a.every(Number.isSafeInteger));equal(a.reduce((a,b)=>a+b,0),total);check(Math.max(...a)-Math.min(...a)<=1);}
check(nearlyEqual(0.1+0.2,0.3));check(!nearlyEqual(Infinity,1));check(!nearlyEqual(NaN,NaN));throws(()=>splitCents(1,0));
`);
test('http-and-tcp','shouldRetry',`check(shouldRetry('GET',503));check(!shouldRetry('PATCH',503));check(!shouldRetry('POST',503));check(shouldRetry('POST',503,true));check(!shouldRetry('POST',409,true));`);
test('pass-at-k','estimatePassAtK',`
for(let n=1;n<=9;n++)for(let c=0;c<=n;c++)for(let k=1;k<=n;k++){let subsets=0,hits=0;for(let mask=0;mask<2**n;mask++){let count=0,hit=false;for(let i=0;i<n;i++)if(mask&(1<<i)){count++;if(i<c)hit=true;}if(count===k){subsets++;if(hit)hits++;}}check(Math.abs(estimatePassAtK(n,c,k)-hits/subsets)<1e-12);}
throws(()=>estimatePassAtK(2,1,3));
`);
test('unique-ids','mint',`
const ids=new Set();for(let ms=0;ms<5;ms++)for(let worker=0;worker<5;worker++)for(let seq=0;seq<10;seq++){const id=mint(ms,worker,seq);check(!ids.has(id));ids.add(id);check(BigInt(id)<2n**63n);}
throws(()=>mint(1,1024,0));throws(()=>mint(1,0,4096));throws(()=>mint(-1,0,0));throws(()=>mint(2**41,0,0));
`);
test('upload-slots','finishTimes',`
for(let t=0;t<300;t++){const n=rand(9),k=1+rand(4),d=Array.from({length:n},()=>rand(50));const got=finishTimes(d,k);equal(got.length,n);
let clock=0,started=0;const end=new Array(n).fill(-1),running=[];while(started<n||running.length){while(running.length<k&&started<n){running.push(started);end[started]=clock+d[started];started++;}
const soonest=Math.min(...running.map(i=>end[i]));clock=soonest;for(let r=running.length-1;r>=0;r--)if(end[running[r]]===clock)running.splice(r,1);}
equal(got,end);check(n===0||Math.max(...got)>=Math.ceil(d.reduce((a,b)=>a+b,0)/k));}
throws(()=>finishTimes([1],0));
`);
test('session-store-levels','SessionStore',`
const s=new SessionStore();s.set(0,'a','1',2);s.set(0,'b','2');check(s.get(1,'a')==='1');check(s.get(2,'a')===null);check(!s.delete(3,'a'));
equal(s.scan(3,''),['b=2']);s.set(4,'b','3',1);check(s.get(5,'b')===null);equal(s.scan(5,''),[]);
`);
if(failures.length){for(const failure of failures)console.error(failure);process.exitCode=1;}
console.log(`${snippets} runnable examples; ${groups} independent reference/edge-case groups; ${checks} assertions; ${failures.length} failures`);
