'use client';

import { useState } from 'react';

const ARTVAULT_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

// The bookmarklet code — minified inline JS
const bookmarkletCode = `
javascript:void(function(){
  var d=document,w=window,av='${ARTVAULT_URL}';

  /* Remove existing overlay if re-clicked */
  var old=d.getElementById('artvault-clipper');
  if(old){old.remove();return;}

  /* Find all images on the page */
  var imgs=Array.from(d.querySelectorAll('img')).filter(function(i){
    return i.naturalWidth>100&&i.naturalHeight>100&&i.src&&i.src.startsWith('http');
  });

  /* Find videos */
  var vids=Array.from(d.querySelectorAll('video source,video[src]')).map(function(v){
    return v.src||v.getAttribute('src');
  }).filter(Boolean);

  /* Find YouTube/Vimeo embeds */
  var iframes=Array.from(d.querySelectorAll('iframe[src]')).map(function(f){
    return f.src;
  }).filter(function(s){return s.match(/youtube|vimeo|dailymotion|spotify|soundcloud/);});

  if(!imgs.length&&!vids.length&&!iframes.length){
    alert('ArtVault: No media found on this page');return;
  }

  /* Build overlay */
  var overlay=d.createElement('div');
  overlay.id='artvault-clipper';
  overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.85);overflow-y:auto;font-family:system-ui,sans-serif;';

  var html='<div style="max-width:900px;margin:0 auto;padding:24px;">';
  html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">';
  html+='<h2 style="color:#fff;font-size:20px;margin:0;">Pick media to save to <span style="color:#ec4899;">ArtVault</span></h2>';
  html+='<button onclick="document.getElementById(\\'artvault-clipper\\').remove()" style="color:#999;background:none;border:none;font-size:24px;cursor:pointer;">&times;</button>';
  html+='</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">';

  imgs.forEach(function(img){
    var u=encodeURIComponent(img.src);
    var t=encodeURIComponent(img.alt||d.title);
    var p=encodeURIComponent(w.location.href);
    html+='<a href="'+av+'/clip?url='+u+'&title='+t+'&pageUrl='+p+'" target="_blank" style="display:block;border-radius:12px;overflow:hidden;border:2px solid transparent;transition:border-color 0.2s;" onmouseover="this.style.borderColor=\\'#ec4899\\'" onmouseout="this.style.borderColor=\\'transparent\\'">';
    html+='<img src="'+img.src+'" style="width:100%;height:150px;object-fit:cover;display:block;" />';
    html+='<div style="padding:8px;background:#1a1a1a;"><span style="color:#ccc;font-size:11px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(img.alt||'Image')+'</span></div>';
    html+='</a>';
  });

  vids.forEach(function(src){
    var u=encodeURIComponent(src);
    var t=encodeURIComponent('Video from '+d.title);
    var p=encodeURIComponent(w.location.href);
    html+='<a href="'+av+'/clip?url='+u+'&title='+t+'&pageUrl='+p+'" target="_blank" style="display:flex;align-items:center;justify-content:center;height:150px;border-radius:12px;background:#1a1a1a;border:2px solid transparent;color:#ec4899;font-size:14px;" onmouseover="this.style.borderColor=\\'#ec4899\\'" onmouseout="this.style.borderColor=\\'transparent\\'">Video</a>';
  });

  iframes.forEach(function(src){
    var u=encodeURIComponent(src);
    var t=encodeURIComponent('Embed from '+d.title);
    var p=encodeURIComponent(w.location.href);
    html+='<a href="'+av+'/clip?url='+u+'&title='+t+'&pageUrl='+p+'" target="_blank" style="display:flex;align-items:center;justify-content:center;height:150px;border-radius:12px;background:#1a1a1a;border:2px solid transparent;color:#ec4899;font-size:14px;" onmouseover="this.style.borderColor=\\'#ec4899\\'" onmouseout="this.style.borderColor=\\'transparent\\'">Embed</a>';
  });

  html+='</div></div>';
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
            { step: '3', text: 'An overlay shows all media found on the page' },
            { step: '4', text: 'Click the one you want — it opens the clip form pre-filled' },
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

      {/* Features */}
      <div className="rounded-xl border border-themed bg-themed-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-themed">What it Detects</h2>
        <ul className="space-y-2 text-sm text-themed-secondary">
          <li className="flex gap-2">
            <span className="accent-text">&#x2713;</span>
            Images (filters out tiny icons/logos, only shows 100x100+ images)
          </li>
          <li className="flex gap-2">
            <span className="accent-text">&#x2713;</span>
            HTML5 video elements
          </li>
          <li className="flex gap-2">
            <span className="accent-text">&#x2713;</span>
            YouTube, Vimeo, Dailymotion, Spotify, SoundCloud embeds
          </li>
          <li className="flex gap-2">
            <span className="accent-text">&#x2713;</span>
            Auto-detects media type and converts to embed URLs
          </li>
          <li className="flex gap-2">
            <span className="accent-text">&#x2713;</span>
            Duplicate detection — warns if URL already exists
          </li>
        </ul>
      </div>
    </div>
  );
}
