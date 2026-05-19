import { useState, useEffect } from "react";
import { supabase } from './supabase';

const THEMES = {
  google:  { name:"구글 라이트", emoji:"🔵", B:"#5080c8", R:"#c85040", Y:"#e8b800", G:"#3a9048", BG:"#f5f5f5", CA:"#ffffff", BD:"#e8e8ee", T1:"#1e1e22", T2:"#444455", T3:"#888899", T4:"#b0b0c0", SEG:"#e4e4e8", dark:false, yDark:true },
  warm:    { name:"웜 내추럴",   emoji:"🌿", B:"#d45e46", R:"#3e9a68", Y:"#c89a20", G:"#4090d4", BG:"#f7f5f0", CA:"#ffffff", BD:"#e8e4d8", T1:"#1e1a14", T2:"#443c30", T3:"#8a8070", T4:"#b8b0a0", SEG:"#e4e0d4", dark:false, yDark:true },
  mood:    { name:"세련된 무드", emoji:"🪻", B:"#9858b8", R:"#289a80", Y:"#d47048", G:"#4878b0", BG:"#f5f5f8", CA:"#ffffff", BD:"#e4e4ec", T1:"#1a1820", T2:"#403850", T3:"#808098", T4:"#b0b0c8", SEG:"#e0e0e8", dark:false, yDark:false },
  dark:    { name:"다크",        emoji:"🌙", B:"#5080c8", R:"#c85040", Y:"#e8b800", G:"#3a9048", BG:"#1e1e2e", CA:"#181825", BD:"#313244", T1:"#ffffff", T2:"#c8cdd8", T3:"#7a8194", T4:"#555870", SEG:"#252535", dark:true,  yDark:true },
  nordic:  { name:"노르딕",      emoji:"❄️", B:"#4a7ab8", R:"#c06878", Y:"#d4a050", G:"#5a9878", BG:"#f2f4f7", CA:"#ffffff", BD:"#dde4ed", T1:"#1a1e2a", T2:"#3a4055", T3:"#7888a0", T4:"#b0b8c8", SEG:"#dde4ed", dark:false, yDark:true },
};
const JB = "'JetBrains Mono', monospace";
const NB = "'Nanum Barun Gothic', sans-serif";
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const getWeekKey = () => { const d = new Date(), j = new Date(d.getFullYear(),0,1); return `${d.getFullYear()}-W${String(Math.ceil(((d-j)/86400000+j.getDay()+1)/7)).padStart(2,"0")}`; };
const save = (k,v) => { try { localStorage.setItem(k, typeof v==="string"?v:JSON.stringify(v)); } catch(_){} };
const load = (k,fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch(_){return fb;} };
const cleanMD = (t) => t.replace(/#{1,6}\s*/g,"").replace(/\*\*(.+?)\*\*/g,"$1").replace(/\*(.+?)\*/g,"$1").replace(/`(.+?)`/g,"$1").trim();

const saveDB = async (userId, key, value) => {
  if (!userId) return;
  try {
    const strValue = typeof value === "string" ? value : JSON.stringify(value);
    await supabase.from("user_data").upsert(
      { user_id: userId, data_key: key, data_value: strValue, updated_at: new Date().toISOString() },
      { onConflict: "user_id,data_key" }
    );
  } catch (_) {}
};

const loadAllFromDB = async (userId) => {
  if (!userId) return {};
  try {
    const { data } = await supabase.from("user_data").select("data_key,data_value").eq("user_id", userId);
    if (!data) return {};
    const result = {};
    data.forEach(row => {
      try { result[row.data_key] = JSON.parse(row.data_value); }
      catch (_) { result[row.data_key] = row.data_value; }
    });
    return result;
  } catch (_) { return {}; }
};

const DEF_HABITS = ["운동","노무사 공부","영어","뉴스 스크랩","감사일기","독서"];
const DEF_TOP3 = ["노무사 공부","저축 이체","블로그 포스팅","영어 공부","투자 공부","업무 정리","운동"];
const DEF_GOALS = [
  {id:"savings",name:"저축",target:1200,current:0,unit:"만원"},
  {id:"study",name:"노무사 공부",target:100,current:0,unit:"점"},
  {id:"english",name:"영어",target:100,current:0,unit:"시간"},
  {id:"blog",name:"블로그",target:5,current:0,unit:"편/월"},
  {id:"invest",name:"투자 공부",target:50,current:0,unit:"시간"},
];
const DEF_TASKS = ["4대보험 정산","급여 처리","근태 관리","채용 업무","사내 공지/메일 작성","현장 인사이트 보고","사회보험 신고"];
const FRAMES = {
  PREP:{name:"PREP",desc:"즉석 답변",fields:["Point — 결론 먼저","Reason — 이유","Example — 근거/사례","Point — 마무리"]},
  STAR:{name:"STAR",desc:"업무 보고",fields:["Situation — 현재 상황","Task — 해야 할 일","Action — 내가 한 것","Result — 결과/기대효과"]},
  THREE:{name:"3단",desc:"회의 발언",fields:["주장 — 제 생각은 ~입니다","근거 — 왜냐하면 ~입니다","제안 — 따라서 ~하면 좋겠습니다"]},
};

export default function App() {
  const [themeKey, setThemeKey] = useState(() => load("gl_theme","google"));
  const th = THEMES[themeKey]||THEMES.google;
  const C = (color) => ({ background:`${color}20`, color, border:`0.5px solid ${color}55`, borderRadius:12, fontSize:9, padding:"2px 8px", fontWeight:700, fontFamily:JB });
  const I = (color) => ({ background:th.BG, border:`1px solid ${color}40`, borderRadius:9, padding:"7px 10px", fontSize:12, color:th.T1, fontFamily:NB, width:"100%", outline:"none", resize:"vertical" });
  const B = (color,full,ydk) => ({ background:color, color:ydk?"#1a1a00":"#fff", border:"none", borderRadius:13, padding:"10px 0", fontSize:11, fontWeight:700, fontFamily:JB, cursor:"pointer", width:full?"100%":"auto" });
  const K = { background:th.CA, borderRadius:13, overflow:"hidden", boxShadow:th.dark?"none":"0 1px 8px rgba(0,0,0,0.07)", border:th.dark?`0.5px solid ${th.BD}`:"none" };

  const [tab,setTab] = useState("today");
  const [ready,setReady] = useState(false);
  const [setupDone,setSetupDone] = useState(false);
  const [profile,setProfile] = useState({name:"",wakeTime:"07:00",workEndTime:"18:30"});
  const [habits,setHabits] = useState(DEF_HABITS);
  const [top3Items,setTop3Items] = useState(DEF_TOP3);
  const [goals,setGoals] = useState(DEF_GOALS);
  const [workInfo,setWorkInfo] = useState({jobTitle:"HR 담당자",tasks:DEF_TASKS});
  const [journal,setJournal] = useState({q1:"",q2:"",q3:""});
  const [habitDone,setHabitDone] = useState({});
  const [quickNotes,setQuickNotes] = useState([]);
  const [newNote,setNewNote] = useState("");
  const [coaching,setCoaching] = useState("");
  const [coachLoading,setCoachLoading] = useState(false);
  const [weeklyTop3,setWeeklyTop3] = useState({weekKey:"",items:[]});
  const [top3Sel,setTop3Sel] = useState(false);
  const [top3Draft,setTop3Draft] = useState([]);
  const [dailyTop1,setDailyTop1] = useState({date:"",item:"",done:false});
  const [top1Sel,setTop1Sel] = useState(false);
  const [goalInputs,setGoalInputs] = useState({});
  const [review,setReview] = useState({good:"",bad:"",improve:""});
  const [reviewSaved,setReviewSaved] = useState(false);
  const [repSit,setRepSit] = useState(null);
  const [repFrame,setRepFrame] = useState("PREP");
  const [repAns,setRepAns] = useState({});
  const [repFB,setRepFB] = useState("");
  const [repEx,setRepEx] = useState("");
  const [repLoading,setRepLoading] = useState(false);
  const [sec,setSec] = useState("theme");
  const [nh,setNh] = useState(""); const [nt,setNt] = useState(""); const [nw,setNw] = useState("");
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 769);

  const td = todayStr(), wk = getWeekKey();
  const sv = (k, v) => { save(k, v); if (user) saveDB(user.id, k, v); };

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 769);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    try {
      const p=localStorage.getItem("gl_profile");
      if(p){setProfile(JSON.parse(p));setSetupDone(true);}else{setReady(true);return;}
      const h=localStorage.getItem("gl_habits");if(h)setHabits(JSON.parse(h));
      const t=localStorage.getItem("gl_top3items");if(t)setTop3Items(JSON.parse(t));
      const g=localStorage.getItem("gl_goals");if(g)setGoals(JSON.parse(g));
      const w=localStorage.getItem("gl_workinfo");if(w)setWorkInfo(JSON.parse(w));
      const hd=localStorage.getItem("gl_habit_"+td);if(hd)setHabitDone(JSON.parse(hd));
      const jd=localStorage.getItem("gl_journal_"+td);if(jd)setJournal(JSON.parse(jd));
      const qn=localStorage.getItem("gl_quicknotes");if(qn)setQuickNotes(JSON.parse(qn));
      const wt=localStorage.getItem("gl_weeklytop3");if(wt)setWeeklyTop3(JSON.parse(wt));
      const dt=localStorage.getItem("gl_dailytop1");if(dt)setDailyTop1(JSON.parse(dt));
      const rv=localStorage.getItem("gl_review_"+wk);if(rv){setReview(JSON.parse(rv));setReviewSaved(true);}
      const gi=localStorage.getItem("gl_goalinputs");if(gi)setGoalInputs(JSON.parse(gi));
      const co=localStorage.getItem("gl_coaching_"+td);if(co)setCoaching(co);
    }catch(_){}
    setReady(true);
  },[]);

  useEffect(() => {
    if (!user || !ready) return;
    const syncFromDB = async () => {
      setSyncing(true);
      const dbData = await loadAllFromDB(user.id);
      if (Object.keys(dbData).length === 0) {
        const keys = ["gl_profile","gl_habits","gl_top3items","gl_goals","gl_workinfo","gl_quicknotes","gl_weeklytop3","gl_dailytop1","gl_goalinputs","gl_theme","gl_habit_"+td,"gl_journal_"+td,"gl_coaching_"+td,"gl_review_"+wk];
        for (const k of keys) { const v=localStorage.getItem(k); if(v) await saveDB(user.id, k, v); }
      } else {
        Object.entries(dbData).forEach(([k,v]) => save(k,v));
        if(dbData["gl_profile"]){setProfile(dbData["gl_profile"]);setSetupDone(true);}
        if(dbData["gl_habits"])setHabits(dbData["gl_habits"]);
        if(dbData["gl_top3items"])setTop3Items(dbData["gl_top3items"]);
        if(dbData["gl_goals"])setGoals(dbData["gl_goals"]);
        if(dbData["gl_workinfo"])setWorkInfo(dbData["gl_workinfo"]);
        if(dbData["gl_habit_"+td])setHabitDone(dbData["gl_habit_"+td]);
        if(dbData["gl_journal_"+td])setJournal(dbData["gl_journal_"+td]);
        if(dbData["gl_quicknotes"])setQuickNotes(dbData["gl_quicknotes"]);
        if(dbData["gl_weeklytop3"])setWeeklyTop3(dbData["gl_weeklytop3"]);
        if(dbData["gl_dailytop1"])setDailyTop1(dbData["gl_dailytop1"]);
        if(dbData["gl_review_"+wk]){setReview(dbData["gl_review_"+wk]);setReviewSaved(true);}
        if(dbData["gl_goalinputs"])setGoalInputs(dbData["gl_goalinputs"]);
        if(dbData["gl_coaching_"+td])setCoaching(dbData["gl_coaching_"+td]);
        if(dbData["gl_theme"])setThemeKey(dbData["gl_theme"]);
      }
      setSyncing(false);
    };
    syncFromDB();
  }, [user, ready]);

  const signInWithGoogle = () => supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.origin } });
  const signOutUser = async () => { await supabase.auth.signOut(); setUser(null); };

  const toggleHabit = h => { const n={...habitDone,[h]:!habitDone[h]}; setHabitDone(n); sv("gl_habit_"+td,n); };
  const addNote = () => { if(!newNote.trim())return; const n=[...quickNotes,{id:Date.now(),date:td,text:newNote.trim()}]; setQuickNotes(n); sv("gl_quicknotes",n); setNewNote(""); };
  const saveTop3 = () => { if(top3Draft.length!==3)return; const n={weekKey:wk,items:top3Draft}; setWeeklyTop3(n); sv("gl_weeklytop3",n); setTop3Sel(false); setTop3Draft([]); setTop1Sel(true); };
  const saveTop1 = item => { const n={date:td,item,done:false}; setDailyTop1(n); sv("gl_dailytop1",n); setTop1Sel(false); };
  const doneTop1 = () => { const n={...dailyTop1,done:true}; setDailyTop1(n); sv("gl_dailytop1",n); };

  const getCoaching = async () => {
    setCoachLoading(true);
    try {
      const hs = habits.map(h=>`${h}:${habitDone[h]?"완료":"미완료"}`).join(", ");
      const res = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:300,messages:[{role:"user",content:`목표달성 코치입니다. 한국어 존댓말로 잘한점 1문장, 개선점 1문장, 내일조언 1문장. 마크다운 기호 절대 사용하지 마세요. 이모티콘 금지. 간결하게.\n사용자:${profile.name}\n다짐:${journal.q3||"미작성"}\n습관:${hs}\nTOP1:${dailyTop1.item||"미설정"}-${dailyTop1.done?"완료":"미완료"}\nTOP3:${weeklyTop3.items?.join(", ")||"미설정"}`}]})});
      const d=await res.json(); const c=cleanMD(d.content?.[0]?.text||"코칭 생성 실패"); setCoaching(c); sv("gl_coaching_"+td,c);
    }catch(_){setCoaching("코칭 생성 중 오류가 발생했어요.");}
    setCoachLoading(false);
  };

  const genSit = async () => {
    setRepLoading(true); setRepFB(""); setRepEx(""); setRepAns({});
    try {
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:150,messages:[{role:"user",content:`HR 직무 전문가. 업무목록: ${workInfo.tasks.join(", ")} 중 하나로 ${FRAMES[repFrame].desc} 연습용 상황 1-2문장만 한국어로. 마크다운 기호 사용 금지. 상황만 출력.`}]})});
      const d=await res.json(); setRepSit(cleanMD(d.content?.[0]?.text||"상황 생성 실패"));
    }catch(_){setRepSit("오류 발생");}
    setRepLoading(false);
  };

  const getRepFB = async () => {
    setRepLoading(true);
    try {
      const f=FRAMES[repFrame];
      const ans=f.fields.map((fld,i)=>`${fld}: ${repAns[i]||"(미작성)"}`).join("\n");
      const prompt=`커뮤니케이션 코치입니다. 마크다운 기호 절대 사용 금지. 한국어 존댓말. 이모티콘 금지.

아래 JSON 형식으로만 응답하세요:
{"feedback":"피드백 2-3문장","example":{"${f.fields[0]}":"예시","${f.fields[1]}":"예시","${f.fields[2]}":"예시"${f.fields[3]?`,"${f.fields[3]}":"예시"`:""}}}

상황: ${repSit}
프레임: ${f.name}
답변:
${ans}`;
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:600,messages:[{role:"user",content:prompt}]})});
      const d=await res.json();
      const raw=d.content?.[0]?.text||"{}";
      try {
        const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
        setRepFB(parsed.feedback||"");
        setRepEx(parsed.example||{});
      } catch(_) {
        setRepFB(cleanMD(raw));
        setRepEx({});
      }
    }catch(_){setRepFB("오류 발생");setRepEx({});}
    setRepLoading(false);
  };

  const updateGoal = (id,val) => {
    const ni={...goalInputs,[id]:val}; setGoalInputs(ni); sv("gl_goalinputs",ni);
    const ng=goals.map(g=>g.id===id?{...g,current:Number(val)||0}:g); setGoals(ng); sv("gl_goals",ng);
  };

  const hdCount = habits.filter(h=>habitDone[h]).length;
  const wkNotes = quickNotes.filter(n=>{ const nd=new Date(n.date),today=new Date(),ws=new Date(today); ws.setDate(today.getDate()-today.getDay()); return nd>=ws; });
  const tabC = {today:th.B,goals:th.Y,review:th.G,report:th.R,settings:th.T3};
  const sbTxt = (tab==="goals"&&th.yDark)?"#1a1a00":"#fff";
  const LOGO = <>{["Goal"].join("")}<span style={{color:th.B}}>L</span><span style={{color:th.R}}>o</span><span style={{color:th.Y}}>g</span><span style={{color:th.G}}>.</span></>;

  if(!ready) return <div style={{background:th.BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:th.T3,fontFamily:JB,fontSize:13}}>Loading...</div>;
  if(syncing) return <div style={{background:th.BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:th.T3,fontFamily:JB,fontSize:13}}>동기화 중...</div>;

  if(!setupDone) return (
    <div style={{background:th.BG,minHeight:"100vh",padding:20,fontFamily:NB}}>
      <div style={{maxWidth:480,margin:"0 auto",paddingTop:40}}>
        <div style={{marginBottom:28}}>
          <div style={{fontFamily:JB,fontSize:26,fontWeight:700,color:th.T1,marginBottom:4}}>{LOGO}</div>
          <div style={{fontSize:13,color:th.T3}}>시작 전에 이름을 입력해주세요</div>
        </div>
        {!user&&<div style={{marginBottom:16}}>
          <button onClick={signInWithGoogle} style={{width:"100%",padding:"12px 0",background:"#fff",border:"1.5px solid #e0e0e0",borderRadius:13,fontFamily:NB,fontSize:13,fontWeight:600,color:"#333",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:16,fontWeight:700,color:"#4285F4"}}>G</span> Google로 로그인 (기기 간 동기화)
          </button>
          <div style={{fontSize:10,color:th.T3,textAlign:"center",marginTop:6,fontFamily:JB}}>로그인 없이도 사용 가능해요</div>
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[["이름","name","text","정나래"],["기상 시간","wakeTime","time",""],["퇴근 시간","workEndTime","time",""]].map(([label,key,type,ph])=>(
            <div key={key} style={{...K,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:th.T3,marginBottom:4,fontFamily:JB,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
              <input type={type} style={{...I(th.B),borderRadius:8}} placeholder={ph} value={profile[key]} onChange={e=>setProfile({...profile,[key]:e.target.value})}/>
            </div>
          ))}
          <button onClick={()=>{if(!profile.name)return;sv("gl_profile",profile);setSetupDone(true);setTop3Sel(true);}} style={{...B(th.B,true,false)}}>시작하기 →</button>
        </div>
      </div>
    </div>
  );

  if(top3Sel||(weeklyTop3.weekKey!==wk&&!dailyTop1.item)) return (
    <div style={{background:th.BG,minHeight:"100vh",padding:20,fontFamily:NB}}>
      <div style={{maxWidth:480,margin:"0 auto",paddingTop:40}}>
        <div style={{marginBottom:24}}>
          <div style={{fontFamily:JB,fontSize:11,color:th.Y,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Weekly Setup</div>
          <div style={{fontSize:20,fontWeight:700,color:th.T1}}>이번 주 TOP 3를<br/>골라주세요</div>
          <div style={{fontSize:12,color:th.T3,marginTop:6}}>딱 3개만 — 이것만 이번 주에 집중해요</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          {top3Items.map(item=>{
            const sel=top3Draft.includes(item);
            return <button key={item} onClick={()=>sel?setTop3Draft(top3Draft.filter(i=>i!==item)):top3Draft.length<3&&setTop3Draft([...top3Draft,item])} style={{background:sel?`${th.Y}20`:th.CA,border:`1.5px solid ${sel?th.Y:th.BD}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:NB,fontSize:13,color:sel?th.T1:th.T2,fontWeight:sel?700:400}}>
              {item}{sel&&<span style={{fontFamily:JB,fontSize:11,color:th.Y,fontWeight:700}}>{top3Draft.indexOf(item)+1}</span>}
            </button>;
          })}
        </div>
        <div style={{fontSize:11,color:th.T3,textAlign:"center",marginBottom:12,fontFamily:JB}}>{top3Draft.length} / 3 선택됨</div>
        <button onClick={saveTop3} disabled={top3Draft.length!==3} style={{...B(top3Draft.length===3?th.Y:th.T4,true,top3Draft.length===3&&th.yDark)}}>확정하기 →</button>
      </div>
    </div>
  );

  if(top1Sel||(!dailyTop1.item||dailyTop1.date!==td)) return (
    <div style={{background:th.BG,minHeight:"100vh",padding:20,fontFamily:NB}}>
      <div style={{maxWidth:480,margin:"0 auto",paddingTop:40}}>
        <div style={{marginBottom:24}}>
          <div style={{fontFamily:JB,fontSize:11,color:th.B,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Daily Focus</div>
          <div style={{fontSize:20,fontWeight:700,color:th.T1}}>오늘 하나만<br/>골라요</div>
          <div style={{fontSize:12,color:th.T3,marginTop:6}}>이것만 오늘 반드시 해요</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(weeklyTop3.items||[]).map((item,i)=>(
            <button key={item} onClick={()=>saveTop1(item)} style={{background:th.CA,border:`1.5px solid ${th.BD}`,borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:[th.B,th.R,th.G][i]+"25",color:[th.B,th.R,th.G][i],display:"flex",alignItems:"center",justifyContent:"center",fontFamily:JB,fontSize:12,fontWeight:700,flexShrink:0}}>{i+1}</div>
              <span style={{fontFamily:NB,fontSize:13,color:th.T1,fontWeight:600}}>{item}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const ReportTab = () => (
    <>
      <div style={{...K,marginBottom:8}}>
        <div style={{padding:"9px 12px",borderBottom:`0.5px solid ${th.BD}`}}><span style={{fontFamily:JB,fontSize:11,fontWeight:700,color:th.T1}}>말하기 연습</span></div>
        <div style={{padding:"10px 12px"}}>
          <div style={{fontSize:10,color:th.T3,marginBottom:8,fontFamily:JB,textTransform:"uppercase",letterSpacing:.5}}>프레임 선택</div>
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {Object.entries(FRAMES).map(([key,f])=>(
              <button key={key} onClick={()=>{setRepFrame(key);setRepSit(null);setRepAns({});setRepFB("");setRepEx("");}} style={{flex:1,padding:"8px 4px",background:repFrame===key?`${th.R}18`:th.BG,border:`1px solid ${repFrame===key?th.R:th.BD}`,borderRadius:9,cursor:"pointer",fontFamily:JB,fontSize:9,fontWeight:repFrame===key?700:400,color:repFrame===key?th.R:th.T3}}>
                <div>{f.name}</div><div style={{fontSize:8,marginTop:2,color:th.T4}}>{f.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={genSit} disabled={repLoading} style={{...B(th.R,true,false)}}>{repLoading?"생성 중...":"상황 카드 뽑기 →"}</button>
        </div>
      </div>
      {repSit&&<div style={{...K,marginBottom:8}}>
        <div style={{padding:"9px 12px",borderBottom:`0.5px solid ${th.BD}`,display:"flex",alignItems:"center",gap:8}}>
          <span style={C(th.R)}>상황</span>
          <span style={{fontFamily:JB,fontSize:10,color:th.T3}}>{FRAMES[repFrame].name}</span>
        </div>
        <div style={{padding:"10px 12px"}}>
          <div style={{background:`${th.R}12`,borderRadius:9,padding:"10px 12px",fontSize:12,color:th.T1,lineHeight:1.7,marginBottom:12}}>{repSit}</div>
          {FRAMES[repFrame].fields.map((field,i)=>(
            <div key={i} style={{marginBottom:8}}>
              <div style={{fontFamily:JB,fontSize:9,color:th.R,marginBottom:4,fontWeight:700}}>{field}</div>
              <textarea rows={2} style={{...I(th.R),fontSize:11}} placeholder="답변을 입력하세요..." value={repAns[i]||""} onChange={e=>setRepAns({...repAns,[i]:e.target.value})}/>
            </div>
          ))}
          <button onClick={getRepFB} disabled={repLoading} style={{...B(th.R,true,false)}}>{repLoading?"피드백 생성 중...":"AI 피드백 받기 →"}</button>
        </div>
      </div>}
      {repFB&&<div style={{background:`${th.R}10`,border:`1px solid ${th.R}30`,borderRadius:13,padding:"12px 14px",marginBottom:8}}>
        <div style={{fontFamily:JB,fontSize:9,color:th.R,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>AI Feedback</div>
        <div style={{fontSize:12,color:th.T1,lineHeight:1.9}}>{repFB}</div>
      </div>}
      {repEx&&Object.keys(repEx).length>0&&<div style={{background:`${th.B}10`,border:`1px solid ${th.B}30`,borderRadius:13,padding:"12px 14px",marginBottom:8}}>
        <div style={{fontFamily:JB,fontSize:9,color:th.B,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>모범 답변 예시</div>
        {Object.entries(repEx).map(([field,val],i)=>(
          <div key={i} style={{marginBottom:i<Object.keys(repEx).length-1?10:0}}>
            <div style={{fontFamily:JB,fontSize:9,color:th.B,fontWeight:700,marginBottom:4}}>{field}</div>
            <div style={{background:`${th.B}12`,borderRadius:8,padding:"8px 10px",fontSize:12,color:th.T1,lineHeight:1.7}}>{val}</div>
          </div>
        ))}
      </div>}
    </>
  );

  return (
    <div style={{background:th.BG,minHeight:"100vh",fontFamily:NB}}>
      <div style={{maxWidth:520,margin:"0 auto"}}>
        <div style={{background:th.CA,borderBottom:`0.5px solid ${th.BD}`,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
          <div style={{fontFamily:JB,fontSize:17,fontWeight:700,color:th.T1,letterSpacing:-.5}}>{LOGO}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontFamily:JB,fontSize:9,color:th.T3}}>{td}</div>
            <div style={C(th.G)}>{hdCount}/{habits.length}</div>
            {user ? <div style={{fontFamily:JB,fontSize:9,color:th.B,fontWeight:700}}>☁ 동기화됨</div>
              : <button onClick={signInWithGoogle} style={{background:`${th.B}15`,border:`1px solid ${th.B}40`,borderRadius:8,padding:"3px 8px",fontFamily:JB,fontSize:9,color:th.B,cursor:"pointer",fontWeight:700}}>로그인</button>}
          </div>
        </div>

        <div style={{display:"flex",background:th.SEG,borderRadius:10,margin:"8px 10px",padding:2}}>
          {[["today","Today",th.B],["goals","Goals",th.Y],["review","Review",th.G],["report","Report",th.R],["settings","⚙",th.T3]].map(([id,label,color])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,textAlign:"center",fontFamily:JB,fontSize:9,padding:"6px 0",borderRadius:8,border:"none",cursor:"pointer",background:tab===id?th.CA:"transparent",color:tab===id?color:th.T3,fontWeight:tab===id?700:400,boxShadow:tab===id?"0 1px 3px rgba(0,0,0,0.1)":"none",transition:"all .15s"}}>{label}</button>
          ))}
        </div>

        <div style={{padding:"4px 10px 80px"}}>
          {tab==="today"&&<>
            <div style={{background:dailyTop1.done?`${th.G}18`:`${th.Y}18`,border:`1px solid ${dailyTop1.done?th.G:th.Y}44`,borderRadius:13,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:JB,fontSize:9,color:dailyTop1.done?th.G:th.Y,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Today's TOP 1</div>
                <div style={{fontSize:14,fontWeight:700,color:th.T1}}>{dailyTop1.item}</div>
              </div>
              {!dailyTop1.done ? <button onClick={doneTop1} style={{background:th.Y,color:th.yDark?"#1a1a00":"#fff",border:"none",borderRadius:10,padding:"6px 14px",fontFamily:JB,fontSize:10,fontWeight:700,cursor:"pointer"}}>완료 ✓</button>
                : <div style={{fontFamily:JB,fontSize:11,color:th.G,fontWeight:700}}>완료 ✓</div>}
            </div>
            <div style={{...K,marginBottom:8}}>
              <div style={{padding:"9px 12px",display:"flex",alignItems:"center",gap:8,borderBottom:`0.5px solid ${th.BD}`}}>
                <div style={{width:26,height:26,borderRadius:8,background:`${th.B}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>📝</div>
                <span style={{fontFamily:JB,fontSize:11,fontWeight:700,color:th.T1}}>Morning Journal</span>
                <span style={{...C(th.B),marginLeft:"auto"}}>5 min</span>
              </div>
              <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:7}}>
                {[["q1","오늘 감사한 것 3가지..."],["q2","오늘 기분 좋게 만드는 것..."],["q3","오늘의 다짐 한 줄..."]].map(([k,ph])=>(
                  <textarea key={k} rows={2} style={{...I(th.B),fontSize:11}} placeholder={ph} value={journal[k]} onChange={e=>setJournal({...journal,[k]:e.target.value})} onBlur={()=>sv("gl_journal_"+td,journal)}/>
                ))}
              </div>
            </div>
            <div style={{...K,marginBottom:8}}>
              <div style={{padding:"9px 12px",display:"flex",alignItems:"center",gap:8,borderBottom:`0.5px solid ${th.BD}`}}>
                <div style={{width:26,height:26,borderRadius:8,background:`${th.G}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>✅</div>
                <span style={{fontFamily:JB,fontSize:11,fontWeight:700,color:th.T1}}>Daily Habits</span>
                <span style={{...C(th.G),marginLeft:"auto"}}>{hdCount}/{habits.length}</span>
              </div>
              <div style={{padding:"4px 12px"}}>
                {habits.map((h,i)=>(
                  <div key={h}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0"}}>
                      <span style={{fontSize:12,color:habitDone[h]?th.T3:th.T1,fontWeight:habitDone[h]?400:500,textDecoration:habitDone[h]?"line-through":"none"}}>{h}</span>
                      <button onClick={()=>toggleHabit(h)} style={{width:22,height:22,borderRadius:"50%",border:"none",cursor:"pointer",background:habitDone[h]?th.G:th.SEG,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{habitDone[h]?"✓":""}</button>
                    </div>
                    {i<habits.length-1&&<div style={{height:"0.5px",background:th.BD}}/>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{...K,marginBottom:8}}>
              <div style={{padding:"9px 12px",display:"flex",alignItems:"center",gap:8,borderBottom:`0.5px solid ${th.BD}`}}>
                <div style={{width:26,height:26,borderRadius:8,background:`${th.R}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>📌</div>
                <span style={{fontFamily:JB,fontSize:11,fontWeight:700,color:th.T1}}>Quick Note</span>
                <span style={{fontSize:9,color:th.T3,marginLeft:"auto",fontFamily:JB}}>주간 회고 때 확인</span>
              </div>
              <div style={{padding:"10px 12px"}}>
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  <input style={{...I(th.R),flex:1,fontSize:11}} placeholder="잘한 것, 아쉬운 것, 더 공부할 것..." value={newNote} onChange={e=>setNewNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNote()}/>
                  <button onClick={addNote} style={{background:th.R,color:"#fff",border:"none",borderRadius:9,padding:"0 14px",fontFamily:JB,fontSize:14,cursor:"pointer",flexShrink:0}}>+</button>
                </div>
                {quickNotes.filter(n=>n.date===td).map(n=>(
                  <div key={n.id} style={{fontSize:11,color:th.T2,padding:"5px 0",borderBottom:`0.5px solid ${th.BD}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>{n.text}</span>
                    <button onClick={()=>{const nx=quickNotes.filter(q=>q.id!==n.id);setQuickNotes(nx);sv("gl_quicknotes",nx);}} style={{background:"none",border:"none",color:th.T4,cursor:"pointer",fontSize:13}}>×</button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={getCoaching} disabled={coachLoading} style={{...B(th.B,true,false),marginBottom:8}}>{coachLoading?"코칭 생성 중...":"오늘의 AI 코칭 받기 →"}</button>
            {coaching&&<div style={{background:`${th.B}12`,border:`1px solid ${th.B}30`,borderRadius:13,padding:"12px 14px",marginBottom:8}}>
              <div style={{fontFamily:JB,fontSize:9,color:th.B,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>AI Coaching</div>
              <div style={{fontSize:12,color:th.T1,lineHeight:1.9}}>{coaching}</div>
            </div>}
          </>}

          {tab==="goals"&&<>
            <div style={{...K,marginBottom:8}}>
              <div style={{padding:"9px 12px",display:"flex",alignItems:"center",gap:8,borderBottom:`0.5px solid ${th.BD}`}}>
                <span style={{fontFamily:JB,fontSize:11,fontWeight:700,color:th.T1}}>This Week TOP 3</span>
                <span style={{...C(th.Y),marginLeft:"auto"}}>{wk}</span>
              </div>
              <div style={{padding:"10px 12px"}}>
                {(weeklyTop3.items||[]).map((item,i)=>(
                  <div key={item} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<2?`0.5px solid ${th.BD}`:"none"}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:[th.B,th.R,th.G][i]+"25",color:[th.B,th.R,th.G][i],display:"flex",alignItems:"center",justifyContent:"center",fontFamily:JB,fontSize:10,fontWeight:700,flexShrink:0}}>{i+1}</div>
                    <span style={{fontSize:12,color:th.T1,flex:1}}>{item}</span>
                    {item===dailyTop1.item&&dailyTop1.done&&<span style={{fontFamily:JB,fontSize:9,color:th.G,fontWeight:700}}>오늘 완료</span>}
                  </div>
                ))}
                <button onClick={()=>setTop3Sel(true)} style={{width:"100%",marginTop:10,background:"none",border:`1px dashed ${th.Y}66`,borderRadius:9,padding:"7px 0",fontFamily:JB,fontSize:10,color:th.Y,cursor:"pointer"}}>다음 주 TOP3 변경</button>
              </div>
            </div>
            <div style={{...K,marginBottom:8}}>
              <div style={{padding:"9px 12px",borderBottom:`0.5px solid ${th.BD}`}}>
                <span style={{fontFamily:JB,fontSize:11,fontWeight:700,color:th.T1}}>2026 Annual Goals</span>
              </div>
              <div style={{padding:"10px 12px"}}>
                {goals.map((g,i)=>{
                  const pct=Math.min(100,Math.round((g.current/g.target)*100))||0;
                  const cc=[th.B,th.R,th.Y,th.G,th.B][i];
                  return <div key={g.id} style={{marginBottom:i<goals.length-1?12:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:12,color:th.T1,fontWeight:600}}>{g.name}</span>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input type="number" step=".1" style={{width:60,background:th.BG,border:`1px solid ${th.BD}`,borderRadius:6,padding:"2px 6px",fontSize:11,color:th.T1,fontFamily:JB,textAlign:"center",outline:"none"}} value={goalInputs[g.id]??g.current} onChange={e=>updateGoal(g.id,e.target.value)}/>
                        <span style={{fontFamily:JB,fontSize:9,color:th.T3}}>/ {g.target}{g.unit}</span>
                        <span style={{fontFamily:JB,fontSize:10,color:cc,fontWeight:700}}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{height:6,background:`${cc}20`,borderRadius:3,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:cc,borderRadius:3,transition:"width .3s"}}/>
                    </div>
                  </div>;
                })}
              </div>
            </div>
          </>}

          {tab==="review"&&<>
            <div style={{...K,marginBottom:8}}>
              <div style={{padding:"9px 12px",display:"flex",alignItems:"center",gap:8,borderBottom:`0.5px solid ${th.BD}`}}>
                <span style={{fontFamily:JB,fontSize:11,fontWeight:700,color:th.T1}}>Weekly Review</span>
                <span style={{...C(th.G),marginLeft:"auto"}}>{wk}</span>
              </div>
              <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:10}}>
                {[["good","잘한 점 ✓","이번 주 잘한 것, 성과..."],["bad","아쉬운 점 ✗","더 잘할 수 있었던 것..."],["improve","다음 주 개선할 것 1가지","딱 1가지만..."]].map(([k,label,ph])=>(
                  <div key={k}>
                    <div style={{fontSize:10,color:th.T3,marginBottom:4,fontFamily:JB,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
                    <textarea rows={3} style={{...I(th.G),fontSize:11}} placeholder={ph} value={review[k]} onChange={e=>setReview({...review,[k]:e.target.value})}/>
                  </div>
                ))}
                <button onClick={()=>{sv("gl_review_"+wk,review);setReviewSaved(true);}} style={{...B(th.G,true,false)}}>{reviewSaved?"회고 저장됨 ✓":"회고 저장하기"}</button>
              </div>
            </div>
            {wkNotes.length>0&&<div style={{...K,marginBottom:8}}>
              <div style={{padding:"9px 12px",borderBottom:`0.5px solid ${th.BD}`}}><span style={{fontFamily:JB,fontSize:11,fontWeight:700,color:th.T1}}>이번 주 Quick Notes</span></div>
              <div style={{padding:"10px 12px"}}>
                {wkNotes.map(n=>(
                  <div key={n.id} style={{fontSize:11,color:th.T2,padding:"5px 0",borderBottom:`0.5px solid ${th.BD}`,display:"flex",gap:8}}>
                    <span style={{fontFamily:JB,fontSize:9,color:th.T4,flexShrink:0}}>{n.date.slice(5)}</span>
                    <span>{n.text}</span>
                  </div>
                ))}
              </div>
            </div>}
            <div style={{...K,padding:"12px 14px",marginBottom:8}}>
              <div style={{fontFamily:JB,fontSize:9,color:th.T3,marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>오늘 습관 달성률</div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{height:8,flex:1,background:`${th.G}20`,borderRadius:4,overflow:"hidden"}}><div style={{width:`${habits.length>0?Math.round((hdCount/habits.length)*100):0}%`,height:"100%",background:th.G,borderRadius:4}}/></div>
                <span style={{fontFamily:JB,fontSize:12,color:th.G,fontWeight:700}}>{habits.length>0?Math.round((hdCount/habits.length)*100):0}%</span>
              </div>
            </div>
          </>}

          {tab==="report"&&<ReportTab/>}

          {tab==="settings"&&<>
            <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto",paddingBottom:2}}>
              {[["theme","테마"],["profile","프로필"],["habits","습관"],["top3","TOP3"],["goals_s","목표"],["work","내 업무"],["sync","동기화"]].map(([id,label])=>(
                <button key={id} onClick={()=>setSec(id)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${sec===id?th.B:th.BD}`,background:sec===id?`${th.B}20`:th.CA,color:sec===id?th.B:th.T3,fontFamily:JB,fontSize:10,fontWeight:sec===id?700:400,cursor:"pointer",flexShrink:0}}>{label}</button>
              ))}
            </div>
            {sec==="theme"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
              {Object.entries(THEMES).map(([key,t])=>(
                <button key={key} onClick={()=>{setThemeKey(key);sv("gl_theme",key);}} style={{...K,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:themeKey===key?`1.5px solid ${th.B}`:`0.5px solid ${th.BD}`,background:th.CA,textAlign:"left",width:"100%"}}>
                  <span style={{fontSize:20}}>{t.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:th.T1,marginBottom:4}}>{t.name}</div>
                    <div style={{display:"flex",gap:4}}>{[t.B,t.R,t.Y,t.G].map((c,i)=><div key={i} style={{width:14,height:14,borderRadius:"50%",background:c}}/>)}</div>
                  </div>
                  {themeKey===key&&<span style={{fontFamily:JB,fontSize:10,color:th.B,fontWeight:700}}>현재 ✓</span>}
                </button>
              ))}
            </div>}
            {sec==="profile"&&<div style={{...K,padding:"14px"}}>
              {[["이름","name","text","정나래"],["기상 시간","wakeTime","time",""],["퇴근 시간","workEndTime","time",""]].map(([label,key,type,ph])=>(
                <div key={key} style={{marginBottom:10}}>
                  <div style={{fontFamily:JB,fontSize:9,color:th.T3,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
                  <input type={type} style={{...I(th.B),borderRadius:8}} placeholder={ph} value={profile[key]} onChange={e=>{const n={...profile,[key]:e.target.value};setProfile(n);sv("gl_profile",n);}}/>
                </div>
              ))}
            </div>}
            {sec==="habits"&&<div style={{...K,padding:"14px"}}>
              {habits.map((h,i)=>(
                <div key={h} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:i<habits.length-1?`0.5px solid ${th.BD}`:"none"}}>
                  <span style={{fontSize:12,color:th.T1}}>{h}</span>
                  <button onClick={()=>{const n=habits.filter(x=>x!==h);setHabits(n);sv("gl_habits",n);}} style={{background:"none",border:"none",color:th.R,cursor:"pointer",fontSize:14}}>×</button>
                </div>
              ))}
              <div style={{display:"flex",gap:6,marginTop:10}}>
                <input style={{...I(th.B),flex:1,fontSize:11}} placeholder="새 습관..." value={nh} onChange={e=>setNh(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nh.trim()){const n=[...habits,nh.trim()];setHabits(n);sv("gl_habits",n);setNh("");}}}/>
                <button onClick={()=>{if(!nh.trim())return;const n=[...habits,nh.trim()];setHabits(n);sv("gl_habits",n);setNh("");}} style={{background:th.B,color:"#fff",border:"none",borderRadius:9,padding:"0 14px",fontFamily:JB,cursor:"pointer"}}>+</button>
              </div>
            </div>}
            {sec==="top3"&&<div style={{...K,padding:"14px"}}>
              {top3Items.map((item,i)=>(
                <div key={item} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:i<top3Items.length-1?`0.5px solid ${th.BD}`:"none"}}>
                  <span style={{fontSize:12,color:th.T1}}>{item}</span>
                  <button onClick={()=>{const n=top3Items.filter(x=>x!==item);setTop3Items(n);sv("gl_top3items",n);}} style={{background:"none",border:"none",color:th.R,cursor:"pointer",fontSize:14}}>×</button>
                </div>
              ))}
              <div style={{display:"flex",gap:6,marginTop:10}}>
                <input style={{...I(th.Y),flex:1,fontSize:11}} placeholder="새 항목..." value={nt} onChange={e=>setNt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nt.trim()){const n=[...top3Items,nt.trim()];setTop3Items(n);sv("gl_top3items",n);setNt("");}}}/>
                <button onClick={()=>{if(!nt.trim())return;const n=[...top3Items,nt.trim()];setTop3Items(n);sv("gl_top3items",n);setNt("");}} style={{background:th.Y,color:th.yDark?"#1a1a00":"#fff",border:"none",borderRadius:9,padding:"0 14px",fontFamily:JB,cursor:"pointer"}}>+</button>
              </div>
            </div>}
            {sec==="goals_s"&&<div style={{...K,padding:"14px"}}>
              {goals.map((g,i)=>(
                <div key={g.id} style={{marginBottom:i<goals.length-1?12:0}}>
                  <div style={{fontFamily:JB,fontSize:9,color:th.T3,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{g.name} 목표 ({g.unit})</div>
                  <input type="number" style={{...I(th.G),borderRadius:8,fontSize:11}} value={g.target} onChange={e=>{const n=goals.map(x=>x.id===g.id?{...x,target:Number(e.target.value)}:x);setGoals(n);sv("gl_goals",n);}}/>
                </div>
              ))}
            </div>}
            {sec==="work"&&<div style={{...K,padding:"14px"}}>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:JB,fontSize:9,color:th.T3,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>직무</div>
                <input style={{...I(th.R),borderRadius:8,fontSize:11}} value={workInfo.jobTitle} onChange={e=>{const n={...workInfo,jobTitle:e.target.value};setWorkInfo(n);sv("gl_workinfo",n);}}/>
              </div>
              <div style={{fontFamily:JB,fontSize:9,color:th.T3,marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>주요 업무</div>
              {workInfo.tasks.map((task,i)=>(
                <div key={task} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:i<workInfo.tasks.length-1?`0.5px solid ${th.BD}`:"none"}}>
                  <span style={{fontSize:12,color:th.T1}}>{task}</span>
                  <button onClick={()=>{const n={...workInfo,tasks:workInfo.tasks.filter(t=>t!==task)};setWorkInfo(n);sv("gl_workinfo",n);}} style={{background:"none",border:"none",color:th.R,cursor:"pointer",fontSize:14}}>×</button>
                </div>
              ))}
              <div style={{display:"flex",gap:6,marginTop:10}}>
                <input style={{...I(th.R),flex:1,fontSize:11}} placeholder="업무 추가..." value={nw} onChange={e=>setNw(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nw.trim()){const n={...workInfo,tasks:[...workInfo.tasks,nw.trim()]};setWorkInfo(n);sv("gl_workinfo",n);setNw("");}}}/>
                <button onClick={()=>{if(!nw.trim())return;const n={...workInfo,tasks:[...workInfo.tasks,nw.trim()]};setWorkInfo(n);sv("gl_workinfo",n);setNw("");}} style={{background:th.R,color:"#fff",border:"none",borderRadius:9,padding:"0 14px",fontFamily:JB,cursor:"pointer"}}>+</button>
              </div>
            </div>}
            {sec==="sync"&&<div style={{...K,padding:"14px"}}>
              <div style={{fontFamily:JB,fontSize:9,color:th.T3,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>기기 간 동기화</div>
              {user ? (
                <div>
                  <div style={{background:`${th.G}15`,borderRadius:10,padding:"10px 12px",marginBottom:12}}>
                    <div style={{fontSize:12,color:th.G,fontWeight:700,marginBottom:4}}>☁ 동기화 활성화됨</div>
                    <div style={{fontSize:11,color:th.T2}}>{user.email}</div>
                  </div>
                  <button onClick={signOutUser} style={{...B(th.R,true,false)}}>로그아웃</button>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:12,color:th.T2,marginBottom:12,lineHeight:1.7}}>Google 계정으로 로그인하면 여러 기기에서 데이터가 자동으로 동기화됩니다.</div>
                  <button onClick={signInWithGoogle} style={{width:"100%",padding:"12px 0",background:"#fff",border:"1.5px solid #e0e0e0",borderRadius:13,fontFamily:NB,fontSize:13,fontWeight:600,color:"#333",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <span style={{fontSize:16,fontWeight:700,color:"#4285F4"}}>G</span> Google로 로그인
                  </button>
                </div>
              )}
            </div>}
          </>}
        </div>

        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,background:tabC[tab],padding:"4px 14px",display:"flex",gap:14,fontFamily:JB,fontSize:9,fontWeight:700,color:sbTxt,zIndex:20}}>
          <span>⎇ main</span>
          <span>habits {hdCount}/{habits.length}</span>
          <span style={{marginLeft:"auto"}}>{user?"☁ ":""}{profile.name||"GoalLog"} · {th.name}</span>
        </div>
      </div>
    </div>
  );
}
