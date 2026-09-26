(() => {
  "use strict";
  const arena=document.getElementById("arena"), scoreEl=document.getElementById("score"),
    chainEl=document.getElementById("chain"), timeEl=document.getElementById("time"),
    message=document.getElementById("message"), start=document.getElementById("start"),
    reset=document.getElementById("reset"), result=document.getElementById("result"),
    finalScore=document.getElementById("finalScore"), finalText=document.getElementById("finalText"),
    again=document.getElementById("again");
  let score=0,chain=0,time=30,running=false,timer=null,spawnTimer=null;

  function update(){scoreEl.textContent=score;chainEl.textContent=chain;timeEl.textContent=time}
  function say(text,type=""){message.textContent=text;message.className="message "+type}
  function clearNodes(){arena.querySelectorAll(".node").forEach(n=>n.remove())}

  function tap(node){
    if(!running)return;
    if(node.dataset.human==="1"){
      node.classList.add("hit"); chain++;
      score += 10 + Math.min(chain,20)*2; update();
      say(chain>=5 ? "Strong human signal chain." : "Human signal confirmed.","good");
      setTimeout(()=>node.remove(),130);
    }else{
      node.classList.add("miss"); chain=0; score=Math.max(0,score-12); update();
      say("Noise detected. Chain broken.","bad"); setTimeout(()=>node.remove(),130);
    }
  }

  function spawn(){
    if(!running)return;
    const count=Math.min(8,3+Math.floor(score/100));
    const humanCount=1+Math.floor(Math.random()*Math.min(3,count));
    const spots=[];
    for(let i=0;i<count;i++){
      let x,y,tries=0;
      do{x=7+Math.random()*86;y=8+Math.random()*80;tries++}
      while(tries<20 && spots.some(p=>Math.hypot(p.x-x,p.y-y)<11));
      spots.push({x,y});
      const n=document.createElement("button");
      n.type="button"; n.className="node "+(i<humanCount?"human":"noise");
      n.style.left=x+"%"; n.style.top=y+"%";
      n.setAttribute("aria-label",i<humanCount?"Human signal":"Noise signal");
      const dot=document.createElement("span"); dot.className="dot"; n.appendChild(dot);
      n.dataset.human=i<humanCount?"1":"0"; n.addEventListener("click",()=>tap(n));
      arena.appendChild(n);
      setTimeout(()=>{
        if(n.isConnected){
          n.classList.add("miss");
          setTimeout(()=>n.remove(),140);
          if(n.dataset.human==="1"&&running){chain=0;update();say("Signal lost — find the next human node.","bad")}
        }
      },Math.max(950,2400-score*2));
    }
  }

  function end(){
    running=false; clearInterval(timer); clearInterval(spawnTimer); clearNodes();
    start.textContent="Start Network"; finalScore.textContent=score;
    finalText.textContent=score>=250?"High-density signal run.":score>=120?"A solid network connection.":"Keep training your signal detection.";
    result.hidden=false; say("Round complete.","good");
  }

  function begin(){
    clearInterval(timer); clearInterval(spawnTimer); clearNodes();
    score=0;chain=0;time=30;running=true;result.hidden=true;start.textContent="Restart";update();
    say("Find the Human Signals.");spawn();
    spawnTimer=setInterval(spawn,1700);
    timer=setInterval(()=>{time--;update();if(time<=0)end()},1000);
  }

  function resetGame(){
    running=false;clearInterval(timer);clearInterval(spawnTimer);clearNodes();
    score=0;chain=0;time=30;result.hidden=true;start.textContent="Start Network";
    update();say("Press Start Network to begin.");
  }

  start.addEventListener("click",begin); again.addEventListener("click",begin); reset.addEventListener("click",resetGame);
  document.getElementById("year").textContent=new Date().getFullYear(); update();
})();