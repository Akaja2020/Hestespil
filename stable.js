// Gårdens heste. Lejefunktionen er bevidst inaktiv indtil videre.
const STABLE_STORAGE_KEY = "hestespil_stable_horses_v1";
const DEFAULT_STABLE_HORSES = [
 {id:"S-000001",name:"Stjerneskud",breed:"Araber",gender:"Hoppe",color:"Skimmel",height:"153 cm",temperament:"Vågen og energisk",image:"stjerneskud.PNG"},
 {id:"S-000002",name:"Safir",breed:"Araber",gender:"Hingst",color:"Brun",height:"156 cm",temperament:"Stolt og følsom",image:"safir.PNG"},
 {id:"S-000003",name:"Dusty",breed:"Quarter",gender:"Hingst",color:"Rødskimmel",height:"151 cm",temperament:"Rolig og samarbejdsvillig",image:"dusty.PNG"},
 {id:"S-000004",name:"Clover",breed:"Quarter",gender:"Hoppe",color:"Palomino",height:"150 cm",temperament:"Venlig og lærenem",image:"clover.PNG"},
 {id:"S-000005",name:"Måneskin",breed:"Welsh Cob",gender:"Hoppe",color:"Rød",height:"145 cm",temperament:"Livlig og nysgerrig",image:"maaneskin.PNG"},
 {id:"S-000006",name:"Midnat",breed:"Frieser",gender:"Hingst",color:"Sort",height:"164 cm",temperament:"Rolig og modig",image:"midnat.PNG"}
];
function getStableHorses(){
 try { const raw=localStorage.getItem(STABLE_STORAGE_KEY); if(!raw)return DEFAULT_STABLE_HORSES; const saved=JSON.parse(raw); if(!Array.isArray(saved)||!saved.length)return DEFAULT_STABLE_HORSES; return saved.map((h,i)=>({... (DEFAULT_STABLE_HORSES.find(x=>x.id===h.id)||DEFAULT_STABLE_HORSES[i]||{}),...h})); }
 catch(e){console.error("Kunne ikke indlæse gårdens heste:",e);return DEFAULT_STABLE_HORSES;}
}
function textEl(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=text;return el;}
function renderStableHorses(){
 const container=document.getElementById("stableHorseCards"),empty=document.getElementById("stableEmptyMessage"),count=document.getElementById("stableHorseCount");if(!container||!empty)return;
 const horses=getStableHorses();container.replaceChildren();empty.hidden=horses.length>0;if(count)count.textContent=horses.length+(horses.length===1?" hest":" heste");
 horses.forEach(h=>{const card=document.createElement("article");card.className="horse-overview-card";const img=document.createElement("img");img.className="stable-horse-image";img.src=h.image||"Horse-illustration.JPEG";img.alt="Billede af "+(h.name||"hesten");img.loading="lazy";img.onerror=()=>{img.onerror=null;img.src="Horse-illustration.JPEG";};const content=document.createElement("div");content.className="horse-card-content";content.append(textEl("p","horse-id","ID: "+(h.id||"Ukendt")),textEl("h3","",h.name||"Hest"),textEl("p","horse-info",[h.breed,h.gender,h.color].filter(Boolean).join(" · ")),textEl("p","","Højde: "+(h.height||"Ikke angivet")),textEl("p","","Temperament: "+(h.temperament||"Ikke angivet")));const btn=document.createElement("button");btn.type="button";btn.disabled=true;btn.textContent="Lej denne hest";btn.title="Lejefunktionen kommer senere";content.appendChild(btn);card.append(img,content);container.appendChild(card);});
}
renderStableHorses();
