const SH=['<path d="M12 3 22 20H2z"/>','<path d="M12 2 22 12 12 22 2 12z"/>','<circle cx="12" cy="12" r="10"/>','<rect x="3" y="3" width="18" height="18" rx="2"/>'].map(p=>`<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tile=(i,t='',cls='')=>`<div class="tile c${i} ${cls}">${SH[i]}<b>${'ABCD'[i]}</b><span>${esc(t)}</span></div>`;
const tiles=(v,fn)=>`<div class="grid">${Array.from({length:v.options},(_,i)=>fn(i)).join('')}</div>`;
const rows=top=>top.map(r=>`<div class="row"><span class="mut">${r.rank}</span><b>${esc(r.name)}</b><em>${r.score}</em></div>`).join('');
function board(v){
  if(v.phase==='lobby')return `<div style="text-align:center"><p class="mut">Join at ${esc(location.host)} with PIN</p><div class="pin">${v.pin}</div><p style="margin:22px 0 14px"><b>${v.count}</b> ${v.count==1?'player':'players'} in</p><div class="chips" style="justify-content:center">${v.players.map(n=>`<span>${esc(n)}</span>`).join('')}</div></div>`;
  if(v.phase==='question')return `<div class="stack"><p class="mut">Question ${v.q+1} of ${v.total}</p><span class="bar"><u style="animation-duration:${v.left}ms"></u></span><h2 style="font-size:2em;line-height:1.15">${esc(v.text)||'Look at the question'}</h2><p class="mut">${v.answered} of ${v.count} answered</p>${tiles(v,i=>tile(i,v.labels[i]))}</div>`;
  if(v.phase==='reveal'){const m=Math.max(1,...v.dist);return `<p class="mut">Question ${v.q+1} of ${v.total}</p><div class="dist">${v.dist.map((n,i)=>`<div class="c${i} ${v.correct===i?'':'dim'}" style="height:${Math.max(4,n/m*100)}%"><span>${n}</span></div>`).join('')}</div>${tiles(v,i=>tile(i,v.labels[i],v.correct===i?'':'dim'))}<h2 style="margin:26px 0 6px">Leaderboard</h2>${rows(v.top)}`}
  if(v.phase==='final'){const t=v.top,o=[t[1],t[0],t[2]].filter(Boolean),h={1:200,2:150,3:110};return `<h2 style="text-align:center;font-size:2em;margin-bottom:24px">Final results</h2><div class="pod">${o.map(r=>`<div style="height:${h[r.rank]}px">${r.rank}<small>${esc(r.name)}</small>${r.score}</div>`).join('')}</div>${rows(t.slice(3))}`}
  return '';
}
