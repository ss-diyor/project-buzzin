const SH=['<path d="M12 3 22 20H2z"/>','<path d="M12 2 22 12 12 22 2 12z"/>','<circle cx="12" cy="12" r="10"/>','<rect x="3" y="3" width="18" height="18" rx="2"/>'].map(p=>`<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tile=(i,t='',cls='')=>`<div class="tile c${i} ${cls}">${SH[i]}<b>${'ABCD'[i]}</b><span>${esc(t)}</span></div>`;
const tiles=(v,fn)=>`<div class="grid">${Array.from({length:v.options},(_,i)=>fn(i)).join('')}</div>`;
const rows=top=>top.map(r=>`<div class="row"><span class="mut">${r.rank}</span>${av(r.av)}<b>${esc(r.name)}</b><em>${r.score}</em></div>`).join('');
const E='<circle cx="18" cy="26" r="2.4" fill="#1A1C3A"/><circle cx="30" cy="26" r="2.4" fill="#1A1C3A"/>',S=' stroke="#DDE1F0" stroke-width="1.5"';
const AV=[
['#FFE7C7','<path d="M10 22 12 6 23 13zM38 22 36 6 25 13z" fill="#F2994A"/><circle cx="24" cy="27" r="15" fill="#F2994A"/>'+E+'<path d="M22 31h4l-2 3z" fill="#E8453C"/>'],
['#E3F0FF','<ellipse cx="11" cy="25" rx="5" ry="10" fill="#8B5E3C"/><ellipse cx="37" cy="25" rx="5" ry="10" fill="#8B5E3C"/><circle cx="24" cy="27" r="14" fill="#D2A673"/>'+E+'<ellipse cx="24" cy="32" rx="4" ry="3" fill="#1A1C3A"/>'],
['#E8F7EE','<circle cx="13" cy="13" r="6" fill="#1A1C3A"/><circle cx="35" cy="13" r="6" fill="#1A1C3A"/><circle cx="24" cy="27" r="15" fill="#fff"'+S+'/><ellipse cx="18" cy="26" rx="4.5" ry="5.5" fill="#1A1C3A"/><ellipse cx="30" cy="26" rx="4.5" ry="5.5" fill="#1A1C3A"/><circle cx="18" cy="25" r="1.6" fill="#fff"/><circle cx="30" cy="25" r="1.6" fill="#fff"/><ellipse cx="24" cy="33" rx="3" ry="2" fill="#1A1C3A"/>'],
['#FFF3D6','<ellipse cx="24" cy="29" rx="17" ry="14" fill="#3DBE7A"/><circle cx="15" cy="16" r="7" fill="#3DBE7A"/><circle cx="33" cy="16" r="7" fill="#3DBE7A"/><circle cx="15" cy="16" r="4" fill="#fff"/><circle cx="33" cy="16" r="4" fill="#fff"/><circle cx="15" cy="16" r="2" fill="#1A1C3A"/><circle cx="33" cy="16" r="2" fill="#1A1C3A"/><path d="M15 33q9 6 18 0" stroke="#1A1C3A" stroke-width="2" fill="none" stroke-linecap="round"/>'],
['#EDE7FF','<path d="M10 20 12 6 22 13zM38 20 36 6 26 13z" fill="#8C6BD9"/><circle cx="24" cy="27" r="15" fill="#8C6BD9"/><circle cx="17" cy="25" r="7" fill="#fff"/><circle cx="31" cy="25" r="7" fill="#fff"/><circle cx="17" cy="25" r="3.2" fill="#1A1C3A"/><circle cx="31" cy="25" r="3.2" fill="#1A1C3A"/><path d="M21 31h6l-3 6z" fill="#F5B21B"/>'],
['#FFE4DC','<path d="M9 22 13 5 23 14zM39 22 35 5 25 14z" fill="#E8573C"/><circle cx="24" cy="27" r="15" fill="#E8573C"/><path d="M9 29q15 16 30 0q-4 9-15 9q-11 0-15-9z" fill="#fff"/>'+E+'<circle cx="24" cy="34" r="2.2" fill="#1A1C3A"/>'],
['#FFE8F1','<ellipse cx="17" cy="12" rx="4.5" ry="11" fill="#fff"'+S+'/><ellipse cx="31" cy="12" rx="4.5" ry="11" fill="#fff"'+S+'/><ellipse cx="17" cy="13" rx="2" ry="7" fill="#F9A8C7"/><ellipse cx="31" cy="13" rx="2" ry="7" fill="#F9A8C7"/><circle cx="24" cy="30" r="14" fill="#fff"'+S+'/>'+E.replace(/cy="26"/g,'cy="28"')+'<circle cx="24" cy="33" r="2" fill="#F26D9A"/>'],
['#E6EEFF','<path d="M24 14V7" stroke="#8FA5C9" stroke-width="2.5"/><circle cx="24" cy="6" r="3" fill="#E8453C"/><rect x="9" y="14" width="30" height="26" rx="7" fill="#8FA5C9"/><circle cx="18" cy="26" r="5" fill="#fff"/><circle cx="30" cy="26" r="5" fill="#fff"/><circle cx="18" cy="26" r="2.2" fill="#1A1C3A"/><circle cx="30" cy="26" r="2.2" fill="#1A1C3A"/><rect x="16" y="34" width="16" height="3" rx="1.5" fill="#1A1C3A"/>']];
const av=(i,c='av')=>`<svg class="${c}" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="${AV[i|0]?.[0]||AV[0][0]}"/>${AV[i|0]?.[1]||''}</svg>`;
let _k='',_seen=new Set();
function board(v){
  const fresh=(v.phase+v.q)!==_k;_k=v.phase+v.q;
  const w=h=>`<div class="${fresh?'in':''}">${h}</div>`;
  if(v.phase==='lobby'){
    const chips=v.players.map(p=>{const c=_seen.has(p.name)?'':' class="new"';_seen.add(p.name);return `<span${c}>${av(p.av,'av sm')}${esc(p.name)}</span>`}).join('');
    return w(`<div style="text-align:center"><p class="mut">Join at ${esc(location.host)} with this PIN</p><div class="digits" aria-label="PIN ${v.pin}">${v.pin.split('').map(d=>`<span class="dg">${d}</span>`).join('')}</div><p style="margin:22px 0 14px"><b>${v.count}</b> ${v.count==1?'player':'players'} in</p><div class="chips" style="justify-content:center">${chips}</div></div>`);
  }
  if(v.phase==='question')return w(`<div class="stack"><p class="mut">Question ${v.q+1} of ${v.total}</p><span class="bar"><u style="animation-duration:${v.left}ms"></u></span><h2 style="font-size:2em;line-height:1.15">${esc(v.text)||'Look at the question'}</h2><p class="mut">${v.answered} of ${v.count} answered</p>${tiles(v,i=>tile(i,v.labels[i]))}</div>`);
  if(v.phase==='reveal'){const m=Math.max(1,...v.dist);return w(`<p class="mut">Question ${v.q+1} of ${v.total}</p><div class="dist">${v.dist.map((n,i)=>`<div class="c${i} ${v.correct===i?'':'dim'}" style="height:${Math.max(4,n/m*100)}%"><span>${n}</span></div>`).join('')}</div>${tiles(v,i=>tile(i,v.labels[i],v.correct===i?'':'dim'))}<h2 style="margin:26px 0 6px">Leaderboard</h2>${rows(v.top)}`)}
  if(v.phase==='final'){const t=v.top,o=[t[1],t[0],t[2]].filter(Boolean),h={1:210,2:150,3:110};
    const cf=fresh?Array.from({length:32},(_,i)=>`<i class="cf c${i%4}" style="left:${(i*37)%100}%;animation-delay:${1.5+(i%8)*.15}s;animation-duration:${2.8+(i%5)*.4}s"></i>`).join(''):'';
    return w(`<h2 style="text-align:center;font-size:2em;margin-bottom:34px">Final results</h2><div class="pod">${o.map(r=>`<div class="r${r.rank}" style="height:${h[r.rank]}px">${av(r.av,'av lg')}${r.rank}<small>${esc(r.name)}</small>${r.score}</div>`).join('')}</div>${rows(t.slice(3))}${cf}`)}
  return '';
}
