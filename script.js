(() => {
  "use strict";
  const arena=document.getElementById("arena"),scoreEl=document.getElementById("score"),bestEl=document.getElementById("best"),chainEl=document.getElementById("chain"),timeEl=document.getElementById("time"),timeBar=document.getElementById("timeBar"),message=document.getElementById("message"),start=document.getElementById("start"),reset=document.getElementById("reset"),result=document.getElementById("result"),finalScore=document.getElementById("finalScore"),finalText=document.getElementById("finalText"),finalHits=document.getElementById("finalHits"),finalNoise=document.getElementById("finalNoise"),finalPrecision=document.getElementById("finalPrecision"),again=document.getElementById("again"),callsign=document.getElementById("callsign"),saveScore=document.getElementById("saveScore"),leaderboardList=document.getElementById("leaderboardList"),clearBoard=document.getElementById("clearBoard");
  const BOARD_KEY="human-node-arcade-board-v1";
  let score=0,chain=0,time=30,running=false,timer=null,spawnTimer=null,hits=0,noiseHits=0,maxChain=0;

  function board(){try{return JSON.parse(localStorage.getItem(BOARD_KEY)||"[]")}catch{return[]}}
  function setBoard(rows){localStorage.setItem(BOARD_KEY,JSON.stringify(rows))}
  function best(){return board().reduce((m,r)=>Math.max(m,r.score),0)}
  function update(){scoreEl.textContent=score;bestEl.textContent=best();chainEl.textContent=chain;timeEl.textContent=time;timeBar.style.width=(time/30*100)+"%"}
  function say(text,type=""){message.textContent=text;message.className="message "+type}
  function clearNodes(){arena.querySelectorAll(".node").forEach(n=>n.remove())}

  function tap(node){
    if(!running||!node.isConnected)return;
    if(node.dataset.human==="1"){
      node.classList.add("hit");hits++;chain++;maxChain=Math.max(maxChain,chain);
      const multiplier=1+Math.min(4,Math.floor(chain/5)*0.25);
      score+=Math.round(10*multiplier);update();
      say(chain>=5?`Signal locked · ${multiplier.toFixed(2)}× chain bonus.`:"Human signal confirmed.",chain>=5?"combo":"good");
      setTimeout(()=>node.remove(),130);
    }else{
      node.classList.add("miss");noiseHits++;chain=0;score=Math.max(0,score-12);update();
      say("Noise detected. Chain broken.","bad");setTimeout(()=>node.remove(),130);
    }
  }

  function spawn(){
    if(!running)return;
    const elapsed=30-time;
    const count=Math.min(10,3+Math.floor(elapsed/6));
    const humanCount=1+Math.floor(Math.random()*Math.min(3,count));
    const spots=[];
    for(let i=0;i<count;i++){
      let x,y,tries=0;
      do{x=7+Math.random()*86;y=8+Math.random()*80;tries++}while(tries<20&&spots.some(p=>Math.hypot(p.x-x,p.y-y)<11));
      spots.push({x,y});
      const n=document.createElement("button");n.type="button";n.className="node "+(i<humanCount?"human":"noise");n.style.left=x+"%";n.style.top=y+"%";n.setAttribute("aria-label",i<humanCount?"Human signal":"Noise signal");
      const dot=document.createElement("span");dot.className="dot";n.appendChild(dot);n.dataset.human=i<humanCount?"1":"0";n.addEventListener("click",()=>tap(n));arena.appendChild(n);
      const lifetime=Math.max(700,2100-elapsed*25+Math.random()*500);
      setTimeout(()=>{if(n.isConnected){n.classList.add("miss");setTimeout(()=>n.remove(),140);if(n.dataset.human==="1"&&running){chain=0;update();say("Signal lost — find the next human node.","bad")}}},lifetime);
    }
  }

  function end(){
    running=false;clearInterval(timer);clearInterval(spawnTimer);clearNodes();start.textContent="Start Network";finalScore.textContent=score;finalHits.textContent=hits;finalNoise.textContent=noiseHits;finalPrecision.textContent=(hits+noiseHits?Math.round(hits/(hits+noiseHits)*100):0)+"%";
    finalText.textContent=score>=300?"High-density signal run.":score>=150?"A strong network connection.":"Keep training your signal detection.";
    result.hidden=false;say("Round complete.","good");update();callsign.focus();
  }

  function begin(){
    clearInterval(timer);clearInterval(spawnTimer);clearNodes();score=0;chain=0;time=30;hits=0;noiseHits=0;maxChain=0;running=true;result.hidden=true;start.textContent="Restart";update();say("Find the Human Signals.");spawn();spawnTimer=setInterval(spawn,1650);
    timer=setInterval(()=>{time--;update();if(time<=0)end()},1000);
  }

  function resetGame(){running=false;clearInterval(timer);clearInterval(spawnTimer);clearNodes();score=0;chain=0;time=30;hits=0;noiseHits=0;result.hidden=true;start.textContent="Start Network";update();say("Press Start Network to begin.")}

  function renderBoard(){
    const rows=board().sort((a,b)=>b.score-a.score||a.ts-b.ts).slice(0,10);
    if(!rows.length){leaderboardList.innerHTML='<div class="empty-board">No local scores yet. Finish a run to create the first signal.</div>';return}
    leaderboardList.innerHTML=rows.map((r,i)=>`<div class="board-row"><span class="rank">#${i+1}</span><span class="board-name">${escapeHtml(r.name)}</span><span class="board-date">${new Date(r.ts).toLocaleDateString()}</span><span class="board-score">${r.score}</span></div>`).join("");
  }
  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
  function save(){
    const name=(callsign.value.trim()||"Player").slice(0,16);const rows=board();rows.push({name,score,ts:Date.now()});setBoard(rows.sort((a,b)=>b.score-a.score).slice(0,20));renderBoard();update();saveScore.textContent="Saved";setTimeout(()=>saveScore.textContent="Save Score",1200)
  }

  start.addEventListener("click",begin);again.addEventListener("click",begin);reset.addEventListener("click",resetGame);saveScore.addEventListener("click",save);
  clearBoard.addEventListener("click",()=>{if(confirm("Clear all local Human Node Arcade scores on this device?")){localStorage.removeItem(BOARD_KEY);renderBoard();update()}});
  document.getElementById("year").textContent=new Date().getFullYear();renderBoard();update();
})();
