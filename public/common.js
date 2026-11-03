const SH=['<path d="M12 3 22 20H2z"/>','<path d="M12 2 22 12 12 22 2 12z"/>','<circle cx="12" cy="12" r="10"/>','<rect x="3" y="3" width="18" height="18" rx="2"/>'].map(p=>`<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tile=(i,t='',cls='')=>`<div class="tile c${i} ${cls}">${SH[i]}<b>${'ABCD'[i]}</b><span>${esc(t)}</span></div>`;
const tiles=(v,fn)=>`<div class="grid">${Array.from({length:v.options},(_,i)=>fn(i)).join('')}</div>`;
const rows=top=>top.map(r=>`<div class="row"><span class="mut">${r.rank}</span><b>${esc(r.name)}</b><em>${r.score}</em></div>`).join('');
let _k='',_seen=new Set();
function board(v){
  const fresh=(v.phase+v.q)!==_k;_k=v.phase+v.q;
  const w=h=>`<div class="${fresh?'in':''}">${h}</div>`;
  if(v.phase==='lobby'){
    const chips=v.players.map(n=>{const c=_seen.has(n)?'':' class="new"';_seen.add(n);return `<span${c}>${esc(n)}</span>`}).join('');
    return w(`<div style="text-align:center"><p class="mut">Join at ${esc(location.host)} with this PIN</p><div class="digits" aria-label="PIN ${v.pin}">${v.pin.split('').map(d=>`<span class="dg">${d}</span>`).join('')}</div><p style="margin:22px 0 14px"><b>${v.count}</b> ${v.count==1?'player':'players'} in</p><div class="chips" style="justify-content:center">${chips}</div></div>`);
  }
  if(v.phase==='question')return w(`<div class="stack"><p class="mut">Question ${v.q+1} of ${v.total}</p><span class="bar"><u style="animation-duration:${v.left}ms"></u></span><h2 style="font-size:2em;line-height:1.15">${esc(v.text)||'Look at the question'}</h2><p class="mut">${v.answered} of ${v.count} answered</p>${tiles(v,i=>tile(i,v.labels[i]))}</div>`);
  if(v.phase==='reveal'){const m=Math.max(1,...v.dist);return w(`<p class="mut">Question ${v.q+1} of ${v.total}</p><div class="dist">${v.dist.map((n,i)=>`<div class="c${i} ${v.correct===i?'':'dim'}" style="height:${Math.max(4,n/m*100)}%"><span>${n}</span></div>`).join('')}</div>${tiles(v,i=>tile(i,v.labels[i],v.correct===i?'':'dim'))}<h2 style="margin:26px 0 6px">Leaderboard</h2>${rows(v.top)}`)}
  if(v.phase==='final'){const t=v.top,o=[t[1],t[0],t[2]].filter(Boolean),h={1:210,2:150,3:110};
    const cf=fresh?Array.from({length:32},(_,i)=>`<i class="cf c${i%4}" style="left:${(i*37)%100}%;animation-delay:${1.5+(i%8)*.15}s;animation-duration:${2.8+(i%5)*.4}s"></i>`).join(''):'';
    return w(`<h2 style="text-align:center;font-size:2em;margin-bottom:34px">Final results</h2><div class="pod">${o.map(r=>`<div class="r${r.rank}" style="height:${h[r.rank]}px">${r.rank}<small>${esc(r.name)}</small>${r.score}</div>`).join('')}</div>${rows(t.slice(3))}${cf}`)}
  return '';
}
