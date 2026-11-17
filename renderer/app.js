(function(){
"use strict";
var DATA = JSON.parse(document.getElementById("architecture-data").textContent);
var ST = DATA.statuses;
(function(){ var t = document.getElementById("sitetitle"); if (t && DATA.title) t.textContent = DATA.title; })();

/* ---------- logos: simplified marks, 24 by 24. %c% is the mark colour, %bg% the tile behind it ---------- */
var S = ' fill="none" stroke="%c%" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
var BR = {
  tauri:{c:"#FFC131", m:'<circle cx="9.2" cy="9.2" r="5" fill="none" stroke="#FFC131" stroke-width="2.6"/><circle cx="14.8" cy="14.8" r="5" fill="none" stroke="#24C8DB" stroke-width="2.6"/>'},
  supabase:{c:"#3ECF8E", m:'<path d="M13.2 2.6c-.4-.5-1.2-.2-1.2.4v8H4.7c-.8 0-1.2.9-.7 1.5l7.9 9c.4.5 1.2.2 1.2-.4v-8h7.3c.8 0 1.2-.9.7-1.5z" fill="%c%"/>'},
  cloudflare:{c:"#F38020", m:'<path d="M17.6 18.5H6.3a4.3 4.3 0 0 1-.7-8.5 5.7 5.7 0 0 1 10.9-1.7 4.7 4.7 0 0 1 1.1 10.2z" fill="%c%"/>'},
  r2:{c:"#F38020", m:'<path d="M4.5 6.5h15l-1.8 13a1.6 1.6 0 0 1-1.6 1.4H7.9a1.6 1.6 0 0 1-1.6-1.4z" fill="%c%"/><ellipse cx="12" cy="6.5" rx="7.5" ry="2.2" fill="%c%" stroke="%bg%" stroke-width="1.2"/>'},
  vercel:{c:"fg", m:'<path d="M12 4l9.2 16H2.8z" fill="%c%"/>'},
  resend:{c:"fg", m:'<path fill-rule="evenodd" d="M6.5 4h6.6a5 5 0 0 1 1.9 9.6L19.2 20h-3.7l-3.7-5.9H9.8V20H6.5zM9.8 7v4.2h3.1a2.1 2.1 0 0 0 0-4.2z" fill="%c%"/>'},
  openrouter:{c:"fg", m:'<path d="M2.5 12h5.3l4.4-5.5h4.3M7.8 12l4.4 5.5h4.3"'+S+' stroke-width="2"/><path d="M16 3.5l3.5 3-3.5 3M16 14.5l3.5 3-3.5 3"'+S+' stroke-width="2"/>'},
  github:{c:"fg", m:'<path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.6-.2.6-.5v-1.7c-2.6.6-3.2-1.2-3.2-1.2-.4-1.1-1-1.4-1-1.4-.9-.6 0-.6 0-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.1-.2-4.3-1-4.3-4.7 0-1 .4-1.9 1-2.6-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.6 1 2.6 0 3.7-2.2 4.5-4.3 4.7.3.3.6.9.6 1.8v2.6c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5z" fill="%c%"/>'},
  actions:{c:"fg", m:'<circle cx="12" cy="12" r="8.5"'+S+' stroke-width="2"/><path d="M10 8.3v7.4l5.8-3.7z" fill="%c%"/>'},
  google:{c:"#4285F4", m:'<path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7z" fill="#4285F4"/><path d="M12 21.5c2.6 0 4.7-.9 6.3-2.3l-3.1-2.4c-.9.6-1.9.9-3.2.9-2.5 0-4.6-1.7-5.3-3.9H3.5v2.5A9.5 9.5 0 0 0 12 21.5z" fill="#34A853"/><path d="M6.7 13.8a5.7 5.7 0 0 1 0-3.6V7.7H3.5a9.5 9.5 0 0 0 0 8.6z" fill="#FBBC05"/><path d="M12 6.3c1.4 0 2.6.5 3.6 1.4l2.7-2.7A9.5 9.5 0 0 0 3.5 7.7l3.2 2.5C7.4 8 9.5 6.3 12 6.3z" fill="#EA4335"/>'},
  hostinger:{c:"#673DE6", m:'<path d="M5 3l5 2.7V11H5zM14 7.6l5-2.5V11h-5zM5 13h14v8l-5-2.6v-3.2h-4V21l-5-2.5z" fill="%c%"/>'},
  brave:{c:"#FB542B", m:'<path d="M12 2.5l6.6 2 1.4 3.1-1.2 7.6L12 21.5l-6.8-6.3L4 7.6l1.4-3.1z" fill="%c%"/><path d="M9 10.5l3 4 3-4" fill="none" stroke="%bg%" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'},
  hf:{c:"#FFD21E", m:'<circle cx="12" cy="12" r="9.5" fill="#FFD21E"/><circle cx="8.8" cy="10" r="1.3" fill="#3a3b45"/><circle cx="15.2" cy="10" r="1.3" fill="#3a3b45"/><path d="M8.5 14c1 1.8 2.2 2.4 3.5 2.4s2.5-.6 3.5-2.4" fill="none" stroke="#3a3b45" stroke-width="1.6" stroke-linecap="round"/>'},
  azure:{c:"#0078D4", m:'<path d="M9.6 3h5L8 21H3.4z" fill="%c%"/><path d="M14.6 7.2l6 13.8H9.9l5.9-2.4-3.3-4.4z" fill="%c%" opacity=".72"/>'},
  node:{c:"#5FA04E", m:'<path d="M12 2.6l8.1 4.7v9.4L12 21.4l-8.1-4.7V7.3z" fill="%c%"/><path d="M12 7.5v9M8.5 9.5l3.5-2 3.5 2" fill="none" stroke="%bg%" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'},
  nvidia:{c:"#76B900", m:'<path d="M3.5 12h1.4M7.4 8.5v7M10.8 5v14M14.2 8v8M17.6 6.5v11M20.6 12h0"'+S+' stroke-width="2.2"/>'},
  sqlite:{c:"fg", m:'<ellipse cx="12" cy="6" rx="7" ry="2.6"'+S+'/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"'+S+'/>'},
  gemini:{c:"#4C8DF6", m:'<path d="M12 2.5c.6 5 4.5 8.9 9.5 9.5-5 .6-8.9 4.5-9.5 9.5-.6-5-4.5-8.9-9.5-9.5 5-.6 8.9-4.5 9.5-9.5z" fill="%c%"/>'},
  android:{c:"#3DDC84", m:'<path d="M4 17a8 8 0 0 1 16 0z" fill="%c%"/><path d="M7.6 9.6L5.8 6.8M16.4 9.6l1.8-2.8"'+S+' stroke-width="1.6"/><circle cx="9" cy="13.6" r="1" fill="%bg%"/><circle cx="15" cy="13.6" r="1" fill="%bg%"/>'},
  discord:{c:"#5865F2", m:'<path d="M5.2 6.6c1.6-1.2 3.4-1.8 5-2l.5 1c.9-.2 1.8-.2 2.7 0l.5-1c1.6.2 3.4.8 5 2 1.7 3.2 2.3 6.5 2 10-1.6 1.3-3.3 2-4.9 2.5l-1-1.7c.6-.2 1.2-.5 1.7-.9l-.4-.3c-3.1 1.5-6.4 1.5-9.6 0l-.4.3c.5.4 1.1.7 1.7.9l-1 1.7c-1.6-.5-3.3-1.2-4.9-2.5-.3-3.5.4-6.8 2-10z" fill="%c%"/><circle cx="9.4" cy="12.4" r="1.5" fill="%bg%"/><circle cx="14.6" cy="12.4" r="1.5" fill="%bg%"/>'},
  postgres:{c:"#4F7FD9", m:'<path d="M7.2 4.2c-2.7 0-4.2 2.4-4.2 5.4 0 3.4 1.7 6.5 3.5 7.8.8.6 1.7.1 1.8-.9l.3-2.6c.9.4 2 .6 3.2.6v5.2c0 .9.6 1.5 1.5 1.5s1.5-.6 1.5-1.5v-5.7c2.6-1.1 4.5-3.7 4.5-6.8 0-2.3-1.7-3.9-3.8-3.9-1.3 0-2.5.5-3.3 1.4-.9-.9-2.9-1.5-5-1.5z" fill="%c%"/><circle cx="15.6" cy="8.9" r="1.1" fill="%bg%"/>'},
  redis:{c:"#E5483B", m:'<path d="M12 3.8l8.5 3.6L12 11 3.5 7.4z" fill="%c%"/><path d="M3.5 11.6L12 15.2l8.5-3.6M3.5 15.8L12 19.4l8.5-3.6"'+S+' stroke-width="2"/>'},
  flutter:{c:"#54C5F8", m:'<path d="M14.6 2.5h5.2L8.3 14l-2.6-2.6z" fill="#54C5F8"/><path d="M14.6 11.4h5.2l-5.4 5.4 5.4 5.4h-5.2l-5.4-5.4z" fill="#29A8E0"/>'},
  nestjs:{c:"#E0234E", m:'<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z" fill="%c%"/><path d="M9 15.2V8.8l6 6.4V8.8" fill="none" stroke="%bg%" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'},
  svelte:{c:"#FF3E00", m:'<path d="M16.3 4.6c-2-1.4-4.8-.9-6.2 1.1l-3.9 5.4c-1.3 1.9-.9 4.4 1 5.8M7.7 19.4c2 1.4 4.8.9 6.2-1.1l3.9-5.4c1.3-1.9.9-4.4-1-5.8"'+S+' stroke-width="2.6"/>'},
  python:{c:"#4B8BBE", m:'<path d="M11.8 2.5c-4.3 0-4 1.9-4 1.9v2h4.2v.7H6.2S3.5 6.8 3.5 11.1s2.4 4.1 2.4 4.1h1.4v-2s-.1-2.4 2.4-2.4h4.1s2.3 0 2.3-2.2V4.8s.3-2.3-4.3-2.3z" fill="#4B8BBE"/><path d="M12.2 21.5c4.3 0 4-1.9 4-1.9v-2H12v-.7h5.8s2.7.3 2.7-4-2.4-4.1-2.4-4.1h-1.4v2s.1 2.4-2.4 2.4H10.2s-2.3 0-2.3 2.2v3.8s-.3 2.3 4.3 2.3z" fill="#FFD43B"/><circle cx="9.6" cy="4.6" r=".9" fill="%bg%"/><circle cx="14.4" cy="19.4" r=".9" fill="%bg%"/>'},
  docker:{c:"#2496ED", m:'<path d="M2.6 12.4h18.6c-.5 4.2-4.2 7.2-9.5 7.2-5.1 0-8.8-2.9-9.1-7.2z" fill="%c%"/><path d="M4.6 9.2h2.6v2.3H4.6zM7.8 9.2h2.6v2.3H7.8zM11 9.2h2.6v2.3H11zM14.2 9.2h2.6v2.3h-2.6zM7.8 6.2h2.6v2.3H7.8zM11 6.2h2.6v2.3H11zM11 3.2h2.6v2.3H11z" fill="%c%"/>'},
  ml:{c:"fg", m:'<path d="M5 6l7 6-7 6M5 12h7M12 12l7-4.5M12 12l7 4.5M5 6l7 6M5 18l7-6"'+S+' stroke-width="1.4" opacity=".55"/><circle cx="5" cy="6" r="2" fill="%c%"/><circle cx="5" cy="12" r="2" fill="%c%"/><circle cx="5" cy="18" r="2" fill="%c%"/><circle cx="12" cy="12" r="2.2" fill="%c%"/><circle cx="19" cy="7.5" r="2" fill="%c%"/><circle cx="19" cy="16.5" r="2" fill="%c%"/>'},
  proxmox:{c:"#E57000", m:'<path d="M4 5l8 7-8 7M20 5l-8 7 8 7" fill="none" stroke="%c%" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'},
  tailscale:{c:"fg", m:'<circle cx="5" cy="5" r="2.1" fill="%c%" opacity=".3"/><circle cx="12" cy="5" r="2.1" fill="%c%" opacity=".3"/><circle cx="19" cy="5" r="2.1" fill="%c%" opacity=".3"/><circle cx="5" cy="12" r="2.1" fill="%c%"/><circle cx="12" cy="12" r="2.1" fill="%c%"/><circle cx="19" cy="12" r="2.1" fill="%c%"/><circle cx="5" cy="19" r="2.1" fill="%c%" opacity=".3"/><circle cx="12" cy="19" r="2.1" fill="%c%"/><circle cx="19" cy="19" r="2.1" fill="%c%" opacity=".3"/>'},
  nextjs:{c:"fg", m:'<circle cx="12" cy="12" r="9.5" fill="%c%"/><path d="M9.2 16.5V7.6l7.2 9.6M14.8 7.6v5.6" fill="none" stroke="%bg%" stroke-width="1.9" stroke-linecap="round"/>'},
  deepgram:{c:"#13EF93", m:'<path d="M4.5 4h7.2a8 8 0 0 1 0 16H4.5z" fill="none" stroke="%c%" stroke-width="2.6"/><path d="M8.5 9.5h3a2.5 2.5 0 0 1 0 5h-3z" fill="%c%"/>'},
  groq:{c:"#F55036", m:'<circle cx="12" cy="11" r="6.5" fill="none" stroke="%c%" stroke-width="2.4"/><path d="M18.5 11v4.5a5 5 0 0 1-8.7 3.4" fill="none" stroke="%c%" stroke-width="2.4" stroke-linecap="round"/>'},
  rust:{c:"fg", m:'<circle cx="12" cy="12" r="8.2" fill="none" stroke="%c%" stroke-width="2"/><circle cx="12" cy="12" r="10.3" fill="none" stroke="%c%" stroke-width="1.2" stroke-dasharray="1.6 1.6"/><path d="M9 16.5v-9h3.4a2.2 2.2 0 0 1 0 4.4H9m3 0 2.6 4.6" fill="none" stroke="%c%" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'},
  steam:{c:"fg", m:'<circle cx="12" cy="12" r="9.5" fill="%c%"/><circle cx="15.2" cy="9.4" r="2.6" fill="none" stroke="%bg%" stroke-width="1.5"/><circle cx="9.2" cy="15" r="1.9" fill="none" stroke="%bg%" stroke-width="1.5"/><path d="M3.2 13.2l5 2M10.8 14.1l2.8-2.6" fill="none" stroke="%bg%" stroke-width="1.5"/>'},
  hono:{c:"#E36002", m:'<path d="M12 2.8c3.2 3.6 6.5 7.4 6.5 11.3a6.5 6.5 0 0 1-13 0C5.5 10.7 8 6.9 12 2.8z" fill="%c%"/><path d="M12 11.5c1.4 1.6 2.6 3 2.6 4.4a2.6 2.6 0 0 1-5.2 0c0-1.3 1.1-2.8 2.6-4.4z" fill="%bg%" opacity=".55"/>'},
  electron:{c:"#47848F", m:'<ellipse cx="12" cy="12" rx="9.5" ry="3.8" fill="none" stroke="%c%" stroke-width="1.5"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" fill="none" stroke="%c%" stroke-width="1.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" fill="none" stroke="%c%" stroke-width="1.5" transform="rotate(-60 12 12)"/><circle cx="12" cy="12" r="1.8" fill="%c%"/>'},
  elevenlabs:{c:"fg", m:'<rect x="8" y="4" width="2.6" height="16" rx="1" fill="%c%"/><rect x="13.4" y="4" width="2.6" height="16" rx="1" fill="%c%"/>'},
  openai:{c:"fg", m:'<g fill="none" stroke="%c%" stroke-width="1.6"><path d="M12 3.2l7.6 4.4v8.8L12 20.8l-7.6-4.4V7.6z"/><path d="M12 8.2l3.3 1.9v3.8L12 15.8l-3.3-1.9v-3.8z"/><path d="M12 3.2v5M19.6 7.6l-4.3 2.5M19.6 16.4l-4.3-2.5M12 20.8v-5M4.4 16.4l4.3-2.5M4.4 7.6l4.3 2.5"/></g>'},
  threejs:{c:"fg", m:'<path d="M4 20L8.2 3.5 20.5 8.2z" fill="none" stroke="%c%" stroke-width="1.6" stroke-linejoin="round"/><path d="M6.1 11.8l8.3 -1.3M8.2 3.5l3.1 15.2M14.4 5.9l-3.1 12.8" fill="none" stroke="%c%" stroke-width="1.1"/>'},
  blender:{c:"#E87D0D", m:'<circle cx="14" cy="13.5" r="6.2" fill="none" stroke="%c%" stroke-width="2.2"/><circle cx="14" cy="13.5" r="2.3" fill="%c%"/><path d="M3 9.5h8M6 5.5l7.5 5.2" fill="none" stroke="%c%" stroke-width="2.2" stroke-linecap="round"/>'},
  evenrealities:{c:"fg", m:'<circle cx="7" cy="13" r="4" fill="none" stroke="%c%" stroke-width="1.8"/><circle cx="17" cy="13" r="4" fill="none" stroke="%c%" stroke-width="1.8"/><path d="M11 12.5c.7-.6 1.3-.6 2 0M3 12.5L2 10M21 12.5l1-2.5" fill="none" stroke="%c%" stroke-width="1.8" stroke-linecap="round"/>'},
  ollama:{c:"fg", m:'<path d="M8 21v-6.5a4 4 0 0 1 8 0V21M7.5 9.5V5.2c0-1.2 1.5-1.6 2-.5l1 2.3M16.5 9.5V5.2c0-1.2-1.5-1.6-2-.5l-1 2.3M6.5 13a5.5 5 0 0 1 11 0" fill="none" stroke="%c%" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="12.2" r=".9" fill="%c%"/><circle cx="14" cy="12.2" r=".9" fill="%c%"/>'},
  shield:{c:"fg", m:'<path d="M12 3l7 2.8v5.4c0 4.3-3 7.9-7 9.3-4-1.4-7-5-7-9.3V5.8z"'+S+'/><path d="M8.8 12.2l2.2 2.2 4.2-4.4"'+S+'/>'},
  chip:{c:"fg", m:'<rect x="6.5" y="6.5" width="11" height="11" rx="2"'+S+'/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"'+S+'/>'},
  key:{c:"fg", m:'<circle cx="8" cy="15" r="4"'+S+'/><path d="M11 12l8-8M16 7l2.5 2.5M14 9l2 2"'+S+'/>'},
  mic:{c:"fg", m:'<rect x="9" y="3" width="6" height="11" rx="3"'+S+'/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"'+S+'/>'},
  graph:{c:"fg", m:'<circle cx="6" cy="7" r="2.3"'+S+'/><circle cx="18" cy="6" r="2.3"'+S+'/><circle cx="12" cy="17" r="2.3"'+S+'/><path d="M7.2 9l3.8 6M16.8 8l-3.8 7M8.3 6.8h7.4"'+S+'/>'},
  download:{c:"fg", m:'<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"'+S+'/>'},
  globe:{c:"fg", m:'<circle cx="12" cy="12" r="8.5"'+S+'/><path d="M3.5 12h17M12 3.5c2.4 2.6 3.6 5.4 3.6 8.5s-1.2 5.9-3.6 8.5c-2.4-2.6-3.6-5.4-3.6-8.5s1.2-5.9 3.6-8.5z"'+S+'/>'},
  terminal:{c:"fg", m:'<rect x="3" y="4.5" width="18" height="15" rx="2"'+S+'/><path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5"'+S+'/>'},
  loop:{c:"fg", m:'<path d="M18.2 9A7 7 0 1 0 19 13"'+S+'/><path d="M18.6 4.5v4.6H14"'+S+'/>'},
  wrench:{c:"fg", m:'<path d="M14.7 6.3a4 4 0 0 0 5 5L11 20a2.1 2.1 0 0 1-3-3l8.7-8.7a4 4 0 0 0-2-2z"'+S+'/>'},
  branch:{c:"fg", m:'<circle cx="6.5" cy="5.5" r="2"'+S+'/><circle cx="6.5" cy="18.5" r="2"'+S+'/><circle cx="17.5" cy="8.5" r="2"'+S+'/><path d="M6.5 7.5v9M17.5 10.5c0 3.5-4 3.8-7 4.6-2 .5-4 1-4 1.4"'+S+'/>'},
  file:{c:"fg", m:'<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"'+S+'/>'},
  plug:{c:"fg", m:'<path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21"'+S+'/>'},
  spark:{c:"fg", m:'<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"'+S+'/>'},
  camera:{c:"fg", m:'<rect x="3" y="7" width="13" height="10" rx="2"'+S+'/><path d="M16 10.5l5-3v9l-5-3"'+S+'/>'},
  chart:{c:"fg", m:'<path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"'+S+' stroke-width="2.2"/>'},
  film:{c:"fg", m:'<rect x="3" y="5" width="18" height="14" rx="2"'+S+'/><path d="M10 9.2v5.6l4.8-2.8z" fill="%c%"/>'},
  laptop:{c:"fg", m:'<rect x="5" y="5" width="14" height="10" rx="1.5"'+S+'/><path d="M3 19h18"'+S+'/>'},
  server:{c:"fg", m:'<rect x="4" y="4" width="16" height="7" rx="1.5"'+S+'/><rect x="4" y="13" width="16" height="7" rx="1.5"'+S+'/><path d="M8 7.5h.01M8 16.5h.01"'+S+' stroke-width="2.6"/>'}
};
var OWN = {shield:1,chip:1,key:1,mic:1,graph:1,download:1,globe:1,terminal:1,loop:1,wrench:1,branch:1,file:1,plug:1,spark:1,camera:1,chart:1,film:1,laptop:1,server:1};

function $(id){ return document.getElementById(id); }
function each(list, fn){ Array.prototype.forEach.call(list, fn); }
function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function esc(t){ return String(t == null ? "" : t).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]; }); }
function f1(v){ return (Math.round(v*10)/10).toString(); }
var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* mark markup for a brand */
function mark(brand, bg){
  var b = BR[brand] || BR.chip, fg = cssVar("--fg") || "#f4f4f5";
  var col = b.c === "fg" ? fg : b.c;
  return b.m.replace(/%c%/g, col).replace(/%bg%/g, bg || cssVar("--raised") || "#1a1a1d");
}
/* status glyph */
function glyph(s, cx, cy, r){
  r = r || 5;
  switch(s){
    case "live": return '<circle class="g-ok" cx="'+cx+'" cy="'+cy+'" r="'+r+'"/>';
    case "ready": return '<circle class="g-okline" cx="'+cx+'" cy="'+cy+'" r="'+r+'"/><circle class="g-ok" cx="'+cx+'" cy="'+cy+'" r="'+(r*0.42)+'"/>';
    case "built": return '<circle class="g-fgline" cx="'+cx+'" cy="'+cy+'" r="'+r+'"/><path class="g-fg" d="M'+cx+' '+(cy-r)+' A'+r+' '+r+' 0 0 0 '+cx+' '+(cy+r)+' Z"/>';
    case "pending": return '<circle class="g-warnline" cx="'+cx+'" cy="'+cy+'" r="'+(r-0.4)+'"/>';
    case "paused": return '<rect class="g-fg" x="'+(cx-r*0.8)+'" y="'+(cy-r)+'" width="'+(r*0.55)+'" height="'+(2*r)+'"/><rect class="g-fg" x="'+(cx+r*0.25)+'" y="'+(cy-r)+'" width="'+(r*0.55)+'" height="'+(2*r)+'"/>';
    case "planned": return '<circle class="g-faint" stroke-dasharray="1.6 2.2" cx="'+cx+'" cy="'+cy+'" r="'+r+'"/>';
    default: return '<circle class="g-faintfill" cx="'+cx+'" cy="'+cy+'" r="'+(r*0.75)+'"/>';
  }
}
function glyphSvg(s, size){ size = size || 12; var h = size/2; return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" aria-hidden="true">'+glyph(s,h,h,h-1.2)+'</svg>'; }
function logoSvg(brand, size){ return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" aria-hidden="true">'+mark(brand)+'</svg>'; }

var PILL = {live:"live", ready:"set up", built:"built", pending:"not set up", paused:"paused", planned:"planned", notes:"from notes"};
var ATTN = {pending:1, planned:1, paused:1};
var SAMEALL = false, DRAGGED = false; /* when every part shares one status, show it once in the app box, not as a pill on each part */
function stClass(s){ return s==="pending" ? " warn" : (s==="live"||s==="ready") ? " ok" : ""; }

/* ---------- state ---------- */
var app = null, M = null, view = /[?&]view=map\b/.test(location.search) ? "map" : "overview", sel = null, selL = null, tour = null, step = 0;
var cam = null, camMode = "fit", camRaf = 0, dragged = false;

function nodeById(id){ for (var i=0;i<app.nodes.length;i++) if (app.nodes[i].id===id) return app.nodes[i]; return null; }
function code(n){ return app.code+"-"+String(app.nodes.indexOf(n)+1).padStart(2,"0"); }
function center(n){ return [n.x+n.w/2, n.y+n.h/2]; }
function exitPoint(n, p){
  var c = center(n), dx = p[0]-c[0], dy = p[1]-c[1];
  if (dx===0 && dy===0) return c;
  var tx = dx!==0 ? (n.w/2)/Math.abs(dx) : Infinity, ty = dy!==0 ? (n.h/2)/Math.abs(dy) : Infinity, t = Math.min(tx,ty);
  return [c[0]+dx*t, c[1]+dy*t];
}
function edgePoints(e){
  var a = nodeById(e.from), b = nodeById(e.to), via = e.via || [];
  var first = via.length ? via[0] : center(b), last = via.length ? via[via.length-1] : center(a);
  return [exitPoint(a, first)].concat(via, [exitPoint(b, last)]);
}
function inferKind(a, n){
  if (n.kind) return n.kind;
  if (n.brand==="sqlite" || n.brand==="r2") return "store";
  var z = a.zones[n.zone];
  return z && z.tag==="third party" ? "external" : "component";
}

/* one shape for every app: places, links with drawn points, walkthroughs */
function model(a){
  if (a._m) return a._m;
  var m = {view: a.arch ? a.arch.view : a.view, places: [], extras: [], links: [], captions: [], tours: []};
  a.nodes.forEach(function(n){ n._kind = inferKind(a, n); });
  if (a.arch){
    a.arch.regions.forEach(function(r){ (r.kind==="place" ? m.places : m.extras).push(r); });
    a.arch.links.forEach(function(l){ m.links.push({id:l.id, from:l.from, to:l.to, label:l.label, pts:l.pts, main:!!l.main, pending:!!l.pending, lx:l.lx, ly:l.ly, anchor:l.anchor, quiet:false, evidence:l.evidence||[], unverified:!!l.unverified, note:l.note}); });
    m.captions = a.arch.captions || [];
    a.arch.features.forEach(function(ft){ m.tours.push({id:ft.id, kind:"feature", name:ft.name, tag:ft.tag || PILL[ft.status], warn: ft.status==="pending"||ft.status==="planned", line:ft.line, steps:ft.steps, links:ft.links}); });
  } else {
    a.zones.forEach(function(z){ if (z.x != null) m.places.push({kind:"place", label:z.label, x:z.x, y:z.y, w:z.w, h:z.h}); });
    a.edges.forEach(function(e, i){
      var pts = edgePoints(e), best = -1, bi = 0;
      for (var k=0;k<pts.length-1;k++){ var dl = Math.hypot(pts[k+1][0]-pts[k][0], pts[k+1][1]-pts[k][1]); if (dl>best){ best=dl; bi=k; } }
      m.links.push({id:"e"+i, from:e.from, to:e.to, label:e.label, pts:pts, main:false, pending:!!e.pending,
        lx:(pts[bi][0]+pts[bi+1][0])/2, ly:(pts[bi][1]+pts[bi+1][1])/2+4, anchor:"middle", quiet:true});
    });
  }
  var order = a.nodes.slice().sort(function(p, q){ return (p.zone-q.zone) || (p.y-q.y) || (p.x-q.x); });
  m.tours.push({id:"parts", kind:"parts", name:"Part by part", tag:a.nodes.length+" parts", warn:false,
    line:"Every part in turn, grouped by where it runs: what it does and what it connects to.",
    steps: order.map(function(n){ return [n.id, n.what]; }), links: []});
  a._m = m; return m;
}
function tourById(id){ return M.tours.filter(function(t){ return t.id===id; })[0] || null; }
function linksOf(id){ return M.links.filter(function(l){ return l.from===id || l.to===id; }); }

/* ---------- chrome ---------- */
var CATCOLORS = ["#60a5fa","#34d399","#f5a524","#c084fc","#f472b6","#22d3ee","#fb7185","#a3e635"];
function cats(){ return (DATA.categories || []).map(function(c, i){ return {id:c.id, label:c.label, desc:c.description || "", color:c.color || CATCOLORS[i % CATCOLORS.length]}; }); }
function catOf(id){ return cats().filter(function(c){ return c.id===id; })[0] || {id:id, label:"", desc:"", color:"#85858f"}; }
function working(){ return DATA.apps.filter(function(a){ return !a.stage; }); }
function multi(){ return DATA.apps.length + (DATA.inProgress || []).length > 1; }
var GENERIC = {server:1,globe:1,laptop:1,terminal:1,loop:1,plug:1,chip:1,file:1,mic:1,graph:1,shield:1,key:1,film:1,chart:1,spark:1,wrench:1,branch:1,download:1,camera:1,ml:1};
function brandsOf(a, max){
  var seen = {}, named = [], generic = [];
  (a.nodes || []).forEach(function(n){ if (!n.brand || seen[n.brand]) return; seen[n.brand] = 1; (GENERIC[n.brand] ? generic : named).push(n.brand); });
  return named.concat(generic).slice(0, max);
}
function plural(n, one, many){ return n + " " + (n===1 ? one : many); }
function renderJump(){
  var j = $("jump");
  if (!multi()){ j.innerHTML = ""; return; }
  var o = '<label class="jl" for="jump-sel">Go to</label><select id="jump-sel"><option value="home">All systems</option>';
  cats().forEach(function(c){
    var list = DATA.apps.filter(function(a){ return a.category===c.id; });
    if (list.length) o += '<optgroup label="'+esc(c.label)+'">'+list.map(function(a){ return '<option value="'+esc(a.id)+'"'+(page==="app" && app && app.id===a.id ? " selected" : "")+'>'+esc(a.name)+'</option>'; }).join("")+'</optgroup>';
  });
  if (progressList().length) o += '<option value="in-progress"'+(page==="progress"?" selected":"")+'>Not working yet ('+progressList().length+')</option>';
  j.innerHTML = o + '</select>';
  $("jump-sel").addEventListener("change", function(){ location.hash = "#" + this.value; });
}
function renderCrumbs(){
  var c = $("crumbs");
  if (!multi() || page==="home"){ c.hidden = true; return; }
  c.hidden = false;
  var mid = page==="progress" ? '' : '<span class="sep">/</span><span class="cc" style="--cat:'+catOf(app.category).color+'"><i></i>'+esc(app.stage ? "Not working yet" : catOf(app.category).label)+'</span>';
  c.innerHTML = '<a href="#home" class="back">← All systems</a>' + mid + '<span class="sep">/</span><span class="here">'+esc(page==="progress" ? "Not working yet" : app.name)+'</span>';
}
function appCard(a, color){
  var feats = a.arch && a.arch.features ? a.arch.features.length : 0;
  var meta = [plural((a.nodes||[]).length, "part", "parts")];
  if (feats) meta.push(plural(feats, "walkthrough", "walkthroughs"));
  if (a.checked) meta.push("checked " + a.checked);
  return '<a class="acard" href="#'+esc(a.id)+'" style="--cat:'+color+'" data-q="'+esc((a.name+" "+a.summary+" "+brandsOf(a, 20).join(" ")+" "+catOf(a.category).label).toLowerCase())+'">'
    + '<span class="alogos">'+brandsOf(a, 6).map(function(b){ return '<span class="lg">'+logoSvg(b, 18)+'</span>'; }).join("")+'</span>'
    + '<span class="an">'+esc(a.name)+'</span>'
    + '<span class="as">'+esc(firstSentence(a.summary))+'</span>'
    + (a.source && a.source.repo ? '<span class="arepo mono">'+esc(a.source.repo)+'</span>' : '')
    + '<span class="am">'+esc(meta.join(" · "))+'</span>'
    + '<span class="ago">Open →</span></a>';
}
function renderHome(){
  var cs = cats(), w = working(), prog = progressList();
  var used = cs.filter(function(c){ return w.some(function(a){ return a.category===c.id; }); });
  var h = '<section class="hhero"><h2>'+esc(DATA.title || "Your systems")+'</h2>'
    + '<p>'+plural(w.length, "system", "systems")+(used.length > 1 ? ' in '+used.length+' groups' : '')+'. Pick one to see what it is made of, how its parts connect, and step-by-step walkthroughs of how it runs.</p>'
    + '<div class="hfind"><input type="search" id="find" placeholder="Find a system, a technology or a group…" aria-label="Find a system" autocomplete="off"></div>';
  if (used.length > 1 || prog.length){
    h += '<nav class="catjump" aria-label="Groups">' + used.map(function(c){ var n = w.filter(function(a){ return a.category===c.id; }).length; return '<a href="#home" data-cat="'+esc(c.id)+'" style="--cat:'+c.color+'"><i></i>'+esc(c.label)+'<b>'+n+'</b></a>'; }).join("")
      + (prog.length ? '<a href="#home" data-cat="in-progress" class="wip"><i></i>Not working yet<b>'+prog.length+'</b></a>' : '') + '</nav>';
  }
  h += '</section>';
  used.forEach(function(c){
    var list = w.filter(function(a){ return a.category===c.id; });
    h += '<section class="catsec" id="cat-'+esc(c.id)+'" style="--cat:'+c.color+'"><header><i></i><div><h3>'+esc(c.label)+'</h3>'+(c.desc ? '<p>'+esc(c.desc)+'</p>' : '')+'</div><span class="cn">'+plural(list.length, "system", "systems")+'</span></header>'
      + '<div class="cards">'+list.map(function(a){ return appCard(a, c.color); }).join("")+'</div></section>';
  });
  if (prog.length){
    h += '<section class="catsec wip" id="cat-in-progress"><header><i></i><div><h3>Not working yet</h3><p>Being built or set aside. What works today and what is left, for each.</p></div><span class="cn">'+plural(prog.length, "system", "systems")+'</span></header><div class="cards">'
      + prog.map(function(p){ return '<a class="acard wip" href="#in-progress"><span class="an">'+esc(p.name)+'</span><span class="as">'+esc(firstSentence(p.summary))+'</span><span class="am">'+esc((STAGE[p.stage]||p.stage)+(p.checked ? " · checked "+p.checked : ""))+'</span><span class="ago">See what is left →</span></a>'; }).join("")
      + '</div></section>';
  }
  h += '<p class="nomatch" id="nomatch" hidden>Nothing matches. Try a technology like “postgres”, or a group name.</p>';
  var host = $("home"); host.innerHTML = h;
  var f = $("find");
  f.addEventListener("input", function(){
    var q = f.value.trim().toLowerCase(), any = false;
    each(host.querySelectorAll(".catsec"), function(sec){
      var shown = 0;
      each(sec.querySelectorAll(".acard"), function(card){ var ok = !q || (card.getAttribute("data-q") || card.textContent.toLowerCase()).indexOf(q) >= 0; card.hidden = !ok; if (ok) shown++; });
      sec.hidden = !shown; if (shown) any = true;
    });
    $("nomatch").hidden = any;
  });
  each(host.querySelectorAll(".catjump a"), function(a){ a.addEventListener("click", function(ev){ ev.preventDefault(); var el = $("cat-"+a.getAttribute("data-cat")); if (el) el.scrollIntoView({behavior:"smooth", block:"start"}); }); });
}
function catLabel(id){ var c = (DATA.categories || []).filter(function(x){ return x.id===id; })[0]; return c ? c.label : ""; }
function renderHead(){
  var c = catOf(app.category);
  $("apphead").innerHTML = '<div class="titleblock"><h2>'+esc(app.name)+'</h2><p class="kicker">'
    + (app.source && app.source.repo ? '<span class="mono">'+esc(app.source.repo)+(app.source.commit ? ' @ '+esc(app.source.commit.slice(0,7)) : '')+'</span>' : '')
    + (app.checked ? '<span>checked '+esc(app.checked)+'</span>' : '')+'</p></div>'
    + '<div class="viewtabs" role="tablist" aria-label="How to look at it">'
    + '<button type="button" role="tab" id="view-overview" aria-selected="'+(view==="overview")+'"><b>Summary</b><span>What it is, its parts, its flows</span></button>'
    + '<button type="button" role="tab" id="view-map" aria-selected="'+(view==="map")+'"><b>Interactive map</b><span>Click parts, play walkthroughs</span></button></div>';
  $("view-overview").addEventListener("click", function(){ setView("overview"); });
  $("view-map").addEventListener("click", function(){ setView("map"); });
}
function firstSentence(t){ var m = String(t).match(/^.*?[.!?](\s|$)/); return m ? m[0].trim() : t; }
function tourButton(t, cls){
  return '<button type="button" class="'+cls+'" data-tour="'+t.id+'"><span class="tn">'+esc(t.name)+'<span class="tagpill'+(t.warn?" warn":"")+'">'+esc(t.tag)+'</span></span>'
    + '<span class="tl">'+esc(t.line)+'</span><span class="tc">'+(t.kind==="parts" ? "Start the tour" : t.steps.length+" steps · walk through")+' →</span></button>';
}
var KIND = {store:"data", external:"service", core:"core"};
function renderOverview(){
  var counts = {}; app.nodes.forEach(function(n){ counts[n.status]=(counts[n.status]||0)+1; });
  var stats = Object.keys(ST).filter(function(k){ return counts[k]; }).map(function(k){ return '<span title="'+esc(ST[k].means)+'">'+glyphSvg(k)+counts[k]+' '+esc(ST[k].label.toLowerCase())+'</span>'; }).join("");
  var h = '<div class="story"><p class="lede">'+esc(app.summary)+'</p>'
    + '<dl class="facts">'+app.facts.map(function(f){ return '<dt>'+esc(f[0])+'</dt><dd>'+esc(f[1])+'</dd>'; }).join("")+'</dl>'
    + '<div class="statrow"><span class="count">'+app.nodes.length+' parts</span><span class="stats">'+stats+'</span></div>';
  if (app.blockers && app.blockers.length){
    h += '<div class="wait"><em>'+esc(app.blockersLabel || "Waiting on")+'</em>'
      + app.blockers.map(function(id){ var n = nodeById(id); return '<button type="button" class="chip" data-go="'+id+'" title="'+esc(firstSentence(n.state))+'">'+logoSvg(n.brand,14)+esc(n.label)+'</button>'; }).join("") + '</div>';
  }
  h += '<div class="btnrow"><button type="button" class="btn primary" id="open-map">Open the interactive map →</button></div></div>';
  var feats = M.tours.filter(function(t){ return t.kind==="feature"; });
  h += '<section class="block"><div class="blockhead"><h3>Walk through it</h3><p>'+(feats.length ? "Each one follows a feature through the parts, one step at a time." : "Steps through the map one part at a time.")+'</p></div>'
    + '<div class="tourgrid">'+(feats.length ? feats : M.tours).map(function(t){ return tourButton(t, "tourcard"); }).join("")+'</div>'
    + (feats.length ? '<button type="button" class="textlink" data-tour="parts">Or go through every part, one at a time →</button>' : '')+'</section>';
  h += '<section class="block"><div class="blockhead"><h3>The pieces</h3><p>Grouped by where each part runs. Pick one to see it on the map.</p></div><div class="partgrid">'
    + app.zones.map(function(z, zi){
        var ns = app.nodes.filter(function(n){ return n.zone===zi; });
        return '<div class="zonelist"><div class="zh"><b>'+esc(z.label)+'</b><span>'+ns.length+(ns.length===1?" part":" parts")+'</span></div>'
          + ns.map(function(n){ return '<button type="button" data-go="'+n.id+'">'+logoSvg(n.brand,20)+'<span class="n">'+esc(n.label)+(KIND[n._kind] ? '<i class="kd">'+KIND[n._kind]+'</i>' : '')+'</span><span class="s">'+glyphSvg(n.status,10)+esc(ST[n.status].label)+'</span></button>'; }).join("")
          + '</div>';
      }).join("") + '</div></section>';
  h += '<details class="caveat" id="caveat"><summary>How this was checked</summary><p>'+esc(app.caveat)+'</p></details>';
  var host = $("overview"); host.innerHTML = h;
  $("open-map").addEventListener("click", function(){ setView("map"); });
  each(host.querySelectorAll("[data-go]"), function(b){ b.addEventListener("click", function(){ setView("map"); select(b.getAttribute("data-go")); }); });
  each(host.querySelectorAll("[data-tour]"), function(b){ b.addEventListener("click", function(){ setView("map"); startTour(b.getAttribute("data-tour")); }); });
}
function sizeStage(){
  var st = $("stage"); if (!st || !M) return;
  if (document.fullscreenElement || window.innerWidth <= 1000){ st.style.height = ""; return; }
  var dw = st.clientWidth - 340 - 14, want = Math.round(dw*M.view[1]/M.view[0]) + 24;
  var max = Math.max(460, Math.min(940, window.innerHeight - 170));
  st.style.height = Math.max(460, Math.min(max, want)) + "px";
}
function phone(){ return window.innerWidth <= 700; }
/* on a phone the map and its panel fill the screen together, like an app */
function toStage(){ if (!phone()) return; var st = $("stage"); if (st && !st.closest("[hidden]")) setTimeout(function(){ st.scrollIntoView({block:"start", behavior: REDUCED ? "auto" : "smooth"}); }, 30); }
function setView(v){
  view = v;
  $("overview").hidden = v!=="overview"; $("mapview").hidden = v!=="map";
  each(document.querySelectorAll("#apphead .viewtabs button"), function(b){ b.setAttribute("aria-selected", String(b.id==="view-"+v)); });
  if (v==="map"){ sizeStage(); renderDiagram(); applyState(false); renderPanel(); toStage(); }
}

/* ---------- diagram ---------- */
function roundPath(pts){
  var d = "M"+f1(pts[0][0])+" "+f1(pts[0][1]);
  for (var i=1;i<pts.length-1;i++){
    var p = pts[i], a = pts[i-1], b = pts[i+1];
    var la = Math.hypot(p[0]-a[0], p[1]-a[1]), lb = Math.hypot(b[0]-p[0], b[1]-p[1]), r = Math.min(8, la/2, lb/2);
    if (!(r >= 1)){ d += " L"+f1(p[0])+" "+f1(p[1]); continue; }
    d += " L"+f1(p[0]+(a[0]-p[0])*r/la)+" "+f1(p[1]+(a[1]-p[1])*r/la)+" Q"+f1(p[0])+" "+f1(p[1])+" "+f1(p[0]+(b[0]-p[0])*r/lb)+" "+f1(p[1]+(b[1]-p[1])*r/lb);
  }
  var z = pts[pts.length-1];
  return d+" L"+f1(z[0])+" "+f1(z[1]);
}
function arrowHead(p, q){
  var ang = Math.atan2(q[1]-p[1], q[0]-p[0]), L = 9, W = 4.4;
  var bx = q[0]-L*Math.cos(ang), by = q[1]-L*Math.sin(ang);
  return "M"+f1(bx+W*Math.sin(ang))+" "+f1(by-W*Math.cos(ang))+" L"+f1(q[0])+" "+f1(q[1])+" L"+f1(bx-W*Math.sin(ang))+" "+f1(by+W*Math.cos(ang))+" Z";
}
function badge(n){
  var x = n.x+n.w-10, y = n.y;
  if (ATTN[n.status] && !SAMEALL){
    var t = PILL[n.status], w = t.length*6.3+30;
    return '<g class="badge'+(n.status==="pending"?" warn":"")+'"><rect x="'+f1(x-w)+'" y="'+(y-10)+'" width="'+f1(w)+'" height="20" rx="10"/>'+glyph(n.status, x-w+12, y, 4.5)+'<text x="'+f1(x-w+22)+'" y="'+(y+4)+'">'+esc(t)+'</text></g>';
  }
  return '<g class="badge"><circle class="bbg" cx="'+(x-8)+'" cy="'+y+'" r="9"/>'+glyph(n.status, x-8, y, 4.5)+'</g>';
}
function nodeSvg(n){
  var x=n.x, y=n.y, w=n.w, h=n.h, k=n._kind, o=[], dash = (n.status==="pending"||n.status==="planned"||n.unverified) ? ' stroke-dasharray="5 4"' : '';
  o.push('<g class="node k-'+k+(n.unverified?' unv':'')+'" tabindex="0" role="button" data-id="'+n.id+'" aria-label="'+esc(n.label)+', '+esc(ST[n.status].label)+'">');
  var logo = function(lx, ly){ return '<g transform="translate('+lx+','+ly+') scale(.92)">'+mark(n.brand)+'</g>'; };
  if (k==="core"){
    o.push('<rect class="front" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="10"/>');
    o.push(logo(x+16, y+18));
    o.push('<text class="cl" x="'+(x+48)+'" y="'+(y+32)+'">'+esc(n.label)+'</text>');
    o.push('<text class="ns" x="'+(x+48)+'" y="'+(y+49)+'" data-max="'+(w-60)+'">'+esc(n.sub)+'</text>');
    (n.chips||[]).forEach(function(c, i){
      var cy = y+62+i*32;
      o.push('<g class="chipr"><rect x="'+(x+12)+'" y="'+cy+'" width="'+(w-24)+'" height="28" rx="5"/><text class="cn" x="'+(x+24)+'" y="'+(cy+18)+'">'+esc(c[0])+'</text><text class="cs" x="'+(x+w-22)+'" y="'+(cy+18)+'" text-anchor="end">'+esc(c[1])+'</text></g>');
    });
  } else if (k==="store"){
    var e = 7;
    o.push('<path class="front" d="M'+x+' '+(y+e)+' A'+(w/2)+' '+e+' 0 0 1 '+(x+w)+' '+(y+e)+' V'+(y+h-e)+' A'+(w/2)+' '+e+' 0 0 1 '+x+' '+(y+h-e)+' Z"'+dash+'/>');
    o.push('<path class="lid" d="M'+x+' '+(y+e)+' A'+(w/2)+' '+e+' 0 0 0 '+(x+w)+' '+(y+e)+'"/>');
    o.push(logo(x+13, y+h/2-8));
    o.push('<text class="nl" x="'+(x+45)+'" y="'+(y+h/2+3)+'" data-max="'+(w-57)+'">'+esc(n.label)+'</text>');
    if (n.sub) o.push('<text class="ns" x="'+(x+45)+'" y="'+(y+h/2+19)+'" data-max="'+(w-57)+'">'+esc(n.sub)+'</text>');
  } else {
    var ext = k==="external", tx = x+(ext?48:46);
    o.push('<rect class="front" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(ext?Math.min(26,h/2):8)+'"'+dash+'/>');
    o.push(logo(x+(ext?16:14), y+h/2-11));
    o.push('<text class="nl" x="'+tx+'" y="'+(y+h/2+(n.sub?-2:5))+'" data-max="'+(w-(tx-x)-12)+'">'+esc(n.label)+'</text>');
    if (n.sub) o.push('<text class="ns" x="'+tx+'" y="'+(y+h/2+15)+'" data-max="'+(w-(tx-x)-12)+'">'+esc(n.sub)+'</text>');
  }
  o.push(badge(n));
  o.push('<g class="step" style="display:none"><circle cx="'+(x+2)+'" cy="'+(y+2)+'" r="12"/><text x="'+(x+2)+'" y="'+(y+6.2)+'" text-anchor="middle"></text></g>');
  o.push('</g>');
  return o.join("");
}
function regionSvg(r){
  if (r.kind==="place") return '<g class="place"><rect x="'+r.x+'" y="'+r.y+'" width="'+r.w+'" height="'+r.h+'" rx="10"/><text x="'+(r.x+16)+'" y="'+(r.y+24)+'">'+esc(r.label)+'</text></g>';
  if (r.kind==="group") return '<g class="grp"><rect x="'+r.x+'" y="'+r.y+'" width="'+r.w+'" height="'+r.h+'" rx="8"/><text x="'+(r.x+12)+'" y="'+(r.y+28)+'">'+esc(r.label)+'</text></g>';
  var lw = r.label.length*8.4 + (r.sub ? r.sub.length*6.2+18 : 0) + 20;
  return '<g class="cont"><rect class="box" x="'+r.x+'" y="'+r.y+'" width="'+r.w+'" height="'+r.h+'" rx="12"/>'
    + '<rect class="leg" x="'+(r.x+12)+'" y="'+(r.y-10)+'" width="'+f1(lw)+'" height="20" rx="5"/>'
    + '<text class="cl2" x="'+(r.x+22)+'" y="'+(r.y+5)+'">'+esc(r.label)+(r.sub?'<tspan class="cs2" dx="10">'+esc(r.sub)+'</tspan>':'')+'</text></g>';
}
function linkSvg(l){
  var d = roundPath(l.pts), n = l.pts.length;
  return '<g class="edge'+(l.main?" main":"")+(l.pending?" pending":"")+(l.unverified?" unv":"")+'" data-id="'+l.id+'" tabindex="0" role="button" aria-label="Link: '+esc(l.label||"")+'"><path class="hit" d="'+d+'"/><path class="halo" d="'+d+'"/><path class="base" d="'+d+'"/><path class="flow" d="'+d+'"/><path class="head" d="'+arrowHead(l.pts[n-2], l.pts[n-1])+'"/></g>';
}
function labelSvg(l){
  if (!l.label) return "";
  var x = l.lx, y = l.ly, an = l.anchor || "start";
  if (x==null){ var a=l.pts[0], b=l.pts[1]; x=(a[0]+b[0])/2; y=(a[1]+b[1])/2-6; an="middle"; }
  var w = l.label.length*6.6+12, rx = an==="middle" ? x-w/2 : an==="end" ? x-w+6 : x-6;
  return '<g class="alabel'+(l.quiet?" quiet":"")+'" data-for="'+l.id+'"><rect x="'+f1(rx)+'" y="'+f1(y-12)+'" width="'+f1(w)+'" height="17" rx="4"/><text x="'+f1(x)+'" y="'+f1(y)+'" text-anchor="'+an+'">'+esc(l.label)+'</text></g>';
}
/* trim any label that would run past its box */
function fitText(host){
  each(host.querySelectorAll("text[data-max]"), function(t){
    var max = parseFloat(t.getAttribute("data-max")), full = t.textContent, s = full;
    try {
      if (t.getComputedTextLength() <= max) return;
      while (s.length > 3 && t.getComputedTextLength() > max) { s = s.slice(0,-1); t.textContent = s.replace(/[\s·,]+$/,"") + "…"; }
      var ttl = document.createElementNS("http://www.w3.org/2000/svg","title"); ttl.textContent = full; t.appendChild(ttl);
    } catch(e) {}
  });
}
function renderDiagram(){
  var mh = $("maphint"); if (mh) mh.textContent = hostSize()[0] < 700 ? "Drag to see the rest" : "Hover a part to preview · drag to move";
  var v = M.view, o = [];
  o.push('<svg class="map" preserveAspectRatio="xMidYMid meet" viewBox="0 0 '+v[0]+' '+v[1]+'" role="group" aria-label="'+esc(app.name)+' architecture map">');
  M.places.forEach(function(r){ o.push(regionSvg(r)); });
  M.extras.forEach(function(r){ o.push(regionSvg(r)); });
  M.captions.forEach(function(c){ o.push('<text class="acap">'+c.lines.map(function(t,i){ return '<tspan x="'+c.x+'" y="'+(c.y+i*20)+'">'+esc(t)+'</tspan>'; }).join("")+'</text>'); });
  o.push('<g id="edges">'); M.links.forEach(function(l){ o.push(linkSvg(l)); }); o.push('</g>');
  SAMEALL = app.nodes.every(function(n){ return n.status===app.nodes[0].status; });
  o.push('<g id="nodes">'); app.nodes.forEach(function(n){ o.push(nodeSvg(n)); }); o.push('</g>');
  o.push('<g id="alabels">'); M.links.forEach(function(l){ o.push(labelSvg(l)); }); o.push('</g>');
  o.push('</svg>');
  var host = $("svgwrap");
  host.innerHTML = o.join("");
  fitText(host);
  each(host.querySelectorAll(".node"), function(g){
    g.addEventListener("click", function(){ if (!dragged){ unpeek(); pick(g.getAttribute("data-id")); } });
    g.addEventListener("pointerenter", function(ev){ if (ev.pointerType==="mouse") peekSoon(g); });
    g.addEventListener("pointerleave", unpeek);
    g.addEventListener("focus", function(){ try { if (g.matches(":focus-visible")) peek(g); } catch(e) {} });
    g.addEventListener("blur", unpeek);
    g.addEventListener("keydown", function(ev){ if (ev.key==="Enter"||ev.key===" "){ ev.preventDefault(); pick(g.getAttribute("data-id")); } });
  });
  each(host.querySelectorAll(".edge, .alabel"), function(g){
    var lid = g.getAttribute("data-id") || g.getAttribute("data-for");
    g.addEventListener("click", function(ev){ if (dragged || tour) return; ev.stopPropagation(); selectLink(lid); });
    g.addEventListener("keydown", function(ev){ if (ev.key==="Enter"||ev.key===" "){ ev.preventDefault(); selectLink(lid); } });
  });
  host.querySelector("svg").addEventListener("click", function(ev){ if (dragged) return; if (!ev.target.closest(".node") && !tour && (sel || selL)) select(null); });
  cam = null;
}

/* ---------- hover preview ---------- */
var peekT = 0;
function peekSoon(g){ clearTimeout(peekT); peekT = setTimeout(function(){ peek(g); }, 110); }
function unpeek(){
  clearTimeout(peekT);
  var host = $("svgwrap"), s = host.querySelector("svg");
  if (s && s.classList.contains("peek")){ s.classList.remove("peek"); each(host.querySelectorAll(".pk"), function(x){ x.classList.remove("pk", "pkc"); }); }
  $("peekcard").hidden = true;
}
function peek(g){
  var id = g.getAttribute("data-id"), n = nodeById(id), host = $("svgwrap"), s = host.querySelector("svg");
  if (!n || !s || host.classList.contains("drag")) return;
  unpeek();
  var ls = linksOf(id), near = {}, lon = {};
  near[id] = 1; ls.forEach(function(l){ near[l.from] = 1; near[l.to] = 1; lon[l.id] = 1; });
  if (!tour){
    s.classList.add("peek");
    each(host.querySelectorAll(".node"), function(x){ var nid = x.getAttribute("data-id"); if (near[nid]) x.classList.add("pk"); if (nid===id) x.classList.add("pkc"); });
    each(host.querySelectorAll(".edge"), function(x){ if (lon[x.getAttribute("data-id")]) x.classList.add("pk"); });
    each(host.querySelectorAll(".alabel"), function(x){ if (lon[x.getAttribute("data-for")]) x.classList.add("pk"); });
  }
  var names = [], seen = {};
  app.edges.forEach(function(e){ var o = e.from===id ? e.to : e.to===id ? e.from : null; if (o && !seen[o]){ seen[o] = 1; names.push(nodeById(o).label); } });
  var card = $("peekcard");
  card.innerHTML = '<div class="ph"><b>'+esc(n.label)+'</b><span class="ps'+(n.status==="pending"?" warn":"")+'">'+glyphSvg(n.status)+esc(ST[n.status].label)+'</span></div>'
    + '<p>'+esc(firstSentence(n.what))+'</p>'
    + (names.length ? '<div class="pt">Talks to <b>'+esc(names.slice(0,4).join(", "))+'</b>'+(names.length>4 ? " and "+(names.length-4)+" more" : "")+'</div>' : '')
    + '<div class="pt">Click for details</div>';
  card.hidden = false;
  var box = card.parentNode.getBoundingClientRect(), r = g.querySelector(".front").getBoundingClientRect();
  var cw = card.offsetWidth, ch = card.offsetHeight;
  var left = Math.min(Math.max(8, r.left-box.left+(r.width-cw)/2), box.width-cw-8);
  var top = r.bottom-box.top+12;
  if (top+ch > box.height-8) top = r.top-box.top-ch-12;
  if (top < 8) top = Math.max(8, Math.min(box.height-ch-8, r.bottom-box.top+12));
  card.style.left = Math.round(left)+"px"; card.style.top = Math.round(top)+"px";
}

/* ---------- camera ---------- */
function hostSize(){ var h = $("svgwrap"); return [Math.max(h.clientWidth, 80), Math.max(h.clientHeight, 80)]; }
function aspectBox(b){
  var s = hostSize(), r = s[0]/s[1], cx = b.x+b.w/2, cy = b.y+b.h/2, w = b.w, h = b.h;
  if (w/h < r) w = h*r; else h = w/r;
  return {x:cx-w/2, y:cy-h/2, w:w, h:h};
}
function fitBox(){ return aspectBox({x:0, y:0, w:M.view[0], h:M.view[1]+56}); }
function clampBox(b){
  var f = fitBox();
  if (b.w >= f.w) return f;
  var W = M.view[0], H = M.view[1]+56;
  b.x = b.w >= W ? (W-b.w)/2 : Math.min(Math.max(b.x, 0), W-b.w);
  b.y = b.h >= H ? (H-b.h)/2 : Math.min(Math.max(b.y, 0), H-b.h);
  return b;
}
function focusBox(ids){
  var x0=Infinity, y0=Infinity, x1=-Infinity, y1=-Infinity;
  ids.forEach(function(id){ var n = nodeById(id); if (!n) return; x0=Math.min(x0,n.x); y0=Math.min(y0,n.y); x1=Math.max(x1,n.x+n.w); y1=Math.max(y1,n.y+n.h); });
  if (x0===Infinity) return fitBox();
  var pad = 90, b = aspectBox({x:x0-pad, y:y0-pad, w:x1-x0+pad*2, h:y1-y0+pad*2});
  var hw = hostSize()[0], minW = hw<700 ? hw/0.78 : Math.max(hw/1.15, Math.min(M.view[0]*0.5, 760));
  if (b.w < minW){ var k = minW/b.w, cx = b.x+b.w/2, cy = b.y+b.h/2; b = {x:cx-b.w*k/2, y:cy-b.h*k/2, w:b.w*k, h:b.h*k}; }
  return clampBox(b);
}
function applyCam(){ var s = document.querySelector("#svgwrap svg"); if (s && cam) s.setAttribute("viewBox", f1(cam.x)+" "+f1(cam.y)+" "+f1(cam.w)+" "+f1(cam.h)); }
function setCam(b, anim){
  cancelAnimationFrame(camRaf);
  if (anim) unpeek();
  if (!cam || !anim || REDUCED){ cam = b; applyCam(); return; }
  var from = cam, t0 = performance.now(), dur = 420;
  function tick(now){
    var t = Math.min(1, Math.max(0, (now-t0)/dur)), e = t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
    cam = {x:from.x+(b.x-from.x)*e, y:from.y+(b.y-from.y)*e, w:from.w+(b.w-from.w)*e, h:from.h+(b.h-from.h)*e};
    applyCam();
    if (t<1) camRaf = requestAnimationFrame(tick);
  }
  camRaf = requestAnimationFrame(tick);
}
function neighbours(id){ var ids = [id]; linksOf(id).forEach(function(l){ ids.push(l.from===id ? l.to : l.from); }); return ids; }
function aimCamera(anim){
  if (view!=="map") return;
  if (tour){
    var s = tour.steps, cur = s[step][0];
    setCam(focusBox(tour.kind==="feature" ? (hostSize()[0]<700 ? [cur] : [cur].concat(step>0 ? [s[step-1][0]] : [], step<s.length-1 ? [s[step+1][0]] : [])) : neighbours(cur)), anim);
  } else if (camMode==="free" && cam){ setCam(clampBox(aspectBox(cam)), false); }
  else if (sel) setCam(focusBox(phone() ? [sel.id] : neighbours(sel.id)), anim);
  else setCam(startBox(), anim);
}
/* on a narrow screen the whole map is too small to read, so start at a readable size on the left and let people drag */
function startBox(){
  var s = hostSize();
  if (s[0] >= 700 || camMode==="all") return fitBox();
  var w = Math.min(M.view[0], s[0]/0.78), h = w*s[1]/s[0], f = fitBox();
  if (w >= f.w) return f;
  var c = app.nodes.filter(function(n){ return n._kind==="core"; })[0];
  return clampBox({x: c ? c.x-14 : 0, y: c ? c.y+c.h/2-h/2 : 0, w:w, h:h});
}
function zoom(k){
  if (!cam) return;
  var f = fitBox(), w = Math.min(f.w, Math.max(hostSize()[0]/2.2, cam.w*k)), h = w*cam.h/cam.w, cx = cam.x+cam.w/2, cy = cam.y+cam.h/2;
  camMode = w >= f.w ? "fit" : "free";
  setCam(clampBox({x:cx-w/2, y:cy-h/2, w:w, h:h}), true);
}
function bindCamera(){
  var host = $("svgwrap"), start = null, touches = {}, pinch = null;
  function tcount(){ return Object.keys(touches).length; }
  function tpair(){ var k = Object.keys(touches); return [touches[k[0]], touches[k[1]]]; }
  host.addEventListener("pointerdown", function(ev){
    if (ev.pointerType==="touch"){ touches[ev.pointerId] = {x:ev.clientX, y:ev.clientY}; }
    if (tcount()===2 && cam){
      var p = tpair(), r = host.getBoundingClientRect();
      pinch = {d:Math.hypot(p[0].x-p[1].x, p[0].y-p[1].y), cam:cam, mx:(p[0].x+p[1].x)/2-r.left, my:(p[0].y+p[1].y)/2-r.top};
      start = null; cancelAnimationFrame(camRaf); unpeek(); return;
    }
  });
  host.addEventListener("pointermove", function(ev){
    if (!pinch || !touches[ev.pointerId]) return;
    touches[ev.pointerId] = {x:ev.clientX, y:ev.clientY};
    var p = tpair(), d = Math.hypot(p[0].x-p[1].x, p[0].y-p[1].y); if (d < 10) return;
    var f = fitBox(), c0 = pinch.cam, s = hostSize();
    var w = Math.min(f.w, Math.max(s[0]/2.2, c0.w*pinch.d/d)), h = w*c0.h/c0.w;
    var fx = pinch.mx/s[0], fy = pinch.my/s[1], px = c0.x+fx*c0.w, py = c0.y+fy*c0.h;
    cam = clampBox({x:px-fx*w, y:py-fy*h, w:w, h:h}); camMode = w >= f.w ? "fit" : "free"; DRAGGED = true; applyCam();
  });
  function untouch(ev){ delete touches[ev.pointerId]; if (tcount() < 2 && pinch){ pinch = null; dragged = true; setTimeout(function(){ dragged = false; }, 0); } }
  host.addEventListener("pointerup", untouch); host.addEventListener("pointercancel", untouch);
  host.addEventListener("pointerdown", function(ev){ if (ev.button || pinch) return; DRAGGED = true; var mh0 = $("maphint"); if (mh0) mh0.hidden = true; start = {x:ev.clientX, y:ev.clientY, cam:cam, moved:false}; });
  host.addEventListener("pointermove", function(ev){
    if (pinch || !start || !start.cam) return;
    var dx = ev.clientX-start.x, dy = ev.clientY-start.y;
    if (!start.moved){ if (Math.hypot(dx,dy) < 5) return; start.moved = true; host.classList.add("drag"); unpeek(); try { host.setPointerCapture(ev.pointerId); } catch(e) {} cancelAnimationFrame(camRaf); }
    var k = start.cam.w/hostSize()[0];
    cam = clampBox({x:start.cam.x-dx*k, y:start.cam.y-dy*k, w:start.cam.w, h:start.cam.h}); camMode = "free"; applyCam();
  });
  function end(){ if (start && start.moved){ dragged = true; setTimeout(function(){ dragged = false; }, 0); } start = null; host.classList.remove("drag"); }
  host.addEventListener("pointerup", end); host.addEventListener("pointercancel", end);
  host.addEventListener("wheel", function(ev){
    if (!(ev.ctrlKey || ev.metaKey) || !cam) return;
    ev.preventDefault(); zoom(ev.deltaY > 0 ? 1.15 : 1/1.15);
  }, {passive:false});
  $("zoom-in").addEventListener("click", function(){ zoom(1/1.35); });
  $("zoom-out").addEventListener("click", function(){ zoom(1.35); });
  $("zoom-fit").addEventListener("click", function(){ camMode = "all"; setCam(fitBox(), true); });
  var fs = $("zoom-full"), stage = $("stage");
  if (!stage.requestFullscreen) fs.hidden = true;
  fs.addEventListener("click", function(){
    if (document.fullscreenElement) document.exitFullscreen();
    else { var p = stage.requestFullscreen(); if (p && p.catch) p.catch(function(){ fs.hidden = true; }); }
  });
  document.addEventListener("fullscreenchange", function(){ fs.textContent = document.fullscreenElement ? "Exit full screen" : "Full screen"; setTimeout(function(){ sizeStage(); aimCamera(false); }, 60); });
  var rt = 0;
  window.addEventListener("resize", function(){ clearTimeout(rt); rt = setTimeout(function(){ sizeStage(); aimCamera(false); }, 120); });
}

/* ---------- highlight state on the map ---------- */
function applyState(anim){
  if (view!=="map") return;
  var host = $("svgwrap"), on = {}, soft = {}, lon = {}, lnow = {}, lsoft = {}, cur = null, active = !!(tour || sel || selL);
  if (tour){
    var s = tour.steps, seen = {}; cur = s[step][0];
    s.forEach(function(st, i){ on[st[0]] = 1; if (i <= step) seen[st[0]] = 1; });
    if (tour.kind==="feature"){
      s.forEach(function(st){ if (!seen[st[0]]) soft[st[0]] = 1; });
      tour.links.forEach(function(id){
        var l = M.links.filter(function(x){ return x.id===id; })[0]; if (!l) return;
        var a = !nodeById(l.from) || seen[l.from], b = !nodeById(l.to) || seen[l.to];
        lon[id] = 1;
        if (!(a && b)) lsoft[id] = 1;
        else if (l.from===cur || l.to===cur) lnow[id] = 1;
      });
    } else {
      on = {}; neighbours(cur).forEach(function(id){ on[id] = 1; });
      linksOf(cur).forEach(function(l){ lon[l.id] = 1; });
    }
  } else if (selL){
    on[selL.from] = 1; on[selL.to] = 1; lon[selL.id] = 1; lnow[selL.id] = 1;
  } else if (sel){
    neighbours(sel.id).forEach(function(id){ on[id] = 1; });
    linksOf(sel.id).forEach(function(l){ lon[l.id] = 1; });
  }
  each(host.querySelectorAll(".node"), function(g){
    var id = g.getAttribute("data-id"), st = g.querySelector(".step"), nums = [];
    g.classList.toggle("sel", !!sel && !tour && id===sel.id);
    g.classList.toggle("cur", id===cur);
    g.classList.toggle("onpath", !!tour && tour.kind==="feature" && !!on[id] && !soft[id]);
    g.classList.toggle("dim", active && !on[id]);
    g.classList.toggle("soft", !!soft[id]);
    g.setAttribute("aria-pressed", String((!!sel && id===sel.id) || id===cur));
    if (tour && tour.kind==="feature") tour.steps.forEach(function(x, i){ if (x[0]===id) nums.push(i+1); });
    else if (tour && id===cur) nums.push(step+1);
    st.style.display = nums.length ? "" : "none";
    st.querySelector("text").textContent = nums.join(",");
    st.querySelector("circle").setAttribute("r", nums.join(",").length>2 ? 16 : 12);
  });
  each(host.querySelectorAll(".edge"), function(g){
    var id = g.getAttribute("data-id");
    g.classList.toggle("hot", !!lon[id] && !lsoft[id]);
    g.classList.toggle("now", !!lnow[id]);
    g.classList.toggle("soft", !!lsoft[id]);
    g.classList.toggle("dim", active && !lon[id]);
    if (lon[id] && !lsoft[id]) g.parentNode.appendChild(g);
  });
  each(host.querySelectorAll(".alabel"), function(g){
    var id = g.getAttribute("data-for");
    g.classList.toggle("on", !!lon[id] && !lsoft[id]);
    g.classList.toggle("dim", active && !lon[id]);
  });
  var mh = $("maphint"); if (mh) mh.hidden = active || DRAGGED;
  aimCamera(anim !== false);
}

/* ---------- panel ---------- */
function statusLine(n){ return '<span class="statusline'+stClass(n.status)+'" title="'+esc(ST[n.status].means)+'">'+glyphSvg(n.status)+esc(ST[n.status].label)+'</span>'; }
function talksList(n, attr){
  var talks = app.edges.filter(function(e){ return e.from===n.id || e.to===n.id; });
  if (!talks.length) return "";
  return '<div class="sect"><h3>Talks to</h3><ul class="links">' + talks.map(function(e){
    var out = e.from===n.id, other = nodeById(out ? e.to : e.from);
    return '<li><button type="button" '+attr+'="'+other.id+'"><span class="dir">'+(out?"→":"←")+'</span><span><span class="to">'+esc(other.label)+'</span>'+(e.pending?'<span class="tagpill">not yet</span>':'')+(e.label?'<span class="lab">'+esc(e.label)+'</span>':'')+'</span></button></li>';
  }).join("") + '</ul></div>';
}
function kv(n){
  return '<dl class="kv"><dt>Status</dt><dd>'+esc(n.state)+'</dd>'
    + (n.where ? '<dt>Lives in</dt><dd class="mono">'+esc(n.where)+'</dd>' : '')
    + '<dt>Checked</dt><dd>'+esc(n.checked)+'</dd></dl>';
}
function legendHtml(){
  var used = {}, kinds = {}; app.nodes.forEach(function(n){ used[n.status]=1; kinds[n._kind]=1; });
  var h = '<span><svg width="22" height="14" aria-hidden="true"><rect x="1" y="1" width="20" height="12" rx="3" fill="none" stroke="currentColor"/></svg>Running part</span>';
  if (kinds.store) h += '<span><svg width="22" height="16" aria-hidden="true"><path d="M1 4 A10 3 0 0 1 21 4 V12 A10 3 0 0 1 1 12 Z M1 4 A10 3 0 0 0 21 4" fill="none" stroke="currentColor"/></svg>Data store</span>';
  if (kinds.external) h += '<span><svg width="22" height="14" aria-hidden="true"><rect x="1" y="1" width="20" height="12" rx="6" fill="none" stroke="currentColor"/></svg>Outside service</span>';
  h += '<span><i class="ln"></i>Connected</span>';
  if (M.links.some(function(l){ return l.pending; })) h += '<span><i class="ln dash"></i>Not connected yet</span>';
  if (M.links.some(function(l){ return l.unverified; }) || app.nodes.some(function(n){ return n.unverified; })) h += '<span><i class="ln dash unv"></i>Unverified claim</span>';
  return h + Object.keys(ST).filter(function(k){ return used[k]; }).map(function(k){ return '<span title="'+esc(ST[k].means)+'">'+glyphSvg(k)+esc(ST[k].label)+'</span>'; }).join("");
}
function ghUrl(ev){
  var src = app.source; if (!src || !src.repo || !src.commit) return null;
  var u = "https://github.com/"+src.repo+"/blob/"+src.commit+"/"+ev.file.split("/").map(encodeURIComponent).join("/");
  if (ev.lines && ev.lines.length) u += "#L"+ev.lines[0]+(ev.lines[1] && ev.lines[1]!==ev.lines[0] ? "-L"+ev.lines[1] : "");
  return u;
}
function evidenceHtml(list, unv, title){
  list = list || [];
  var h = '<div class="sect evid"><h3>'+esc(title||"Evidence")+(list.length?' <span class="cnt">'+list.length+'</span>':'')+'</h3>';
  if (unv) h += '<p class="unvnote">Unverified: an independent check could not confirm this against the cited code.</p>';
  if (!list.length) return h + '<p class="hint">No code cited.</p></div>';
  h += '<ul class="evlist">' + list.map(function(ev){
    var where = ev.file + (ev.lines && ev.lines.length ? ":"+ev.lines[0]+(ev.lines[1]&&ev.lines[1]!==ev.lines[0]?"-"+ev.lines[1]:"") : "");
    var u = ghUrl(ev);
    return '<li>'+(u ? '<a class="mono" href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(where)+'</a>' : '<span class="mono">'+esc(where)+'</span>')+(ev.note?'<span class="evn">'+esc(ev.note)+'</span>':'')+'</li>';
  }).join("") + '</ul>';
  if (app.source && app.source.commit) h += '<p class="evsrc">At '+esc(app.source.repo)+' @ <span class="mono">'+esc(app.source.commit.slice(0,10))+'</span></p>';
  return h + '</div>';
}
function linkById(id){ for (var i=0;i<M.links.length;i++) if (M.links[i].id===id) return M.links[i]; return null; }
function renderPanel(){
  if (view!=="map") return;
  var p = $("panel"), keep = document.activeElement && document.activeElement.id, h;
  if (tour){
    var s = tour.steps, n = nodeById(s[step][0]), last = step===s.length-1;
    h = '<div class="wkhead"><div><p class="kicker">Walkthrough</p><p class="wkname">'+esc(tour.name)+'<span class="tagpill'+(tour.warn?" warn":"")+'">'+esc(tour.tag)+'</span></p></div><button type="button" class="btn small" id="wk-exit">Exit</button></div>'
      + '<div class="sect"><div class="wkbar" aria-hidden="true">'+s.map(function(x, i){ return '<i'+(i<=step?' class="done"':'')+'></i>'; }).join("")+'</div>'
      + '<p class="wkcount">Step '+(step+1)+' of '+s.length+(tour.kind==="parts" ? ' · '+esc(app.zones[n.zone].label) : '')+'</p></div>'
      + '<div class="brandrow"><span class="logo">'+logoSvg(n.brand,24)+'</span><div style="min-width:0"><h2>'+esc(n.label)+'</h2>'+(n.sub?'<p class="sub">'+esc(n.sub)+'</p>':'')+'</div></div>'
      + '<p class="wktext">'+esc(s[step][1])+'</p>'
      + '<div class="wknav"><button type="button" class="btn" id="wk-prev"'+(step===0?" disabled":"")+'>← Back</button><button type="button" class="btn primary" id="wk-next">'+(last?"Finish":"Next →")+'</button></div>'
      + (s[step][2] ? evidenceHtml(s[step][2], s[step][3]==="unverified", "Evidence for this step") : '')
      + '<div class="sect">'+statusLine(n)+kv(n)+'</div>'
      + (tour.kind==="parts" ? talksList(n, "data-jump") : '')
      + '<div class="sect"><h3>All steps</h3><ol class="wksteps">'+s.map(function(x, i){ return '<li><button type="button" data-step="'+i+'" class="'+(i===step?"cur":i<step?"past":"")+'"'+(i===step?' aria-current="step"':'')+'><span>'+esc(nodeById(x[0]).label)+'</span></button></li>'; }).join("")+'</ol></div>';
  } else if (sel){
    h = '<div class="rowbetween"><p class="kicker">'+esc(app.zones[sel.zone].label)+' · '+code(sel)+'</p><button type="button" class="btn small" id="back">Close</button></div>'
      + '<div class="brandrow"><span class="logo">'+logoSvg(sel.brand,24)+'</span><div style="min-width:0"><h2>'+esc(sel.label)+'</h2>'+(sel.sub?'<p class="sub">'+esc(sel.sub)+'</p>':'')+'</div></div>'
      + statusLine(sel)
      + '<p class="what">'+esc(sel.what)+'</p>' + kv(sel) + evidenceHtml(sel.evidence, sel.unverified) + talksList(sel, "data-go");
  } else if (selL){
    var fa = nodeById(selL.from), tb = nodeById(selL.to);
    h = '<div class="rowbetween"><p class="kicker">Connection</p><button type="button" class="btn small" id="back">Close</button></div>'
      + '<h2 class="lkh"><button type="button" class="lkn" data-go="'+esc(selL.from)+'">'+esc(fa ? fa.label : selL.from)+'</button> <span class="dir">→</span> <button type="button" class="lkn" data-go="'+esc(selL.to)+'">'+esc(tb ? tb.label : selL.to)+'</button></h2>'
      + (selL.label ? '<p class="what">'+esc(selL.label)+(selL.note ? ': '+esc(selL.note) : '')+'</p>' : '')
      + (selL.pending ? '<p class="hint">Not connected yet.</p>' : '')
      + evidenceHtml(selL.evidence, selL.unverified);
  } else {
    h = '<div class="sect"><h3>How to read the map</h3><div class="legend">'+legendHtml()+'</div></div>'
      + '<div class="sect"><h3>Walk through it</h3><ul class="tourlist">'+M.tours.map(function(t){ return '<li>'+tourButton(t, "")+'</li>'; }).join("")+'</ul></div>'
      + '<p class="hint">Click any part for what it does, where it lives and what it talks to.</p>';
  }
  p.innerHTML = h; p.scrollTop = 0;
  p.classList.toggle("scrolls", window.innerWidth > 1000 && p.scrollHeight > p.clientHeight + 4);
  each(p.querySelectorAll("[data-go]"), function(b){ b.addEventListener("click", function(){ select(b.getAttribute("data-go")); }); });
  each(p.querySelectorAll("[data-tour]"), function(b){ b.addEventListener("click", function(){ startTour(b.getAttribute("data-tour")); }); });
  each(p.querySelectorAll("[data-step]"), function(b){ b.addEventListener("click", function(){ goStep(+b.getAttribute("data-step")); }); });
  each(p.querySelectorAll("[data-jump]"), function(b){ b.addEventListener("click", function(){ jumpTo(b.getAttribute("data-jump")); }); });
  var x;
  if ((x = $("back"))) x.addEventListener("click", function(){ select(null); });
  if ((x = $("wk-exit"))) x.addEventListener("click", endTour);
  if ((x = $("wk-prev"))) x.addEventListener("click", function(){ goStep(step-1); });
  if ((x = $("wk-next"))) x.addEventListener("click", function(){ if (step===tour.steps.length-1) endTour(); else goStep(step+1); });
  if (keep && (keep==="wk-next" || keep==="wk-prev")){ var k = $(keep); if (k && !k.disabled) k.focus(); else if ($("wk-next")) $("wk-next").focus(); }
}

/* ---------- actions ---------- */
function select(id){
  tour = null; selL = null; sel = id ? nodeById(id) : null;
  if (!sel && camMode!=="free") camMode = "fit";
  applyState(); renderPanel();
}
function selectLink(id){ tour = null; sel = null; selL = linkById(id); renderPanel(); applyState(); }
function startTour(id){ tour = tourById(id); sel = null; step = 0; if (!tour) return; applyState(); renderPanel(); toStage(); var n = $("wk-next"); if (n) n.focus({preventScroll:true}); }
function endTour(){ tour = null; sel = null; camMode = "fit"; applyState(); renderPanel(); }
function goStep(i){ if (!tour) return; step = Math.min(tour.steps.length-1, Math.max(0, i)); applyState(); renderPanel(); }
function stepOf(id){ if (!tour) return -1; var s = tour.steps, i; for (i=step+1;i<s.length;i++) if (s[i][0]===id) return i; for (i=0;i<s.length;i++) if (s[i][0]===id) return i; return -1; }
function jumpTo(id){ var i = stepOf(id); if (i >= 0) goStep(i); else select(id); }
function pick(id){ if (tour) jumpTo(id); else select(sel && sel.id===id ? null : id); }

function asText(){
  var L = [app.name + " architecture (checked " + (app.checked || DATA.generated) + ")", app.summary, "Note: " + app.caveat, ""];
  app.zones.forEach(function(z, zi){
    L.push("## " + z.label);
    app.nodes.filter(function(n){ return n.zone===zi; }).forEach(function(n){
      L.push("- [" + code(n) + "] " + n.label + (n.sub ? " (" + n.sub + ")" : "") + ": " + ST[n.status].label + ". " + n.what);
      L.push("  Status: " + n.state + " Checked: " + n.checked + (n.where ? ". Lives in: " + n.where : ""));
    });
    L.push("");
  });
  L.push("## Connections");
  app.edges.forEach(function(e){ L.push("- " + nodeById(e.from).label + " -> " + nodeById(e.to).label + (e.label ? ": " + e.label : "") + (e.pending ? " (not connected yet)" : "")); });
  if (app.arch){ L.push(""); L.push("## Features, traced through the parts"); app.arch.features.forEach(function(ft){ L.push("- " + ft.name + " (" + (ft.tag||ST[ft.status].label) + "): " + ft.line); ft.steps.forEach(function(st, i){ L.push("  " + (i+1) + ". " + nodeById(st[0]).label + ": " + st[1]); }); }); }
  return L.join("\n");
}
$("copy-all").addEventListener("click", function(){
  var st = $("copy-all-state"), text = asText();
  function fallback(){
    var old = $("copy-fallback"); if (old) old.remove();
    var t = document.createElement("textarea"); t.id = "copy-fallback"; t.rows = 10; t.value = text; t.className = "mono";
    t.setAttribute("aria-label", "Architecture as text");
    t.style.cssText = "width:100%;background:var(--raised);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:10px";
    st.parentNode.parentNode.appendChild(t); t.select(); st.textContent = "Select and copy the text below.";
  }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function(){ st.textContent = "Copied " + app.name + "."; }, fallback); else fallback();
});

var STAGE = {building:"Being built", stalled:"Stalled", parked:"Parked"};
function shortList(items, none){
  if (!items.length) return '<ul><li class="none">'+none+'</li></ul>';
  var li = function(x){ return '<li>'+esc(x)+'</li>'; }, head = items.slice(0, 4), rest = items.slice(4);
  return '<ul>'+head.map(li).join("")+'</ul>'+(rest.length ? '<details class="more"><summary>'+rest.length+' more</summary><ul>'+rest.map(li).join("")+'</ul></details>' : '');
}
function progressList(){ return (DATA.inProgress || []).concat(DATA.apps.filter(function(a){ return !!a.stage; })); }
function renderProgress(){
  var h = '<div class="story"><p class="lede">Apps that do not work end to end yet. Each one gets a full map here once it runs. What works today and what is left are listed for each.</p></div>';
  (DATA.categories || []).forEach(function(c){
    var list = progressList().filter(function(p){ return p.category===c.id; });
    if (!list.length) return;
    h += '<section class="block"><div class="blockhead"><h3>'+esc(c.label)+'</h3><p>'+list.length+(list.length===1?" app":" apps")+'</p></div><div class="pgrid">'
      + list.map(function(p){
          return '<article class="pcard" id="ip-'+esc(p.id)+'"><div class="ph"><b>'+esc(p.name)+'</b><span class="tagpill warn">'+esc(STAGE[p.stage] || p.stage)+'</span></div>'
            + '<p class="pl">'+esc(p.summary)+'</p>'
            + (p.facts && p.facts.length ? '<dl class="facts">'+p.facts.map(function(f){ return '<dt>'+esc(f[0])+'</dt><dd>'+esc(f[1])+'</dd>'; }).join("")+'</dl>' : '')
            + '<div class="pcols"><div><h4>Works today</h4>'+shortList(p.works, "Nothing yet")+'</div>'
            + '<div><h4>Left to do</h4>'+shortList(p.left, "Nothing listed")+'</div></div>'
            + '<div class="pfoot"><span class="pchk">Checked '+esc(p.checked)+'</span>'+(p.nodes ? '<a class="btn small" href="#'+esc(p.id)+'">Open its map →</a>' : '')+'</div></article>';
        }).join("") + '</div></section>';
  });
  $("progress").innerHTML = h;
}
var page = "app";
function showOnly(which){
  $("home").hidden = which!=="home"; $("progress").hidden = which!=="progress";
  $("apphead").hidden = which==="home";
  $("overview").hidden = which!=="app" || view!=="overview"; $("mapview").hidden = which!=="app" || view!=="map";
  $("agentsbox").hidden = which!=="app";
}
function route(force){
  var id = (location.hash || "").replace("#","");
  var found = DATA.apps.filter(function(a){ return a.id===id; })[0];
  if (id==="in-progress" && progressList().length){
    if (!force && page==="progress") return;
    page = "progress"; sel = null; tour = null;
    $("apphead").innerHTML = '<div class="titleblock"><h2>Not working yet</h2><p class="kicker"><span>'+plural(progressList().length, "system", "systems")+' being built or set aside</span></p></div>';
    showOnly("progress"); renderJump(); renderCrumbs(); renderProgress(); window.scrollTo(0, 0); return;
  }
  if (!found && multi()){
    if (!force && page==="home") return;
    page = "home"; app = null; sel = null; tour = null;
    showOnly("home"); renderJump(); renderCrumbs(); renderHome(); document.title = (DATA.title || "Architecture maps"); return;
  }
  found = found || working()[0] || DATA.apps[0];
  if (!force && page==="app" && app && found.id===app.id) return;
  var fromHome = page!=="app";
  page = "app";
  app = found; M = model(app); sel = null; tour = null; step = 0; cam = null; camMode = "fit";
  if (fromHome) view = /[?&]view=map\b/.test(location.search) ? "map" : "overview";
  $("copy-all-state").textContent = "";
  var fb = $("copy-fallback"); if (fb) fb.remove();
  showOnly("app"); renderJump(); renderCrumbs(); renderHead(); renderOverview(); setView(view);
  document.title = app.name + " · " + (DATA.title || "Architecture maps"); window.scrollTo(0, 0);
}
window.addEventListener("hashchange", function(){ route(false); });
/* for scripts and screenshots: open a part, a link or a walkthrough step */
window.visualizeflow = {select: select, selectLink: selectLink, tour: function(id, i){ startTour(id); goStep(i || 0); }};
document.addEventListener("keydown", function(ev){
  if (page!=="app" || view!=="map" || ev.altKey || ev.ctrlKey || ev.metaKey) return;
  var t = ev.target, tag = t && t.tagName;
  if (tag==="INPUT" || tag==="TEXTAREA" || tag==="SELECT") return;
  if (ev.key==="Escape"){ if (tour) endTour(); else if (sel) select(null); }
  else if (tour && ev.key==="ArrowRight"){ ev.preventDefault(); goStep(step+1); }
  else if (tour && ev.key==="ArrowLeft"){ ev.preventDefault(); goStep(step-1); }
});
bindCamera();
route(true);
/* re-fit labels once the web fonts arrive, since they change text widths */
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (view==="map"){ renderDiagram(); applyState(false); } });
})();
