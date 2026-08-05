import React,{useEffect,useMemo,useState}from'react';
import{createRoot}from'react-dom/client';
import{ChevronLeft,ChevronRight,Plus,Check,X}from'lucide-react';
import'./styles.css';
import'./event-bars.css';
import'./offline.css';

const PROJECT_KEY='move-projects-v1',ENTRY_KEY='move-entries-v1';
const SEA_BLUE='#32ADE6';
const COLORS=['#0A84FF','#FFD60A','#BF5AF2','#30D158',SEA_BLUE,'#FF9F0A','#FF453A','#FF375F','#8E8E93'];
const SWIM_PROJECT={id:'swim',name:'游泳',color:SEA_BLUE};
const DEFAULT_PROJECTS=[{id:'glutes',name:'臀腿',color:COLORS[0]},{id:'climb',name:'爬坡',color:COLORS[1]},{id:'upper',name:'上肢',color:COLORS[2]},SWIM_PROJECT];
const LIGHT_EVENT_COLORS=new Set(['#FFD60A',SEA_BLUE]);
const pad=n=>String(n).padStart(2,'0'),keyOf=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,sameDay=(a,b)=>a.toDateString()===b.toDateString();
const weekdays=['一','二','三','四','五','六','日'];
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
const ensureSwimProject=projects=>{const validProjects=Array.isArray(projects)?projects:DEFAULT_PROJECTS;return validProjects.some(project=>project.id===SWIM_PROJECT.id||project.name?.trim()===SWIM_PROJECT.name)?validProjects:[...validProjects,SWIM_PROJECT]};

function demoEntries(today){const key=day=>`${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(day)}`;return{
 [key(1)]:[{id:'a',projectId:'glutes',content:'深蹲、臀推'},{id:'b',projectId:'upper',content:'划船、推肩'}],
 [key(2)]:[{id:'c',projectId:'climb',content:'爬坡 25 分钟'}],
 [key(4)]:[{id:'d',projectId:'glutes',content:'深蹲 4×6，罗马尼亚硬拉 4×8，臀推 4×10'},{id:'e',projectId:'climb',content:'热身 10 分钟，爬坡间歇 6×3 分钟'}],
 [key(5)]:[{id:'f',projectId:'upper',content:'背部和肩部'}],[key(7)]:[{id:'g',projectId:'glutes',content:'臀腿训练'}],
 [key(8)]:[{id:'h',projectId:'climb',content:'爬坡'},{id:'i',projectId:'upper',content:'上肢'}],
 [key(11)]:[{id:'j',projectId:'glutes',content:'臀腿'},{id:'k',projectId:'climb',content:'爬坡'},{id:'l',projectId:'upper',content:'拉伸'}],
 [key(18)]:[{id:'m',projectId:'glutes',content:'臀腿'}],[key(19)]:[{id:'n',projectId:'climb',content:'爬坡'},{id:'o',projectId:'upper',content:'上肢'}],
 [key(26)]:[{id:'p',projectId:'upper',content:'上肢'},{id:'q',projectId:'glutes',content:'臀腿'}]};}

function ProjectMark({project}){return <span className="project-mark" style={{background:project?.color||'#8E8E93'}}/>}

function App(){
 const today=useMemo(()=>new Date(),[]),demo=new URLSearchParams(location.search).has('demo');
 const[month,setMonth]=useState(()=>new Date(today.getFullYear(),today.getMonth(),1)),[selected,setSelected]=useState(today);
 const[projects,setProjects]=useState(()=>demo?DEFAULT_PROJECTS:ensureSwimProject(read(PROJECT_KEY,DEFAULT_PROJECTS)));
 const[entries,setEntries]=useState(()=>demo?demoEntries(today):read(ENTRY_KEY,{}));
 const[sheet,setSheet]=useState(null),[projectName,setProjectName]=useState(''),[projectColor,setProjectColor]=useState(COLORS[0]);
 const[selectedProject,setSelectedProject]=useState(projects[0]?.id),[details,setDetails]=useState('');
 const[storageStatus,setStorageStatus]=useState(()=>demo?'standard':'checking');
 useEffect(()=>{if(!demo)localStorage.setItem(PROJECT_KEY,JSON.stringify(projects))},[demo,projects]);
 useEffect(()=>{if(demo)return;let active=true;(async()=>{try{if(!navigator.storage?.persisted){if(active)setStorageStatus('standard');return}const alreadyPersistent=await navigator.storage.persisted();const persistent=alreadyPersistent||(navigator.storage.persist?await navigator.storage.persist():false);if(active)setStorageStatus(persistent?'protected':'standard')}catch{if(active)setStorageStatus('standard')}})();return()=>{active=false}},[demo]);
 const projectMap=Object.fromEntries(projects.map(p=>[p.id,p]));
 const days=useMemo(()=>{const offset=(month.getDay()+6)%7,start=new Date(month.getFullYear(),month.getMonth(),1-offset);return Array.from({length:42},(_,i)=>new Date(start.getFullYear(),start.getMonth(),start.getDate()+i))},[month]);
 const prefix=`${month.getFullYear()}-${pad(month.getMonth()+1)}`;
 const workoutDays=Object.entries(entries).filter(([key,list])=>key.startsWith(prefix)&&list.length).length;
 const selectedEntries=entries[keyOf(selected)]||[];
 const persist=(nextProjects=projects,nextEntries=entries)=>{if(!demo){localStorage.setItem(PROJECT_KEY,JSON.stringify(nextProjects));localStorage.setItem(ENTRY_KEY,JSON.stringify(nextEntries))}};
 const chooseDay=day=>{setSelected(day);if(day.getMonth()!==month.getMonth())setMonth(new Date(day.getFullYear(),day.getMonth(),1))};
 const addProject=()=>{if(!projectName.trim())return;const next=[...projects,{id:`p-${Date.now()}`,name:projectName.trim(),color:projectColor}];setProjects(next);persist(next,entries);setProjectName('');setSheet('projects')};
 const addWorkout=()=>{if(!selectedProject)return;const key=keyOf(selected),next={...entries,[key]:[...(entries[key]||[]),{id:`e-${Date.now()}`,projectId:selectedProject,content:details.trim()}]};setEntries(next);persist(projects,next);setDetails('');setSheet(null)};
 const exportBackup=()=>{const data={version:1,exportedAt:new Date().toISOString(),projects,entries};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`动记备份-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),500)};
 const importBackup=async event=>{const file=event.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.projects)||!data.entries||typeof data.entries!=='object')throw new Error();const nextProjects=ensureSwimProject(data.projects);setProjects(nextProjects);setEntries(data.entries);persist(nextProjects,data.entries);alert('备份已恢复')}catch{alert('无法读取这个备份文件')}event.target.value=''};
 return <main className="app-shell">
  <section className="calendar-surface">
   <header className="navigation-bar"><div><h1>{month.getFullYear()}年{month.getMonth()+1}月</h1><p>本月运动 {workoutDays} 天</p></div><button className="manage" onClick={()=>setSheet('projects')}>管理项目</button></header>
   <div className="month-controls"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft/></button><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight/></button></div>
   <div className="weekday-row">{weekdays.map(d=><span key={d}>{d}</span>)}</div>
   <div className="calendar-grid">{days.map(day=>{const list=entries[keyOf(day)]||[],outside=day.getMonth()!==month.getMonth(),active=sameDay(day,selected);return <button key={keyOf(day)} className={`day-cell ${outside?'outside ':''}${active?'selected':''}`} onClick={()=>chooseDay(day)}><span className="date-number">{day.getDate()}</span><span className="mini-events">{list.slice(0,2).map(item=>{const project=projectMap[item.projectId];return <span className={`mini-event ${LIGHT_EVENT_COLORS.has(project?.color)?'light':''}`} style={{background:project?.color||'#8E8E93'}} key={item.id}><b>{project?.name||'项目'}</b></span>})}{list.length>2&&<small>+{list.length-2}项</small>}</span></button>})}</div>
  </section>
  <section className="day-section"><div className="day-heading"><div><h2>{selected.getMonth()+1}月{selected.getDate()}日</h2>{sameDay(selected,today)&&<span>今天</span>}</div><span>当天训练</span></div>
   <div className="event-list">{selectedEntries.length?selectedEntries.map(item=>{const project=projectMap[item.projectId];return <div className="event-row" key={item.id}><ProjectMark project={project}/><div><strong>{project?.name||'项目'}</strong><p>{item.content||'暂无详细内容'}</p></div><ChevronRight/></div>}):<div className="empty-row">这一天还没有训练</div>}</div>
   <button className="add-button" onClick={()=>{setSelectedProject(projects[0]?.id);setSheet('workout')}}><Plus/>添加训练</button>
  </section>
  {sheet&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSheet(null)}}><section className="sheet"><div className="grabber"/>
   {sheet==='projects'&&<><div className="sheet-nav"><button onClick={()=>setSheet(null)}>完成</button><h3>项目</h3><span/></div><div className="project-list">{projects.map(project=><div className="project-row" key={project.id}><span className="color-dot" style={{background:project.color}}/><strong>{project.name}</strong></div>)}</div><button className="new-project" onClick={()=>setSheet('newProject')}><Plus/>新建项目</button><div className="backup-group"><button onClick={exportBackup}>导出备份</button><label>导入备份<input type="file" accept="application/json,.json" onChange={importBackup}/></label></div><p className="offline-ready">{storageStatus==='checking'?'正在检查本地存储保护…':storageStatus==='protected'?'本地存储已保护 · 建议定期备份':'记录保存在本机 · 建议定期备份'}</p></>}
   {sheet==='newProject'&&<><div className="sheet-nav"><button onClick={()=>setSheet('projects')}>取消</button><h3>新建项目</h3><button onClick={addProject}>完成</button></div><div className="input-group"><label>项目名称</label><input autoFocus value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="例如：核心训练"/></div><div className="color-group"><label>颜色</label><div className="swatches">{COLORS.map(color=><button key={color} style={{background:color}} className={projectColor===color?'chosen':''} onClick={()=>setProjectColor(color)}>{projectColor===color&&<Check/>}</button>)}</div></div><div className="preview"><label>预览</label><div><span className="project-mark" style={{background:projectColor}}/><strong>{projectName||'项目名称'}</strong></div></div></>}
   {sheet==='workout'&&<><div className="sheet-nav"><button onClick={()=>setSheet(null)}>取消</button><h3>添加训练</h3><button onClick={addWorkout}>完成</button></div><div className="project-picker">{projects.map(project=><button className={selectedProject===project.id?'active':''} onClick={()=>setSelectedProject(project.id)} key={project.id}><ProjectMark project={project}/>{project.name}{selectedProject===project.id&&<Check/>}</button>)}</div><div className="input-group"><label>训练内容</label><textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="写下具体训练内容…"/></div></>}
   <button className="sheet-close" onClick={()=>setSheet(null)} aria-label="关闭"><X/></button>
  </section></div>}
 </main>}
createRoot(document.getElementById('root')).render(<App/>);
if('serviceWorker'in navigator&&!location.search.includes('demo'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
