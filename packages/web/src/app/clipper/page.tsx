'use client';

import { useState } from 'react';

const ARTVAULT_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

// The bookmarklet code — enhanced with deep video extraction
const bookmarkletCode = `
javascript:void(function(){
  var d=document,w=window,av='${ARTVAULT_URL}';

  /* Remove existing overlay if re-clicked */
  var old=d.getElementById('artvault-clipper');
  if(old){old.remove();return;}

  var media=[];
  var seen={};
  function add(url,label,type,thumb){
    if(!url||seen[url])return;
    seen[url]=1;
    media.push({url:url,label:label,type:type,thumb:thumb||''});
  }

  /* 1. HTML5 video elements & source tags */
  d.querySelectorAll('video').forEach(function(v){
    var src=v.src||v.currentSrc;
    if(src)add(src,'HTML5 Video','VIDEO');
    v.querySelectorAll('source').forEach(function(s){
      if(s.src)add(s.src,'HTML5 Video ('+s.type+')','VIDEO');
    });
    /* poster as thumbnail */
    if(v.poster)add(v.poster,'Video Poster','IMAGE',v.poster);
  });

  /* 2. All iframes — detect any embedded player */
  d.querySelectorAll('iframe[src]').forEach(function(f){
    var s=f.src;
    if(s.match(/youtube\\.com|youtu\\.be/)){
      var m=s.match(/(?:embed\\/|v=|youtu\\.be\\/)([a-zA-Z0-9_-]{11})/);
      if(m)add('https://www.youtube.com/embed/'+m[1],'YouTube: '+m[1],'IFRAME','https://img.youtube.com/vi/'+m[1]+'/hqdefault.jpg');
    }else if(s.match(/vimeo\\.com/)){
      var vm=s.match(/vimeo\\.com\\/(?:video\\/)?(\\d+)/);
      if(vm)add('https://player.vimeo.com/video/'+vm[1],'Vimeo: '+vm[1],'IFRAME');
    }else if(s.match(/dailymotion\\.com/)){
      var dm=s.match(/dailymotion\\.com\\/(?:embed\\/)?video\\/([a-zA-Z0-9]+)/);
      if(dm)add('https://www.dailymotion.com/embed/video/'+dm[1],'Dailymotion','IFRAME');
    }else if(s.match(/spotify\\.com/)){
      add(s,'Spotify Embed','IFRAME');
    }else if(s.match(/soundcloud\\.com/)){
      add(s,'SoundCloud Embed','IFRAME');
    }else if(s.match(/twitch\\.tv/)){
      add(s,'Twitch Embed','IFRAME');
    }else if(s.match(/facebook\\.com.*video/)){
      add(s,'Facebook Video','IFRAME');
    }else if(s.match(/tiktok\\.com/)){
      add(s,'TikTok Embed','IFRAME');
    }else if(s.match(/wistia\\.(com|net)/)){
      add(s,'Wistia Video','IFRAME');
    }else if(s.match(/loom\\.com/)){
      add(s,'Loom Video','IFRAME');
    }else if(s.match(/\\.(mp4|webm|ogg)/i)){
      add(s,'Video (iframe)','VIDEO');
    }else if(s.match(/player|video|embed|watch/i)){
      add(s,'Embedded Player','IFRAME');
    }
  });

  /* 3. Open Graph meta tags */
  d.querySelectorAll('meta[property]').forEach(function(m){
    var p=m.getAttribute('property'),c=m.content;
    if(!c)return;
    if(p==='og:video'||p==='og:video:url'||p==='og:video:secure_url'){
      add(c,'OG Video: '+d.title,'IFRAME');
    }
    if(p==='og:image'){
      add(c,'OG Image: '+d.title,'IMAGE',c);
    }
  });

  /* 4. Twitter card meta */
  d.querySelectorAll('meta[name]').forEach(function(m){
    var n=m.name,c=m.content;
    if(!c)return;
    if(n==='twitter:player:stream'||n==='twitter:player'){
      add(c,'Twitter Video: '+d.title,'IFRAME');
    }
    if(n==='twitter:image'){
      add(c,'Twitter Image','IMAGE',c);
    }
  });

  /* 5. JSON-LD structured data */
  d.querySelectorAll('script[type="application/ld+json"]').forEach(function(s){
    try{
      var j=JSON.parse(s.textContent);
      var items=Array.isArray(j)?j:[j];
      items.forEach(function(item){
        if(item['@type']==='VideoObject'){
          if(item.contentUrl)add(item.contentUrl,item.name||'Video','VIDEO');
          if(item.embedUrl)add(item.embedUrl,item.name||'Embed','IFRAME');
          if(item.thumbnailUrl)add(item.thumbnailUrl,(item.name||'Video')+' Thumbnail','IMAGE',item.thumbnailUrl);
        }
        if(item['@type']==='ImageObject'&&item.contentUrl){
          add(item.contentUrl,item.name||'Image','IMAGE',item.contentUrl);
        }
      });
    }catch(e){}
  });

  /* 6. Common video player data attributes */
  d.querySelectorAll('[data-video-url],[data-src],[data-video],[data-embed-url],[data-stream-url]').forEach(function(el){
    var attrs=['data-video-url','data-src','data-video','data-embed-url','data-stream-url'];
    attrs.forEach(function(a){
      var v=el.getAttribute(a);
      if(v&&v.match(/^https?:\\/\\//)){
        if(v.match(/\\.(mp4|webm|ogg|m3u8)/i))add(v,'Video (data-attr)','VIDEO');
        else add(v,'Media (data-attr)','IFRAME');
      }
    });
  });

  /* 7. Video.js instances */
  if(w.videojs){
    try{
      var players=w.videojs.getAllPlayers();
      players.forEach(function(p){
        var s=p.currentSrc();
        if(s)add(s,'Video.js Player','VIDEO');
      });
    }catch(e){}
  }

  /* 8. JW Player instances */
  if(w.jwplayer){
    try{
      var jw=w.jwplayer();
      if(jw&&jw.getPlaylistItem){
        var item=jw.getPlaylistItem();
        if(item&&item.file)add(item.file,'JW Player','VIDEO');
        if(item&&item.sources){
          item.sources.forEach(function(s){if(s.file)add(s.file,'JW Player ('+s.type+')','VIDEO');});
        }
      }
    }catch(e){}
  }

  /* 9. Regular images (large ones) */
  d.querySelectorAll('img').forEach(function(i){
    if(i.naturalWidth>100&&i.naturalHeight>100&&i.src&&i.src.startsWith('http')){
      add(i.src,i.alt||'Image','IMAGE',i.src);
    }
  });

  /* 10. CSS background images */
  d.querySelectorAll('[style*="background"]').forEach(function(el){
    var m=el.style.backgroundImage.match(/url\\(['"]?(https?:\\/\\/[^'"\\)]+)['"]?\\)/);
    if(m&&m[1])add(m[1],'Background Image','IMAGE',m[1]);
  });

  if(!media.length){
    alert('ArtVault: No media found on this page');return;
  }

  /* Build overlay */
  var overlay=d.createElement('div');
  overlay.id='artvault-clipper';
  overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.92);overflow-y:auto;font-family:system-ui,sans-serif;';

  var html='<div style="max-width:960px;margin:0 auto;padding:24px;">';
  html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
  html+='<h2 style="color:#fff;font-size:20px;margin:0;">Save to <span style="color:#ec4899;">ArtVault</span></h2>';
  html+='<button onclick="document.getElementById(\\'artvault-clipper\\').remove()" style="color:#999;background:none;border:none;font-size:28px;cursor:pointer;line-height:1;">&times;</button>';
  html+='</div>';
  html+='<p style="color:#888;font-size:13px;margin:0 0 16px;">Found '+media.length+' media items on this page</p>';

  /* Section labels */
  var types={IMAGE:[],VIDEO:[],IFRAME:[]};
  media.forEach(function(m){types[m.type].push(m);});
  var labels={VIDEO:'Videos & Embeds',IMAGE:'Images',IFRAME:'Embedded Players'};

  ['VIDEO','IFRAME','IMAGE'].forEach(function(type){
    var items=types[type];
    if(!items.length)return;
    html+='<h3 style="color:#ec4899;font-size:14px;margin:16px 0 8px;text-transform:uppercase;letter-spacing:1px;">'+labels[type]+' ('+items.length+')</h3>';
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">';
    items.forEach(function(m){
      var u=encodeURIComponent(m.url);
      var t=encodeURIComponent(m.label||d.title);
      var p=encodeURIComponent(w.location.href);
      var typeParam=m.type;
      if(m.type==='IMAGE'&&m.thumb){
        html+='<a href="'+av+'/clip?url='+u+'&title='+t+'&pageUrl='+p+'&type='+typeParam+'" target="_blank" style="display:block;border-radius:12px;overflow:hidden;border:2px solid transparent;transition:all 0.2s;" onmouseover="this.style.borderColor=\\'#ec4899\\';this.style.transform=\\'scale(1.02)\\'" onmouseout="this.style.borderColor=\\'transparent\\';this.style.transform=\\'scale(1)\\'">';
        html+='<img src="'+m.thumb+'" style="width:100%;height:140px;object-fit:cover;display:block;" onerror="this.style.display=\\'none\\'" />';
        html+='<div style="padding:6px 8px;background:#1a1a1a;"><span style="color:#aaa;font-size:11px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+m.label+'</span></div></a>';
      }else{
        var icon=m.type==='VIDEO'?'&#9654;':'&#128279;';
        var bg=m.type==='VIDEO'?'#1a1a2e':'#1a1a1a';
        html+='<a href="'+av+'/clip?url='+u+'&title='+t+'&pageUrl='+p+'&type='+typeParam+'" target="_blank" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:140px;border-radius:12px;background:'+bg+';border:2px solid transparent;transition:all 0.2s;text-decoration:none;" onmouseover="this.style.borderColor=\\'#ec4899\\';this.style.transform=\\'scale(1.02)\\'" onmouseout="this.style.borderColor=\\'transparent\\';this.style.transform=\\'scale(1)\\'">';
        html+='<span style="font-size:28px;margin-bottom:8px;">'+icon+'</span>';
        html+='<span style="color:#ec4899;font-size:13px;font-weight:600;">'+m.type+'</span>';
        html+='<span style="color:#888;font-size:11px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;padding:0 8px;">'+m.label+'</span></a>';
      }
    });
    html+='</div>';
  });

  html+='</div>';
  overlay.innerHTML=html;
  d.body.appendChild(overlay);
})();
`.replace(/\n/g, '').replace(/\s{2,}/g, ' ').trim();

export default function ClipperPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      <h1 className="mb-2 text-3xl font-bold text-themed">Web Clipper</h1>
      <p className="mb-8 text-themed-secondary">Save images, videos, and embeds from any website to your ArtVault with one click.</p>

      {/* Step 1: Install */}
      <div className="mb-8 rounded-xl border border-themed bg-themed-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-themed">Setup (one time)</h2>

        <p className="mb-4 text-sm text-themed-secondary">
          Drag this button to your browser&apos;s bookmarks bar:
        </p>

        <div className="mb-6 flex items-center justify-center rounded-lg bg-themed-input p-6">
          <a
            href={bookmarkletCode}
            onClick={(e) => e.preventDefault()}
            className="rounded-lg accent-bg px-6 py-3 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105"
            title="Drag me to your bookmarks bar!"
          >
            + Save to ArtVault
          </a>
        </div>

        <div className="space-y-3 text-sm text-themed-secondary">
          <p><strong className="text-themed">Chrome/Edge:</strong> Make sure your bookmarks bar is visible (Ctrl+Shift+B), then drag the button above to it.</p>
          <p><strong className="text-themed">Firefox:</strong> Drag the button to your bookmarks toolbar. If hidden, press Ctrl+Shift+B.</p>
          <p><strong className="text-themed">Safari:</strong> Show bookmarks bar (Cmd+Shift+B), then drag the button to it.</p>
        </div>

        <div className="mt-4 border-t border-themed pt-4">
          <p className="mb-2 text-xs text-themed-muted">Or copy manually:</p>
          <button
            onClick={handleCopy}
            className="rounded-lg bg-themed-input px-4 py-2 text-sm text-themed-secondary hover:text-themed"
          >
            {copied ? 'Copied!' : 'Copy bookmarklet code'}
          </button>
        </div>
      </div>

      {/* Step 2: How to use */}
      <div className="mb-8 rounded-xl border border-themed bg-themed-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-themed">How to Use</h2>

        <div className="space-y-4">
          {[
            { step: '1', text: 'Browse any website with images, videos, or embeds' },
            { step: '2', text: 'Click "Save to ArtVault" in your bookmarks bar' },
            { step: '3', text: 'An overlay shows all detected media, grouped by type' },
            { step: '4', text: 'Click the one you want — opens the clip form pre-filled' },
            { step: '5', text: 'Add tags, pick a collection, and save' },
          ].map(({ step, text }) => (
            <div key={step} className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full accent-soft-bg text-sm font-bold accent-text">
                {step}
              </div>
              <p className="pt-0.5 text-sm text-themed-secondary">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What it detects */}
      <div className="rounded-xl border border-themed bg-themed-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-themed">What it Detects</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold accent-text">Video Players</h3>
            <ul className="space-y-1.5 text-sm text-themed-secondary">
              <li className="flex gap-2"><span className="accent-text">&#x2713;</span> HTML5 &lt;video&gt; elements</li>
              <li className="flex gap-2"><span className="accent-text">&#x2713;</span> YouTube, Vimeo, Dailymotion</li>
              <li className="flex gap-2"><span className="accent-text">&#x2713;</span> Twitch, Facebook, TikTok</li>
              <li className="flex gap-2"><span className="accent-text">&#x2713;</span> Wistia, Loom embeds</li>
              <li className="flex gap-2"><span className="accent-text">&#x2713;</span> Video.js, JW Player instances</li>
              <li className="flex gap-2"><span className="accent-text">&#x2713;</span> Any iframe with &ldquo;player/video/embed&rdquo; in URL</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold accent-text">Meta & Structured Data</h3>
            <ul className="space-y-1.5 text-sm text-themed-secondary">
              <li className="flex gap-2"><span className="accent-text">&#x2713;</span> Open Graph (og:video, og:image)</li>
              <li className="flex gap-2"><span className="accent-text">&#x2713;</span> Twitter Cards (player:stream)</li>
              <li className="flex gap-2"><span className="accent-text">&#x2713;</span> JSON-LD VideoObject / ImageObject</li>
              <li className="flex gap-2"><span className="accent-text">&#x2713;</span> data-video-url, data-src attributes</li>
              <li className="flex gap-2"><span className="accent-text">&#x2713;</span> CSS background images</li>
              <li className="flex gap-2"><span className="accent-text">&#x2713;</span> Spotify, SoundCloud audio embeds</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
