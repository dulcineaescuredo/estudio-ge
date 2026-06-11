'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ABOGADAS = ['Claudia', 'Dolores', 'Candela', 'Sergio', 'Dulcinea'];

const PROCESOS = {
  ordinario: { nombre: 'Ordinario (conocimiento)', etapas: [
    { id:'med', n:'Mediación' }, { id:'dem', n:'Demanda presentada' }, { id:'tra', n:'Traslado notificado' },
    { id:'con', n:'Contestación de demanda' }, { id:'trd', n:'Traslado documental' }, { id:'aup', n:'Audiencia preliminar' },
    { id:'apr', n:'Apertura a prueba' },
    { id:'pru', n:'Producción de prueba', sub:['Informativa (oficios)','Testimonial (notificar)','Declaración de parte','Pericial (notificar)','Documental'] },
    { id:'ale', n:'Alegatos' }, { id:'sen', n:'Sentencia' }, { id:'apl', n:'Plazo de apelación' },
    { id:'cam', n:'Trámite en Cámara / TSJ' }, { id:'fir', n:'Firmeza' }, { id:'eje', n:'Ejecución de sentencia' }
  ]},
  ejecutivo: { nombre: 'Ejecutivo (monitorio)', etapas: [
    { id:'dem', n:'Demanda presentada' }, { id:'sen', n:'Sentencia monitoria dictada' }, { id:'not', n:'Notificación al deudor' },
    { id:'opo', n:'Plazo de oposición de excepciones', op:['Paga','No se opone','Se opone'] },
    { id:'cob', n:'Cobro y archivo', req:['opo','Paga'] },
    { id:'ejd', n:'Ejecución directa de la sentencia', req:['opo','No se opone'] },
    { id:'tro', n:'Traslado de la oposición', req:['opo','Se opone'] },
    { id:'res', n:'Resolución de la oposición', req:['opo','Se opone'] },
    { id:'sig', n:'Continúa según resultado', req:['opo','Se opone'] }
  ]},
  ejecucion: { nombre: 'Ejecución de sentencia', etapas: [
    { id:'liq', n:'Liquidación presentada' }, { id:'apl', n:'Aprobación de liquidación' }, { id:'int', n:'Intimación de pago' },
    { id:'emb', n:'Embargo' }, { id:'sub', n:'Subasta / realización de bienes' }, { id:'cob', n:'Cobro' }, { id:'arc', n:'Archivo' }
  ]},
  sucesorio: { nombre: 'Sucesorio', etapas: [
    { id:'dem', n:'Demanda' }, { id:'f23', n:'Formulario 2033 — Colegio de Escribanos' }, { id:'pro', n:'Proveído de escrito inicial' },
    { id:'edi', n:'Publicación de edictos' }, { id:'dec', n:'Declaratoria de herederos' }, { id:'inv', n:'Denuncia de bienes / inventario / avalúo' },
    { id:'vcr', n:'Vista Caja y Rentas' }, { id:'pcr', n:'Comprobante de pago Caja y Rentas' }, { id:'par', n:'Partición' },
    { id:'adj', n:'Adjudicación' }, { id:'ins', n:'Inscripción registral' }, { id:'arc', n:'Archivo' }
  ]},
  alimentos: { nombre: 'Alimentos', etapas: [
    { id:'med', n:'Mediación', op:['Acuerdo (cierra acá)','Sin acuerdo (sigue)'] },
    { id:'sel', n:'Pagar sellado y preparar vía', req:['med','Sin acuerdo (sigue)'] },
    { id:'dem', n:'Demanda', req:['med','Sin acuerdo (sigue)'] },
    { id:'tra', n:'Traslado', req:['med','Sin acuerdo (sigue)'] },
    { id:'con', n:'Contestación de demanda', req:['med','Sin acuerdo (sigue)'] },
    { id:'cdo', n:'Control de documental', req:['med','Sin acuerdo (sigue)'] },
    { id:'aud', n:'Audiencia', op:['Acuerdo con homologación (cierra)','Sin acuerdo (sigue a prueba)'], req:['med','Sin acuerdo (sigue)'] },
    { id:'pru', n:'Apertura a prueba', sub:['Declaración de parte (notificación)','Testimonial (notificación)','Informativa (oficios)','Peritos (notificación)'], req:['aud','Sin acuerdo (sigue a prueba)'] },
    { id:'ale', n:'Alegatos', req:['aud','Sin acuerdo (sigue a prueba)'] },
    { id:'sen', n:'Sentencia', req:['aud','Sin acuerdo (sigue a prueba)'] },
    { id:'apl', n:'Apelación', req:['aud','Sin acuerdo (sigue a prueba)'] },
    { id:'agr', n:'Agravios', req:['aud','Sin acuerdo (sigue a prueba)'] },
    { id:'sca', n:'Sentencia de Cámara', req:['aud','Sin acuerdo (sigue a prueba)'] }
  ]},
  otro: { nombre: 'Otro / sin mapa', etapas: [] }
};
PROCESOS.regimen = { nombre: 'Régimen comunicacional', etapas: JSON.parse(JSON.stringify(PROCESOS.alimentos.etapas)) };

const HOY = new Date().toISOString().split('T')[0];

function formatFecha(f) {
  if (!f) return '';
  const p = f.split('-');
  if (p.length !== 3) return f;
  const meses = ['','ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(p[2])} ${meses[parseInt(p[1])]}`;
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [vista, setVista] = useState('dashboard');
  const [expedientes, setExpedientes] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [notas, setNotas] = useState([]);
  const [expActual, setExpActual] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargandoAuth(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      supabase.from('perfiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => setPerfil(data));
      cargarDatos();
    } else {
      setPerfil(null);
    }
  }, [session]);

  async function cargarDatos() {
    setCargandoDatos(true);
    const [e, c, t, n] = await Promise.all([
      supabase.from('expedientes').select('*').order('creado_en', { ascending: false }),
      supabase.from('consultas').select('*').order('fecha', { ascending: false }),
      supabase.from('tareas').select('*').order('creado_en', { ascending: false }),
      supabase.from('notas').select('*').order('creado_en', { ascending: false }),
    ]);
    setExpedientes(e.data || []);
    setConsultas(c.data || []);
    setTareas(t.data || []);
    setNotas(n.data || []);
    setCargandoDatos(false);
  }

  async function login() {
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) setLoginError('Email o contraseña incorrectos.');
  }
  async function logout() { await supabase.auth.signOut(); }

  if (cargandoAuth) {
    return <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',color:'#8a8a8a'}}>Cargando...</div>;
  }

  if (!session) {
    return (
      <div style={{position:'fixed',inset:0,background:'#f9f8f5',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
        <div style={{background:'#fff',border:'1px solid #e2e2e2',borderRadius:14,padding:36,width:'90%',maxWidth:360,textAlign:'center'}}>
          <div style={{width:48,height:48,borderRadius:12,background:'#185FA5',color:'#fff',fontSize:18,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>GE</div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:4}}>Guazzaroni Escuredo</div>
          <div style={{fontSize:13,color:'#8a8a8a',marginBottom:24}}>Sistema de gestión del estudio</div>
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
            style={{width:'100%',padding:'11px 14px',border:'1px solid #e2e2e2',borderRadius:8,fontSize:14,outline:'none',marginBottom:10,boxSizing:'border-box'}} />
          <input type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&login()}
            style={{width:'100%',padding:'11px 14px',border:'1px solid #e2e2e2',borderRadius:8,fontSize:14,outline:'none',marginBottom:10,boxSizing:'border-box'}} />
          {loginError && <div style={{fontSize:12,color:'#A32D2D',marginBottom:10}}>{loginError}</div>}
          <button onClick={login} style={{width:'100%',padding:11,background:'#185FA5',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:500,cursor:'pointer'}}>Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'system-ui',background:'#f9f8f5',color:'#1a1a1a'}}>
      <div style={{width:210,minWidth:210,background:'#fff',borderRight:'1px solid #e2e2e2',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'18px 16px',borderBottom:'1px solid #e2e2e2'}}>
          <div style={{fontSize:13,fontWeight:600,lineHeight:1.3}}>Guazzaroni<br/>Escuredo</div>
          <div style={{fontSize:11,color:'#8a8a8a',marginTop:2}}>General Pico, LP</div>
        </div>
        <div style={{padding:'10px 8px',flex:1}}>
          {[['dashboard','Inicio'],['expedientes','Expedientes'],['nuevo-exp','Nuevo expediente'],['notas','Anotaciones'],['consultas','Consultas'],['nueva-consulta','Nueva consulta'],['tareas','Tareas'],['nueva-tarea','Nueva tarea']].map(([id,label])=>(
            <button key={id} onClick={()=>{setVista(id);setExpActual(null);}}
              style={{display:'block',width:'100%',textAlign:'left',padding:'8px 10px',borderRadius:8,fontSize:13,border:'none',background:vista===id?'#E6F1FB':'none',color:vista===id?'#0C447C':'#4a4a4a',fontWeight:vista===id?500:400,cursor:'pointer',marginBottom:1}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{padding:'12px 14px',borderTop:'1px solid #e2e2e2',display:'flex',alignItems:'center',gap:9}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:'#E6F1FB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,color:'#0C447C'}}>
            {perfil?.nombre?.[0] || session.user.email[0].toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{perfil?.nombre || session.user.email}</div>
            <button onClick={logout} style={{fontSize:11,color:'#8a8a8a',background:'none',border:'none',padding:0,cursor:'pointer'}}>Cerrar sesión</button>
          </div>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:22}}>
        {cargandoDatos && <div style={{color:'#8a8a8a',fontSize:13,marginBottom:12}}>Cargando datos...</div>}
        <Contenido
          vista={vista} setVista={setVista}
          perfil={perfil}
          expedientes={expedientes} consultas={consultas} tareas={tareas} notas={notas}
          expActual={expActual} setExpActual={setExpActual}
          recargar={cargarDatos}
        />
      </div>
    </div>
  );
}

function Badge({ children, bg, color }) {
  return <span style={{display:'inline-block',fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:600,background:bg||'#F1EFE8',color:color||'#444441',whiteSpace:'nowrap'}}>{children}</span>;
}
function Card({ children, title }) {
  return (
    <div style={{background:'#fff',border:'1px solid #e2e2e2',borderRadius:12,padding:16,marginBottom:14}}>
      {title && <div style={{fontSize:13,fontWeight:500,marginBottom:14}}>{title}</div>}
      {children}
    </div>
  );
}
const inputStyle = {width:'100%',padding:'8px 11px',border:'1px solid #e2e2e2',borderRadius:8,fontSize:13,background:'#f9f8f5',outline:'none',fontFamily:'system-ui',marginBottom:12,boxSizing:'border-box'};
const btnPrimary = {padding:'8px 13px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #185FA5',background:'#185FA5',color:'#fff',fontFamily:'system-ui'};

function Contenido(props) {
  const { vista } = props;
  if (vista === 'dashboard') return <Dashboard {...props} />;
  if (vista === 'expedientes') return <Expedientes {...props} />;
  if (vista === 'detalle') return <Detalle {...props} />;
  if (vista === 'nuevo-exp') return <NuevoExpediente {...props} />;
  if (vista === 'notas') return <Notas {...props} />;
  if (vista === 'consultas') return <Consultas {...props} />;
  if (vista === 'nueva-consulta') return <NuevaConsulta {...props} />;
  if (vista === 'tareas') return <Tareas {...props} />;
  if (vista === 'nueva-tarea') return <NuevaTarea {...props} />;
  return null;
}

function Dashboard({ expedientes, consultas, tareas, notas, setVista, setExpActual }) {
  const mes = HOY.substring(0,7);
  const activos = expedientes.filter(e=>e.estado==='activo').length;
  const consMes = consultas.filter(c=>c.fecha&&c.fecha.startsWith(mes)).length;
  const tareasPend = tareas.filter(t=>t.estado==='pendiente').length;
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {[['Expedientes activos',activos],['Consultas este mes',consMes],['Tareas pendientes',tareasPend],['Total expedientes',expedientes.length]].map(([l,v])=>(
          <div key={l} style={{background:'#f9f8f5',borderRadius:8,padding:'13px 15px'}}>
            <div style={{fontSize:11,color:'#8a8a8a',marginBottom:5}}>{l}</div>
            <div style={{fontSize:22,fontWeight:500}}>{v}</div>
          </div>
        ))}
      </div>
      <Card title="Últimas anotaciones">
        {notas.length ? notas.slice(0,5).map(n=>{
          const ex = expedientes.find(e=>e.id===n.expediente_id);
          return <div key={n.id} style={{padding:'9px 0',borderBottom:'1px solid #f5f5f3',cursor:ex?'pointer':'default'}} onClick={()=>{if(ex){setExpActual(ex);setVista('detalle');}}}>
            <div style={{fontSize:11,color:'#8a8a8a',marginBottom:2}}>{ex?ex.caratula:''} · {formatFecha(n.fecha)} · {n.autora}</div>
            <div style={{fontSize:12}}>{n.texto.length>100?n.texto.slice(0,100)+'…':n.texto}</div>
          </div>;
        }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:20}}>Sin anotaciones aún</div>}
      </Card>
    </div>
  );
}

function Expedientes({ expedientes, setVista, setExpActual }) {
  const [q, setQ] = useState('');
  const lista = expedientes.filter(e=>!q||(e.caratula||'').toLowerCase().includes(q.toLowerCase())||(e.numero||'').toLowerCase().includes(q.toLowerCase()));
  return (
    <Card title="Expedientes">
      <input style={inputStyle} placeholder="Buscar expediente..." value={q} onChange={e=>setQ(e.target.value)} />
      {lista.length ? (
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr>{['N°','Carátula','Proceso','Estado','Responsable'].map(h=><th key={h} style={{textAlign:'left',padding:'7px 10px',fontSize:11,color:'#8a8a8a',borderBottom:'1px solid #e2e2e2'}}>{h}</th>)}</tr></thead>
          <tbody>
            {lista.map(e=>{
              const mapa = PROCESOS[e.tipo_proceso];
              return <tr key={e.id} style={{cursor:'pointer'}} onClick={()=>{setExpActual(e);setVista('detalle');}}>
                <td style={{padding:'10px',borderBottom:'1px solid #f5f5f3',fontSize:11,color:'#8a8a8a'}}>{e.numero}</td>
                <td style={{padding:'10px',borderBottom:'1px solid #f5f5f3',fontWeight:500}}>{e.caratula}</td>
                <td style={{padding:'10px',borderBottom:'1px solid #f5f5f3',fontSize:12}}>{mapa?mapa.nombre:'—'}</td>
                <td style={{padding:'10px',borderBottom:'1px solid #f5f5f3'}}><Badge bg="#EAF3DE" color="#27500A">{e.estado}</Badge></td>
                <td style={{padding:'10px',borderBottom:'1px solid #f5f5f3'}}><Badge bg="#E6F1FB" color="#0C447C">{e.responsable||'—'}</Badge></td>
              </tr>;
            })}
          </tbody>
        </table>
      ) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:30}}>Sin expedientes todavía. Cargá el primero desde "Nuevo expediente".</div>}
    </Card>
  );
}

function Detalle({ expActual, setExpActual, setVista, notas, perfil, recargar }) {
  const [guardando, setGuardando] = useState(false);
  const [notaTexto, setNotaTexto] = useState('');
  const e = expActual;
  if (!e) return null;
  const mapa = PROCESOS[e.tipo_proceso];
  const prog = (() => { try { return e.progreso ? (typeof e.progreso==='string'?JSON.parse(e.progreso):e.progreso) : {hechas:{},subs:{},dec:{}}; } catch { return {hechas:{},subs:{},dec:{}}; } })();
  if (!prog.hechas) prog.hechas = {}; if (!prog.subs) prog.subs = {}; if (!prog.dec) prog.dec = {};

  const etapasVis = mapa ? mapa.etapas.filter(et=>!et.req || prog.dec[et.req[0]]===et.req[1]) : [];

  async function guardarProg(nuevoProg) {
    setExpActual({...e, progreso: nuevoProg});
    await supabase.from('expedientes').update({ progreso: nuevoProg }).eq('id', e.id);
    recargar();
  }
  function tildar(etId) {
    const np = JSON.parse(JSON.stringify(prog));
    if (np.hechas[etId]) delete np.hechas[etId]; else np.hechas[etId] = HOY;
    guardarProg(np);
  }
  function tildarSub(etId, si) {
    const np = JSON.parse(JSON.stringify(prog));
    if (!np.subs[etId]) np.subs[etId] = {};
    if (np.subs[etId][si]) delete np.subs[etId][si]; else np.subs[etId][si] = HOY;
    guardarProg(np);
  }
  function elegir(etId, op) {
    const np = JSON.parse(JSON.stringify(prog));
    if (np.dec[etId]===op) delete np.dec[etId]; else { np.dec[etId]=op; if(!np.hechas[etId]) np.hechas[etId]=HOY; }
    guardarProg(np);
  }
  async function agregarNota() {
    if (!notaTexto.trim()) return;
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    setGuardando(true);
    const etAct = etapasVis.find(et=>!prog.hechas[et.id]);
    await supabase.from('notas').insert({
      estudio_id: e.estudio_id, expediente_id: e.id, fecha: HOY,
      autora: perfil?.nombre || 'Equipo', texto: notaTexto.trim(), etapa: etAct?etAct.n:''
    });
    setNotaTexto('');
    setGuardando(false);
    recargar();
  }
  const notasExp = notas.filter(n=>n.expediente_id===e.id);

  return (
    <div>
      <button onClick={()=>setVista('expedientes')} style={{padding:'7px 13px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #e2e2e2',background:'#fff',marginBottom:12}}>← Volver</button>
      <Card>
        <div style={{fontSize:11,color:'#8a8a8a',marginBottom:3}}>{e.numero} · {e.juzgado||'Sin juzgado'}</div>
        <div style={{fontSize:16,fontWeight:600,marginBottom:6}}>{e.caratula}</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <Badge bg="#EAF3DE" color="#27500A">{e.estado}</Badge>
          {mapa && <Badge bg="#EEEDFE" color="#3C3489">{mapa.nombre}</Badge>}
          <Badge bg="#E6F1FB" color="#0C447C">{e.responsable||'—'}</Badge>
        </div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:14,alignItems:'start'}}>
        <Card title="Etapas del proceso">
          {!mapa || !mapa.etapas.length ? <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:20}}>Sin mapa de proceso asignado.</div> :
            etapasVis.map((et,i)=>{
              const hecha = prog.hechas[et.id];
              const esActual = !hecha && etapasVis.slice(0,i).every(x=>prog.hechas[x.id]);
              return <div key={et.id} style={{display:'flex',gap:12,padding:'9px 0',alignItems:'flex-start'}}>
                <div onClick={()=>tildar(et.id)} style={{width:16,height:16,borderRadius:4,border:hecha?'none':'1.5px solid #c9c9c4',background:hecha?'#185FA5':'#fff',cursor:'pointer',flexShrink:0,marginTop:2,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10}}>{hecha?'✓':''}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:13,fontWeight:500,color:hecha?'#8a8a8a':'#1a1a1a'}}>{et.n}</span>
                    {hecha && <span style={{fontSize:11,color:'#639922',fontWeight:500}}>✓ {formatFecha(hecha)}</span>}
                    {esActual && <Badge bg="#185FA5" color="#fff">ACTUAL</Badge>}
                  </div>
                  {et.sub && <div style={{marginTop:5}}>
                    {et.sub.map((s,si)=>{
                      const sh = prog.subs[et.id]&&prog.subs[et.id][si];
                      return <div key={si} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',fontSize:12,color:'#4a4a4a'}}>
                        <div onClick={()=>tildarSub(et.id,si)} style={{width:13,height:13,borderRadius:3,border:sh?'none':'1.5px solid #c9c9c4',background:sh?'#185FA5':'#fff',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:8}}>{sh?'✓':''}</div>
                        <span style={{textDecoration:sh?'line-through':'none',color:sh?'#8a8a8a':'#4a4a4a'}}>{s}</span>
                      </div>;
                    })}
                  </div>}
                  {et.op && <div style={{display:'flex',gap:6,marginTop:7,flexWrap:'wrap'}}>
                    {et.op.map(o=><button key={o} onClick={()=>elegir(et.id,o)} style={{padding:'7px 12px',border:prog.dec[et.id]===o?'1px solid #185FA5':'1px solid #e2e2e2',borderRadius:8,fontSize:12,cursor:'pointer',background:prog.dec[et.id]===o?'#185FA5':'#fff',color:prog.dec[et.id]===o?'#fff':'#1a1a1a',fontWeight:500}}>{o}</button>)}
                  </div>}
                </div>
              </div>;
            })
          }
        </Card>
        <Card title="Anotaciones">
          <textarea style={{...inputStyle,minHeight:64,resize:'vertical'}} placeholder="Escribí una nota: lo que pasó en la audiencia, algo para el próximo escrito..." value={notaTexto} onChange={e=>setNotaTexto(e.target.value)} />
          <button onClick={agregarNota} disabled={guardando} style={{...btnPrimary,width:'100%',marginBottom:14}}>{guardando?'Guardando...':'+ Agregar nota'}</button>
          {notasExp.length ? notasExp.map(n=>(
            <div key={n.id} style={{background:'#f9f8f5',borderRadius:8,padding:'11px 13px',marginBottom:8}}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:5,flexWrap:'wrap'}}>
                <Badge bg="#E6F1FB" color="#0C447C">{n.autora}</Badge>
                <span style={{fontSize:11,color:'#8a8a8a'}}>{formatFecha(n.fecha)}</span>
                {n.etapa && <Badge>{n.etapa}</Badge>}
              </div>
              <div style={{fontSize:13,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{n.texto}</div>
            </div>
          )) : <div style={{color:'#8a8a8a',fontSize:12,textAlign:'center',padding:18}}>Sin anotaciones todavía.</div>}
        </Card>
      </div>
    </div>
  );
}

function NuevoExpediente({ perfil, recargar, setVista }) {
  const [f, setF] = useState({ numero:'', caratula:'', juzgado:'', tipo_proceso:'', estado:'activo', proximo_vencimiento:'', motivo_vencimiento:'', responsable:'', notas:'' });
  const [msg, setMsg] = useState('');
  const set = (k,v) => setF({...f,[k]:v});
  async function guardar() {
    if (!f.numero||!f.caratula||!f.tipo_proceso||!f.responsable) { alert('Completá los campos obligatorios (*)'); return; }
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    const { error } = await supabase.from('expedientes').insert({ ...f, estudio_id: perfil.estudio_id, progreso: {} });
    if (error) { alert('Error: '+error.message); return; }
    setMsg(`Expediente ${f.numero} guardado.`);
    setF({ numero:'', caratula:'', juzgado:'', tipo_proceso:'', estado:'activo', proximo_vencimiento:'', motivo_vencimiento:'', responsable:'', notas:'' });
    recargar();
    setTimeout(()=>setMsg(''),3000);
  }
  return (
    <Card title="Nuevo expediente">
      {msg && <div style={{background:'#EAF3DE',border:'1px solid #C0DD97',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#27500A',marginBottom:14}}>✓ {msg}</div>}
      <div style={{maxWidth:520}}>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>N° de expediente *</label>
        <input style={inputStyle} placeholder="GP-2026-0001" value={f.numero} onChange={e=>set('numero',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Carátula *</label>
        <input style={inputStyle} placeholder="Pérez c/ García s/ Alimentos" value={f.caratula} onChange={e=>set('caratula',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Tipo de proceso *</label>
        <select style={inputStyle} value={f.tipo_proceso} onChange={e=>set('tipo_proceso',e.target.value)}>
          <option value="">Seleccioná</option>
          <option value="ordinario">Ordinario (conocimiento)</option>
          <option value="ejecutivo">Ejecutivo (monitorio)</option>
          <option value="ejecucion">Ejecución de sentencia</option>
          <option value="sucesorio">Sucesorio</option>
          <option value="alimentos">Alimentos</option>
          <option value="regimen">Régimen comunicacional</option>
          <option value="otro">Otro / sin mapa</option>
        </select>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Juzgado</label>
        <input style={inputStyle} placeholder="Civil N°1 - Gral. Pico" value={f.juzgado} onChange={e=>set('juzgado',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Estado *</label>
        <select style={inputStyle} value={f.estado} onChange={e=>set('estado',e.target.value)}>
          <option value="activo">Activo</option><option value="espera">En espera</option><option value="apelado">Apelado</option><option value="archivado">Archivado</option>
        </select>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Próximo vencimiento</label>
        <input type="date" style={inputStyle} value={f.proximo_vencimiento} onChange={e=>set('proximo_vencimiento',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Motivo del vencimiento</label>
        <input style={inputStyle} placeholder="Contestar demanda" value={f.motivo_vencimiento} onChange={e=>set('motivo_vencimiento',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Responsable *</label>
        <select style={inputStyle} value={f.responsable} onChange={e=>set('responsable',e.target.value)}>
          <option value="">Seleccioná</option>
          {ABOGADAS.map(a=><option key={a}>{a}</option>)}
        </select>
        <button onClick={guardar} style={btnPrimary}>Guardar expediente</button>
      </div>
    </Card>
  );
}

function Notas({ notas, expedientes, setVista, setExpActual }) {
  const [q, setQ] = useState('');
  const lista = notas.filter(n=>{
    const ex = expedientes.find(e=>e.id===n.expediente_id);
    const blob = (n.texto+' '+(ex?ex.caratula+' '+ex.numero:'')+' '+(n.etapa||'')+' '+n.autora).toLowerCase();
    return !q || blob.includes(q.toLowerCase());
  });
  return (
    <Card title="Todas las anotaciones">
      <input style={inputStyle} placeholder="Buscar en las notas: cliente, tema, lo que recuerdes..." value={q} onChange={e=>setQ(e.target.value)} />
      {lista.length ? lista.map(n=>{
        const ex = expedientes.find(e=>e.id===n.expediente_id);
        return <div key={n.id} style={{background:'#f9f8f5',borderRadius:8,padding:'11px 13px',marginBottom:8,cursor:ex?'pointer':'default'}} onClick={()=>{if(ex){setExpActual(ex);setVista('detalle');}}}>
          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:5,flexWrap:'wrap'}}>
            <span style={{fontSize:12,fontWeight:600}}>{ex?ex.caratula:'(expediente)'}</span>
            <Badge bg="#E6F1FB" color="#0C447C">{n.autora}</Badge>
            <span style={{fontSize:11,color:'#8a8a8a'}}>{formatFecha(n.fecha)}</span>
            {n.etapa && <Badge>{n.etapa}</Badge>}
          </div>
          <div style={{fontSize:13,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{n.texto}</div>
        </div>;
      }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:30}}>No hay notas que coincidan.</div>}
    </Card>
  );
}

function Consultas({ consultas }) {
  const [q, setQ] = useState('');
  const mes = HOY.substring(0,7);
  const mesA = consultas.filter(c=>c.fecha&&c.fecha.startsWith(mes));
  const lista = consultas.filter(c=>!q||(c.cliente||'').toLowerCase().includes(q.toLowerCase())||(c.motivo||'').toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {[['Consultas este mes',mesA.length],['Primeras',mesA.filter(c=>c.tipo==='primera').length],['Seguimientos',mesA.filter(c=>c.tipo==='seguimiento').length],['Clientes únicos',new Set(mesA.map(c=>c.cliente)).size]].map(([l,v])=>(
          <div key={l} style={{background:'#f9f8f5',borderRadius:8,padding:'13px 15px'}}><div style={{fontSize:11,color:'#8a8a8a',marginBottom:5}}>{l}</div><div style={{fontSize:22,fontWeight:500}}>{v}</div></div>
        ))}
      </div>
      <Card title="Registro de consultas">
        <input style={inputStyle} placeholder="Buscar cliente o motivo..." value={q} onChange={e=>setQ(e.target.value)} />
        {lista.length ? lista.map(c=>(
          <div key={c.id} style={{padding:'10px 0',borderBottom:'1px solid #f5f5f3'}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
              <span style={{fontSize:13,fontWeight:500}}>{c.cliente}</span>
              <Badge bg={c.tipo==='primera'?'#FAEEDA':'#EAF3DE'} color={c.tipo==='primera'?'#633806':'#27500A'}>{c.tipo==='primera'?'Primera consulta':'Seguimiento'}</Badge>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:3,flexWrap:'wrap'}}>
              <span style={{fontSize:11,color:'#8a8a8a'}}>{formatFecha(c.fecha)}</span>
              <Badge bg="#E6F1FB" color="#0C447C">{c.abogada}</Badge>
            </div>
            <div style={{fontSize:12,fontWeight:500,marginBottom:2}}>{c.motivo}</div>
            {c.comentario && <div style={{fontSize:11,color:'#4a4a4a',fontStyle:'italic',lineHeight:1.5}}>{c.comentario}</div>}
          </div>
        )) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:30}}>Sin consultas todavía.</div>}
      </Card>
    </div>
  );
}

function NuevaConsulta({ perfil, recargar }) {
  const [f, setF] = useState({ tipo:'primera', cliente:'', telefono:'', fecha:HOY, abogada:'', motivo:'', comentario:'' });
  const [msg, setMsg] = useState('');
  const set = (k,v)=>setF({...f,[k]:v});
  async function guardar() {
    if (!f.cliente||!f.fecha||!f.abogada||!f.motivo) { alert('Completá los obligatorios (*)'); return; }
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    const { error } = await supabase.from('consultas').insert({ ...f, estudio_id: perfil.estudio_id });
    if (error) { alert('Error: '+error.message); return; }
    setMsg(`Consulta de ${f.cliente} guardada.`);
    setF({ tipo:'primera', cliente:'', telefono:'', fecha:HOY, abogada:'', motivo:'', comentario:'' });
    recargar();
    setTimeout(()=>setMsg(''),3000);
  }
  return (
    <Card title="Registrar consulta">
      {msg && <div style={{background:'#EAF3DE',border:'1px solid #C0DD97',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#27500A',marginBottom:14}}>✓ {msg}</div>}
      <div style={{maxWidth:520}}>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Tipo *</label>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {[['primera','Primera consulta (paga)'],['seguimiento','Seguimiento']].map(([v,l])=>(
            <button key={v} onClick={()=>set('tipo',v)} style={{flex:1,padding:9,border:f.tipo===v?'1px solid #185FA5':'1px solid #e2e2e2',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',background:f.tipo===v?'#E6F1FB':'#f9f8f5',color:f.tipo===v?'#0C447C':'#4a4a4a'}}>{l}</button>
          ))}
        </div>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Cliente *</label>
        <input style={inputStyle} value={f.cliente} onChange={e=>set('cliente',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Teléfono</label>
        <input style={inputStyle} value={f.telefono} onChange={e=>set('telefono',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Fecha *</label>
        <input type="date" style={inputStyle} value={f.fecha} onChange={e=>set('fecha',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Abogada/o *</label>
        <select style={inputStyle} value={f.abogada} onChange={e=>set('abogada',e.target.value)}>
          <option value="">Seleccioná</option>{ABOGADAS.map(a=><option key={a}>{a}</option>)}
        </select>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Motivo *</label>
        <input style={inputStyle} placeholder="Ej: Alimentos, sucesión, despido..." value={f.motivo} onChange={e=>set('motivo',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Comentario</label>
        <textarea style={{...inputStyle,minHeight:72,resize:'vertical'}} value={f.comentario} onChange={e=>set('comentario',e.target.value)} />
        <button onClick={guardar} style={btnPrimary}>Guardar consulta</button>
      </div>
    </Card>
  );
}

function Tareas({ tareas, recargar }) {
  const [estado, setEstado] = useState('pendiente');
  async function toggle(t) {
    const nuevo = t.estado==='completada'?'pendiente':'completada';
    await supabase.from('tareas').update({ estado: nuevo }).eq('id', t.id);
    recargar();
  }
  const lista = tareas.filter(t=>estado==='todas'||t.estado===estado).sort((a,b)=>{
    if(a.estado!==b.estado) return a.estado==='pendiente'?-1:1;
    if(!a.deadline&&!b.deadline) return 0; if(!a.deadline) return 1; if(!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });
  return (
    <Card title="Tareas">
      <select style={{...inputStyle,width:'auto'}} value={estado} onChange={e=>setEstado(e.target.value)}>
        <option value="pendiente">Solo pendientes</option><option value="todas">Todas</option><option value="completada">Completadas</option>
      </select>
      {lista.length ? lista.map(t=>{
        const done = t.estado==='completada';
        return <div key={t.id} style={{display:'flex',gap:8,padding:'10px 0',borderBottom:'1px solid #f5f5f3',alignItems:'flex-start'}}>
          <div onClick={()=>toggle(t)} style={{width:15,height:15,borderRadius:4,border:done?'none':'1.5px solid #c9c9c4',background:done?'#185FA5':'#fff',cursor:'pointer',flexShrink:0,marginTop:2,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:9}}>{done?'✓':''}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:500,textDecoration:done?'line-through':'none',color:done?'#8a8a8a':'#1a1a1a',marginBottom:5}}>{t.descripcion}</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
              <Badge bg="#E6F1FB" color="#0C447C">{t.responsable}</Badge>
              {t.deadline && <Badge bg="#FAEEDA" color="#633806">{formatFecha(t.deadline)}</Badge>}
            </div>
            {t.comentario && <div style={{fontSize:11,color:'#8a8a8a',marginTop:5,fontStyle:'italic'}}>{t.comentario}</div>}
          </div>
        </div>;
      }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:30}}>Sin tareas.</div>}
    </Card>
  );
}

function NuevaTarea({ perfil, recargar }) {
  const [f, setF] = useState({ descripcion:'', responsable:'', deadline:'', comentario:'' });
  const [msg, setMsg] = useState('');
  const set = (k,v)=>setF({...f,[k]:v});
  async function guardar() {
    if (!f.descripcion||!f.responsable) { alert('Completá descripción y responsable (*)'); return; }
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    const { error } = await supabase.from('tareas').insert({ ...f, estudio_id: perfil.estudio_id, estado:'pendiente', deadline: f.deadline||null });
    if (error) { alert('Error: '+error.message); return; }
    setMsg(`Tarea asignada a ${f.responsable} creada.`);
    setF({ descripcion:'', responsable:'', deadline:'', comentario:'' });
    recargar();
    setTimeout(()=>setMsg(''),3000);
  }
  return (
    <Card title="Nueva tarea">
      {msg && <div style={{background:'#EAF3DE',border:'1px solid #C0DD97',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#27500A',marginBottom:14}}>✓ {msg}</div>}
      <div style={{maxWidth:520}}>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Descripción *</label>
        <textarea style={{...inputStyle,minHeight:72,resize:'vertical'}} value={f.descripcion} onChange={e=>set('descripcion',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Responsable *</label>
        <select style={inputStyle} value={f.responsable} onChange={e=>set('responsable',e.target.value)}>
          <option value="">Seleccioná</option>{ABOGADAS.map(a=><option key={a}>{a}</option>)}<option>Todos</option>
        </select>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Deadline (opcional)</label>
        <input type="date" style={inputStyle} value={f.deadline} onChange={e=>set('deadline',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Comentario (opcional)</label>
        <textarea style={{...inputStyle,minHeight:56,resize:'vertical'}} value={f.comentario} onChange={e=>set('comentario',e.target.value)} />
        <button onClick={guardar} style={btnPrimary}>Crear tarea</button>
      </div>
    </Card>
  );
}