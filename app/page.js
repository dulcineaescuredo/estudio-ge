'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ABOGADAS = ['Claudia', 'Dolores', 'Candela', 'Sergio', 'Dulcinea'];

const SOCIO_COLORS = {
  'Dulcinea': { bg:'#FBEAF0', color:'#72243E' },
  'Claudia':  { bg:'#E8F0EB', color:'#2D5A3D' },
  'Candela':  { bg:'#E6F1FB', color:'#0C447C' },
  'Dolores':  { bg:'#EEEDFE', color:'#3C3489' },
  'Sergio':   { bg:'#FAEEDA', color:'#633806' },
};
function socioColor(nombre) {
  return SOCIO_COLORS[nombre] || { bg:'#F1EFE8', color:'#444441' };
}

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
  divorcio: { nombre: 'Divorcio', etapas: [
    { id:'pre', n:'Presentación', op:['Conjunta (termina acá)','Separada (sigue)'] },
    { id:'dem', n:'Demanda', req:['pre','Separada (sigue)'] },
    { id:'nod', n:'Notificación al demandado', req:['pre','Separada (sigue)'] },
    { id:'con', n:'Contestación de demanda', req:['pre','Separada (sigue)'] },
    { id:'noc', n:'Notificación de contestación', req:['pre','Separada (sigue)'] },
    { id:'doc', n:'Documental', req:['pre','Separada (sigue)'] },
    { id:'pcr', n:'Propuesta del convenio regulador', req:['pre','Separada (sigue)'] },
    { id:'nop', n:'Notificación de propuesta', req:['pre','Separada (sigue)'] },
    { id:'sen', n:'Sentencia', req:['pre','Separada (sigue)'] }
  ]},
  otro: { nombre: 'Otro / sin mapa', etapas: [] }
};
PROCESOS.regimen = { nombre: 'Régimen comunicacional', etapas: JSON.parse(JSON.stringify(PROCESOS.alimentos.etapas)) };

const HOY = new Date().toISOString().split('T')[0];
const _hd = new Date();
const HOY_LOCAL = `${_hd.getFullYear()}-${String(_hd.getMonth()+1).padStart(2,'0')}-${String(_hd.getDate()).padStart(2,'0')}`;

const nombreCompleto = (c) => c?.apellido && c?.nombre_pila ? `${c.apellido}, ${c.nombre_pila}` : (c?.apellido || c?.nombre_pila || c?.nombre || '');

function diasHasta(fecha) {
  if (!fecha) return null;
  const hoy = new Date(HOY + 'T00:00:00');
  const f = new Date(fecha + 'T00:00:00');
  return Math.round((f - hoy) / (1000*60*60*24));
}
function vencColor(fecha) {
  const d = diasHasta(fecha);
  if (d === null) return { bg:'#F1EFE8', color:'#444441', label:'sin fecha' };
  if (d < 0)  return { bg:'#FCEBEB', color:'#791F1F', label:`venció hace ${Math.abs(d)} día${Math.abs(d)===1?'':'s'}` };
  if (d === 0) return { bg:'#FCEBEB', color:'#C53030', label:'vence hoy' };
  if (d <= 2)  return { bg:'#FDECEA', color:'#C53030', label:`en ${d} día${d===1?'':'s'}` };
  if (d <= 3)  return { bg:'#FEF0E6', color:'#9C4221', label:`en ${d} días` };
  if (d <= 7)  return { bg:'#FAEEDA', color:'#633806', label:`en ${d} días` };
  return { bg:'#EBF6E0', color:'#276027', label:`en ${d} días` };
}

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
  const [clientes, setClientes] = useState([]);
  const [honorarios, setHonorarios] = useState([]);
  const [cuotas, setCuotas] = useState([]);
  const [valorUhon, setValorUhon] = useState(null);
  const [expActual, setExpActual] = useState(null);
  const [cliActual, setCliActual] = useState(null);
  const [honActual, setHonActual] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [sidebarAbierta, setSidebarAbierta] = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? false : true);

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
    const [e, c, t, n, cl, h, cu, cfg] = await Promise.all([
      supabase.from('expedientes').select('*').order('creado_en', { ascending: false }),
      supabase.from('consultas').select('*').order('fecha', { ascending: false }),
      supabase.from('tareas').select('*').order('creado_en', { ascending: false }),
      supabase.from('notas').select('*').order('creado_en', { ascending: false }),
      supabase.from('clientes').select('*').order('nombre', { ascending: true }),
      supabase.from('honorarios').select('*').order('creado_en', { ascending: false }),
      supabase.from('cuotas').select('*').order('numero', { ascending: true }),
      supabase.from('config').select('*').maybeSingle(),
    ]);
    setExpedientes(e.data || []);
    setConsultas(c.data || []);
    setTareas(t.data || []);
    setNotas(n.data || []);
    setClientes(cl.data || []);
    setHonorarios(h.data || []);
    setCuotas(cu.data || []);
    setValorUhon(cfg.data?.valor_uhon ?? null);
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
      <div style={{position:'fixed',inset:0,background:'#F7F6F3',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
        <div style={{background:'#fff',border:'1px solid #EBEBEA',borderRadius:16,padding:40,width:'90%',maxWidth:360,textAlign:'center',boxShadow:'0 4px 24px rgba(0,0,0,0.08)'}}>
          <div style={{width:52,height:52,borderRadius:14,background:'#9B4F6A',color:'#fff',fontSize:18,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}>GE</div>
          <div style={{fontSize:18,fontWeight:700,marginBottom:4,color:'#1A1A1A'}}>Guazzaroni Escuredo</div>
          <div style={{fontSize:13,color:'#6B7280',marginBottom:28}}>Sistema de gestión del estudio</div>
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
            style={{width:'100%',padding:'11px 14px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:14,outline:'none',marginBottom:10,boxSizing:'border-box',background:'#F7F6F3'}} />
          <input type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&login()}
            style={{width:'100%',padding:'11px 14px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:14,outline:'none',marginBottom:10,boxSizing:'border-box',background:'#F7F6F3'}} />
          {loginError && <div style={{fontSize:12,color:'#A32D2D',marginBottom:10}}>{loginError}</div>}
          <button onClick={login} style={{width:'100%',padding:12,background:'#2B6CB0',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}}>Entrar</button>
        </div>
      </div>
    );
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'system-ui',background:'#F7F6F3',color:'#1A1A1A',overflow:'hidden'}}>
      {sidebarAbierta && isMobile && (
        <div onClick={()=>setSidebarAbierta(false)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:40}} />
      )}
      {!sidebarAbierta && (
        <button onClick={()=>setSidebarAbierta(true)}
          style={{position:'fixed',top:12,left:0,zIndex:50,background:'#9B4F6A',color:'#fff',border:'none',borderRadius:'0 8px 8px 0',padding:'8px 12px',fontSize:18,cursor:'pointer',lineHeight:1,minHeight:44}}>
          ☰
        </button>
      )}
      {sidebarAbierta && (
        <div style={{width:224,minWidth:224,background:'#9B4F6A',display:'flex',flexDirection:'column',
          ...(isMobile ? {position:'fixed',top:0,left:0,height:'100vh',zIndex:50} : {})}}>
          <div style={{padding:'16px 18px 14px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:'#fff',color:'#9B4F6A',fontSize:15,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>GE</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:'#fff',lineHeight:1.25}}>Guazzaroni<br/>Escuredo</div>
                <div style={{fontSize:11,color:'#FFFFFF',marginTop:2,opacity:0.75}}>General Pico, LP</div>
              </div>
              <button onClick={()=>setSidebarAbierta(false)} style={{background:'none',border:'none',color:'#fff',fontSize:18,cursor:'pointer',padding:4,lineHeight:1,opacity:0.8,flexShrink:0,minHeight:36}}>☰</button>
            </div>
          </div>
          <div style={{padding:'10px 10px',flex:1,overflowY:'auto'}}>
            {[
              ['dashboard','🏠','Inicio',''],
              ['expedientes','📁','Expedientes',''],
              ['nuevo-exp','➕','Nuevo expediente','sub'],
              ['agenda','📅','Agenda',''],
              ['agenda-vencimientos','⚠️','Vencimientos','sub'],
              ['agenda-audiencias','⚖️','Audiencias','sub'],
              ['agenda-turnos','🕐','Turnos','sub'],
              ['agenda-tareas','✅','Tareas c/vencimiento','sub'],
              ['consultas','💬','Consultas',''],
              ['nueva-consulta','➕','Nueva consulta','sub'],
              ['ver-consultas','📋','Ver consultas','sub'],
              ['tareas','✅','Tareas',''],
              ['nueva-tarea','➕','Nueva tarea','sub'],
              ['honorarios','💰','Honorarios',''],
              ['clientes','👥','Clientes',''],
            ].map(([id,emoji,label,tipo])=>{
              const isSub = tipo==='sub';
              return <button key={id} onClick={()=>{setVista(id);setExpActual(null);if(isMobile)setSidebarAbierta(false);}}
                style={{display:'flex',alignItems:'center',gap:8,
                  width:vista===id?'calc(100% - 8px)':'100%',
                  marginLeft:vista===id?4:0,marginRight:vista===id?4:0,
                  textAlign:'left',padding:isSub?'6px 10px 6px 28px':'8px 10px',borderRadius:6,fontSize:isSub?13:15,border:'none',
                  background:vista===id?'rgba(255,255,255,0.18)':'transparent',
                  color:'#FFFFFF',
                  fontWeight:vista===id?600:400,cursor:'pointer',marginBottom:1,fontFamily:'system-ui',minHeight:isSub?36:44}}>
                <span style={{fontSize:isSub?13:16,flexShrink:0}}>{emoji}</span>{label}
              </button>;
            })}
          </div>
          <div style={{padding:'12px 14px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:socioColor(perfil?.nombre).bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:socioColor(perfil?.nombre).color,flexShrink:0}}>
              {perfil?.nombre?.[0] || session.user.email[0].toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{perfil?.nombre || session.user.email}</div>
              <div style={{display:'flex',gap:8,marginTop:1}}>
                <button onClick={logout} style={{fontSize:11,color:'#FFFFFF',background:'none',border:'none',padding:0,cursor:'pointer',opacity:0.8}}>Cerrar sesión</button>
                <button onClick={()=>setVista('cambiar-password')} style={{fontSize:11,color:'#FFFFFF',background:'none',border:'none',padding:0,cursor:'pointer',opacity:0.8}}>Contraseña</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={{flex:1,overflowY:'auto',padding:isMobile?12:24,minWidth:0}}>
        {cargandoDatos && <div style={{color:'#8a8a8a',fontSize:13,marginBottom:12}}>Cargando datos...</div>}
        <Contenido
          vista={vista} setVista={setVista}
          perfil={perfil}
          expedientes={expedientes} consultas={consultas} tareas={tareas} notas={notas} clientes={clientes}
          honorarios={honorarios} cuotas={cuotas} valorUhon={valorUhon}
          expActual={expActual} setExpActual={setExpActual}
          cliActual={cliActual} setCliActual={setCliActual}
          honActual={honActual} setHonActual={setHonActual}
          recargar={cargarDatos}
        />
      </div>
    </div>
  );
}

function Badge({ children, bg, color }) {
  return <span style={{display:'inline-block',fontSize:11,padding:'3px 10px',borderRadius:20,fontWeight:600,background:bg||'#F1EFE8',color:color||'#444441',whiteSpace:'nowrap'}}>{children}</span>;
}
function Card({ children, title }) {
  return (
    <div style={{background:'#fff',border:'1px solid #EBEBEA',borderRadius:14,padding:20,marginBottom:14,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
      {title && <div style={{fontSize:15,fontWeight:600,marginBottom:16,color:'#1A1A1A'}}>{title}</div>}
      {children}
    </div>
  );
}
const inputStyle = {width:'100%',padding:'9px 12px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,background:'#F7F6F3',outline:'none',fontFamily:'system-ui',marginBottom:12,boxSizing:'border-box',minHeight:44};
const btnPrimary = {padding:'9px 16px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #2B6CB0',background:'#2B6CB0',color:'#fff',fontFamily:'system-ui',fontWeight:500};

function Contenido(props) {
  const { vista } = props;
  if (vista === 'dashboard') return <Dashboard {...props} />;
  if (vista === 'vencimientos') return <Vencimientos {...props} />;
  if (vista === 'clientes') return <Clientes {...props} />;
  if (vista === 'detalle-cliente') return <DetalleCliente {...props} />;
  if (vista === 'nuevo-cliente') return <NuevoCliente {...props} />;
  if (vista === 'honorarios') return <Honorarios {...props} />;
  if (vista === 'nuevo-honorario') return <NuevoHonorario {...props} />;
  if (vista === 'detalle-honorario') return <DetalleHonorario {...props} />;
  if (vista === 'expedientes') return <Expedientes {...props} />;
  if (vista === 'detalle') return <Detalle {...props} />;
  if (vista === 'nuevo-exp') return <NuevoExpediente {...props} />;
  if (vista === 'notas') return <Notas {...props} />;
  if (vista === 'consultas') return <Consultas {...props} />;
  if (vista === 'nueva-consulta') return <NuevaConsulta {...props} />;
  if (vista === 'ver-consultas') return <VerConsultas {...props} />;
  if (vista === 'tareas') return <Tareas {...props} />;
  if (vista === 'nueva-tarea') return <NuevaTarea {...props} />;
  if (vista === 'cambiar-password') return <CambiarPassword {...props} />;
  if (vista === 'audiencias') return <AgendaModule tabla="audiencias" titulo="Audiencias" emoji="⚖️" {...props} />;
  if (vista === 'turnos') return <AgendaModule tabla="turnos" titulo="Turnos" emoji="🕐" {...props} />;
  if (vista === 'agenda') return <AgendaUnificada {...props} />;
  if (vista === 'agenda-vencimientos') return <AgendaUnificada filtro="vencimientos" {...props} />;
  if (vista === 'agenda-audiencias') return <AgendaUnificada filtro="audiencias" {...props} />;
  if (vista === 'agenda-turnos') return <AgendaUnificada filtro="turnos" {...props} />;
  if (vista === 'agenda-tareas') return <AgendaUnificada filtro="tareas" {...props} />;
  return null;
}

function LoDeHoy({ perfil, expedientes, clientes, tareas, setVista, setExpActual }) {
  const [audienciasHoy, setAudienciasHoy] = useState([]);
  const [turnosHoy, setTurnosHoy] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!perfil?.nombre) return;
    (async () => {
      const [{ data: a },{ data: t }] = await Promise.all([
        supabase.from('audiencias').select('*').eq('estudio_id','51cc9627-71d2-4cab-a3d5-c5490b3b3e4b').eq('fecha',HOY_LOCAL),
        supabase.from('turnos').select('*').eq('estudio_id','51cc9627-71d2-4cab-a3d5-c5490b3b3e4b').eq('fecha',HOY_LOCAL),
      ]);
      const esResp = r => (r.responsable||'').split(',').map(s=>s.trim()).includes(perfil.nombre);
      setAudienciasHoy((a||[]).filter(esResp).sort((x,y)=>(x.hora||'z').localeCompare(y.hora||'z')));
      setTurnosHoy((t||[]).filter(esResp).sort((x,y)=>(x.hora||'z').localeCompare(y.hora||'z')));
      setCargando(false);
    })();
  }, [perfil?.nombre]);

  const vencimientosHoy = (expedientes||[])
    .filter(e => e.proximo_vencimiento === HOY_LOCAL &&
      (e.responsable||'').split(',').map(s=>s.trim()).includes(perfil?.nombre));

  const tareasHoy = (tareas||[])
    .filter(t => t.deadline === HOY_LOCAL && normEstado(t.estado) !== 'terminado'
      && (t.responsable||'').split(',').map(s=>s.trim()).includes(perfil?.nombre));

  const totalHoy = audienciasHoy.length + turnosHoy.length + vencimientosHoy.length + tareasHoy.length;
  const sinNada = !cargando && totalHoy === 0;

  function fmtH(h) { return h ? h.substring(0,5) : ''; }

  function filaEvento(ev, tipo, onClick) {
    const expVinc = (expedientes||[]).find(e=>e.id===ev.expediente_id);
    const cliVinc = (clientes||[]).find(c=>c.id===ev.cliente_id);
    const vinc = expVinc?.caratula || nombreCompleto(cliVinc) || '';
    const color = tipo==='audiencia' ? '#9B4F6A' : '#2B6CB0';
    return (
      <div key={ev.id} onClick={onClick}
        style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 0',borderBottom:'1px solid #F5EEF0',cursor:'pointer'}}>
        <span style={{fontSize:12,fontWeight:700,color,minWidth:40,flexShrink:0}}>{fmtH(ev.hora)||'—'}</span>
        <span style={{background:color,color:'#fff',borderRadius:5,padding:'2px 8px',fontSize:11,fontWeight:500,flexShrink:0,whiteSpace:'nowrap'}}>
          {ev.tipo||(tipo==='audiencia'?'Audiencia':'Turno')}
        </span>
        <div style={{flex:1,minWidth:0}}>
          {ev.descripcion&&<div style={{fontSize:12,color:'#4a4a4a',marginBottom:1}}>{ev.descripcion}</div>}
          {vinc&&<div style={{fontSize:11,color:'#8a8a8a'}}>📁 {vinc}</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{background:'#FFFBF9',border:'1px solid #F0E6EC',borderLeft:'4px solid #9B4F6A',borderRadius:12,padding:'18px 20px',marginBottom:22}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:sinNada||cargando?6:16}}>
        <div style={{fontSize:18,fontWeight:700,color:'#1A1A1A'}}>✨ Lo de hoy</div>
        {totalHoy>0&&<span style={{background:'#9B4F6A',color:'#fff',borderRadius:20,padding:'2px 10px',fontSize:12,fontWeight:600}}>{totalHoy}</span>}
      </div>
      {cargando&&<div style={{color:'#c0c0c0',fontSize:12}}>Cargando...</div>}
      {sinNada&&<div style={{color:'#8a8a8a',fontSize:13}}>No tenés eventos ni vencimientos para hoy 🎉</div>}
      {audienciasHoy.length>0&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#9B4F6A',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.07em'}}>⚖️ Audiencias de hoy</div>
          {audienciasHoy.map(ev=>filaEvento(ev,'audiencia',()=>setVista('audiencias')))}
        </div>
      )}
      {turnosHoy.length>0&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#2B6CB0',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.07em'}}>🕐 Turnos de hoy</div>
          {turnosHoy.map(ev=>filaEvento(ev,'turno',()=>setVista('turnos')))}
        </div>
      )}
      {vencimientosHoy.length>0&&(
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'#B45309',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.07em'}}>⚠️ Vencimientos de hoy</div>
          {vencimientosHoy.map(e=>(
            <div key={e.id} onClick={()=>{setExpActual(e);setVista('detalle');}}
              style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid #F5EEF0',cursor:'pointer'}}>
              <span style={{background:'#B45309',color:'#fff',borderRadius:5,padding:'2px 8px',fontSize:11,fontWeight:500,flexShrink:0}}>vence hoy</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,color:'#1a1a1a',marginBottom:1}}>{e.caratula}</div>
                {e.motivo_vencimiento&&<div style={{fontSize:11,color:'#8a8a8a'}}>{e.motivo_vencimiento}</div>}
              </div>
              <span style={{fontSize:11,color:'#8a8a8a',flexShrink:0}}>{e.numero}</span>
            </div>
          ))}
        </div>
      )}
      {tareasHoy.length>0&&(
        <div style={{marginTop:vencimientosHoy.length>0?14:0}}>
          <div style={{fontSize:11,fontWeight:700,color:'#D97706',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.07em'}}>✅ Tareas con vencimiento hoy</div>
          {tareasHoy.map(t=>(
            <div key={t.id} onClick={()=>setVista('tareas')}
              style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid #F5EEF0',cursor:'pointer'}}>
              <span style={{background:'#D97706',color:'#fff',borderRadius:5,padding:'2px 8px',fontSize:11,fontWeight:500,flexShrink:0}}>hoy</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,color:'#1a1a1a'}}>{t.descripcion}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Dashboard({ expedientes, consultas, tareas, notas, perfil, setVista, setExpActual, cuotas, honorarios, clientes }) {
  const mes = HOY.substring(0,7);
  const activos = expedientes.filter(e=>(e.estado||'').toLowerCase()==='activo').length;
  const consMes = consultas.filter(c=>c.fecha&&c.fecha.startsWith(mes)).length;
  const tareasPend = tareas.filter(t=>t.estado==='pendiente').length;
  const vencSemana = expedientes.filter(e=>{ const d=diasHasta(e.proximo_vencimiento); return d!==null && d<=7; });
  const vencProximos = expedientes.filter(e=>e.proximo_vencimiento && (e.estado||'').toLowerCase()!=='archivado')
    .sort((a,b)=>a.proximo_vencimiento.localeCompare(b.proximo_vencimiento)).slice(0,6);
  const misTareas = tareas
    .filter(t => t.estudio_id === '51cc9627-71d2-4cab-a3d5-c5490b3b3e4b' && (t.responsable||'').split(',').map(s=>s.trim()).includes(perfil?.nombre) && normEstado(t.estado) !== 'terminado')
    .sort((a,b) => { if(!a.deadline&&!b.deadline) return 0; if(!a.deadline) return 1; if(!b.deadline) return -1; return a.deadline.localeCompare(b.deadline); });
  const cuotasACobrar = (cuotas||[])
    .filter(cu=>cu.estado==='pendiente' && cu.vencimiento && cu.vencimiento<=HOY)
    .sort((a,b)=>a.vencimiento.localeCompare(b.vencimiento));
  const _d3=new Date(HOY+'T00:00:00'); _d3.setDate(_d3.getDate()+3);
  const hoyMas3=`${_d3.getFullYear()}-${String(_d3.getMonth()+1).padStart(2,'0')}-${String(_d3.getDate()).padStart(2,'0')}`;
  const honConRecordatorio=(honorarios||[]).filter(h=>h.fecha_limite_pago&&h.fecha_limite_pago<=hoyMas3&&h.estado!=='pagado');
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:22}}>
        {[['📁','Expedientes activos',activos,null,'expedientes'],['⚠️','Vencimientos esta semana',vencSemana.length,vencSemana.length>0?'#C53030':null,'agenda-vencimientos'],['✅','Tareas pendientes',tareasPend,null,'tareas'],['💬','Consultas este mes',consMes,null,'consultas']].map(([emoji,l,v,col,dest])=>(
          <div key={l} onClick={()=>setVista(dest)}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';e.currentTarget.style.borderColor='#DDDCDA';}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.06)';e.currentTarget.style.borderColor='#EBEBEA';}}
            style={{background:'#fff',borderRadius:14,padding:'18px 20px',border:'1px solid #EBEBEA',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',cursor:'pointer'}}>
            <span style={{fontSize:28,display:'block',marginBottom:8}}>{emoji}</span>
            <div style={{fontSize:32,fontWeight:700,color:col||'#1A1A1A',lineHeight:1}}>{v}</div>
            <div style={{fontSize:12,color:'#6B7280',marginTop:8,lineHeight:1.4}}>{l}</div>
          </div>
        ))}
      </div>
      <LoDeHoy perfil={perfil} expedientes={expedientes} clientes={clientes} tareas={tareas} setVista={setVista} setExpActual={setExpActual} />
      <Card title="📅 Próximos vencimientos">
        {vencProximos.length ? vencProximos.map(e=>{
          const vc = vencColor(e.proximo_vencimiento);
          return <div key={e.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #F0EFED',cursor:'pointer'}} onClick={()=>{setExpActual(e);setVista('detalle');}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{e.caratula}</div>
              <div style={{fontSize:11,color:'#8a8a8a'}}>{e.numero} · {e.motivo_vencimiento||'Vencimiento'}</div>
            </div>
            <Badge bg={vc.bg} color={vc.color}>{formatFecha(e.proximo_vencimiento)} · {vc.label}</Badge>
          </div>;
        }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:20}}>No hay vencimientos cargados. Cargá las fechas al crear o editar un expediente.</div>}
      </Card>
      <Card title="✅ Mis tareas pendientes">
        {misTareas.length ? misTareas.map(t=>{
          const ec = ESTADO_COLOR[normEstado(t.estado)] || ESTADO_COLOR['pendiente'];
          const dp = t.deadline ? t.deadline.split('-') : null;
          const deadlineStr = dp ? `${dp[2]}/${dp[1]}/${dp[0]}` : null;
          return <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #F0EFED'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500,color:'#1a1a1a',marginBottom:4}}>{t.descripcion}</div>
              {deadlineStr && <div style={{fontSize:11,color:'#8a8a8a'}}>Vence: {deadlineStr}</div>}
            </div>
            <Badge bg={ec.bg} color={ec.color}>{normEstado(t.estado)}</Badge>
          </div>;
        }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:20}}>No tenés tareas pendientes 🎉</div>}
      </Card>
      {(cuotasACobrar.length > 0 || honConRecordatorio.length > 0) && (
        <Card title="💰 Cuotas a cobrar">
          {cuotasACobrar.map(cu=>{
            const hon=(honorarios||[]).find(h=>h.id===cu.honorario_id);
            const exp=hon?.expediente_id?expedientes.find(e=>e.id===hon.expediente_id):null;
            const cli=hon?.cliente_id?(clientes||[]).find(c=>c.id===hon.cliente_id):null;
            const vincLabel=hon?.vinculo_tipo==='contraparte'?(hon.contraparte_nombre||'—'):(exp?exp.caratula:(cli?nombreCompleto(cli):'—'));
            const esHoy=cu.vencimiento===HOY;
            const badge=esHoy?{bg:'#FDECEA',color:'#C53030',label:'vence hoy'}:{bg:'#FCEBEB',color:'#791F1F',label:'vencida'};
            return <div key={cu.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #F0EFED'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{hon?hon.concepto:'Honorario'} <span style={{fontSize:11,color:'#8a8a8a'}}>· Cuota {cu.numero}</span></div>
                <div style={{fontSize:11,color:'#8a8a8a'}}>{vincLabel} · vence {formatFecha(cu.vencimiento)}</div>
              </div>
              <span style={{fontSize:13,fontWeight:600,marginRight:4}}>{fmtMoneda(cu.monto)}</span>
              <Badge bg={badge.bg} color={badge.color}>{badge.label}</Badge>
            </div>;
          })}
          {honConRecordatorio.map(h=>{
            const exp=h.expediente_id?expedientes.find(e=>e.id===h.expediente_id):null;
            const cli=h.cliente_id?(clientes||[]).find(c=>c.id===h.cliente_id):null;
            const nombre=h.vinculo_tipo==='contraparte'?(h.contraparte_nombre||'—'):(exp?exp.caratula:(cli?nombreCompleto(cli):'—'));
            return <div key={`rec-${h.id}`} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #F0EFED'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{h.concepto}</div>
                <div style={{fontSize:11,color:'#92400E'}}>Recordar a {nombre} que vence el {formatFecha(h.fecha_limite_pago)}</div>
              </div>
              <Badge bg="#FEF9EE" color="#92400E">límite {formatFecha(h.fecha_limite_pago)}</Badge>
            </div>;
          })}
        </Card>
      )}
    </div>
  );
}

const ESTADO_DOT = { activo:'#27500A', espera:'#633806', apelado:'#0C447C', archivado:'#8a8a8a' };

const PALETA_PROCESO = ['#9B4F6A','#2B6CB0','#27500A','#B45309','#6B21A8','#0891B2','#BE123C','#047857','#9333EA','#D97706'];

function Expedientes({ expedientes, setVista, setExpActual }) {
  const [q, setQ] = useState('');
  const [filtroP, setFiltroP] = useState('');
  const [filtroE, setFiltroE] = useState('');
  const [pagina, setPagina] = useState(1);
  const [hoveredRow, setHoveredRow] = useState(null);
  const POR_PAG = 50;

  const tiposProceso = [...new Set(expedientes.map(e=>e.tipo_proceso).filter(Boolean))];

  function dotColorProceso(tp) {
    const idx = tiposProceso.indexOf(tp);
    return idx >= 0 ? PALETA_PROCESO[idx % PALETA_PROCESO.length] : '#8a8a8a';
  }

  function calcEtapa(e) {
    const mapa = PROCESOS[e.tipo_proceso];
    const prog = (() => { try { return e.progreso ? (typeof e.progreso==='string'?JSON.parse(e.progreso):e.progreso) : {hechas:{},dec:{}}; } catch { return {hechas:{},dec:{}}; } })();
    if (!prog.hechas) prog.hechas = {}; if (!prog.dec) prog.dec = {};
    const esDemandada = e.rol === 'demandada';
    const etapasVis = mapa && mapa.etapas.length ? mapa.etapas
      .filter(et => !et.req || prog.dec[et.req[0]] === et.req[1])
      .filter(et => !(esDemandada && et.id === 'dem'))
      .map(et => esDemandada && et.id === 'con' ? {...et, n:'Contestar demanda'} : et)
      : [];
    if (!mapa || !etapasVis.length) return '—';
    if (etapasVis.every(et => prog.hechas[et.id])) return 'Finalizado';
    return etapasVis.find(et => !prog.hechas[et.id])?.n || '—';
  }

  function resolveResponsable(e) {
    if (e.responsable) return e.responsable;
    if (!e.cliente_id) return '';
    const otros = expedientes.filter(x => x.id !== e.id && x.cliente_id === e.cliente_id && x.responsable);
    if (!otros.length) return '';
    const freq = {};
    otros.forEach(x => { freq[x.responsable] = (freq[x.responsable]||0)+1; });
    return Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0];
  }

  function resetPag() { setPagina(1); }

  const listaProcTexto = expedientes.filter(e => {
    const textoOk = !q || (e.caratula||'').toLowerCase().includes(q.toLowerCase()) || (e.numero||'').toLowerCase().includes(q.toLowerCase());
    const procesoOk = !filtroP || e.tipo_proceso === filtroP;
    return textoOk && procesoOk;
  });

  const etapasUnicas = [...new Set(listaProcTexto.map(e=>calcEtapa(e)).filter(s=>s&&s!=='—'))].sort();

  const listaFiltrada = listaProcTexto.filter(e => !filtroE || calcEtapa(e) === filtroE);

  const totalPags = Math.max(1, Math.ceil(listaFiltrada.length / POR_PAG));
  const pagActual = Math.min(pagina, totalPags);
  const desde = (pagActual - 1) * POR_PAG;
  const hasta = Math.min(desde + POR_PAG, listaFiltrada.length);
  const listaPag = listaFiltrada.slice(desde, hasta);

  return (
    <Card title="📁 Expedientes">
      <input style={inputStyle} placeholder="Buscar expediente..." value={q} onChange={e=>{setQ(e.target.value);resetPag();}} />

      <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <select style={{...inputStyle,marginBottom:0,flex:'1 1 180px',maxWidth:260}}
          value={filtroP} onChange={e=>{setFiltroP(e.target.value);setFiltroE('');resetPag();}}>
          <option value="">Todos los procesos</option>
          {tiposProceso.map(tp=><option key={tp} value={tp}>{PROCESOS[tp]?.nombre||tp}</option>)}
        </select>
        <select style={{...inputStyle,marginBottom:0,flex:'1 1 180px',maxWidth:300}}
          value={filtroE} onChange={e=>{setFiltroE(e.target.value);resetPag();}}>
          <option value="">Todas las etapas</option>
          {etapasUnicas.map(et=><option key={et} value={et}>{et}</option>)}
        </select>
        {(filtroP||filtroE) && (
          <button onClick={()=>{setFiltroP('');setFiltroE('');resetPag();}}
            style={{padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',color:'#6B7280',fontFamily:'system-ui',whiteSpace:'nowrap'}}>
            Limpiar ✕
          </button>
        )}
      </div>

      {tiposProceso.length > 0 && (
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
          {tiposProceso.map(tp=>(
            <div key={tp} style={{display:'flex',alignItems:'center',gap:5,background:'#F7F6F3',borderRadius:20,padding:'3px 10px',cursor:'pointer'}}
              onClick={()=>{setFiltroP(filtroP===tp?'':tp);setFiltroE('');resetPag();}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:dotColorProceso(tp),display:'inline-block',flexShrink:0}}></span>
              <span style={{fontSize:11,color:filtroP===tp?'#1A1A1A':'#6B7280',fontWeight:filtroP===tp?600:400}}>{PROCESOS[tp]?.nombre||tp}</span>
            </div>
          ))}
        </div>
      )}

      {listaFiltrada.length ? (
        <>
          <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr style={{background:'#F7F6F3'}}>
              {['N°','Carátula','Proceso','Etapa actual','Estado','Responsable'].map(h=>(
                <th key={h} style={{textAlign:'left',padding:'10px 10px',fontSize:11,color:'#6B7280',borderBottom:'1px solid #EBEBEA',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {listaPag.map(e=>{
                const mapa = PROCESOS[e.tipo_proceso];
                const prog = (() => { try { return e.progreso ? (typeof e.progreso==='string'?JSON.parse(e.progreso):e.progreso) : {hechas:{},dec:{}}; } catch { return {hechas:{},dec:{}}; } })();
                if (!prog.hechas) prog.hechas = {}; if (!prog.dec) prog.dec = {};
                const esDemandada = e.rol === 'demandada';
                const etapasVis = mapa && mapa.etapas.length ? mapa.etapas
                  .filter(et => !et.req || prog.dec[et.req[0]] === et.req[1])
                  .filter(et => !(esDemandada && et.id === 'dem'))
                  .map(et => esDemandada && et.id === 'con' ? {...et, n:'Contestar demanda'} : et)
                  : [];
                const etapaActual = !mapa || !etapasVis.length ? '—'
                  : etapasVis.every(et => prog.hechas[et.id]) ? 'Finalizado'
                  : (etapasVis.find(et => !prog.hechas[et.id])?.n || '—');
                const respDisplay = resolveResponsable(e);
                const dotColor = dotColorProceso(e.tipo_proceso);
                return <tr key={e.id} style={{cursor:'pointer',background:hoveredRow===e.id?'#F7F6F3':'transparent'}}
                  onMouseEnter={()=>setHoveredRow(e.id)} onMouseLeave={()=>setHoveredRow(null)}
                  onClick={()=>{setExpActual(e);setVista('detalle');}}>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontSize:11,color:'#6B7280'}}>{e.numero}</td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}>
                    <div style={{display:'flex',alignItems:'center',gap:7}}>
                      <span style={{width:8,height:8,borderRadius:'50%',background:dotColor,display:'inline-block',flexShrink:0}}></span>
                      <span style={{fontWeight:500}}>{e.caratula}</span>
                    </div>
                  </td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontSize:12,color:'#6B7280'}}>{mapa?mapa.nombre:'—'}</td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}>{etapaActual==='Finalizado'?<Badge bg="#EAF3DE" color="#27500A">Finalizado</Badge>:<span style={{fontSize:12,color:'#4a4a4a'}}>{etapaActual}</span>}</td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}><Badge bg="#EAF3DE" color="#27500A">{e.estado}</Badge></td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}>
                    {respDisplay ? <Badge bg={socioColor(respDisplay).bg} color={socioColor(respDisplay).color}>{respDisplay}</Badge> : null}
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:14,flexWrap:'wrap',gap:10}}>
            <span style={{fontSize:12,color:'#6B7280'}}>
              Mostrando {desde+1}–{hasta} de {listaFiltrada.length} expediente{listaFiltrada.length!==1?'s':''}
            </span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={pagActual===1}
                style={{padding:'5px 12px',borderRadius:8,fontSize:12,cursor:pagActual===1?'default':'pointer',border:'1px solid #DDDCDA',background:'#fff',color:pagActual===1?'#C0C0C0':'#4a4a4a',fontFamily:'system-ui'}}>
                Anterior
              </button>
              <span style={{fontSize:12,color:'#4a4a4a',whiteSpace:'nowrap'}}>Página {pagActual} / {totalPags}</span>
              <button onClick={()=>setPagina(p=>Math.min(totalPags,p+1))} disabled={pagActual===totalPags}
                style={{padding:'5px 12px',borderRadius:8,fontSize:12,cursor:pagActual===totalPags?'default':'pointer',border:'1px solid #DDDCDA',background:'#fff',color:pagActual===totalPags?'#C0C0C0':'#4a4a4a',fontFamily:'system-ui'}}>
                Siguiente
              </button>
            </div>
          </div>
        </>
      ) : <div style={{color:'#6B7280',fontSize:13,textAlign:'center',padding:30}}>
        {expedientes.length===0 ? 'Sin expedientes todavía. Cargá el primero desde "Nuevo expediente".' : 'No hay expedientes que coincidan con los filtros.'}
      </div>}
    </Card>
  );
}

function Detalle({ expActual, setExpActual, setVista, notas, perfil, recargar, clientes }) {
  const [guardando, setGuardando] = useState(false);
  const [notaTexto, setNotaTexto] = useState('');
  const e = expActual;
  if (!e) return null;
  const mapa = PROCESOS[e.tipo_proceso];
  const prog = (() => { try { return e.progreso ? (typeof e.progreso==='string'?JSON.parse(e.progreso):e.progreso) : {hechas:{},subs:{},dec:{}}; } catch { return {hechas:{},subs:{},dec:{}}; } })();
  if (!prog.hechas) prog.hechas = {}; if (!prog.subs) prog.subs = {}; if (!prog.dec) prog.dec = {};

  const esDemandada = e.rol === 'demandada';
  const etapasVis = mapa ? mapa.etapas
    .filter(et => !et.req || prog.dec[et.req[0]] === et.req[1])
    .filter(et => !(esDemandada && et.id === 'dem'))
    .map(et => {
      if (esDemandada && et.id === 'con') return { ...et, n: 'Contestar demanda' };
      return et;
    }) : [];

  const motivoEsOtro = !etapasVis.find(et => et.id !== 'med' && et.n === (e.motivo_vencimiento||''));
  const [motivoOtro, setMotivoOtro] = useState(motivoEsOtro ? (e.motivo_vencimiento||'') : '');

  async function guardarProg(nuevoProg) {
    setExpActual({...e, progreso: nuevoProg});
    await supabase.from('expedientes').update({ progreso: nuevoProg }).eq('id', e.id);
    recargar();
  }
  function tildar(etId) {
    const np = JSON.parse(JSON.stringify(prog));
    if (np.hechas[etId]) {
      delete np.hechas[etId];
    } else {
      const idx = etapasVis.findIndex(et => et.id === etId);
      etapasVis.slice(0, idx + 1).forEach(et => {
        if (!np.hechas[et.id]) np.hechas[et.id] = HOY;
      });
    }
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
  async function actualizarVencimiento(campo, valor) {
    setExpActual({...e, [campo]: valor});
    await supabase.from('expedientes').update({ [campo]: valor||null }).eq('id', e.id);
    recargar();
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
      <button onClick={()=>setVista('expedientes')} style={{padding:'7px 13px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',marginBottom:12}}>← Volver</button>
      <Card>
        <div style={{fontSize:11,color:'#6B7280',marginBottom:4}}>{e.numero} · {e.juzgado||'Sin juzgado'}</div>
        <div style={{fontSize:20,fontWeight:700,marginBottom:10,lineHeight:1.3}}>{e.caratula}</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14,alignItems:'center'}}>
          <select value={e.estado||'activo'} onChange={ev=>actualizarVencimiento('estado', ev.target.value)}
            style={{padding:'4px 8px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,background:'#F7F6F3',fontFamily:'system-ui'}}>
            <option value="activo">Activo</option>
            <option value="espera">En espera</option>
            <option value="apelado">Apelado</option>
            <option value="archivado">Archivado</option>
          </select>
          {mapa && <Badge bg="#EEEDFE" color="#3C3489">{mapa.nombre}</Badge>}
          <select value={e.responsable||''} onChange={ev=>actualizarVencimiento('responsable', ev.target.value)}
            style={{padding:'4px 8px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,background:'#F7F6F3',fontFamily:'system-ui'}}>
            <option value="">Sin asignar</option>
            {ABOGADAS.map(a=><option key={a}>{a}</option>)}
          </select>
          <span style={{fontSize:12,color:'#8a8a8a',marginLeft:4}}>Rol:</span>
          <select value={e.rol||'actora'} onChange={ev=>actualizarVencimiento('rol', ev.target.value)}
            style={{padding:'4px 8px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,background:'#F7F6F3',fontFamily:'system-ui'}}>
            <option value="actora">Actora</option>
            <option value="demandada">Demandada</option>
          </select>
          <span style={{fontSize:12,color:'#8a8a8a',marginLeft:4}}>Cliente:</span>
          <select value={e.cliente_id||''} onChange={ev=>actualizarVencimiento('cliente_id', ev.target.value||null)}
            style={{padding:'4px 8px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,background:'#F7F6F3',fontFamily:'system-ui'}}>
            <option value="">Sin vincular</option>
            {(clientes||[]).map(cl=><option key={cl.id} value={cl.id}>{nombreCompleto(cl)}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end',borderTop:'1px solid #f5f5f3',paddingTop:12}}>
          <div>
            <label style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:4}}>Próximo vencimiento</label>
            <input type="date" value={e.proximo_vencimiento||''} onChange={ev=>actualizarVencimiento('proximo_vencimiento',ev.target.value)}
              style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,background:'#F7F6F3',fontFamily:'system-ui'}} />
          </div>
          <div style={{flex:1,minWidth:180}}>
            <label style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:4}}>Motivo del vencimiento</label>
            <select
              value={etapasVis.find(et => et.id !== 'med' && et.n === (e.motivo_vencimiento||'')) ? e.motivo_vencimiento : 'Otro'}
              onChange={ev => {
                if (ev.target.value !== 'Otro') {
                  setMotivoOtro('');
                  actualizarVencimiento('motivo_vencimiento', ev.target.value);
                } else {
                  actualizarVencimiento('motivo_vencimiento', '');
                }
              }}
              style={{width:'100%',padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,background:'#F7F6F3',fontFamily:'system-ui',boxSizing:'border-box'}}>
              <option value="">— Sin motivo —</option>
              {etapasVis.filter(et => et.id !== 'med').map(et => <option key={et.id} value={et.n}>{et.n}</option>)}
              <option value="Otro">Otro</option>
            </select>
            {(etapasVis.find(et => et.id !== 'med' && et.n === (e.motivo_vencimiento||'')) == null && e.motivo_vencimiento !== null && e.motivo_vencimiento !== '' || etapasVis.find(et => et.id !== 'med' && et.n === (e.motivo_vencimiento||'')) == null) &&
              <input type="text" value={motivoOtro} onChange={ev=>setMotivoOtro(ev.target.value)}
                onBlur={ev=>actualizarVencimiento('motivo_vencimiento', ev.target.value)}
                placeholder="Describí el motivo..."
                style={{width:'100%',padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,background:'#F7F6F3',fontFamily:'system-ui',boxSizing:'border-box',marginTop:6}} />
            }
          </div>
          {e.proximo_vencimiento && (()=>{ const vc=vencColor(e.proximo_vencimiento); return <Badge bg={vc.bg} color={vc.color}>{vc.label}</Badge>; })()}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12,borderTop:'1px solid #f5f5f3',paddingTop:12}}>
          <div>
            <label style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:4,fontWeight:600}}>HIPÓTESIS DE MÁXIMA</label>
            <textarea defaultValue={e.hipotesis_maxima||''} onBlur={ev=>actualizarVencimiento('hipotesis_maxima',ev.target.value)} placeholder="El mejor resultado posible..."
              style={{width:'100%',padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,background:'#F7F6F3',fontFamily:'system-ui',boxSizing:'border-box',minHeight:48,resize:'vertical'}} />
          </div>
          <div>
            <label style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:4,fontWeight:600}}>HIPÓTESIS DE MÍNIMA</label>
            <textarea defaultValue={e.hipotesis_minima||''} onBlur={ev=>actualizarVencimiento('hipotesis_minima',ev.target.value)} placeholder="El resultado aceptable mínimo..."
              style={{width:'100%',padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,background:'#F7F6F3',fontFamily:'system-ui',boxSizing:'border-box',minHeight:48,resize:'vertical'}} />
          </div>
        </div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:14,alignItems:'start'}}>
        <Card title="🗺️ Etapas del proceso">
          {!mapa || !mapa.etapas.length ? <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:20}}>Sin mapa de proceso asignado.</div> :
            etapasVis.map((et,i)=>{
              const hecha = prog.hechas[et.id];
              const esActual = !hecha && etapasVis.slice(0,i).every(x=>prog.hechas[x.id]);
              return <div key={et.id} style={{display:'flex',gap:12,padding:'9px 0',alignItems:'flex-start'}}>
                <div onClick={()=>tildar(et.id)} style={{width:16,height:16,borderRadius:4,border:hecha?'none':'1.5px solid #c9c9c4',background:hecha?'#2B6CB0':'#fff',cursor:'pointer',flexShrink:0,marginTop:2,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10}}>{hecha?'✓':''}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:13,fontWeight:500,color:hecha?'#8a8a8a':'#1a1a1a'}}>{et.n}</span>
                    {hecha && <span style={{fontSize:11,color:'#639922',fontWeight:500}}>✓ {formatFecha(hecha)}</span>}
                    {esActual && <Badge bg="#2B6CB0" color="#fff">ACTUAL</Badge>}
                  </div>
                  {et.sub && <div style={{marginTop:5}}>
                    {et.sub.map((s,si)=>{
                      const sh = prog.subs[et.id]&&prog.subs[et.id][si];
                      return <div key={si} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',fontSize:12,color:'#4a4a4a'}}>
                        <div onClick={()=>tildarSub(et.id,si)} style={{width:13,height:13,borderRadius:3,border:sh?'none':'1.5px solid #c9c9c4',background:sh?'#2B6CB0':'#fff',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:8}}>{sh?'✓':''}</div>
                        <span style={{textDecoration:sh?'line-through':'none',color:sh?'#8a8a8a':'#4a4a4a'}}>{s}</span>
                      </div>;
                    })}
                  </div>}
                  {et.op && <div style={{display:'flex',gap:6,marginTop:7,flexWrap:'wrap'}}>
                    {et.op.map(o=><button key={o} onClick={()=>elegir(et.id,o)} style={{padding:'7px 12px',border:prog.dec[et.id]===o?'1px solid #2B6CB0':'1px solid #e2e2e2',borderRadius:8,fontSize:12,cursor:'pointer',background:prog.dec[et.id]===o?'#185FA5':'#fff',color:prog.dec[et.id]===o?'#fff':'#1a1a1a',fontWeight:500}}>{o}</button>)}
                  </div>}
                </div>
              </div>;
            })
          }
        </Card>
        <Card title="📋 Anotaciones">
          <textarea style={{...inputStyle,minHeight:64,resize:'vertical'}} placeholder="Escribí una nota: lo que pasó en la audiencia, algo para el próximo escrito..." value={notaTexto} onChange={e=>setNotaTexto(e.target.value)} />
          <button onClick={agregarNota} disabled={guardando} style={{...btnPrimary,width:'100%',marginBottom:14}}>{guardando?'Guardando...':'+ Agregar nota'}</button>
          {notasExp.length ? notasExp.map(n=>(
            <div key={n.id} style={{background:'#F7F6F3',borderRadius:8,padding:'11px 13px',marginBottom:8}}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:5,flexWrap:'wrap'}}>
                <Badge bg={socioColor(n.autora).bg} color={socioColor(n.autora).color}>{n.autora}</Badge>
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

function NuevoExpediente({ perfil, recargar, setVista, clientes }) {
  const [f, setF] = useState({ numero:'', caratula:'', juzgado:'', tipo_proceso:'', estado:'activo', proximo_vencimiento:'', motivo_vencimiento:'', responsable:'', notas:'', cliente_id:'', hipotesis_maxima:'', hipotesis_minima:'', rol:'actora' });
  useEffect(()=>{ if(perfil?.nombre) setF(prev=>({...prev, responsable: prev.responsable||perfil.nombre})); }, [perfil]);
  const [msg, setMsg] = useState('');
  const [responsableSugerido, setResponsableSugerido] = useState(false);
  const set = (k,v) => setF({...f,[k]:v});
  async function onClienteChange(clienteId) {
    setF(prev=>({...prev, cliente_id: clienteId}));
    setResponsableSugerido(false);
    if (!clienteId) return;
    const { data } = await supabase.from('expedientes')
      .select('responsable')
      .eq('cliente_id', clienteId)
      .eq('estudio_id', '51cc9627-71d2-4cab-a3d5-c5490b3b3e4b')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.responsable) {
      setF(prev=>({...prev, responsable: data.responsable}));
      setResponsableSugerido(true);
    }
  }
  async function guardar() {
    if (!f.numero||!f.caratula||!f.tipo_proceso||!f.responsable) { alert('Completá los campos obligatorios (*)'); return; }
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    const payload = { ...f, estudio_id: perfil.estudio_id, progreso: {}, cliente_id: f.cliente_id||null };
    const { error } = await supabase.from('expedientes').insert(payload);
    if (error) { alert('Error: '+error.message); return; }
    setMsg(`Expediente ${f.numero} guardado.`);
    setF({ numero:'', caratula:'', juzgado:'', tipo_proceso:'', estado:'activo', proximo_vencimiento:'', motivo_vencimiento:'', responsable:'', notas:'', cliente_id:'', hipotesis_maxima:'', hipotesis_minima:'', rol:'actora' });
    setResponsableSugerido(false);
    recargar();
    setTimeout(()=>setMsg(''),3000);
  }
  return (
    <Card title="📁 Nuevo expediente">
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
          <option value="divorcio">Divorcio</option>
          <option value="otro">Otro / sin mapa</option>
        </select>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Rol del estudio</label>
        <select style={inputStyle} value={f.rol} onChange={e=>set('rol',e.target.value)}>
          <option value="actora">Actora</option>
          <option value="demandada">Demandada</option>
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
        {(() => {
          const etapasForm = f.tipo_proceso && PROCESOS[f.tipo_proceso]
            ? PROCESOS[f.tipo_proceso].etapas.filter(et => et.id !== 'med')
            : [];
          const esOtro = f.motivo_vencimiento && !etapasForm.find(et => et.n === f.motivo_vencimiento);
          return <>
            <select style={inputStyle} value={esOtro ? 'Otro' : f.motivo_vencimiento} onChange={e => {
              if (e.target.value !== 'Otro') set('motivo_vencimiento', e.target.value);
              else set('motivo_vencimiento', '');
            }}>
              <option value="">— Sin motivo —</option>
              {etapasForm.map(et => <option key={et.id} value={et.n}>{et.n}</option>)}
              <option value="Otro">Otro</option>
            </select>
            {(esOtro || f.motivo_vencimiento === '') && f.tipo_proceso && etapasForm.length > 0 && (esOtro) &&
              <input style={{...inputStyle, marginTop:6}} placeholder="Describí el motivo..." value={f.motivo_vencimiento} onChange={e=>set('motivo_vencimiento',e.target.value)} />
            }
          </>;
        })()}
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Responsable *</label>
        <SocioChips value={f.responsable} onChange={v=>{set('responsable',v);setResponsableSugerido(false);}} />
        {responsableSugerido && <div style={{fontSize:11,color:'#8a8a8a',marginTop:-8,marginBottom:12}}>Sugerido según expedientes anteriores de este cliente</div>}
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Cliente</label>
        <select style={inputStyle} value={f.cliente_id} onChange={e=>onClienteChange(e.target.value)}>
          <option value="">Sin vincular</option>
          {(clientes||[]).map(cl=><option key={cl.id} value={cl.id}>{nombreCompleto(cl)}</option>)}
        </select>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Hipótesis de máxima</label>
        <textarea style={{...inputStyle,minHeight:52,resize:'vertical'}} placeholder="El mejor resultado posible para el cliente..." value={f.hipotesis_maxima} onChange={e=>set('hipotesis_maxima',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Hipótesis de mínima</label>
        <textarea style={{...inputStyle,minHeight:52,resize:'vertical'}} placeholder="El resultado aceptable mínimo..." value={f.hipotesis_minima} onChange={e=>set('hipotesis_minima',e.target.value)} />
        <button onClick={guardar} style={btnPrimary}>Guardar expediente</button>
      </div>
    </Card>
  );
}

function Notas({ notas, expedientes, setVista, setExpActual, recargar }) {
  const [q, setQ] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [editTexto, setEditTexto] = useState('');
  const lista = notas.filter(n=>{
    const ex = expedientes.find(e=>e.id===n.expediente_id);
    const blob = (n.texto+' '+(ex?ex.caratula+' '+ex.numero:'')+' '+(n.etapa||'')+' '+n.autora).toLowerCase();
    return !q || blob.includes(q.toLowerCase());
  });
  async function eliminarNota(n, ev) {
    ev.stopPropagation();
    if (!confirm('¿Eliminar esta nota?')) return;
    await supabase.from('notas').delete().eq('id', n.id);
    recargar();
  }
  async function guardarEdicion(n, ev) {
    ev.stopPropagation();
    if (!editTexto.trim()) return;
    await supabase.from('notas').update({ texto: editTexto.trim() }).eq('id', n.id);
    setEditandoId(null);
    recargar();
  }
  return (
    <Card title="📝 Todas las anotaciones">
      <input style={inputStyle} placeholder="Buscar en las notas: cliente, tema, lo que recuerdes..." value={q} onChange={e=>setQ(e.target.value)} />
      {lista.length ? lista.map(n=>{
        const ex = expedientes.find(e=>e.id===n.expediente_id);
        const esEditando = editandoId===n.id;
        return <div key={n.id} style={{background:'#F7F6F3',borderRadius:8,padding:'11px 13px',marginBottom:8}}>
          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:5,flexWrap:'wrap',justifyContent:'space-between'}}>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',cursor:ex?'pointer':'default'}} onClick={()=>{if(ex){setExpActual(ex);setVista('detalle');}}}>
              <span style={{fontSize:12,fontWeight:600}}>{ex?ex.caratula:'(expediente)'}</span>
              <Badge bg={socioColor(n.autora).bg} color={socioColor(n.autora).color}>{n.autora}</Badge>
              <span style={{fontSize:11,color:'#8a8a8a'}}>{formatFecha(n.fecha)}</span>
              {n.etapa && <Badge>{n.etapa}</Badge>}
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={ev=>{ev.stopPropagation();setEditandoId(esEditando?null:n.id);setEditTexto(n.texto);}}
                style={{fontSize:11,color:'#2B6CB0',background:'none',border:'none',cursor:'pointer'}}>{esEditando?'cancelar':'editar'}</button>
              <button onClick={ev=>eliminarNota(n,ev)}
                style={{fontSize:11,color:'#A32D2D',background:'none',border:'none',cursor:'pointer'}}>eliminar</button>
            </div>
          </div>
          {esEditando ? (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <textarea value={editTexto} onChange={ev=>setEditTexto(ev.target.value)}
                style={{width:'100%',padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,fontFamily:'system-ui',resize:'vertical',minHeight:72,boxSizing:'border-box'}} />
              <button onClick={ev=>guardarEdicion(n,ev)} style={{...btnPrimary,padding:'6px 12px',fontSize:12,alignSelf:'flex-start'}}>Guardar</button>
            </div>
          ) : (
            <div style={{fontSize:13,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{n.texto}</div>
          )}
        </div>;
      }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:30}}>No hay notas que coincidan.</div>}
    </Card>
  );
}

function Consultas({ consultas, recargar }) {
  const [q, setQ] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const mes = HOY.substring(0,7);
  const mesA = consultas.filter(c=>c.fecha&&c.fecha.startsWith(mes));
  const lista = consultas.filter(c=>!q||(c.cliente||'').toLowerCase().includes(q.toLowerCase())||(c.motivo||'').toLowerCase().includes(q.toLowerCase()));

  async function eliminarConsulta(c) {
    if (!confirm(`¿Eliminar la consulta de ${c.cliente}?`)) return;
    await supabase.from('consultas').delete().eq('id', c.id);
    recargar();
  }
  async function guardarEdicion(c) {
    await supabase.from('consultas').update({ cliente: editForm.cliente, tipo: editForm.tipo, fecha: editForm.fecha, abogada: editForm.abogada, motivo: editForm.motivo, comentario: editForm.comentario }).eq('id', c.id);
    setEditandoId(null);
    recargar();
  }

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {[['💬','Consultas este mes',mesA.length],['✨','Primeras',mesA.filter(c=>c.tipo==='primera').length],['🔄','Otras consultas',mesA.filter(c=>c.tipo==='seguimiento').length],['👤','Clientes únicos',new Set(mesA.map(c=>c.cliente)).size]].map(([emoji,l,v])=>(
          <div key={l} style={{background:'#fff',borderRadius:14,padding:'18px 20px',border:'1px solid #EBEBEA',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <span style={{fontSize:24,display:'block',marginBottom:6}}>{emoji}</span>
            <div style={{fontSize:28,fontWeight:700,color:'#1A1A1A',lineHeight:1}}>{v}</div>
            <div style={{fontSize:12,color:'#6B7280',marginTop:6}}>{l}</div>
          </div>
        ))}
      </div>
      <Card title="💬 Registro de consultas">
        <input style={inputStyle} placeholder="Buscar cliente o motivo..." value={q} onChange={e=>setQ(e.target.value)} />
        {lista.length ? lista.map(c=>{
          const esEditando = editandoId===c.id;
          return <div key={c.id} style={{padding:'10px 0',borderBottom:'1px solid #F0EFED'}}>
            {esEditando ? (
              <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:480}}>
                <div style={{display:'flex',gap:8}}>
                  {[['primera','Primera consulta'],['seguimiento','Otras consultas']].map(([v,l])=>(
                    <button key={v} onClick={()=>setEditForm({...editForm,tipo:v})}
                      style={{flex:1,padding:'6px',border:editForm.tipo===v?'1px solid #2B6CB0':'1px solid #e2e2e2',borderRadius:8,fontSize:12,cursor:'pointer',background:editForm.tipo===v?'#E6F1FB':'#f9f8f5',color:editForm.tipo===v?'#0C447C':'#4a4a4a'}}>{l}</button>
                  ))}
                </div>
                <input value={editForm.cliente} onChange={ev=>setEditForm({...editForm,cliente:ev.target.value})} placeholder="Cliente"
                  style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,fontFamily:'system-ui'}} />
                <div style={{display:'flex',gap:8}}>
                  <input type="date" value={editForm.fecha} onChange={ev=>setEditForm({...editForm,fecha:ev.target.value})}
                    style={{padding:'6px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,fontFamily:'system-ui'}} />
                  <select value={editForm.abogada} onChange={ev=>setEditForm({...editForm,abogada:ev.target.value})}
                    style={{padding:'6px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,fontFamily:'system-ui',flex:1}}>
                    {ABOGADAS.map(a=><option key={a}>{a}</option>)}
                  </select>
                </div>
                <input value={editForm.motivo} onChange={ev=>setEditForm({...editForm,motivo:ev.target.value})} placeholder="Motivo"
                  style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,fontFamily:'system-ui'}} />
                <textarea value={editForm.comentario||''} onChange={ev=>setEditForm({...editForm,comentario:ev.target.value})} placeholder="Paso siguiente (opcional)"
                  style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,fontFamily:'system-ui',resize:'vertical',minHeight:56}} />
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>guardarEdicion(c)} style={{...btnPrimary,padding:'6px 12px',fontSize:12}}>Guardar</button>
                  <button onClick={()=>setEditandoId(null)} style={{padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff'}}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                      <span style={{fontSize:13,fontWeight:500}}>{c.cliente}</span>
                      <Badge bg={c.tipo==='primera'?'#FAEEDA':'#EAF3DE'} color={c.tipo==='primera'?'#633806':'#27500A'}>{c.tipo==='primera'?'Primera consulta':'Otras consultas'}</Badge>
                    </div>
                    <div style={{display:'flex',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                      <span style={{fontSize:11,color:'#8a8a8a'}}>{formatFecha(c.fecha)}</span>
                      <Badge bg={socioColor(c.abogada).bg} color={socioColor(c.abogada).color}>{c.abogada}</Badge>
                    </div>
                    <div style={{fontSize:12,fontWeight:500,marginBottom:2}}>{c.motivo}</div>
                    {c.comentario && <div style={{fontSize:11,color:'#4a4a4a',fontStyle:'italic',lineHeight:1.5}}>{c.comentario}</div>}
                  </div>
                  <div style={{display:'flex',gap:10,flexShrink:0,marginLeft:12}}>
                    <button onClick={()=>{setEditandoId(c.id);setEditForm({cliente:c.cliente,tipo:c.tipo,fecha:c.fecha,abogada:c.abogada,motivo:c.motivo,comentario:c.comentario||''}); }}
                      style={{fontSize:11,color:'#2B6CB0',background:'none',border:'none',cursor:'pointer'}}>editar</button>
                    <button onClick={()=>eliminarConsulta(c)}
                      style={{fontSize:11,color:'#A32D2D',background:'none',border:'none',cursor:'pointer'}}>eliminar</button>
                  </div>
                </div>
              </div>
            )}
          </div>;
        }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:30}}>Sin consultas todavía.</div>}
      </Card>
    </div>
  );
}

function VerConsultas({ consultas, recargar }) {
  const [q, setQ] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const lista = consultas.filter(c=>!q
    ||(c.cliente||'').toLowerCase().includes(q.toLowerCase())
    ||(c.motivo||'').toLowerCase().includes(q.toLowerCase())
    ||(c.abogada||'').toLowerCase().includes(q.toLowerCase())
  );

  async function eliminarConsulta(c) {
    if (!confirm(`¿Eliminar la consulta de ${c.cliente}?`)) return;
    await supabase.from('consultas').delete().eq('id', c.id);
    recargar();
  }
  async function guardarEdicion(c) {
    await supabase.from('consultas').update({
      cliente: editForm.cliente, tipo: editForm.tipo, fecha: editForm.fecha,
      abogada: editForm.abogada, motivo: editForm.motivo, comentario: editForm.comentario||null,
      valor_consulta: editForm.tipo==='primera' && editForm.valor_consulta ? Number(editForm.valor_consulta) : null,
      notas_consulta: editForm.notas_consulta||null
    }).eq('id', c.id);
    setEditandoId(null);
    recargar();
  }

  return (
    <Card title="📋 Consultas">
      <input style={inputStyle} placeholder="Buscar cliente, motivo o abogada..." value={q} onChange={e=>setQ(e.target.value)} />
      {lista.length ? lista.map(c=>{
        const esEditando = editandoId===c.id;
        return <div key={c.id} style={{padding:'12px 0',borderBottom:'1px solid #F0EFED'}}>
          {esEditando ? (
            <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:480}}>
              <div style={{display:'flex',gap:8}}>
                {[['primera','Primera consulta'],['seguimiento','Otras consultas']].map(([v,l])=>(
                  <button key={v} onClick={()=>setEditForm({...editForm,tipo:v})}
                    style={{flex:1,padding:'6px',border:editForm.tipo===v?'1px solid #2B6CB0':'1px solid #e2e2e2',borderRadius:8,fontSize:12,cursor:'pointer',background:editForm.tipo===v?'#E6F1FB':'#f9f8f5',color:editForm.tipo===v?'#0C447C':'#4a4a4a'}}>{l}</button>
                ))}
              </div>
              <input value={editForm.cliente} onChange={ev=>setEditForm({...editForm,cliente:ev.target.value})} placeholder="Cliente"
                style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,fontFamily:'system-ui'}} />
              <div style={{display:'flex',gap:8}}>
                <input type="date" value={editForm.fecha} onChange={ev=>setEditForm({...editForm,fecha:ev.target.value})}
                  style={{padding:'6px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,fontFamily:'system-ui'}} />
                <select value={editForm.abogada} onChange={ev=>setEditForm({...editForm,abogada:ev.target.value})}
                  style={{padding:'6px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,fontFamily:'system-ui',flex:1}}>
                  {ABOGADAS.map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
              <input value={editForm.motivo} onChange={ev=>setEditForm({...editForm,motivo:ev.target.value})} placeholder="Motivo"
                style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,fontFamily:'system-ui'}} />
              <textarea value={editForm.comentario||''} onChange={ev=>setEditForm({...editForm,comentario:ev.target.value})} placeholder="Paso siguiente (opcional)"
                style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,fontFamily:'system-ui',resize:'vertical',minHeight:48}} />
              {editForm.tipo==='primera'&&(
                <input type="number" value={editForm.valor_consulta||''} onChange={ev=>setEditForm({...editForm,valor_consulta:ev.target.value})} placeholder="Valor de la consulta ($)"
                  style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,fontFamily:'system-ui'}} />
              )}
              <textarea value={editForm.notas_consulta||''} onChange={ev=>setEditForm({...editForm,notas_consulta:ev.target.value})} placeholder="Notas de la consulta"
                style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,fontFamily:'system-ui',resize:'vertical',minHeight:48}} />
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>guardarEdicion(c)} style={{...btnPrimary,padding:'6px 12px',fontSize:12}}>Guardar</button>
                <button onClick={()=>setEditandoId(null)} style={{padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff'}}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3,flexWrap:'wrap'}}>
                    <span style={{fontSize:13,fontWeight:500}}>{c.cliente}</span>
                    <Badge bg={c.tipo==='primera'?'#FAEEDA':'#EAF3DE'} color={c.tipo==='primera'?'#633806':'#27500A'}>{c.tipo==='primera'?'Primera consulta':'Otras consultas'}</Badge>
                    {c.valor_consulta&&<Badge bg="#E6F1FB" color="#0C447C">{fmtMoneda(c.valor_consulta)}</Badge>}
                  </div>
                  <div style={{display:'flex',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                    <span style={{fontSize:11,color:'#8a8a8a'}}>{formatFecha(c.fecha)}</span>
                    <Badge bg={socioColor(c.abogada).bg} color={socioColor(c.abogada).color}>{c.abogada}</Badge>
                  </div>
                  <div style={{fontSize:12,fontWeight:500,marginBottom:2}}>{c.motivo}</div>
                  {c.comentario&&<div style={{fontSize:11,color:'#4a4a4a',fontStyle:'italic',lineHeight:1.5,marginBottom:3}}>{c.comentario}</div>}
                  {c.notas_consulta&&<div style={{fontSize:11,color:'#4a4a4a',background:'#F7F6F3',borderRadius:6,padding:'5px 8px',marginTop:4}}>{c.notas_consulta}</div>}
                </div>
                <div style={{display:'flex',gap:10,flexShrink:0,marginLeft:12}}>
                  <button onClick={()=>{setEditandoId(c.id);setEditForm({cliente:c.cliente,tipo:c.tipo,fecha:c.fecha,abogada:c.abogada,motivo:c.motivo,comentario:c.comentario||'',valor_consulta:c.valor_consulta||'',notas_consulta:c.notas_consulta||''});}}
                    style={{fontSize:11,color:'#2B6CB0',background:'none',border:'none',cursor:'pointer'}}>editar</button>
                  <button onClick={()=>eliminarConsulta(c)}
                    style={{fontSize:11,color:'#A32D2D',background:'none',border:'none',cursor:'pointer'}}>eliminar</button>
                </div>
              </div>
            </div>
          )}
        </div>;
      }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:30}}>Sin consultas todavía.</div>}
    </Card>
  );
}

function NuevaConsulta({ perfil, recargar, clientes }) {
  const [f, setF] = useState({ tipo:'primera', fecha:HOY, abogada:'', motivo:'', comentario:'', valor_consulta:'', notas_consulta:'' });
  const [clienteQ, setClienteQ] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteAbierto, setClienteAbierto] = useState(false);
  const [clienteDni, setClienteDni] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteDomicilio, setClienteDomicilio] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [estadoPago, setEstadoPago] = useState('pendiente');
  useEffect(()=>{ if(perfil?.nombre) setF(prev=>({...prev, abogada: prev.abogada||perfil.nombre})); }, [perfil]);
  const set = (k,v)=>setF({...f,[k]:v});

  const sugsCliente = !clienteId && clienteQ
    ? (clientes||[]).filter(cl=>(nombreCompleto(cl)||'').toLowerCase().includes(clienteQ.toLowerCase())||(cl.dni||'').includes(clienteQ)).slice(0,8)
    : [];

  function seleccionarCliente(cl) {
    setClienteId(cl.id); setClienteNombre(nombreCompleto(cl)); setClienteQ(''); setClienteAbierto(false);
    setClienteDni(cl.dni||''); setClienteTelefono(cl.telefono||''); setClienteDomicilio(cl.domicilio||''); setClienteEmail(cl.email||'');
  }

  async function guardar() {
    const nombreFinal = clienteId ? clienteNombre : clienteQ;
    if (!nombreFinal||!f.fecha||!f.abogada||!f.motivo) { alert('Completá los obligatorios (*)'); return; }
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    let resolvedId = clienteId;
    if (!clienteId && clienteQ) {
      const { data: nc, error: ce } = await supabase.from('clientes').insert({
        nombre: clienteQ, dni: clienteDni||null, telefono: clienteTelefono||null,
        domicilio: clienteDomicilio||null, email: clienteEmail||null,
        notas_primer_consulta: f.tipo==='primera' ? (f.notas_consulta||null) : null,
        estudio_id: perfil.estudio_id
      }).select('id').single();
      if (ce) { alert('Error al crear cliente: '+ce.message); return; }
      resolvedId = nc.id;
    } else if (clienteId) {
      const upd = { dni: clienteDni||null, telefono: clienteTelefono||null, domicilio: clienteDomicilio||null, email: clienteEmail||null };
      if (f.tipo==='primera' && f.notas_consulta) upd.notas_primer_consulta = f.notas_consulta;
      await supabase.from('clientes').update(upd).eq('id', clienteId);
    }
    const { error } = await supabase.from('consultas').insert({
      tipo: f.tipo, cliente: nombreFinal, cliente_id: resolvedId||null,
      fecha: f.fecha, abogada: f.abogada, motivo: f.motivo,
      comentario: f.comentario||null,
      valor_consulta: f.tipo==='primera' && f.valor_consulta ? Number(f.valor_consulta) : null,
      notas_consulta: f.notas_consulta||null,
      estudio_id: perfil.estudio_id
    });
    if (error) { alert('Error: '+error.message); return; }
    let honOk = true;
    if (f.tipo==='primera' && f.valor_consulta && Number(f.valor_consulta) > 0) {
      const periodo = f.fecha ? f.fecha.substring(0, 7) : HOY.substring(0, 7);
      const { error: honError } = await supabase.from('honorarios').insert({
        concepto: `Consulta - ${nombreFinal}`,
        tipo_trabajo: 'consulta',
        forma: 'fijo',
        valor: Number(f.valor_consulta),
        cliente_id: resolvedId || null,
        vinculo_tipo: resolvedId ? 'cliente' : null,
        estado: estadoPago,
        en_cuotas: false,
        fecha: f.fecha,
        periodo,
        estudio_id: perfil.estudio_id,
      });
      if (honError) honOk = false;
    }
    setMsg(honOk
      ? `Consulta de ${nombreFinal} guardada.`
      : `Consulta de ${nombreFinal} guardada. No se pudo crear el honorario automáticamente. Podés cargarlo manualmente.`);
    setF({ tipo:'primera', fecha:HOY, abogada:f.abogada, motivo:'', comentario:'', valor_consulta:'', notas_consulta:'' });
    setClienteQ(''); setClienteId(''); setClienteNombre('');
    setClienteDni(''); setClienteTelefono(''); setClienteDomicilio(''); setClienteEmail('');
    setEstadoPago('pendiente');
    recargar();
    setTimeout(()=>setMsg(''), honOk ? 3000 : 6000);
  }

  return (
    <Card title="💬 Registrar consulta">
      {msg && <div style={{background:'#EAF3DE',border:'1px solid #C0DD97',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#27500A',marginBottom:14}}>✓ {msg}</div>}
      <div style={{display:'flex',gap:24,alignItems:'flex-start',flexWrap:'wrap'}}>
        {/* Columna izquierda: formulario */}
        <div style={{flex:'1 1 380px',maxWidth:520}}>
          <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Tipo *</label>
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            {[['primera','Primera consulta'],['seguimiento','Otras consultas']].map(([v,l])=>(
              <button key={v} onClick={()=>{ set('tipo',v); if(v!=='primera') setEstadoPago('pendiente'); }} style={{flex:1,padding:9,border:f.tipo===v?'1px solid #2B6CB0':'1px solid #e2e2e2',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',background:f.tipo===v?'#E6F1FB':'#f9f8f5',color:f.tipo===v?'#0C447C':'#4a4a4a'}}>{l}</button>
            ))}
          </div>
          <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Cliente *</label>
          <div style={{position:'relative'}}>
            <input style={{...inputStyle,marginBottom:0}}
              placeholder="Nombre del cliente..."
              value={clienteId ? clienteNombre : clienteQ}
              onChange={ev=>{setClienteQ(ev.target.value);setClienteId('');setClienteNombre('');setClienteAbierto(true);setClienteDni('');setClienteTelefono('');setClienteDomicilio('');setClienteEmail('');}}
              onFocus={()=>setClienteAbierto(true)}
              onBlur={()=>setTimeout(()=>setClienteAbierto(false),150)}
            />
            {clienteAbierto&&sugsCliente.length>0&&(
              <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1px solid #DDDCDA',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:10,maxHeight:200,overflowY:'auto',marginTop:2}}>
                {sugsCliente.map(cl=>(
                  <div key={cl.id} onMouseDown={e=>e.preventDefault()} onClick={()=>seleccionarCliente(cl)}
                    style={{padding:'9px 12px',cursor:'pointer',fontSize:13,borderBottom:'1px solid #F0EFED',color:'#1a1a1a'}}>
                    {nombreCompleto(cl)}{cl.dni&&<span style={{fontSize:11,color:'#8a8a8a',marginLeft:6}}>DNI {cl.dni}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {clienteId && <div style={{fontSize:11,color:'#27500A',marginTop:4,marginBottom:8}}>✓ Cliente existente</div>}
          {!clienteId && clienteQ && <div style={{fontSize:11,color:'#8a8a8a',marginTop:4,marginBottom:8}}>Se creará como cliente nuevo al guardar</div>}
          {!clienteId && !clienteQ && <div style={{marginBottom:8}}/>}
          {f.tipo==='primera'&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
              {[['DNI',clienteDni,setClienteDni],['Teléfono',clienteTelefono,setClienteTelefono],['Domicilio',clienteDomicilio,setClienteDomicilio],['Email',clienteEmail,setClienteEmail]].map(([label,val,setter])=>(
                <div key={label}>
                  <label style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:3}}>{label}</label>
                  <input style={{...inputStyle,marginBottom:0,fontSize:12}} value={val} onChange={e=>setter(e.target.value)} />
                </div>
              ))}
            </div>
          )}
          <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Fecha *</label>
          <input type="date" style={inputStyle} value={f.fecha} onChange={e=>set('fecha',e.target.value)} />
          <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Abogada/o *</label>
          <select style={inputStyle} value={f.abogada} onChange={e=>set('abogada',e.target.value)}>
            <option value="">Seleccioná</option>{ABOGADAS.map(a=><option key={a}>{a}</option>)}
          </select>
          <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Motivo *</label>
          <input style={inputStyle} placeholder="Ej: Alimentos, sucesión, despido..." value={f.motivo} onChange={e=>set('motivo',e.target.value)} />
          {f.tipo==='primera'&&(
            <>
              <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Valor de la consulta ($)</label>
              <input type="number" style={inputStyle} placeholder="Ej: 20000" value={f.valor_consulta} onChange={e=>set('valor_consulta',e.target.value)} />
              {f.valor_consulta && f.valor_consulta.toString().trim() !== '' && f.valor_consulta.toString().trim() !== '0' && (
                <>
                  <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Estado de pago</label>
                  <div style={{display:'flex',gap:8,marginBottom:12}}>
                    {[['pendiente','Pendiente de cobro'],['pagado','Ya está pagado']].map(([v,l])=>(
                      <button key={v} type="button" onClick={()=>setEstadoPago(v)}
                        style={{flex:1,padding:9,border:estadoPago===v?'1px solid #2B6CB0':'1px solid #e2e2e2',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',
                          background:estadoPago===v?'#E6F1FB':'#f9f8f5',color:estadoPago===v?'#0C447C':'#4a4a4a',fontFamily:'system-ui'}}>{l}</button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Paso siguiente</label>
          <textarea style={{...inputStyle,minHeight:72,resize:'vertical'}} placeholder="Ej: Llamar la semana que viene, enviar presupuesto..." value={f.comentario} onChange={e=>set('comentario',e.target.value)} />
          <button onClick={guardar} style={btnPrimary}>Guardar consulta</button>
        </div>
        {/* Columna derecha: bloc de notas */}
        <div style={{flex:'1 1 300px',display:'flex',flexDirection:'column',alignSelf:'stretch',minHeight:500}}>
          <div style={{fontSize:13,fontWeight:600,color:'#1A1A1A',marginBottom:10}}>📝 Notas de la consulta</div>
          <textarea
            style={{flex:1,width:'100%',minHeight:500,padding:'14px 16px',border:'1px solid #EBEBEA',borderRadius:10,
              fontSize:13,fontFamily:'system-ui',lineHeight:1.7,color:'#1A1A1A',background:'#fff',
              resize:'vertical',outline:'none',boxSizing:'border-box'}}
            placeholder="Tomá notas durante la consulta..."
            value={f.notas_consulta}
            onChange={e=>set('notas_consulta',e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
}

const ESTADOS_TAREA = ['pendiente','en proceso','terminado'];
const ESTADO_COLOR = {
  'pendiente': { bg:'#FAEEDA', color:'#633806' },
  'en proceso': { bg:'#E6F1FB', color:'#0C447C' },
  'terminado': { bg:'#EAF3DE', color:'#27500A' }
};
// compatibilidad con tareas viejas que tenían 'completada'
function normEstado(e) { return e==='completada' ? 'terminado' : (e||'pendiente'); }

function SocioChips({ value, onChange }) {
  const sel = (value||'').split(',').map(s=>s.trim()).filter(Boolean);
  function toggle(nombre) {
    const s = new Set(sel);
    if (s.has(nombre)) s.delete(nombre); else s.add(nombre);
    onChange([...s].join(', '));
  }
  return (
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
      {ABOGADAS.map(a=>{
        const active = sel.includes(a);
        const col = socioColor(a);
        return <button key={a} type="button" onClick={()=>toggle(a)}
          style={{padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'system-ui',
            border:active?`1.5px solid ${col.color}`:'1.5px solid #e2e2e2',
            background:active?col.bg:'#fff',
            color:active?col.color:'#8a8a8a'}}>
          {a}
        </button>;
      })}
    </div>
  );
}

function Tareas({ tareas, recargar, expedientes, clientes }) {
  const [filtro, setFiltro] = useState('activas');
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [comentarioId, setComentarioId] = useState(null);
  const [nuevoComentario, setNuevoComentario] = useState('');

  async function cambiarEstado(t, nuevo) {
    await supabase.from('tareas').update({ estado: nuevo }).eq('id', t.id);
    recargar();
  }
  async function eliminarTarea(t) {
    if (!confirm(`¿Eliminar la tarea "${t.descripcion}"?`)) return;
    await supabase.from('tareas').delete().eq('id', t.id);
    recargar();
  }
  async function guardarEdicion(t) {
    await supabase.from('tareas').update({ descripcion: editForm.descripcion, responsable: editForm.responsable, deadline: editForm.deadline||null }).eq('id', t.id);
    setEditandoId(null);
    recargar();
  }
  async function agregarComentario(t) {
    if (!nuevoComentario.trim()) return;
    const actual = t.comentario ? t.comentario + '\n' + nuevoComentario.trim() : nuevoComentario.trim();
    await supabase.from('tareas').update({ comentario: actual }).eq('id', t.id);
    setNuevoComentario('');
    setComentarioId(null);
    recargar();
  }
  const lista = tareas
    .map(t=>({...t, estado: normEstado(t.estado)}))
    .filter(t=> filtro==='todas' ? true : (filtro==='activas' ? t.estado!=='terminado' : t.estado===filtro))
    .sort((a,b)=>{
      const orden = { 'pendiente':0, 'en proceso':1, 'terminado':2 };
      if(orden[a.estado]!==orden[b.estado]) return orden[a.estado]-orden[b.estado];
      if(!a.deadline&&!b.deadline) return 0; if(!a.deadline) return 1; if(!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    });
  return (
    <Card title="✅ Tareas">
      <select style={{...inputStyle,width:'auto'}} value={filtro} onChange={e=>setFiltro(e.target.value)}>
        <option value="activas">Activas (pendiente + en proceso)</option>
        <option value="pendiente">Solo pendientes</option>
        <option value="en proceso">Solo en proceso</option>
        <option value="terminado">Solo terminadas</option>
        <option value="todas">Todas</option>
      </select>
      {lista.length ? lista.map(t=>{
        const done = t.estado==='terminado';
        const esEditando = editandoId===t.id;
        const verComentario = comentarioId===t.id;
        const expVinc = t.expediente_id ? expedientes.find(e=>e.id===t.expediente_id) : null;
        const cliVinc = t.cliente_id ? clientes.find(c=>c.id===t.cliente_id) : null;
        return <div key={t.id} style={{padding:'12px 0',borderBottom:'1px solid #F0EFED'}}>
          {esEditando ? (
            <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:480}}>
              <input value={editForm.descripcion} onChange={ev=>setEditForm({...editForm,descripcion:ev.target.value})}
                style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,fontFamily:'system-ui'}} />
              <SocioChips value={editForm.responsable} onChange={v=>setEditForm({...editForm,responsable:v})} />
              <input type="date" value={editForm.deadline||''} onChange={ev=>setEditForm({...editForm,deadline:ev.target.value})}
                style={{padding:'6px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,fontFamily:'system-ui'}} />
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>guardarEdicion(t)} style={{...btnPrimary,padding:'6px 12px',fontSize:12}}>Guardar</button>
                <button onClick={()=>setEditandoId(null)} style={{padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff'}}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,textDecoration:done?'line-through':'none',color:done?'#8a8a8a':'#1a1a1a',marginBottom:2}}>{t.descripcion}</div>
                {(expVinc||cliVinc) && <div style={{fontSize:11,color:'#8a8a8a',marginBottom:4}}>{expVinc?'📁':'👤'} {expVinc?expVinc.caratula:nombreCompleto(cliVinc)}</div>}
                <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
                  {(t.responsable||'').split(',').map(s=>s.trim()).filter(Boolean).map(r=>(
                    <Badge key={r} bg={socioColor(r).bg} color={socioColor(r).color}>{r}</Badge>
                  ))}
                  {t.deadline && <Badge bg="#FAEEDA" color="#633806">{formatFecha(t.deadline)}</Badge>}
                </div>
                {t.comentario && <div style={{fontSize:11,color:'#4a4a4a',marginTop:5,fontStyle:'italic',whiteSpace:'pre-wrap'}}>{t.comentario}</div>}
                <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap',alignItems:'center'}}>
                  {ESTADOS_TAREA.map(es=>{
                    const sel = t.estado===es;
                    const col = ESTADO_COLOR[es];
                    return <button key={es} onClick={()=>cambiarEstado(t,es)}
                      style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',
                      border:sel?`1px solid ${col.color}`:'1px solid #e2e2e2',
                      background:sel?col.bg:'#fff',color:sel?col.color:'#8a8a8a',fontFamily:'system-ui'}}>
                      {es.charAt(0).toUpperCase()+es.slice(1)}
                    </button>;
                  })}
                  <button onClick={()=>{setEditandoId(t.id);setEditForm({descripcion:t.descripcion,responsable:t.responsable,deadline:t.deadline||''});}}
                    style={{fontSize:11,color:'#2B6CB0',background:'none',border:'none',cursor:'pointer',marginLeft:4}}>editar</button>
                  <button onClick={()=>setComentarioId(verComentario?null:t.id)}
                    style={{fontSize:11,color:'#2B6CB0',background:'none',border:'none',cursor:'pointer'}}>+ comentario</button>
                  <button onClick={()=>eliminarTarea(t)}
                    style={{fontSize:11,color:'#A32D2D',background:'none',border:'none',cursor:'pointer'}}>eliminar</button>
                </div>
                {verComentario && (
                  <div style={{marginTop:8,display:'flex',gap:8,alignItems:'flex-start'}}>
                    <textarea value={nuevoComentario} onChange={ev=>setNuevoComentario(ev.target.value)}
                      placeholder="Escribí un comentario..."
                      style={{flex:1,padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,fontFamily:'system-ui',resize:'vertical',minHeight:56}} />
                    <button onClick={()=>agregarComentario(t)} style={{...btnPrimary,padding:'6px 12px',fontSize:12}}>Agregar</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>;
      }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:30}}>Sin tareas.</div>}
    </Card>
  );
}

function Vencimientos({ expedientes, recargar }) {
  const hoy = new Date();
  const [mesVista, setMesVista] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

  const conVenc = expedientes.filter(e => e.proximo_vencimiento);
  const ordenados = [...conVenc].sort((a, b) => a.proximo_vencimiento.localeCompare(b.proximo_vencimiento));

  const año = mesVista.getFullYear();
  const mes = mesVista.getMonth();
  const primerDia = new Date(año, mes, 1).getDay();
  const diasEnMes = new Date(año, mes + 1, 0).getDate();
  const celdas = [];
  for (let i = 0; i < (primerDia === 0 ? 6 : primerDia - 1); i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  const nombresMes = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const diasSem = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

  function vencimientosDelDia(dia) {
    const fecha = `${año}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    return conVenc.filter(e => e.proximo_vencimiento === fecha);
  }

  function esHoy(dia) {
    return hoy.getFullYear() === año && hoy.getMonth() === mes && hoy.getDate() === dia;
  }

  const mesAnterior = () => setMesVista(new Date(año, mes - 1, 1));
  const mesSiguiente = () => setMesVista(new Date(año, mes + 1, 1));

  return (
    <div>
      <Card title="📅 Vencimientos">

        {/* CALENDARIO */}
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <button onClick={mesAnterior} style={{background:'none',border:'1px solid #DDDCDA',borderRadius:8,padding:'4px 10px',cursor:'pointer',fontSize:14,color:'#4a4a4a'}}>‹</button>
            <span style={{fontWeight:600,fontSize:15,color:'#2c2c2c'}}>{nombresMes[mes]} {año}</span>
            <button onClick={mesSiguiente} style={{background:'none',border:'1px solid #DDDCDA',borderRadius:8,padding:'4px 10px',cursor:'pointer',fontSize:14,color:'#4a4a4a'}}>›</button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:3}}>
            {diasSem.map(d => (
              <div key={d} style={{textAlign:'center',fontSize:11,fontWeight:600,color:'#8a8a8a',padding:'4px 0',letterSpacing:'0.03em'}}>{d}</div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
            {celdas.map((dia, i) => {
              if (!dia) return <div key={`e-${i}`} />;
              const vencs = vencimientosDelDia(dia);
              const hoyFlag = esHoy(dia);
              const hayVenc = vencs.length > 0;
              const colorDia = hayVenc ? vencColor(vencs[0].proximo_vencimiento) : null;
              return (
                <div key={dia} style={{
                  minHeight:52,
                  borderRadius:8,
                  padding:'5px 5px 4px',
                  background: hoyFlag ? '#EBF2FA' : hayVenc ? '#FEF9F0' : '#F7F6F3',
                  border: hoyFlag ? '1.5px solid #2B6CB0' : hayVenc ? `1.5px solid ${colorDia.color}` : '1.5px solid transparent',
                  position:'relative'
                }}>
                  <div style={{fontSize:12,fontWeight:hoyFlag?700:400,color:hoyFlag?'#2B6CB0':'#4a4a4a',marginBottom:2}}>{dia}</div>
                  {vencs.map((e, vi) => (
                    <div key={vi} style={{
                      fontSize:10,
                      color: vencColor(e.proximo_vencimiento).color,
                      fontWeight:600,
                      lineHeight:1.3,
                      overflow:'hidden',
                      textOverflow:'ellipsis',
                      whiteSpace:'nowrap',
                      maxWidth:'100%'
                    }} title={e.caratula}>
                      • {e.caratula?.split(' ')[0]}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Clientes({ clientes, setVista, setCliActual, expedientes }) {
  const [q, setQ] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  const lista = clientes.filter(cl=>!q||(nombreCompleto(cl)||'').toLowerCase().includes(q.toLowerCase())||(cl.dni||'').includes(q));
  return (
    <div>
      <Card title="👥 Clientes">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <input style={{...inputStyle,marginBottom:0,flex:1,maxWidth:320}} placeholder="Buscar cliente..." value={q} onChange={e=>setQ(e.target.value)} />
          <button onClick={()=>setVista('nuevo-cliente')} style={{...btnPrimary,marginLeft:10,flexShrink:0}}>+ Nuevo cliente</button>
        </div>
        {lista.length ? (
          <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr style={{background:'#F7F6F3'}}>{['Nombre','DNI','Teléfono','Responsable','Expedientes activos'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 10px',fontSize:11,color:'#6B7280',borderBottom:'1px solid #EBEBEA',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>)}</tr></thead>
            <tbody>
              {lista.map(cl=>{
                const exps = expedientes.filter(e=>e.cliente_id===cl.id && e.estado!=='archivado');
                return <tr key={cl.id} style={{cursor:'pointer',background:hoveredRow===cl.id?'#F7F6F3':'transparent'}}
                  onMouseEnter={()=>setHoveredRow(cl.id)} onMouseLeave={()=>setHoveredRow(null)}
                  onClick={()=>{setCliActual(cl);setVista('detalle-cliente');}}>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontWeight:500}}>{nombreCompleto(cl)}</td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontSize:12,color:'#6B7280'}}>{cl.dni||'—'}</td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontSize:12}}>{cl.telefono||'—'}</td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}>{cl.responsable?<Badge bg={socioColor(cl.responsable).bg} color={socioColor(cl.responsable).color}>{cl.responsable}</Badge>:<span style={{fontSize:12,color:'#6B7280'}}>—</span>}</td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}><Badge bg="#EAF3DE" color="#27500A">{exps.length}</Badge></td>
                </tr>;
              })}
            </tbody>
          </table>
          </div>
        ) : <div style={{color:'#6B7280',fontSize:13,textAlign:'center',padding:30}}>Sin clientes todavía. Cargá el primero con "Nuevo cliente".</div>}
      </Card>
    </div>
  );
}

function DetalleCliente({ cliActual, setCliActual, expedientes, consultas, setVista, setExpActual, recargar }) {
  const cl = cliActual;
  const [editando, setEditando] = useState(false);
  const [f, setF] = useState(cl);
  const [editandoNotasPrimer, setEditandoNotasPrimer] = useState(false);
  const [notasPrimerEdit, setNotasPrimerEdit] = useState('');
  if (!cl) return null;
  const exps = expedientes.filter(e=>e.cliente_id===cl.id);
  const histConsultas = (consultas||[]).filter(c=>c.cliente_id===cl.id).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  function fmtDMY(f) {
    if (!f) return '';
    const p = f.split('-');
    if (p.length!==3) return f;
    return `${p[2]}/${p[1]}/${p[0]}`;
  }
  async function guardarDatos() {
    const nombreCombinado = (f.apellido+' '+f.nombre_pila).trim();
    await supabase.from('clientes').update({ apellido:f.apellido, nombre_pila:f.nombre_pila, nombre:nombreCombinado||f.nombre, dni:f.dni, telefono:f.telefono, email:f.email, domicilio:f.domicilio, notas:f.notas, responsable:f.responsable }).eq('id', cl.id);
    setCliActual({...f, nombre:nombreCombinado||f.nombre}); setEditando(false); recargar();
  }
  async function eliminarCliente() {
    if (!confirm(`¿Seguro que querés eliminar a ${nombreCompleto(cl)}? Esta acción no se puede deshacer.`)) return;
    await supabase.from('clientes').delete().eq('id', cl.id);
    recargar();
    setVista('clientes');
  }
  async function guardarNotasPrimer() {
    await supabase.from('clientes').update({ notas_primer_consulta: notasPrimerEdit||null }).eq('id', cl.id);
    setCliActual({...cl, notas_primer_consulta: notasPrimerEdit});
    setEditandoNotasPrimer(false);
    recargar();
  }
  return (
    <div>
      <button onClick={()=>setVista('clientes')} style={{padding:'7px 13px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',marginBottom:12}}>← Volver a clientes</button>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div style={{fontSize:18,fontWeight:600,marginBottom:4}}>{nombreCompleto(cl)}</div>
          <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{setF(cl);setEditando(!editando);}} style={{padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff'}}>{editando?'Cancelar':'Editar datos'}</button>
              {!editando && <button onClick={eliminarCliente} style={{padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',color:'#A32D2D'}}>Eliminar</button>}
            </div>
        </div>
        {!editando ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'8px 24px',marginTop:10,fontSize:13}}>
            <div><span style={{color:'#8a8a8a',fontSize:11}}>DNI</span><br/>{cl.dni||'—'}</div>
            <div><span style={{color:'#8a8a8a',fontSize:11}}>Teléfono</span><br/>{cl.telefono||'—'}</div>
            <div><span style={{color:'#8a8a8a',fontSize:11}}>Email</span><br/>{cl.email||'—'}</div>
            <div><span style={{color:'#8a8a8a',fontSize:11}}>Domicilio</span><br/>{cl.domicilio||'—'}</div>
            <div><span style={{color:'#8a8a8a',fontSize:11}}>Quién lo lleva</span><br/>{cl.responsable||'—'}</div>
            {cl.notas && <div style={{gridColumn:'1/3'}}><span style={{color:'#8a8a8a',fontSize:11}}>Notas</span><br/>{cl.notas}</div>}
          </div>
        ) : (
          <div style={{marginTop:12,maxWidth:520}}>
            <div><label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Apellido</label>
              <input style={{...inputStyle,textTransform:'uppercase'}} value={f.apellido||''} onChange={e=>setF({...f,apellido:e.target.value.toUpperCase()})} /></div>
            <div><label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Nombre</label>
              <input style={{...inputStyle,textTransform:'uppercase'}} value={f.nombre_pila||''} onChange={e=>setF({...f,nombre_pila:e.target.value.toUpperCase()})} /></div>
            {[['dni','DNI'],['telefono','Teléfono'],['email','Email'],['domicilio','Domicilio']].map(([k,l])=>(
              <div key={k}><label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>{l}</label>
              <input style={inputStyle} value={f[k]||''} onChange={e=>setF({...f,[k]:e.target.value})} /></div>
            ))}
            <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Quién lo lleva</label>
            <select style={inputStyle} value={f.responsable||''} onChange={e=>setF({...f,responsable:e.target.value})}>
              <option value="">Seleccioná</option>
              {ABOGADAS.map(a=><option key={a}>{a}</option>)}
            </select>
            <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Notas</label>
            <textarea style={{...inputStyle,minHeight:56,resize:'vertical'}} value={f.notas||''} onChange={e=>setF({...f,notas:e.target.value})} />
            <button onClick={guardarDatos} style={btnPrimary}>Guardar cambios</button>
          </div>
        )}
      </Card>
      <Card title="📝 Notas de primera consulta">
        {editandoNotasPrimer ? (
          <div>
            <textarea style={{...inputStyle,minHeight:80,resize:'vertical'}} value={notasPrimerEdit} onChange={e=>setNotasPrimerEdit(e.target.value)} placeholder="Observaciones de la primera consulta..." />
            <div style={{display:'flex',gap:8}}>
              <button onClick={guardarNotasPrimer} style={{...btnPrimary,padding:'6px 12px',fontSize:12}}>Guardar</button>
              <button onClick={()=>setEditandoNotasPrimer(false)} style={{padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff'}}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div>
            {cl.notas_primer_consulta
              ? <div style={{fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap',marginBottom:10,color:'#1a1a1a'}}>{cl.notas_primer_consulta}</div>
              : <div style={{color:'#8a8a8a',fontSize:13,marginBottom:10}}>Sin notas de primera consulta.</div>
            }
            <button onClick={()=>{setNotasPrimerEdit(cl.notas_primer_consulta||'');setEditandoNotasPrimer(true);}}
              style={{fontSize:12,color:'#2B6CB0',background:'none',border:'none',cursor:'pointer',padding:0}}>Editar notas</button>
          </div>
        )}
      </Card>
      <Card title="📋 Historial de consultas">
        {histConsultas.length === 0
          ? <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:12}}>Sin consultas registradas.</div>
          : histConsultas.map(c=>(
            <div key={c.id} style={{padding:'12px 0',borderBottom:'1px solid #F0EFED'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                <span style={{fontSize:12,color:'#8a8a8a',fontWeight:500}}>{fmtDMY(c.fecha)}</span>
                <Badge bg={c.tipo==='primera'?'#F0E6ED':'#EAF1FB'} color={c.tipo==='primera'?'#7A2D4E':'#1a4e80'}>{c.tipo==='primera'?'Primera consulta':'Otras consultas'}</Badge>
                {c.abogada && <Badge bg={socioColor(c.abogada).bg} color={socioColor(c.abogada).color}>{c.abogada}</Badge>}
              </div>
              {c.motivo && <div style={{fontSize:13,color:'#1a1a1a',marginBottom:4}}>{c.motivo}</div>}
              {c.comentario && (
                <div style={{fontSize:12,color:'#555',marginBottom:4}}>
                  <span style={{fontWeight:500,color:'#8a8a8a'}}>Paso siguiente: </span>{c.comentario}
                </div>
              )}
              {c.notas_consulta && (
                <div style={{fontSize:12,color:'#555',whiteSpace:'pre-wrap',marginTop:4,paddingTop:6,borderTop:'1px solid #F0EFED'}}>
                  <span style={{fontWeight:500,color:'#8a8a8a'}}>Notas: </span>{c.notas_consulta}
                </div>
              )}
            </div>
          ))
        }
      </Card>
      <Card title={`Expedientes (${exps.length})`}>
        {exps.length ? exps.map(e=>{
          const mapa = PROCESOS[e.tipo_proceso];
          return <div key={e.id} style={{padding:'12px 0',borderBottom:'1px solid #F0EFED',cursor:'pointer'}} onClick={()=>{setExpActual(e);setVista('detalle');}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{e.caratula}</div>
                <div style={{fontSize:11,color:'#8a8a8a',marginTop:2}}>{e.numero} · {mapa?mapa.nombre:'Sin proceso'} · {e.juzgado||'—'}</div>
              </div>
              <div style={{display:'flex',gap:5,flexShrink:0}}>
                <Badge bg="#EAF3DE" color="#27500A">{e.estado}</Badge>
                <Badge bg={socioColor(e.responsable).bg} color={socioColor(e.responsable).color}>{e.responsable||'—'}</Badge>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:6}}>
              <div style={{background:'#EAF3DE',borderRadius:8,padding:'8px 10px'}}>
                <div style={{fontSize:10,color:'#27500A',fontWeight:600,marginBottom:2}}>HIPÓTESIS DE MÁXIMA</div>
                <div style={{fontSize:12,color:'#1a1a1a'}}>{e.hipotesis_maxima||<span style={{color:'#8a8a8a'}}>Sin cargar</span>}</div>
              </div>
              <div style={{background:'#FAEEDA',borderRadius:8,padding:'8px 10px'}}>
                <div style={{fontSize:10,color:'#633806',fontWeight:600,marginBottom:2}}>HIPÓTESIS DE MÍNIMA</div>
                <div style={{fontSize:12,color:'#1a1a1a'}}>{e.hipotesis_minima||<span style={{color:'#8a8a8a'}}>Sin cargar</span>}</div>
              </div>
            </div>
          </div>;
        }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:20}}>Este cliente no tiene expedientes vinculados todavía. Vinculalos desde el expediente.</div>}
      </Card>
    </div>
  );
}

function NuevoCliente({ perfil, recargar, setVista }) {
  const [f, setF] = useState({ apellido:'', nombre_pila:'', dni:'', telefono:'', email:'', domicilio:'', notas:'', responsable:'' });
  const [msg, setMsg] = useState('');
  const set = (k,v)=>setF({...f,[k]:v});
  async function guardar() {
    if (!f.apellido && !f.nombre_pila) { alert('El apellido o nombre es obligatorio'); return; }
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    const nombre = (f.apellido+' '+f.nombre_pila).trim();
    const { error } = await supabase.from('clientes').insert({ ...f, nombre, estudio_id: perfil.estudio_id });
    if (error) { alert('Error: '+error.message); return; }
    setMsg(`Cliente ${nombre} guardado.`);
    setF({ apellido:'', nombre_pila:'', dni:'', telefono:'', email:'', domicilio:'', notas:'', responsable:'' });
    recargar();
    setTimeout(()=>setMsg(''),3000);
  }
  return (
    <Card title="👤 Nuevo cliente">
      {msg && <div style={{background:'#EAF3DE',border:'1px solid #C0DD97',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#27500A',marginBottom:14}}>✓ {msg}</div>}
      <div style={{maxWidth:520}}>
        <div><label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Apellido *</label>
          <input style={{...inputStyle,textTransform:'uppercase'}} value={f.apellido} onChange={e=>set('apellido',e.target.value.toUpperCase())} /></div>
        <div><label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Nombre *</label>
          <input style={{...inputStyle,textTransform:'uppercase'}} value={f.nombre_pila} onChange={e=>set('nombre_pila',e.target.value.toUpperCase())} /></div>
        {[['dni','DNI'],['telefono','Teléfono'],['email','Email'],['domicilio','Domicilio']].map(([k,l])=>(
          <div key={k}><label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>{l}</label>
          <input style={inputStyle} value={f[k]} onChange={e=>set(k,e.target.value)} /></div>
        ))}
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Quién lo lleva</label>
        <select style={inputStyle} value={f.responsable} onChange={e=>set('responsable',e.target.value)}>
          <option value="">Seleccioná</option>
          {ABOGADAS.map(a=><option key={a}>{a}</option>)}
        </select>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Notas</label>
        <textarea style={{...inputStyle,minHeight:56,resize:'vertical'}} value={f.notas} onChange={e=>set('notas',e.target.value)} />
        <button onClick={guardar} style={btnPrimary}>Guardar cliente</button>
      </div>
    </Card>
  );
}

function fmtMoneda(n) {
  if (n === null || n === undefined || n === '') return '—';
  return '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}
function formaLabel(h, valorUhon) {
  if (h.forma === 'uhon') {
    let s = `${h.valor} UHON`;
    if (valorUhon) s += ` (${fmtMoneda(h.valor * valorUhon)})`;
    return s;
  }
  if (h.forma === 'porcentaje') {
    let s = `${h.valor}%`;
    if (h.monto_base) s += ` · ${fmtMoneda(h.valor / 100 * h.monto_base)}`;
    return s;
  }
  return fmtMoneda(h.valor);
}
const HON_ESTADO_COLOR = {
  'pendiente': { bg:'#FAEEDA', color:'#633806' },
  'en proceso': { bg:'#E6F1FB', color:'#0C447C' },
  'pagado': { bg:'#EAF3DE', color:'#27500A' }
};

function HonorariosTable({ lista, expedientes, clientes, cuotas, valorUhon, setHonActual, setVista, recargar }) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [orden, setOrden] = useState({ col: null, dir: null });
  const [panelAbierto, setPanelAbierto] = useState(null);
  const [fechaLimiteEdit, setFechaLimiteEdit] = useState('');

  function toggleOrden(col) {
    setOrden(prev => {
      if (prev.col !== col) return { col, dir: 'asc' };
      if (prev.dir === 'asc') return { col, dir: 'desc' };
      return { col: null, dir: null };
    });
  }
  function montoNum(h) {
    if (h.forma==='uhon') return (Number(h.valor)||0)*(valorUhon||0);
    if (h.forma==='porcentaje') return (Number(h.valor)||0)/100*(Number(h.monto_base)||0);
    return Number(h.valor)||0;
  }
  function resolveVinc(h) {
    const exp=expedientes.find(e=>e.id===h.expediente_id);
    const cli=clientes.find(c=>c.id===h.cliente_id);
    return h.vinculo_tipo==='contraparte'?(h.contraparte_nombre||''):(exp?exp.caratula:(cli?nombreCompleto(cli):''));
  }
  function cuotaRatio(h) {
    const ch=cuotas.filter(cu=>cu.honorario_id===h.id);
    if (!ch.length) return -1;
    return ch.filter(cu=>cu.estado==='pagada').length/ch.length;
  }

  const sorted = orden.col ? [...lista].sort((a,b)=>{
    const d = orden.dir==='asc' ? 1 : -1;
    if (orden.col==='concepto') return (a.concepto||'').localeCompare(b.concepto||'')*d;
    if (orden.col==='vinc') return resolveVinc(a).localeCompare(resolveVinc(b))*d;
    if (orden.col==='monto') return (montoNum(a)-montoNum(b))*d;
    if (orden.col==='cuotas') return (cuotaRatio(a)-cuotaRatio(b))*d;
    if (orden.col==='estado') return (a.estado||'').localeCompare(b.estado||'')*d;
    return 0;
  }) : lista;

  const COLS = [
    {key:'concepto',label:'Concepto'},{key:'vinc',label:'Vinculado a'},
    {key:'monto',label:'Monto pactado'},{key:'cuotas',label:'Cuotas'},{key:'estado',label:'Estado'},
  ];

  return (
    <div style={{overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
      <thead>
        <tr style={{background:'#F7F6F3'}}>
          {COLS.map(col=>{
            const active=orden.col===col.key;
            return <th key={col.key} onClick={()=>toggleOrden(col.key)}
              style={{textAlign:'left',padding:'10px 10px',fontSize:11,color:active?'#1a1a1a':'#6B7280',borderBottom:'1px solid #EBEBEA',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}>
              {col.label}{active?(orden.dir==='asc'?' ↑':' ↓'):''}
            </th>;
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.flatMap(h=>{
          const exp = expedientes.find(e=>e.id===h.expediente_id);
          const cli = clientes.find(c=>c.id===h.cliente_id);
          const vinc = h.vinculo_tipo==='contraparte' ? (h.contraparte_nombre||'—') : (exp?exp.caratula : (cli?nombreCompleto(cli) : '—'));
          const cuotasH = cuotas.filter(cu=>cu.honorario_id===h.id);
          const pagadas = cuotasH.filter(cu=>cu.estado==='pagada').length;
          const ec = HON_ESTADO_COLOR[h.estado] || HON_ESTADO_COLOR['pendiente'];
          const isOpen = panelAbierto === h.id;
          const ultimoPago = cuotasH.filter(cu=>cu.estado==='pagada').sort((a,b)=>(b.fecha_pago||'').localeCompare(a.fecha_pago||''))[0]?.fecha_pago;
          const rows = [
            <tr key={h.id} style={{cursor:'pointer',background:isOpen?'#F0EEE8':hoveredRow===h.id?'#F7F6F3':'transparent'}}
              onMouseEnter={()=>setHoveredRow(h.id)} onMouseLeave={()=>setHoveredRow(null)}
              onClick={()=>{if(isOpen){setPanelAbierto(null);}else{setPanelAbierto(h.id);setFechaLimiteEdit(h.fecha_limite_pago||'');}}}>
              <td style={{padding:'12px 10px',borderBottom:isOpen?'none':'1px solid #F0EFED',fontWeight:500}}>{h.concepto}</td>
              <td style={{padding:'12px 10px',borderBottom:isOpen?'none':'1px solid #F0EFED',fontSize:12,color:'#6B7280'}}>
                {vinc}
                {(!h.en_cuotas&&h.estado==='pagado'&&h.fecha_pago)&&<div style={{fontSize:11,color:'#16A34A',marginTop:2}}>pagado el {formatFecha(h.fecha_pago)}</div>}
                {(h.en_cuotas&&ultimoPago)&&<div style={{fontSize:11,color:'#16A34A',marginTop:2}}>último pago: {formatFecha(ultimoPago)}</div>}
                {(h.estado!=='pagado'&&!ultimoPago&&h.fecha_limite_pago)&&<div style={{fontSize:11,color:'#B45309',marginTop:2}}>límite {formatFecha(h.fecha_limite_pago)}</div>}
              </td>
              <td style={{padding:'12px 10px',borderBottom:isOpen?'none':'1px solid #F0EFED',fontSize:12}}>{formaLabel(h, valorUhon)}</td>
              <td style={{padding:'12px 10px',borderBottom:isOpen?'none':'1px solid #F0EFED',fontSize:12}}>
                {h.en_cuotas ? (
                  <div>
                    <span>{pagadas}/{cuotasH.length}</span>
                    {cuotasH.length > 0 && (
                      <div style={{marginTop:4,height:4,borderRadius:2,background:'#E5E7EB',minWidth:44}}>
                        <div style={{height:'100%',borderRadius:2,background:'#16A34A',width:`${Math.round(pagadas/cuotasH.length*100)}%`}}></div>
                      </div>
                    )}
                  </div>
                ) : '—'}
              </td>
              <td style={{padding:'12px 10px',borderBottom:isOpen?'none':'1px solid #F0EFED'}}><Badge bg={ec.bg} color={ec.color}>{h.estado}</Badge></td>
            </tr>
          ];
          if (isOpen) {
            rows.push(
              <tr key={`panel-${h.id}`}>
                <td colSpan={5} style={{padding:'12px 14px 16px',borderBottom:'1px solid #F0EFED',background:'#FAFAF9'}}>
                  <div style={{fontSize:10,fontWeight:600,color:'#6B7280',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:10}}>Recordatorio de cobro</div>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <label style={{fontSize:12,color:'#4a4a4a',fontWeight:500,whiteSpace:'nowrap'}}>Fecha límite de pago</label>
                    <input type="date" value={fechaLimiteEdit} onChange={e=>setFechaLimiteEdit(e.target.value)}
                      style={{padding:'5px 8px',border:'1px solid #DDDCDA',borderRadius:7,fontSize:12,fontFamily:'system-ui'}} />
                    <button onClick={async ev=>{ev.stopPropagation();await supabase.from('honorarios').update({fecha_limite_pago:fechaLimiteEdit||null}).eq('id',h.id);setPanelAbierto(null);recargar();}}
                      style={{...btnPrimary,padding:'5px 12px',fontSize:12}}>Guardar</button>
                  </div>
                  <div style={{fontSize:11,color:'#8a8a8a',marginTop:8}}>Los socios verán un aviso en el Inicio 3 días antes y el día del vencimiento</div>
                </td>
              </tr>
            );
          }
          return rows;
        })}
      </tbody>
    </table>
    </div>
  );
}

function Honorarios({ honorarios, cuotas, expedientes, clientes, valorUhon, setVista, setHonActual, recargar, perfil }) {
  const [q, setQ] = useState('');
  const [editUhon, setEditUhon] = useState(false);
  const [uhonInput, setUhonInput] = useState(valorUhon||'');
  const [filtroEstados, setFiltroEstados] = useState([]);
  const [filtroFormas, setFiltroFormas] = useState([]);
  const [filtroSocio, setFiltroSocio] = useState('');
  const [perfilesFiltro, setPerfilesFiltro] = useState([]);
  const [mesHist, setMesHist] = useState(()=>new Date(Number(HOY.substring(0,4)), Number(HOY.substring(5,7))-1, 1));
  const [vistaHon, setVistaHon] = useState('normal');
  const [honSocios, setHonSocios] = useState([]);
  useEffect(()=>{
    if (!perfil?.estudio_id) return;
    supabase.from('honorarios_socios').select('*').eq('estudio_id', perfil.estudio_id)
      .then(({data})=>setHonSocios(data||[]));
    supabase.from('perfiles').select('*').eq('estudio_id', perfil.estudio_id).order('nombre')
      .then(({data})=>setPerfilesFiltro(data||[]));
  }, [perfil?.estudio_id]);

  async function guardarUhon() {
    const eid = perfil?.estudio_id;
    if (!eid) { alert('Error: no se pudo obtener el estudio.'); return; }
    await supabase.from('config').upsert({ estudio_id: eid, valor_uhon: Number(uhonInput) }, { onConflict: 'estudio_id' });
    setEditUhon(false);
    recargar();
  }

  const lista = honorarios
    .filter(h=> filtroEstados.length===0 || filtroEstados.includes(h.estado))
    .filter(h=> filtroFormas.length===0 || filtroFormas.includes(h.forma))
    .filter(h=> !filtroSocio || honSocios.some(hs=>hs.honorario_id===h.id && hs.perfil_id===filtroSocio))
    .filter(h=>{
      if (!q) return true;
      const exp = expedientes.find(e=>e.id===h.expediente_id);
      const cli = clientes.find(c=>c.id===h.cliente_id);
      const blob = `${h.concepto} ${h.tipo_trabajo||''} ${exp?exp.caratula:''} ${cli?nombreCompleto(cli):''}`.toLowerCase();
      return blob.includes(q.toLowerCase());
    });

  const mesActual = HOY.substring(0,7);
  const totalUhonPendiente = honorarios.filter(h=>h.estado!=='pagado' && h.forma==='uhon').reduce((s,h)=>s+(Number(h.valor)||0),0);
  const honConCuotasPend = honorarios.filter(h=>h.en_cuotas && cuotas.some(cu=>cu.honorario_id===h.id&&cu.estado==='pendiente'));
  const honSinCuotasPend = honorarios.filter(h=>!h.en_cuotas && h.estado!=='pagado');
  const totalPorCobrar = honConCuotasPend.length + honSinCuotasPend.length;
  const montoPorCobrar = honConCuotasPend.reduce((s,h)=>s+cuotas.filter(cu=>cu.honorario_id===h.id&&cu.estado==='pendiente').reduce((sc,cu)=>sc+(Number(cu.monto)||0),0),0)
    + honSinCuotasPend.reduce((s,h)=>{
      if (h.forma==='uhon') return s+(Number(h.valor)||0)*(valorUhon||0);
      if (h.forma==='porcentaje') return s+(Number(h.valor)||0)/100*(Number(h.monto_base)||0);
      return s+(Number(h.valor)||0);
    },0);
  const honSinCuotasPagMes = honorarios.filter(h=>!h.en_cuotas && h.estado==='pagado' && h.periodo===mesActual).reduce((s,h)=>{
    if (h.forma==='uhon') return s+(Number(h.valor)||0)*(valorUhon||0);
    if (h.forma==='porcentaje') return s+(Number(h.valor)||0)/100*(Number(h.monto_base)||0);
    return s+(Number(h.valor)||0);
  },0);
  const cobradoMes = cuotas.filter(cu=>cu.estado==='pagada' && (cu.fecha_pago||cu.vencimiento||'').startsWith(mesActual)).reduce((s,cu)=>s+(Number(cu.monto)||0),0) + honSinCuotasPagMes;
  const saldoPendiente = cuotas.filter(cu=>cu.estado!=='pagada').reduce((s,cu)=>s+(Number(cu.monto)||0),0)
    + honSinCuotasPend.reduce((s,h)=>{
      if (h.forma==='uhon') return s+(Number(h.valor)||0)*(valorUhon||0);
      if (h.forma==='porcentaje') return s+(Number(h.valor)||0)/100*(Number(h.monto_base)||0);
      return s+(Number(h.valor)||0);
    },0);

  const mesHistStr = `${mesHist.getFullYear()}-${String(mesHist.getMonth()+1).padStart(2,'0')}`;
  const esMesActualHist = mesHistStr === mesActual;
  const cuotasMesHist = cuotas.filter(cu=>(cu.vencimiento||'').startsWith(mesHistStr));
  const honSinCuotasPagMesHist = honorarios.filter(h=>!h.en_cuotas && h.estado==='pagado' && h.periodo===mesHistStr);
  const montoSinCuotasPagMesHist = honSinCuotasPagMesHist.reduce((s,h)=>{
    if (h.forma==='uhon') return s+(Number(h.valor)||0)*(valorUhon||0);
    if (h.forma==='porcentaje') return s+(Number(h.valor)||0)/100*(Number(h.monto_base)||0);
    return s+(Number(h.valor)||0);
  },0);
  const pagadasMesHist = cuotasMesHist.filter(cu=>cu.estado==='pagada').reduce((s,cu)=>s+(Number(cu.monto)||0),0) + montoSinCuotasPagMesHist;
  const pendientesMesHist = cuotasMesHist.filter(cu=>cu.estado!=='pagada').reduce((s,cu)=>s+(Number(cu.monto)||0),0);
  const miGanancia = cuotasMesHist.filter(cu=>cu.estado==='pagada').reduce((s,cu)=>{
    const hs=honSocios.find(x=>x.honorario_id===cu.honorario_id && x.perfil_id===perfil?.id);
    return s+(hs ? Number(cu.monto)*Number(hs.porcentaje)/100 : 0);
  },0);
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const pendientesMesHistCuotas = cuotasMesHist.filter(cu=>cu.estado!=='pagada');
  const proxVencMesHist = pendientesMesHistCuotas.slice().sort((a,b)=>(a.vencimiento||'').localeCompare(b.vencimiento||''))[0]?.vencimiento;
  const totalMesHist = pagadasMesHist + pendientesMesHist;
  const pctCobradoMesHist = totalMesHist > 0 ? Math.round(pagadasMesHist / totalMesHist * 100) : 0;

  return (
    <div>
      {vistaHon==='estadisticas' ? (
        <EstadisticasHon cuotas={cuotas} honorarios={honorarios} expedientes={expedientes} clientes={clientes} valorUhon={valorUhon} onVolver={()=>setVistaHon('normal')} />
      ) : (<>
      <div style={{background:'#fff',border:'1px solid #EBEBEA',borderRadius:14,marginBottom:14,boxShadow:'0 1px 3px rgba(0,0,0,0.06)',overflow:'hidden'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',flexWrap:'wrap',gap:8}}>
          <div style={{fontSize:11,fontWeight:600,color:'#6B7280',letterSpacing:'0.07em',textTransform:'uppercase'}}>Resumen del mes</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <button onClick={()=>setMesHist(new Date(mesHist.getFullYear(),mesHist.getMonth()-1,1))}
              style={{background:'none',border:'1px solid #DDDCDA',borderRadius:8,padding:'4px 10px',cursor:'pointer',fontSize:14,color:'#4a4a4a'}}>‹</button>
            <span style={{fontWeight:600,fontSize:13,color:'#2c2c2c',minWidth:130,textAlign:'center'}}>{MESES[mesHist.getMonth()]} {mesHist.getFullYear()}</span>
            {esMesActualHist ? (
              <><span style={{fontSize:11,background:'#F0FBF0',color:'#16A34A',padding:'2px 10px',borderRadius:20,fontWeight:600,whiteSpace:'nowrap'}}>hoy</span>
              <button disabled style={{background:'none',border:'1px solid #E5E7EB',borderRadius:8,padding:'4px 10px',fontSize:14,color:'#C0C0C0',cursor:'not-allowed'}}>›</button></>
            ) : (
              <button onClick={()=>setMesHist(new Date(mesHist.getFullYear(),mesHist.getMonth()+1,1))}
                style={{background:'none',border:'1px solid #DDDCDA',borderRadius:8,padding:'4px 10px',cursor:'pointer',fontSize:14,color:'#4a4a4a'}}>›</button>
            )}
          </div>
        </div>
        {/* 3 columnas */}
        <div style={{display:'flex',borderTop:'1px solid #EBEBEA',borderBottom:'1px solid #EBEBEA',flexWrap:'wrap'}}>
          <div style={{flex:'1 1 160px',padding:'20px',borderRight:'1px solid #EBEBEA'}}>
            <div style={{fontSize:11,color:'#6B7280',fontWeight:500,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.04em'}}>Cobrado este mes</div>
            <div style={{fontSize:28,fontWeight:500,color:'#16A34A',lineHeight:1,marginBottom:8}}>{fmtMoneda(pagadasMesHist)}</div>
            <div style={{fontSize:11,color:'#8a8a8a'}}>{cuotasMesHist.filter(cu=>cu.estado==='pagada').length} cuota(s) cobrada(s)</div>
          </div>
          <div style={{flex:'1 1 160px',padding:'20px',borderRight:'1px solid #EBEBEA'}}>
            <div style={{fontSize:11,color:'#6B7280',fontWeight:500,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.04em'}}>Pendiente de cobro</div>
            <div style={{fontSize:28,fontWeight:500,color:'#B45309',lineHeight:1,marginBottom:8}}>{fmtMoneda(pendientesMesHist)}</div>
            <div style={{fontSize:11,color:'#8a8a8a'}}>{pendientesMesHistCuotas.length} cuota(s) pendiente(s){proxVencMesHist&&<> · próx. {formatFecha(proxVencMesHist)}</>}</div>
          </div>
          <div style={{flex:'1 1 160px',padding:'20px'}}>
            <div style={{fontSize:11,color:'#6B7280',fontWeight:500,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.04em'}}>Valor del UHON</div>
            {!editUhon ? (
              <>
                <div style={{fontSize:28,fontWeight:500,color:'#2563EB',lineHeight:1,marginBottom:8}}>{valorUhon?fmtMoneda(valorUhon):'—'}</div>
                <div style={{fontSize:11,color:'#8a8a8a'}}>
                  {totalUhonPendiente>0&&<>{totalUhonPendiente} UHON por cobrar · </>}
                  <button onClick={()=>{setUhonInput(valorUhon||'');setEditUhon(true);}} style={{fontSize:11,color:'#2B6CB0',background:'none',border:'none',cursor:'pointer',padding:0,textDecoration:'underline',fontFamily:'system-ui'}}>editar</button>
                </div>
              </>
            ) : (
              <>
                <div style={{fontSize:28,fontWeight:500,color:'#2563EB',lineHeight:1,marginBottom:8}}>{valorUhon?fmtMoneda(valorUhon):'—'}</div>
                <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                  <input type="number" value={uhonInput} onChange={e=>setUhonInput(e.target.value)} placeholder="Ej: 45000"
                    style={{padding:'4px 8px',border:'1px solid #DDDCDA',borderRadius:6,fontSize:12,width:100,fontFamily:'system-ui'}} />
                  <button onClick={guardarUhon} style={{...btnPrimary,padding:'4px 10px',fontSize:11}}>OK</button>
                  <button onClick={()=>setEditUhon(false)} style={{fontSize:11,color:'#6B7280',background:'none',border:'none',cursor:'pointer'}}>cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Barra de progreso */}
        <div style={{padding:'14px 20px 12px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <span style={{fontSize:11,color:'#6B7280'}}>Cobrado del total del mes</span>
            <span style={{fontSize:11,fontWeight:600,color:'#16A34A'}}>{pctCobradoMesHist}%</span>
          </div>
          <div style={{height:5,borderRadius:3,background:'#E5E7EB'}}>
            <div style={{height:'100%',borderRadius:3,background:'#16A34A',width:`${pctCobradoMesHist}%`}}></div>
          </div>
        </div>
        {/* Lista de cuotas del mes */}
        <div style={{borderTop:'1px solid #EBEBEA',padding:'14px 20px 4px'}}>
          <div style={{fontSize:11,fontWeight:600,color:'#6B7280',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Cuotas del mes · {cuotasMesHist.length}</div>
          {cuotasMesHist.length ? cuotasMesHist.map(cu=>{
            const hon=honorarios.find(h=>h.id===cu.honorario_id);
            const exp=hon?.expediente_id?expedientes.find(e=>e.id===hon.expediente_id):null;
            const cli=hon?.cliente_id?clientes.find(c=>c.id===hon.cliente_id):null;
            const vincLabel=hon?.vinculo_tipo==='contraparte'?(hon.contraparte_nombre||null):(exp?exp.caratula:(cli?nombreCompleto(cli):null));
            const formaStr=hon?formaLabel(hon,valorUhon):null;
            const detalleDesc=[vincLabel,formaStr,cu.vencimiento?`vence ${formatFecha(cu.vencimiento)}`:null].filter(Boolean).join(' · ');
            return <div key={cu.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 0',borderBottom:'1px solid #F0EFED'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500}}>{hon?hon.concepto:'Honorario'} <span style={{fontSize:11,color:'#8a8a8a'}}>· Cuota {cu.numero}</span></div>
                {detalleDesc&&<div style={{fontSize:11,color:'#8a8a8a',marginTop:1}}>{detalleDesc}</div>}
                {cu.estado==='pagada'&&cu.fecha_pago&&<div style={{fontSize:11,color:'#16A34A',marginTop:2}}>✓ Pagada el {formatFecha(cu.fecha_pago)}</div>}
                {cu.estado!=='pagada'&&<div style={{fontSize:11,color:'#B45309',marginTop:2}}>Recordar al cliente antes del {formatFecha(hon?.fecha_limite_pago||cu.vencimiento)}</div>}
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                <span style={{fontSize:13,fontWeight:600}}>{fmtMoneda(cu.monto)}</span>
                <Badge bg={cu.estado==='pagada'?'#F0FBF0':'#FEF9EE'} color={cu.estado==='pagada'?'#16A34A':'#B45309'}>{cu.estado}</Badge>
              </div>
            </div>;
          }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:'0 0 16px'}}>Sin cuotas con vencimiento en {MESES[mesHist.getMonth()]} {mesHist.getFullYear()}.</div>}
        </div>
      </div>

      <Card>
        <div style={{display:'flex',gap:10,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
          <input style={{...inputStyle,marginBottom:0,flex:1,minWidth:200}} placeholder="Buscar por concepto, cliente, expediente..." value={q} onChange={e=>setQ(e.target.value)} />
          <button onClick={()=>setVistaHon('estadisticas')} style={{...btnPrimary,background:'#fff',color:'#4a4a4a',border:'1px solid #DDDCDA'}}>📊 Estadísticas</button>
          <button onClick={()=>setVista('nuevo-honorario')} style={btnPrimary}>+ Nuevo honorario</button>
        </div>
        <div style={{display:'flex',gap:14,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{display:'flex',gap:5,alignItems:'center'}}>
            <span style={{fontSize:11,color:'#6B7280',fontWeight:600,whiteSpace:'nowrap'}}>ESTADO</span>
            {[['pendiente','Pendiente'],['en proceso','En proceso'],['pagado','Pagado']].map(([v,l])=>{
              const sel=filtroEstados.includes(v);
              return <button key={v} onClick={()=>setFiltroEstados(sel?filtroEstados.filter(x=>x!==v):[...filtroEstados,v])}
                style={{padding:'4px 10px',borderRadius:20,fontSize:12,fontWeight:500,cursor:'pointer',border:'none',
                  background:sel?'#9B4F6A':'#F3F4F6',color:sel?'#fff':'#6B7280',fontFamily:'system-ui'}}>{l}</button>;
            })}
          </div>
          <div style={{display:'flex',gap:5,alignItems:'center'}}>
            <span style={{fontSize:11,color:'#6B7280',fontWeight:600,whiteSpace:'nowrap'}}>FORMA</span>
            {[['uhon','UHON'],['porcentaje','%'],['fijo','$ fijo']].map(([v,l])=>{
              const sel=filtroFormas.includes(v);
              return <button key={v} onClick={()=>setFiltroFormas(sel?filtroFormas.filter(x=>x!==v):[...filtroFormas,v])}
                style={{padding:'4px 10px',borderRadius:20,fontSize:12,fontWeight:500,cursor:'pointer',border:'none',
                  background:sel?'#9B4F6A':'#F3F4F6',color:sel?'#fff':'#6B7280',fontFamily:'system-ui'}}>{l}</button>;
            })}
          </div>
          {perfilesFiltro.length > 0 && (
            <div style={{display:'flex',gap:5,alignItems:'center'}}>
              <span style={{fontSize:11,color:'#6B7280',fontWeight:600,whiteSpace:'nowrap'}}>SOCIO</span>
              <select value={filtroSocio} onChange={e=>setFiltroSocio(e.target.value)}
                style={{padding:'4px 8px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,fontFamily:'system-ui',background:'#fff',color:'#4a4a4a'}}>
                <option value="">Todos los socios</option>
                {perfilesFiltro.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          )}
          {(filtroEstados.length>0||filtroFormas.length>0||filtroSocio) && (
            <button onClick={()=>{setFiltroEstados([]);setFiltroFormas([]);setFiltroSocio('');}}
              style={{padding:'4px 10px',borderRadius:20,fontSize:11,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',color:'#6B7280',fontFamily:'system-ui'}}>
              Limpiar filtros ✕
            </button>
          )}
        </div>
        {lista.length ? (
          <HonorariosTable lista={lista} expedientes={expedientes} clientes={clientes} cuotas={cuotas} valorUhon={valorUhon} setHonActual={setHonActual} setVista={setVista} recargar={recargar} />
        ) : <div style={{color:'#6B7280',fontSize:13,textAlign:'center',padding:30}}>Sin honorarios cargados. Cargá el primero con "Nuevo honorario".</div>}
      </Card>
      </>)}
    </div>
  );
}

function EstadisticasHon({ cuotas, honorarios, expedientes, clientes, onVolver }) {
  const MESES_C = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const MESES_L = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const anoActual = Number(HOY.substring(0,4));
  const [vistaEst, setVistaEst] = useState('anual');
  const [mesStat, setMesStat] = useState(()=>new Date(anoActual, Number(HOY.substring(5,7))-1, 1));
  const [hoveredStat, setHoveredStat] = useState(null);

  const datosAnuales = Array.from({length:12},(_,i)=>{
    const str = `${anoActual}-${String(i+1).padStart(2,'0')}`;
    const cobrado = cuotas.filter(cu=>cu.estado==='pagada'&&(cu.fecha_pago||cu.vencimiento||'').startsWith(str)).reduce((s,cu)=>s+(Number(cu.monto)||0),0);
    const pendiente = cuotas.filter(cu=>cu.estado==='pendiente'&&(cu.vencimiento||'').startsWith(str)).reduce((s,cu)=>s+(Number(cu.monto)||0),0);
    return { str, mes:i, cobrado, pendiente };
  });
  const maxAnual = Math.max(...datosAnuales.map(m=>Math.max(m.cobrado,m.pendiente)),1);

  const mesStatStr = `${mesStat.getFullYear()}-${String(mesStat.getMonth()+1).padStart(2,'0')}`;
  const diasEnMes = new Date(mesStat.getFullYear(),mesStat.getMonth()+1,0).getDate();
  const todasCuotasMes = cuotas.filter(cu=>(cu.vencimiento||'').startsWith(mesStatStr));
  const datosDiarios = Array.from({length:diasEnMes},(_,i)=>{
    const dia = String(i+1).padStart(2,'0');
    const dateStr = `${mesStatStr}-${dia}`;
    const cobrado = cuotas.filter(cu=>cu.estado==='pagada'&&(cu.fecha_pago||cu.vencimiento)===dateStr).reduce((s,cu)=>s+(Number(cu.monto)||0),0);
    const pendiente = cuotas.filter(cu=>cu.estado==='pendiente'&&cu.vencimiento===dateStr).reduce((s,cu)=>s+(Number(cu.monto)||0),0);
    return { dateStr, dia:i+1, cobrado, pendiente };
  }).filter(d=>d.cobrado>0||d.pendiente>0);
  const maxDiario = Math.max(...datosDiarios.map(d=>Math.max(d.cobrado,d.pendiente)),1);

  function fmtK(n) {
    if (n>=1000000) return `$${(n/1000000).toFixed(1).replace(/\.0$/,'')}M`;
    if (n>=1000) return `$${(n/1000).toFixed(1).replace(/\.0$/,'')}k`;
    return `$${Math.round(n)}`;
  }

  const L=50,R=10,T=24,B=40,VW=620,VH=260;
  const chartW=VW-L-R, chartH=VH-T-B;
  const refs=[0.25,0.5,0.75,1];
  const legend = (
    <div style={{display:'flex',gap:14,fontSize:11,color:'#6B7280',marginTop:6}}>
      <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#16A34A',display:'inline-block'}}></span>Cobrado</span>
      <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:'#B45309',display:'inline-block'}}></span>Pendiente</span>
    </div>
  );
  const tooltip = hoveredStat ? (
    <g>
      <rect x={hoveredStat.tx-62} y={hoveredStat.ty-20} width={124} height={20} rx={4} fill="#1a1a1a" opacity={0.88}/>
      <text x={hoveredStat.tx} y={hoveredStat.ty-6} textAnchor="middle" fontSize={10} fill="#fff" fontFamily="system-ui">{hoveredStat.text}</text>
    </g>
  ) : null;

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,flexWrap:'wrap'}}>
        <button onClick={onVolver} style={{padding:'7px 13px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',color:'#4a4a4a'}}>← Volver</button>
        <span style={{fontSize:16,fontWeight:600,color:'#1a1a1a'}}>
          {vistaEst==='anual' ? `Evolución anual — ${anoActual}` : `Detalle — ${MESES_L[mesStat.getMonth()]} ${mesStat.getFullYear()}`}
        </span>
        {vistaEst==='mensual' && (
          <button onClick={()=>{setVistaEst('anual');setHoveredStat(null);}} style={{marginLeft:'auto',padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',color:'#6B7280'}}>← Volver al año</button>
        )}
      </div>

      {vistaEst==='anual' && (
        <Card>
          <div onMouseLeave={()=>setHoveredStat(null)}>
            <svg viewBox={`0 0 ${VW} ${VH}`} style={{width:'100%',height:'auto',display:'block',overflow:'visible'}}>
              {refs.map(f=>{
                const y=T+chartH*(1-f);
                return (
                  <g key={f}>
                    <line x1={L} y1={y} x2={VW-R} y2={y} stroke="#EBEBEA" strokeWidth="1" strokeDasharray="4 3"/>
                    <text x={L-4} y={y+3} textAnchor="end" fontSize={9} fill="#a0a0a0" fontFamily="system-ui">{fmtK(maxAnual*f)}</text>
                  </g>
                );
              })}
              {datosAnuales.map((m,i)=>{
                const gW=chartW/12, gX=L+i*gW;
                const bW=Math.min(16,(gW-8)/2);
                const innerOff=(gW-bW*2-4)/2;
                const cX=gX+innerOff, pX=cX+bW+4;
                const cH=Math.max(0,(m.cobrado/maxAnual)*chartH);
                const pH=Math.max(0,(m.pendiente/maxAnual)*chartH);
                const base=T+chartH;
                const isHov=hoveredStat?.mes===i;
                return (
                  <g key={i} style={{cursor:'pointer'}} onClick={()=>{setMesStat(new Date(anoActual,i,1));setVistaEst('mensual');setHoveredStat(null);}}>
                    <rect x={cX} y={base-cH} width={bW} height={Math.max(cH,1)} rx={2}
                      fill={isHov&&hoveredStat?.tipo==='cobrado'?'#15803D':'#16A34A'}
                      onMouseEnter={()=>setHoveredStat({mes:i,tipo:'cobrado',tx:Math.min(Math.max(cX+bW/2,70),VW-70),ty:Math.max(base-cH-8,T+6),text:`${MESES_C[m.mes]}: ${fmtMoneda(m.cobrado)}`})}
                    />
                    <rect x={pX} y={base-pH} width={bW} height={Math.max(pH,1)} rx={2}
                      fill={isHov&&hoveredStat?.tipo==='pendiente'?'#92400E':'#B45309'}
                      onMouseEnter={()=>setHoveredStat({mes:i,tipo:'pendiente',tx:Math.min(Math.max(pX+bW/2,70),VW-70),ty:Math.max(base-pH-8,T+6),text:`${MESES_C[m.mes]}: ${fmtMoneda(m.pendiente)}`})}
                    />
                    <text x={gX+gW/2} y={base+16} textAnchor="middle" fontSize={9} fill="#8a8a8a" fontFamily="system-ui">{MESES_C[m.mes]}</text>
                  </g>
                );
              })}
              {tooltip}
            </svg>
          </div>
          {legend}
          <div style={{fontSize:11,color:'#8a8a8a',textAlign:'center',marginTop:6}}>Clic en una barra para ver el detalle del mes</div>
        </Card>
      )}

      {vistaEst==='mensual' && (
        <Card>
          {datosDiarios.length===0 ? (
            <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:30}}>Sin movimientos registrados en este mes.</div>
          ) : (
            <div onMouseLeave={()=>setHoveredStat(null)}>
              <svg viewBox={`0 0 ${VW} ${VH}`} style={{width:'100%',height:'auto',display:'block',overflow:'visible'}}>
                {refs.map(f=>{
                  const y=T+chartH*(1-f);
                  return (
                    <g key={f}>
                      <line x1={L} y1={y} x2={VW-R} y2={y} stroke="#EBEBEA" strokeWidth="1" strokeDasharray="4 3"/>
                      <text x={L-4} y={y+3} textAnchor="end" fontSize={9} fill="#a0a0a0" fontFamily="system-ui">{fmtK(maxDiario*f)}</text>
                    </g>
                  );
                })}
                {datosDiarios.map((d,i)=>{
                  const n=datosDiarios.length;
                  const gW=chartW/n, gX=L+i*gW;
                  const bW=Math.min(20,(gW-6)/2);
                  const innerOff=(gW-bW*2-4)/2;
                  const cX=gX+Math.max(innerOff,0), pX=cX+bW+4;
                  const cH=Math.max(0,(d.cobrado/maxDiario)*chartH);
                  const pH=Math.max(0,(d.pendiente/maxDiario)*chartH);
                  const base=T+chartH;
                  const isHov=hoveredStat?.dateStr===d.dateStr;
                  const parts=d.dateStr.split('-');
                  const fechaLabel=`${parts[2]}/${parts[1]}`;
                  return (
                    <g key={d.dateStr}>
                      <rect x={cX} y={base-cH} width={bW} height={Math.max(cH,1)} rx={2}
                        fill={isHov&&hoveredStat?.tipo==='cobrado'?'#15803D':'#16A34A'}
                        onMouseEnter={()=>setHoveredStat({dateStr:d.dateStr,tipo:'cobrado',tx:Math.min(Math.max(cX+bW/2,70),VW-70),ty:Math.max(base-cH-8,T+6),text:`${fechaLabel}: ${fmtMoneda(d.cobrado)}`})}
                      />
                      <rect x={pX} y={base-pH} width={bW} height={Math.max(pH,1)} rx={2}
                        fill={isHov&&hoveredStat?.tipo==='pendiente'?'#92400E':'#B45309'}
                        onMouseEnter={()=>setHoveredStat({dateStr:d.dateStr,tipo:'pendiente',tx:Math.min(Math.max(pX+bW/2,70),VW-70),ty:Math.max(base-pH-8,T+6),text:`${fechaLabel}: ${fmtMoneda(d.pendiente)}`})}
                      />
                      <text x={gX+gW/2} y={base+16} textAnchor="middle" fontSize={9} fill="#8a8a8a" fontFamily="system-ui">{String(d.dia)}</text>
                    </g>
                  );
                })}
                {tooltip}
              </svg>
            </div>
          )}
          {legend}
          {todasCuotasMes.length>0 && (
            <div style={{marginTop:16,borderTop:'1px solid #F0EFED',paddingTop:14}}>
              <div style={{fontSize:12,color:'#6B7280',fontWeight:600,marginBottom:10}}>Cuotas del mes</div>
              {todasCuotasMes.map(cu=>{
                const hon=honorarios.find(h=>h.id===cu.honorario_id);
                const exp=hon?.expediente_id?expedientes.find(e=>e.id===hon.expediente_id):null;
                const cli=hon?.cliente_id?clientes.find(c=>c.id===hon.cliente_id):null;
                const vincLabel=hon?.vinculo_tipo==='contraparte'?(hon.contraparte_nombre||null):(exp?exp.caratula:(cli?nombreCompleto(cli):null));
                return <div key={cu.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid #F0EFED'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500}}>{hon?hon.concepto:'Honorario'} <span style={{fontSize:11,color:'#8a8a8a'}}>· Cuota {cu.numero}</span></div>
                    {vincLabel && <div style={{fontSize:11,color:'#8a8a8a',marginTop:1}}>{vincLabel}</div>}
                    {cu.vencimiento && <div style={{fontSize:11,color:'#8a8a8a',marginTop:1}}>vence {formatFecha(cu.vencimiento)}</div>}
                  </div>
                  <span style={{fontSize:13,fontWeight:600}}>{fmtMoneda(cu.monto)}</span>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2}}>
                    <Badge bg={cu.estado==='pagada'?'#F0FBF0':'#FEF9EE'} color={cu.estado==='pagada'?'#16A34A':'#B45309'}>{cu.estado}</Badge>
                    {cu.estado==='pagada' && cu.fecha_pago && <span style={{fontSize:10,color:'#8a8a8a'}}>{formatFecha(cu.fecha_pago)}</span>}
                  </div>
                </div>;
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function NuevoHonorario({ perfil, recargar, setVista, expedientes, clientes }) {
  const [f, setF] = useState({ concepto:'', tipo_trabajo:'', forma:'uhon', valor:'', monto_base:'', vinculo_tipo:'ninguno', expediente_id:'', cliente_id:'', contraparte_nombre:'', en_cuotas:false, notas:'', fecha:HOY });
  const [perfilesEstudio, setPerfilesEstudio] = useState([]);
  const [distribSocios, setDistribSocios] = useState([]);
  const [gastosPorc, setGastosPorc] = useState(3);
  const [msg, setMsg] = useState('');
  const set = (k,v)=>setF({...f,[k]:v});
  useEffect(()=>{
    if (!perfil?.estudio_id) return;
    Promise.all([
      supabase.from('perfiles').select('*').eq('estudio_id', perfil.estudio_id).order('nombre'),
      supabase.from('config').select('*').eq('estudio_id', perfil.estudio_id).maybeSingle()
    ]).then(([{data:pfs},{data:cfg}])=>{
      const perfiles=pfs||[];
      const gPorc=cfg?.gastos_porcentaje??3;
      const distCfg=Array.isArray(cfg?.distribucion_socios)?cfg.distribucion_socios:[];
      setPerfilesEstudio(perfiles);
      setGastosPorc(gPorc);
      setDistribSocios(perfiles.map(p=>{
        const cfgEntry=distCfg.find(d=>d.nombre.trim().toLowerCase()===p.nombre.trim().toLowerCase());
        return { perfil_id:p.id, nombre:p.nombre, porcentaje:cfgEntry?cfgEntry.porcentaje:0 };
      }));
    });
  }, [perfil?.estudio_id]);
  async function guardar() {
    if (!f.concepto || !f.valor) { alert('Completá al menos el concepto y el valor.'); return; }
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    const somaDistrib = distribSocios.reduce((s,ds)=>s+Number(ds.porcentaje||0),0);
    if (somaDistrib > 0 && somaDistrib !== 100) { alert(`La distribución entre socios debe sumar 100% (ahora suma ${somaDistrib}%).`); return; }
    const payload = { concepto:f.concepto, tipo_trabajo:f.tipo_trabajo, forma:f.forma, valor:Number(f.valor),
      monto_base: f.monto_base ? Number(f.monto_base) : null,
      expediente_id: f.vinculo_tipo==='expediente' ? f.expediente_id||null : null,
      cliente_id: f.vinculo_tipo==='cliente' ? f.cliente_id||null : null,
      contraparte_nombre: f.vinculo_tipo==='contraparte' ? f.contraparte_nombre||null : null,
      vinculo_tipo: f.vinculo_tipo==='ninguno' ? null : f.vinculo_tipo,
      en_cuotas:f.en_cuotas, notas:f.notas,
      estado:'pendiente', estudio_id: perfil.estudio_id, fecha: f.fecha||null,
      periodo: f.fecha ? f.fecha.substring(0,7) : HOY.substring(0,7) };
    const { data: honData, error } = await supabase.from('honorarios').insert(payload).select('id').single();
    if (error) { alert('Error: '+error.message); return; }
    if (honData?.id) {
      const gp=Number(gastosPorc||0);
      const rows=[];
      if (gp>0) rows.push({ honorario_id:honData.id, perfil_id:null, porcentaje:gp, estudio_id:perfil.estudio_id, es_gasto:true });
      if (somaDistrib===100) {
        const factor=(100-gp)/100;
        distribSocios.filter(ds=>Number(ds.porcentaje||0)>0).forEach(ds=>{
          rows.push({ honorario_id:honData.id, perfil_id:ds.perfil_id, porcentaje:Number(ds.porcentaje)*factor, estudio_id:perfil.estudio_id, es_gasto:false });
        });
      }
      if (rows.length) await supabase.from('honorarios_socios').insert(rows);
    }
    setMsg(`Honorario "${f.concepto}" guardado.` + (f.en_cuotas?' Ahora podés cargarle las cuotas desde su detalle.':''));
    setF({ concepto:'', tipo_trabajo:'', forma:'uhon', valor:'', monto_base:'', vinculo_tipo:'ninguno', expediente_id:'', cliente_id:'', contraparte_nombre:'', en_cuotas:false, notas:'', fecha:HOY });
    setDistribSocios(distribSocios.map(ds=>({...ds,porcentaje:0})));
    recargar();
    setTimeout(()=>setMsg(''),4000);
  }
  return (
    <Card title="💰 Nuevo honorario">
      {msg && <div style={{background:'#EAF3DE',border:'1px solid #C0DD97',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#27500A',marginBottom:14}}>✓ {msg}</div>}
      <div style={{maxWidth:560}}>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Concepto *</label>
        <input style={inputStyle} placeholder="Ej: Honorarios juicio de alimentos / Redacción de contrato" value={f.concepto} onChange={e=>set('concepto',e.target.value)} />

        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Tipo de trabajo</label>
        <input style={inputStyle} placeholder="Ej: Judicial, contrato de locación, puesta al día de sociedad..." value={f.tipo_trabajo} onChange={e=>set('tipo_trabajo',e.target.value)} />

        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Forma de cobro *</label>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {[['uhon','En UHON'],['porcentaje','Porcentaje (%)'],['fijo','Monto fijo ($)']].map(([v,l])=>(
            <button key={v} onClick={()=>set('forma',v)} style={{flex:1,padding:9,border:f.forma===v?'1px solid #2B6CB0':'1px solid #e2e2e2',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',background:f.forma===v?'#E6F1FB':'#f9f8f5',color:f.forma===v?'#0C447C':'#4a4a4a'}}>{l}</button>
          ))}
        </div>

        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>
          {f.forma==='uhon'?'Cantidad de UHON *':f.forma==='porcentaje'?'Porcentaje *':'Monto en pesos *'}
        </label>
        <input type="number" style={inputStyle} placeholder={f.forma==='uhon'?'Ej: 10':f.forma==='porcentaje'?'Ej: 20':'Ej: 500000'} value={f.valor} onChange={e=>set('valor',e.target.value)} />
        {f.forma==='porcentaje' && <>
          <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Monto base (sobre el cual se calcula el %)</label>
          <input type="number" style={inputStyle} placeholder="Ej: 500000" value={f.monto_base} onChange={e=>set('monto_base',e.target.value)} />
          {f.monto_base && f.valor && <div style={{fontSize:12,color:'#27500A',marginBottom:12,marginTop:-6}}>= {fmtMoneda(Number(f.valor)/100*Number(f.monto_base))}</div>}
        </>}

        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Vincular a</label>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {[['ninguno','Sin vincular'],['expediente','Expediente'],['cliente','Cliente'],['contraparte','Contraparte']].map(([v,l])=>(
            <button key={v} onClick={()=>setF(prev=>({...prev,vinculo_tipo:v,expediente_id:'',cliente_id:'',contraparte_nombre:''}))}
              style={{flex:1,padding:'7px 4px',border:f.vinculo_tipo===v?'1px solid #2B6CB0':'1px solid #e2e2e2',borderRadius:8,fontSize:11,fontWeight:500,cursor:'pointer',background:f.vinculo_tipo===v?'#E6F1FB':'#f9f8f5',color:f.vinculo_tipo===v?'#0C447C':'#4a4a4a',fontFamily:'system-ui'}}>{l}</button>
          ))}
        </div>
        {f.vinculo_tipo==='expediente' && <select style={inputStyle} value={f.expediente_id} onChange={e=>set('expediente_id',e.target.value)}>
          <option value="">Seleccioná expediente</option>
          {expedientes.map(ex=><option key={ex.id} value={ex.id}>{ex.caratula}</option>)}
        </select>}
        {f.vinculo_tipo==='cliente' && <select style={inputStyle} value={f.cliente_id} onChange={e=>set('cliente_id',e.target.value)}>
          <option value="">Seleccioná cliente</option>
          {clientes.map(cl=><option key={cl.id} value={cl.id}>{nombreCompleto(cl)}</option>)}
        </select>}
        {f.vinculo_tipo==='contraparte' && <input style={inputStyle} placeholder="Nombre de la contraparte" value={f.contraparte_nombre||''} onChange={e=>set('contraparte_nombre',e.target.value)} />}

        <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,cursor:'pointer',fontSize:13}}>
          <input type="checkbox" checked={f.en_cuotas} onChange={e=>set('en_cuotas',e.target.checked)} style={{width:16,height:16,cursor:'pointer'}} />
          Se cobra en cuotas
        </label>
        {f.en_cuotas && <div style={{fontSize:11,color:'#8a8a8a',marginBottom:12,marginTop:-4,fontStyle:'italic'}}>Después de guardar, vas a poder cargar las cuotas (monto, vencimiento y estado) desde el detalle del honorario.</div>}

        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Fecha de carga</label>
        <input type="date" style={inputStyle} value={f.fecha} onChange={e=>set('fecha',e.target.value)} />

        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Notas</label>
        <textarea style={{...inputStyle,minHeight:56,resize:'vertical'}} value={f.notas} onChange={e=>set('notas',e.target.value)} />

        {perfilesEstudio.length > 0 && (
          <div style={{marginBottom:14,background:'#F7F6F3',borderRadius:10,padding:'12px 14px'}}>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,fontWeight:600,color:'#4a4a4a',display:'block',marginBottom:6}}>Gastos del estudio</label>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <input type="number" min="0" max="100" value={gastosPorc}
                  onChange={e=>setGastosPorc(e.target.value)}
                  style={{width:70,padding:'5px 8px',border:'1px solid #DDDCDA',borderRadius:6,fontSize:13,fontFamily:'system-ui',textAlign:'right'}} />
                <span style={{fontSize:13,color:'#4a4a4a'}}>% del total</span>
              </div>
              <div style={{fontSize:11,color:'#8a8a8a'}}>Se descuenta del total antes de distribuir entre socios</div>
            </div>
            <label style={{fontSize:12,fontWeight:600,color:'#4a4a4a',display:'block',marginBottom:6}}>
              {'Distribución entre socios (sobre el '+Math.max(0,100-Number(gastosPorc||0))+'% restante)'}
            </label>
            {distribSocios.map((ds,i)=>(
              <div key={ds.perfil_id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:13,color:'#4a4a4a',flex:1}}>{ds.nombre}</span>
                <input type="number" min="0" max="100" value={ds.porcentaje}
                  onChange={ev=>{ const n=[...distribSocios]; n[i]={...n[i],porcentaje:ev.target.value}; setDistribSocios(n); }}
                  style={{width:70,padding:'5px 8px',border:'1px solid #DDDCDA',borderRadius:6,fontSize:13,fontFamily:'system-ui',textAlign:'right'}} />
                <span style={{fontSize:13,color:'#4a4a4a'}}>%</span>
              </div>
            ))}
            {(()=>{
              const s=distribSocios.reduce((a,ds)=>a+Number(ds.porcentaje||0),0);
              const gp=Number(gastosPorc||0), factor=(100-gp)/100;
              const resumen='Gastos: '+gp+'% · '+distribSocios.filter(ds=>Number(ds.porcentaje||0)>0).map(ds=>ds.nombre+': '+(Number(ds.porcentaje)*factor).toFixed(1).replace(/\.0$/,'')+'%').join(' · ');
              return <>
                <div style={{fontSize:11,marginTop:4,marginBottom:s===100?4:0,color:s===100?'#27500A':s===0?'#8a8a8a':'#A32D2D'}}>
                  {s===0?'Sin distribución configurada':s===100?'✓ 100%':'Suma '+s+'% — debe ser 100%'}
                </div>
                {s===100 && <div style={{fontSize:11,color:'#8a8a8a'}}>{resumen}</div>}
              </>;
            })()}
          </div>
        )}

        <button onClick={guardar} style={btnPrimary}>Guardar honorario</button>
      </div>
    </Card>
  );
}

function DetalleHonorario({ honActual, setHonActual, expedientes, clientes, cuotas, valorUhon, perfil, setVista, recargar }) {
  const h = honActual;
  const [nuevaCuota, setNuevaCuota] = useState({ monto:'', vencimiento:'' });
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState({ concepto: h?.concepto||'', tipo_trabajo: h?.tipo_trabajo||'', forma: h?.forma||'uhon', valor: h?.valor||0 });
  const [confirmandoPagoId, setConfirmandoPagoId] = useState(null);
  const [fechaPago, setFechaPago] = useState(HOY);
  const [perfilesEstudio, setPerfilesEstudio] = useState([]);
  const [distribSocios, setDistribSocios] = useState([]);
  const [gastosPorc, setGastosPorc] = useState(3);
  const [guardandoDistrib, setGuardandoDistrib] = useState(false);
  useEffect(()=>{
    if (!h?.id || !perfil?.estudio_id) return;
    Promise.all([
      supabase.from('perfiles').select('*').eq('estudio_id', perfil.estudio_id).order('nombre'),
      supabase.from('honorarios_socios').select('*').eq('honorario_id', h.id),
      supabase.from('config').select('*').eq('estudio_id', perfil.estudio_id).maybeSingle()
    ]).then(([{data:pfs},{data:hs},{data:cfg}])=>{
      const perfiles=pfs||[];
      const socios=(hs||[]).filter(x=>!x.es_gasto);
      const gastRow=(hs||[]).find(x=>x.es_gasto);
      const gPorc=gastRow?Number(gastRow.porcentaje):(cfg?.gastos_porcentaje??3);
      const distCfg=Array.isArray(cfg?.distribucion_socios)?cfg.distribucion_socios:[];
      const tieneRegistros=socios.length>0;
      setGastosPorc(gPorc);
      setPerfilesEstudio(perfiles);
      setDistribSocios(perfiles.map(p=>{
        if (tieneRegistros) {
          const ex=socios.find(s=>s.perfil_id===p.id);
          if (ex) {
            const factorInv=gPorc<100?100/(100-gPorc):1;
            return { perfil_id:p.id, nombre:p.nombre, porcentaje:Math.round(Number(ex.porcentaje)*factorInv*10)/10 };
          }
          return { perfil_id:p.id, nombre:p.nombre, porcentaje:0 };
        }
        const cfgEntry=distCfg.find(d=>d.nombre.trim().toLowerCase()===p.nombre.trim().toLowerCase());
        return { perfil_id:p.id, nombre:p.nombre, porcentaje:cfgEntry?cfgEntry.porcentaje:0 };
      }));
    });
  }, [h?.id, perfil?.estudio_id]);
  if (!h) return null;
  const exp = expedientes.find(e=>e.id===h.expediente_id);
  const cli = clientes.find(c=>c.id===h.cliente_id);
  const cuotasH = cuotas.filter(cu=>cu.honorario_id===h.id).sort((a,b)=>(a.numero||0)-(b.numero||0));

  async function cambiarEstadoGeneral(nuevo) {
    setHonActual({...h, estado:nuevo});
    await supabase.from('honorarios').update({ estado:nuevo }).eq('id', h.id);
    recargar();
  }
  async function agregarCuota() {
    if (!nuevaCuota.monto) { alert('Poné el monto de la cuota.'); return; }
    const numero = cuotasH.length + 1;
    await supabase.from('cuotas').insert({ honorario_id:h.id, estudio_id:perfil.estudio_id, numero, monto:Number(nuevaCuota.monto), vencimiento:nuevaCuota.vencimiento||null, estado:'pendiente' });
    setNuevaCuota({ monto:'', vencimiento:'' });
    recargar();
  }
  async function toggleCuota(cu) {
    // Solo para desmarcar (pagada → pendiente)
    await supabase.from('cuotas').update({ estado:'pendiente', fecha_pago: null }).eq('id', cu.id);
    const otras = cuotasH.filter(x=>x.id!==cu.id);
    const algunaPagada = otras.some(x=>x.estado==='pagada');
    const sugerido = algunaPagada ? 'en proceso' : 'pendiente';
    if (sugerido!==h.estado) { await supabase.from('honorarios').update({ estado:sugerido }).eq('id', h.id); setHonActual({...h, estado:sugerido}); }
    recargar();
  }
  async function confirmarPago(cu) {
    await supabase.from('cuotas').update({ estado:'pagada', fecha_pago: fechaPago||HOY }).eq('id', cu.id);
    setConfirmandoPagoId(null);
    const otras = cuotasH.filter(x=>x.id!==cu.id);
    const todasPagadas = otras.every(x=>x.estado==='pagada');
    const sugerido = todasPagadas ? 'pagado' : 'en proceso';
    if (sugerido!==h.estado) { await supabase.from('honorarios').update({ estado:sugerido }).eq('id', h.id); setHonActual({...h, estado:sugerido}); }
    recargar();
  }
  async function borrarCuota(cu) {
    await supabase.from('cuotas').delete().eq('id', cu.id);
    recargar();
  }
  async function guardarEdicion() {
    await supabase.from('honorarios').update({ concepto: editForm.concepto, tipo_trabajo: editForm.tipo_trabajo, forma: editForm.forma, valor: Number(editForm.valor) }).eq('id', h.id);
    setHonActual({...h, concepto: editForm.concepto, tipo_trabajo: editForm.tipo_trabajo, forma: editForm.forma, valor: Number(editForm.valor)});
    setEditando(false);
    recargar();
  }
  async function eliminarHonorario() {
    if (!confirm(`¿Eliminar el honorario "${h.concepto}"? Esta acción no se puede deshacer.`)) return;
    await supabase.from('cuotas').delete().eq('honorario_id', h.id);
    await supabase.from('honorarios').delete().eq('id', h.id);
    recargar();
    setVista('honorarios');
  }
  async function guardarDistrib() {
    const soma=distribSocios.reduce((s,ds)=>s+Number(ds.porcentaje||0),0);
    if (soma!==100) { alert(`La distribución debe sumar 100% (ahora suma ${soma}%).`); return; }
    setGuardandoDistrib(true);
    const gp=Number(gastosPorc||0);
    const factor=(100-gp)/100;
    await supabase.from('honorarios_socios').delete().eq('honorario_id', h.id);
    const rows=[];
    if (gp>0) rows.push({ honorario_id:h.id, perfil_id:null, porcentaje:gp, estudio_id:perfil.estudio_id, es_gasto:true });
    distribSocios.filter(ds=>Number(ds.porcentaje||0)>0).forEach(ds=>{
      rows.push({ honorario_id:h.id, perfil_id:ds.perfil_id, porcentaje:Number(ds.porcentaje)*factor, estudio_id:perfil.estudio_id, es_gasto:false });
    });
    if (rows.length) await supabase.from('honorarios_socios').insert(rows);
    setGuardandoDistrib('ok');
    setTimeout(()=>setGuardandoDistrib(false),2000);
  }

  const estadosDisp = h.en_cuotas ? ['pendiente','en proceso','pagado'] : ['pendiente','pagado'];

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <button onClick={()=>setVista('honorarios')} style={{padding:'7px 13px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff'}}>← Volver a honorarios</button>
        <button onClick={eliminarHonorario} style={{padding:'7px 13px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',color:'#A32D2D'}}>Eliminar honorario</button>
      </div>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
          <div style={{fontSize:18,fontWeight:600}}>{h.concepto}</div>
          <button onClick={()=>{setEditando(!editando);setEditForm({concepto:h.concepto,tipo_trabajo:h.tipo_trabajo||'',forma:h.forma,valor:h.valor});}}
            style={{padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',flexShrink:0}}>
            {editando?'Cancelar':'Editar'}
          </button>
        </div>
        {editando ? (
          <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:480,marginBottom:12}}>
            <input value={editForm.concepto} onChange={ev=>setEditForm({...editForm,concepto:ev.target.value})} placeholder="Concepto"
              style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,fontFamily:'system-ui'}} />
            <input value={editForm.tipo_trabajo} onChange={ev=>setEditForm({...editForm,tipo_trabajo:ev.target.value})} placeholder="Tipo de trabajo"
              style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,fontFamily:'system-ui'}} />
            <div style={{display:'flex',gap:6}}>
              {[['uhon','UHON'],['porcentaje','%'],['fijo','$ fijo']].map(([v,l])=>(
                <button key={v} onClick={()=>setEditForm({...editForm,forma:v})}
                  style={{flex:1,padding:'6px',border:editForm.forma===v?'1px solid #2B6CB0':'1px solid #e2e2e2',borderRadius:8,fontSize:12,cursor:'pointer',background:editForm.forma===v?'#E6F1FB':'#f9f8f5',color:editForm.forma===v?'#0C447C':'#4a4a4a'}}>{l}</button>
              ))}
            </div>
            <input type="number" value={editForm.valor} onChange={ev=>setEditForm({...editForm,valor:ev.target.value})} placeholder="Valor"
              style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,fontFamily:'system-ui'}} />
            <button onClick={guardarEdicion} style={{...btnPrimary,padding:'6px 12px',fontSize:12,alignSelf:'flex-start'}}>Guardar cambios</button>
          </div>
        ) : (
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
            {h.tipo_trabajo && <Badge bg="#EEEDFE" color="#3C3489">{h.tipo_trabajo}</Badge>}
            <Badge bg="#F1EFE8" color="#444441">{formaLabel(h, valorUhon)}</Badge>
            {exp && <Badge bg="#E6F1FB" color="#0C447C">Exp: {exp.caratula}</Badge>}
            {cli && <Badge bg="#FBEAF0" color="#72243E">Cliente: {nombreCompleto(cli)}</Badge>}
            {h.vinculo_tipo==='contraparte' && h.contraparte_nombre && <Badge bg="#F1EFE8" color="#444441">Contraparte: {h.contraparte_nombre}</Badge>}
            {h.en_cuotas && <Badge bg="#FAEEDA" color="#633806">En cuotas</Badge>}
            {h.fecha && <Badge bg="#F1EFE8" color="#444441">📅 {formatFecha(h.fecha)}</Badge>}
          </div>
        )}
        <div style={{borderTop:'1px solid #f5f5f3',paddingTop:12,marginBottom:12}}>
          <label style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:4,fontWeight:600}}>
            {h.forma==='uhon'?'CANTIDAD DE UHON':h.forma==='porcentaje'?'PORCENTAJE (%)':'MONTO FIJO ($)'}
          </label>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="number"
              defaultValue={h.valor}
              onBlur={async ev => {
                const nuevo = Number(ev.target.value);
                if (!nuevo || nuevo === h.valor) return;
                setHonActual({...h, valor: nuevo});
                await supabase.from('honorarios').update({ valor: nuevo }).eq('id', h.id);
                recargar();
              }}
              style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,width:140,fontFamily:'system-ui',background:'#F7F6F3'}} />
            <span style={{fontSize:12,color:'#8a8a8a'}}>
              {h.forma==='uhon' && valorUhon ? `= ${fmtMoneda(h.valor * valorUhon)}` : h.forma==='porcentaje' ? '%' : ''}
            </span>
          </div>
        </div>
        <div style={{borderTop:'1px solid #f5f5f3',paddingTop:12}}>
          <label style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:6,fontWeight:600}}>ESTADO {h.en_cuotas?'(sugerido por las cuotas, podés cambiarlo)':''}</label>
          <div style={{display:'flex',gap:6}}>
            {estadosDisp.map(es=>{
              const ec = HON_ESTADO_COLOR[es];
              const sel = h.estado===es;
              return <button key={es} onClick={()=>cambiarEstadoGeneral(es)}
                style={{padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                border:sel?`1px solid ${ec.color}`:'1px solid #e2e2e2', background:sel?ec.bg:'#fff', color:sel?ec.color:'#8a8a8a', fontFamily:'system-ui'}}>
                {es.charAt(0).toUpperCase()+es.slice(1)}
              </button>;
            })}
          </div>
        </div>
        {h.notas && <div style={{marginTop:12,fontSize:13,color:'#4a4a4a',fontStyle:'italic'}}>{h.notas}</div>}
      </Card>

      {perfilesEstudio.length > 0 && (
        <Card title="👥 Distribución entre socios">
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:600,color:'#4a4a4a',display:'block',marginBottom:6}}>Gastos del estudio</label>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <input type="number" min="0" max="100" value={gastosPorc}
                onChange={e=>setGastosPorc(e.target.value)}
                style={{width:70,padding:'5px 8px',border:'1px solid #DDDCDA',borderRadius:6,fontSize:13,fontFamily:'system-ui',textAlign:'right'}} />
              <span style={{fontSize:13,color:'#4a4a4a'}}>% del total</span>
            </div>
            <div style={{fontSize:11,color:'#8a8a8a'}}>Se descuenta del total antes de distribuir entre socios</div>
          </div>
          <label style={{fontSize:12,fontWeight:600,color:'#4a4a4a',display:'block',marginBottom:6}}>
            {'Distribución entre socios (sobre el '+Math.max(0,100-Number(gastosPorc||0))+'% restante)'}
          </label>
          {distribSocios.map((ds,i)=>(
            <div key={ds.perfil_id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{fontSize:13,color:'#4a4a4a',flex:1}}>{ds.nombre}</span>
              <input type="number" min="0" max="100" value={ds.porcentaje}
                onChange={ev=>{ const n=[...distribSocios]; n[i]={...n[i],porcentaje:ev.target.value}; setDistribSocios(n); }}
                style={{width:70,padding:'5px 8px',border:'1px solid #DDDCDA',borderRadius:6,fontSize:13,fontFamily:'system-ui',textAlign:'right'}} />
              <span style={{fontSize:13,color:'#4a4a4a'}}>%</span>
            </div>
          ))}
          {(()=>{
            const s=distribSocios.reduce((a,ds)=>a+Number(ds.porcentaje||0),0);
            const gp=Number(gastosPorc||0), factor=(100-gp)/100;
            const resumen='Gastos: '+gp+'% · '+distribSocios.filter(ds=>Number(ds.porcentaje||0)>0).map(ds=>ds.nombre+': '+(Number(ds.porcentaje)*factor).toFixed(1).replace(/\.0$/,'')+'%').join(' · ');
            return <>
              <div style={{fontSize:11,marginTop:4,marginBottom:s===100?4:10,color:s===100?'#27500A':s===0?'#8a8a8a':'#A32D2D'}}>
                {s===0?'Sin distribución configurada':s===100?'✓ 100%':'Suma '+s+'% — debe ser 100%'}
              </div>
              {s===100 && <div style={{fontSize:11,color:'#8a8a8a',marginBottom:10}}>{resumen}</div>}
            </>;
          })()}
          <button onClick={guardarDistrib}
            style={{...btnPrimary,padding:'7px 14px',
              background:guardandoDistrib==='ok'?'#27500A':btnPrimary.background,
              borderColor:guardandoDistrib==='ok'?'#27500A':btnPrimary.borderColor}}>
            {guardandoDistrib==='ok'?'✓ Guardado':'Guardar distribución'}
          </button>
        </Card>
      )}

      {h.en_cuotas && (
        <Card title="🧾 Cuotas">
          {cuotasH.length ? cuotasH.map(cu=>(
            <div key={cu.id} style={{padding:'10px 0',borderBottom:'1px solid #F0EFED'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div
                  onClick={()=>{ if(cu.estado==='pagada'){ toggleCuota(cu); } else { setConfirmandoPagoId(cu.id); setFechaPago(HOY); } }}
                  style={{width:16,height:16,borderRadius:4,border:cu.estado==='pagada'?'none':'1.5px solid #c9c9c4',background:cu.estado==='pagada'?'#2B6CB0':'#fff',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10}}>{cu.estado==='pagada'?'✓':''}</div>
                <div style={{flex:1}}>
                  <span style={{fontSize:13,fontWeight:500}}>Cuota {cu.numero}</span>
                  <span style={{fontSize:13,marginLeft:10}}>{fmtMoneda(cu.monto)}</span>
                  {cu.vencimiento && <span style={{fontSize:11,color:'#8a8a8a',marginLeft:10}}>vence {formatFecha(cu.vencimiento)}</span>}
                  {cu.fecha_pago && <span style={{fontSize:11,color:'#27500A',marginLeft:10}}>pagada {formatFecha(cu.fecha_pago)}</span>}
                </div>
                <Badge bg={cu.estado==='pagada'?'#EAF3DE':'#FAEEDA'} color={cu.estado==='pagada'?'#27500A':'#633806'}>{cu.estado}</Badge>
                <button onClick={()=>borrarCuota(cu)} style={{fontSize:11,color:'#A32D2D',background:'none',border:'none',cursor:'pointer'}}>borrar</button>
              </div>
              {confirmandoPagoId===cu.id && (
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8,paddingLeft:24,flexWrap:'wrap',background:'#F7F6F3',borderRadius:8,padding:'8px 12px 8px 24px'}}>
                  <span style={{fontSize:12,color:'#4a4a4a',fontWeight:500}}>Fecha de pago:</span>
                  <input type="date" value={fechaPago} onChange={e=>setFechaPago(e.target.value)}
                    style={{padding:'4px 8px',border:'1px solid #DDDCDA',borderRadius:6,fontSize:12,fontFamily:'system-ui'}} />
                  <button onClick={()=>confirmarPago(cu)} style={{...btnPrimary,padding:'4px 10px',fontSize:12}}>Confirmar pago</button>
                  <button onClick={()=>setConfirmandoPagoId(null)} style={{fontSize:11,color:'#6B7280',background:'none',border:'none',cursor:'pointer'}}>cancelar</button>
                </div>
              )}
            </div>
          )) : <div style={{color:'#8a8a8a',fontSize:12,textAlign:'center',padding:14}}>Sin cuotas cargadas todavía.</div>}
          <div style={{display:'flex',gap:8,marginTop:12,alignItems:'flex-end',flexWrap:'wrap'}}>
            <div>
              <label style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:4}}>Monto cuota</label>
              <input type="number" value={nuevaCuota.monto} onChange={e=>setNuevaCuota({...nuevaCuota,monto:e.target.value})} placeholder="Ej: 100000"
                style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,width:130,fontFamily:'system-ui'}} />
            </div>
            <div>
              <label style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:4}}>Vencimiento</label>
              <input type="date" value={nuevaCuota.vencimiento} onChange={e=>setNuevaCuota({...nuevaCuota,vencimiento:e.target.value})}
                style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,fontFamily:'system-ui'}} />
            </div>
            <button onClick={agregarCuota} style={{...btnPrimary,padding:'8px 14px'}}>+ Agregar cuota</button>
          </div>
        </Card>
      )}
    </div>
  );
}

function CambiarPassword({ setVista }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setMsg(''); setError('');
    if (!actual || !nueva || !confirmar) { setError('Completá todos los campos.'); return; }
    if (nueva.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if (nueva !== confirmar) { setError('Las contraseñas nuevas no coinciden.'); return; }
    setGuardando(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: actual });
    if (signInError) { setError('La contraseña actual es incorrecta.'); setGuardando(false); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password: nueva });
    setGuardando(false);
    if (updateError) { setError('Error al actualizar: ' + updateError.message); return; }
    setMsg('Contraseña actualizada correctamente.');
    setActual(''); setNueva(''); setConfirmar('');
  }

  return (
    <Card title="🔑 Cambiar contraseña">
      <div style={{maxWidth:400}}>
        {msg && <div style={{background:'#EAF3DE',border:'1px solid #C0DD97',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#27500A',marginBottom:14}}>✓ {msg}</div>}
        {error && <div style={{background:'#FCEBEB',border:'1px solid #E8AAAA',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#791F1F',marginBottom:14}}>{error}</div>}
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Contraseña actual</label>
        <input type="password" style={inputStyle} value={actual} onChange={e=>setActual(e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Nueva contraseña</label>
        <input type="password" style={inputStyle} value={nueva} onChange={e=>setNueva(e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Confirmar nueva contraseña</label>
        <input type="password" style={inputStyle} value={confirmar} onChange={e=>setConfirmar(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&guardar()} />
        <div style={{display:'flex',gap:8,marginTop:4}}>
          <button onClick={guardar} disabled={guardando} style={btnPrimary}>{guardando?'Guardando...':'Actualizar contraseña'}</button>
          <button onClick={()=>setVista('dashboard')} style={{padding:'8px 13px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff'}}>Cancelar</button>
        </div>
      </div>
    </Card>
  );
}

function NuevaTarea({ perfil, recargar, expedientes, clientes }) {
  const [f, setF] = useState({ descripcion:'', responsable:'', deadline:'', comentario:'' });
  useEffect(()=>{ if(perfil?.nombre) setF(prev=>({...prev, responsable: prev.responsable||perfil.nombre})); }, [perfil]);
  const [msg, setMsg] = useState('');
  const [vinculo, setVinculo] = useState('ninguno');
  const [vincQ, setVincQ] = useState('');
  const [vincId, setVincId] = useState('');
  const [vincNombre, setVincNombre] = useState('');
  const [vincAbierto, setVincAbierto] = useState(false);
  const set = (k,v)=>setF({...f,[k]:v});
  const sugsExp = vinculo==='expediente' && vincQ
    ? expedientes.filter(e=>(e.caratula||'').toLowerCase().includes(vincQ.toLowerCase())||(e.numero||'').toLowerCase().includes(vincQ.toLowerCase())).slice(0,8)
    : [];
  const sugsCli = vinculo==='cliente' && vincQ
    ? clientes.filter(cl=>(nombreCompleto(cl)||'').toLowerCase().includes(vincQ.toLowerCase())).slice(0,8)
    : [];
  async function guardar() {
    if (!f.descripcion||!f.responsable) { alert('Completá descripción y responsable (*)'); return; }
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    const payload = {
      ...f,
      estudio_id: perfil.estudio_id,
      estado: 'pendiente',
      deadline: f.deadline||null,
      expediente_id: vinculo==='expediente' ? vincId||null : null,
      cliente_id: vinculo==='cliente' ? vincId||null : null,
    };
    const { error } = await supabase.from('tareas').insert(payload);
    if (error) { alert('Error: '+error.message); return; }
    setMsg(`Tarea asignada a ${f.responsable} creada.`);
    setF({ descripcion:'', responsable:'', deadline:'', comentario:'' });
    setVinculo('ninguno'); setVincQ(''); setVincId(''); setVincNombre(''); setVincAbierto(false);
    recargar();
    setTimeout(()=>setMsg(''),3000);
  }
  return (
    <Card title="✅ Nueva tarea">
      {msg && <div style={{background:'#EAF3DE',border:'1px solid #C0DD97',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#27500A',marginBottom:14}}>✓ {msg}</div>}
      <div style={{maxWidth:520}}>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Descripción *</label>
        <textarea style={{...inputStyle,minHeight:72,resize:'vertical'}} value={f.descripcion} onChange={e=>set('descripcion',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Responsable *</label>
        <SocioChips value={f.responsable} onChange={v=>set('responsable',v)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Vencimiento (opcional)</label>
        <input type="date" style={inputStyle} value={f.deadline} onChange={e=>set('deadline',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Vincular a (opcional)</label>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {[['ninguno','Sin vincular'],['expediente','Expediente'],['cliente','Cliente']].map(([v,l])=>(
            <button key={v} onClick={()=>{setVinculo(v);setVincQ('');setVincId('');setVincNombre('');setVincAbierto(false);}}
              style={{flex:1,padding:'7px 6px',border:vinculo===v?'1px solid #2B6CB0':'1px solid #e2e2e2',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',background:vinculo===v?'#E6F1FB':'#f9f8f5',color:vinculo===v?'#0C447C':'#4a4a4a',fontFamily:'system-ui'}}>{l}</button>
          ))}
        </div>
        {(vinculo==='expediente'||vinculo==='cliente') && (
          <div style={{position:'relative',marginBottom:12}}>
            <input
              style={{...inputStyle,marginBottom:0}}
              placeholder={vinculo==='expediente'?'N° o carátula del expediente...':'Nombre del cliente...'}
              value={vincNombre||vincQ}
              onChange={ev=>{setVincQ(ev.target.value);setVincId('');setVincNombre('');setVincAbierto(true);}}
              onFocus={()=>setVincAbierto(true)}
              onBlur={()=>setTimeout(()=>setVincAbierto(false),150)}
            />
            {vincId && <div style={{fontSize:11,color:'#27500A',marginTop:4}}>✓ {vincNombre}</div>}
            {vincAbierto && (vinculo==='expediente'?sugsExp:sugsCli).length>0 && (
              <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1px solid #DDDCDA',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:10,maxHeight:220,overflowY:'auto',marginTop:2}}>
                {(vinculo==='expediente'?sugsExp:sugsCli).map(item=>(
                  <div key={item.id}
                    onMouseDown={ev=>ev.preventDefault()}
                    onClick={()=>{setVincId(item.id);setVincNombre(vinculo==='expediente'?item.caratula:nombreCompleto(item));setVincQ('');setVincAbierto(false);}}
                    style={{padding:'9px 12px',cursor:'pointer',fontSize:12,borderBottom:'1px solid #F0EFED',color:'#1a1a1a'}}>
                    {vinculo==='expediente'
                      ? <><span style={{color:'#6B7280',fontSize:11}}>{item.numero} — </span>{item.caratula}</>
                      : nombreCompleto(item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Comentario (opcional)</label>
        <textarea style={{...inputStyle,minHeight:56,resize:'vertical'}} value={f.comentario} onChange={e=>set('comentario',e.target.value)} />
        <button onClick={guardar} style={btnPrimary}>Crear tarea</button>
      </div>
    </Card>
  );
}

const TIPOS_AUDIENCIA = ['Audiencia preliminar','Vista de causa','Audiencia de prueba','Alegatos','Sentencia','Conciliación','Otra'];
const TIPOS_TURNO = ['Consulta inicial','Firma de documentos','Reunión interna','Asesoramiento','Entrega de documentos','Otro'];
const DIAS_SEM_AG = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const MESES_AG = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function AgendaModule({ tabla, titulo, emoji, expedientes, clientes, perfil }) {
  const tipos = tabla==='audiencias' ? TIPOS_AUDIENCIA : TIPOS_TURNO;
  const [eventos, setEventos] = useState([]);
  const [vistaAg, setVistaAg] = useState('mes');
  const [navDate, setNavDate] = useState(new Date(HOY+'T00:00:00'));
  const [mostrarForm, setMostrarForm] = useState(false);
  const [eventoEdit, setEventoEdit] = useState(null);
  const [fechaPres, setFechaPres] = useState(HOY);
  const [detalleEv, setDetalleEv] = useState(null);

  useEffect(()=>{ cargar(); },[]);

  async function cargar() {
    const { data } = await supabase.from(tabla).select('*')
      .eq('estudio_id','51cc9627-71d2-4cab-a3d5-c5490b3b3e4b')
      .order('fecha').order('hora',{nullsFirst:false});
    setEventos(data||[]);
  }

  function dateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function evsDia(fs) {
    return eventos.filter(e=>e.fecha===fs).sort((a,b)=>(a.hora||'').localeCompare(b.hora||''));
  }
  function fmtH(h) { return h?h.substring(0,5):''; }

  function abrirNuevo(fecha) {
    setEventoEdit(null); setFechaPres(fecha||HOY); setDetalleEv(null); setMostrarForm(true);
  }
  function abrirEditar(ev) {
    setEventoEdit(ev); setFechaPres(ev.fecha); setDetalleEv(null); setMostrarForm(true);
  }
  function abrirDetalle(ev) { setDetalleEv(ev); setMostrarForm(false); }
  function cerrar() { setMostrarForm(false); setDetalleEv(null); }

  async function guardar(datos) {
    if (eventoEdit) {
      await supabase.from(tabla).update(datos).eq('id',eventoEdit.id);
    } else {
      await supabase.from(tabla).insert({...datos,estudio_id:'51cc9627-71d2-4cab-a3d5-c5490b3b3e4b'});
    }
    cerrar(); cargar();
  }
  async function eliminar(id) {
    if (!confirm('¿Eliminar este evento?')) return;
    await supabase.from(tabla).delete().eq('id',id);
    cerrar(); cargar();
  }

  const año = navDate.getFullYear();
  const mes = navDate.getMonth();

  function navAnt() {
    if (vistaAg==='mes') setNavDate(new Date(año,mes-1,1));
    else if (vistaAg==='semana') setNavDate(new Date(navDate.getTime()-7*864e5));
    else setNavDate(new Date(navDate.getTime()-864e5));
  }
  function navSig() {
    if (vistaAg==='mes') setNavDate(new Date(año,mes+1,1));
    else if (vistaAg==='semana') setNavDate(new Date(navDate.getTime()+7*864e5));
    else setNavDate(new Date(navDate.getTime()+864e5));
  }

  const lunSem = new Date(navDate);
  lunSem.setDate(navDate.getDate()-((navDate.getDay()+6)%7));

  let navTit = '';
  if (vistaAg==='mes') navTit = `${MESES_AG[mes]} ${año}`;
  else if (vistaAg==='semana') {
    const domSem = new Date(lunSem); domSem.setDate(lunSem.getDate()+6);
    navTit = `${lunSem.getDate()} ${MESES_AG[lunSem.getMonth()].substring(0,3)} — ${domSem.getDate()} ${MESES_AG[domSem.getMonth()].substring(0,3)} ${domSem.getFullYear()}`;
  } else {
    navTit = `${navDate.getDate()} de ${MESES_AG[mes]} ${año}`;
  }

  const chipBg = tabla==='audiencias'?'#9B4F6A':'#2B6CB0';

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:22,fontWeight:700,color:'#1A1A1A'}}>{emoji} {titulo}</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{display:'flex',border:'1px solid #DDDCDA',borderRadius:8,overflow:'hidden'}}>
            {[['mes','Mes'],['semana','Semana'],['dia','Día']].map(([v,l])=>(
              <button key={v} onClick={()=>setVistaAg(v)}
                style={{padding:'6px 14px',fontSize:12,fontWeight:vistaAg===v?600:400,cursor:'pointer',border:'none',
                  background:vistaAg===v?'#9B4F6A':'#fff',color:vistaAg===v?'#fff':'#6B7280',fontFamily:'system-ui'}}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={()=>abrirNuevo(HOY)} style={btnPrimary}>+ Nuevo</button>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
        <button onClick={navAnt} style={{background:'none',border:'1px solid #DDDCDA',borderRadius:8,padding:'4px 12px',cursor:'pointer',fontSize:16,color:'#4a4a4a'}}>‹</button>
        <span style={{fontWeight:600,fontSize:14,color:'#2c2c2c',minWidth:220,textAlign:'center'}}>{navTit}</span>
        <button onClick={navSig} style={{background:'none',border:'1px solid #DDDCDA',borderRadius:8,padding:'4px 12px',cursor:'pointer',fontSize:16,color:'#4a4a4a'}}>›</button>
        <button onClick={()=>setNavDate(new Date(HOY+'T00:00:00'))} style={{fontSize:11,color:'#6B7280',background:'none',border:'1px solid #DDDCDA',borderRadius:6,padding:'3px 8px',cursor:'pointer',fontFamily:'system-ui'}}>Hoy</button>
      </div>

      {vistaAg==='mes' && (()=>{
        const primer = new Date(año,mes,1).getDay();
        const offset = (primer+6)%7;
        const ultDia = new Date(año,mes+1,0).getDate();
        const celdas = [];
        for (let i=0;i<offset;i++) celdas.push(null);
        for (let d=1;d<=ultDia;d++) celdas.push(d);
        return (
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4}}>
              {DIAS_SEM_AG.map(d=><div key={d} style={{textAlign:'center',fontSize:11,fontWeight:600,color:'#8a8a8a',padding:'4px 0'}}>{d}</div>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
              {celdas.map((d,i)=>{
                if (!d) return <div key={`b${i}`} style={{minHeight:72}} />;
                const fs = `${año}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                const evs = evsDia(fs);
                const esHoy = fs===HOY;
                return (
                  <div key={d} onClick={()=>abrirNuevo(fs)}
                    style={{minHeight:72,borderRadius:8,padding:'5px 4px',cursor:'pointer',
                      background:esHoy?'#EBF2FA':'#F7F6F3',border:esHoy?'1.5px solid #2B6CB0':'1.5px solid transparent'}}
                    onMouseEnter={e=>{if(!esHoy)e.currentTarget.style.background='#F0EEE8';}}
                    onMouseLeave={e=>{if(!esHoy)e.currentTarget.style.background='#F7F6F3';}}>
                    <div style={{fontSize:12,fontWeight:esHoy?700:400,color:esHoy?'#2B6CB0':'#4a4a4a',marginBottom:2}}>{d}</div>
                    {evs.slice(0,2).map(ev=>(
                      <div key={ev.id} onClick={e=>{e.stopPropagation();abrirDetalle(ev);}}
                        style={{fontSize:10,background:chipBg,color:'#fff',borderRadius:4,padding:'1px 4px',
                          marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer'}}>
                        {fmtH(ev.hora)&&`${fmtH(ev.hora)} `}{(ev.tipo||'').substring(0,18)}
                      </div>
                    ))}
                    {evs.length>2 && <div style={{fontSize:9,color:'#8a8a8a'}}>+{evs.length-2} más</div>}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {vistaAg==='semana' && (()=>{
        const dias = Array.from({length:7},(_,i)=>{const d=new Date(lunSem);d.setDate(lunSem.getDate()+i);return d;});
        return (
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
              {dias.map(d=>{
                const fs = dateStr(d);
                const evs = evsDia(fs);
                const esHoy = fs===HOY;
                return (
                  <div key={fs} onClick={()=>abrirNuevo(fs)}
                    style={{minHeight:120,borderRadius:10,padding:'8px 6px',cursor:'pointer',
                      background:esHoy?'#EBF2FA':'#F7F6F3',border:esHoy?'1.5px solid #2B6CB0':'1.5px solid transparent'}}>
                    <div style={{fontSize:11,fontWeight:600,color:esHoy?'#2B6CB0':'#4a4a4a'}}>{DIAS_SEM_AG[(d.getDay()+6)%7]}</div>
                    <div style={{fontSize:18,fontWeight:700,color:esHoy?'#2B6CB0':'#1a1a1a',marginBottom:6}}>{d.getDate()}</div>
                    {evs.map(ev=>(
                      <div key={ev.id} onClick={e=>{e.stopPropagation();abrirDetalle(ev);}}
                        style={{fontSize:10,background:chipBg,color:'#fff',borderRadius:4,padding:'2px 5px',
                          marginBottom:3,cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {fmtH(ev.hora)&&`${fmtH(ev.hora)} `}{(ev.tipo||'').substring(0,20)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {vistaAg==='dia' && (()=>{
        const fs = dateStr(navDate);
        const evs = evsDia(fs);
        return (
          <Card>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <span style={{fontSize:14,fontWeight:600,color:'#1a1a1a'}}>Eventos del día</span>
              <button onClick={()=>abrirNuevo(fs)} style={{...btnPrimary,padding:'6px 12px',fontSize:12}}>+ Agregar</button>
            </div>
            {evs.length===0 && <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:30}}>Sin eventos para este día.</div>}
            {evs.map(ev=>{
              const exp=(expedientes||[]).find(e=>e.id===ev.expediente_id);
              const cli=(clientes||[]).find(c=>c.id===ev.cliente_id);
              const vinc=exp?exp.caratula:cli?nombreCompleto(cli):null;
              return (
                <div key={ev.id} onClick={()=>abrirDetalle(ev)}
                  style={{display:'flex',gap:14,padding:'12px 0',borderBottom:'1px solid #F0EFED',cursor:'pointer'}}>
                  <div style={{width:48,flexShrink:0,textAlign:'right'}}>
                    <div style={{fontSize:15,fontWeight:700,color:chipBg}}>{fmtH(ev.hora)||'—'}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:3}}>{ev.tipo||'Evento'}</div>
                    {ev.descripcion&&<div style={{fontSize:12,color:'#4a4a4a',marginBottom:4}}>{ev.descripcion}</div>}
                    {vinc&&<div style={{fontSize:11,color:'#8a8a8a',marginBottom:3}}>📁 {vinc}</div>}
                    {ev.responsable&&(
                      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                        {ev.responsable.split(',').map(s=>s.trim()).filter(Boolean).map(r=>(
                          <Badge key={r} bg={socioColor(r).bg} color={socioColor(r).color}>{r}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        );
      })()}

      {detalleEv&&!mostrarForm&&(
        <AgendaDetalle ev={detalleEv} expedientes={expedientes||[]} clientes={clientes||[]}
          onEditar={()=>abrirEditar(detalleEv)} onEliminar={()=>eliminar(detalleEv.id)} onCerrar={cerrar} />
      )}

      {mostrarForm&&(
        <AgendaForm tabla={tabla} tipos={tipos} fechaPres={fechaPres} eventoEdit={eventoEdit}
          expedientes={expedientes||[]} clientes={clientes||[]} perfil={perfil}
          onGuardar={guardar} onCancelar={cerrar} />
      )}
    </div>
  );
}

function AgendaDetalle({ ev, expedientes, clientes, onEditar, onEliminar, onCerrar }) {
  const exp = expedientes.find(e=>e.id===ev.expediente_id);
  const cli = clientes.find(c=>c.id===ev.cliente_id);
  const vinc = exp?exp.caratula:cli?nombreCompleto(cli):null;
  return (
    <Card>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div style={{fontSize:16,fontWeight:600,color:'#1a1a1a'}}>{ev.tipo||'Evento'}</div>
        <button onClick={onCerrar} style={{fontSize:12,color:'#6B7280',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>✕ Cerrar</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 24px',fontSize:13,marginBottom:16}}>
        <div><span style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:2}}>Fecha</span>{formatFecha(ev.fecha)||ev.fecha}</div>
        <div><span style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:2}}>Hora</span>{ev.hora?ev.hora.substring(0,5):'—'}</div>
        {vinc&&<div style={{gridColumn:'1/3'}}><span style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:2}}>Vinculado a</span>{vinc}</div>}
        {ev.descripcion&&<div style={{gridColumn:'1/3'}}><span style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:2}}>Descripción</span><span style={{lineHeight:1.5}}>{ev.descripcion}</span></div>}
        {ev.responsable&&(
          <div style={{gridColumn:'1/3'}}>
            <span style={{fontSize:11,color:'#8a8a8a',display:'block',marginBottom:4}}>Responsable</span>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {ev.responsable.split(',').map(s=>s.trim()).filter(Boolean).map(r=>(
                <Badge key={r} bg={socioColor(r).bg} color={socioColor(r).color}>{r}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={onEditar} style={btnPrimary}>Editar</button>
        <button onClick={onEliminar} style={{padding:'9px 16px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',color:'#A32D2D',fontFamily:'system-ui',fontWeight:500}}>Eliminar</button>
      </div>
    </Card>
  );
}

function AgendaForm({ tabla, tipos, fechaPres, eventoEdit, expedientes, clientes, perfil, onGuardar, onCancelar }) {
  const [f, setF] = useState({
    fecha: eventoEdit?.fecha||fechaPres||HOY,
    hora: eventoEdit?.hora||'',
    tipo: eventoEdit?.tipo||tipos[0]||'',
    descripcion: eventoEdit?.descripcion||'',
    responsable: eventoEdit?.responsable||perfil?.nombre||'',
  });
  const [tiposCustom, setTiposCustom] = useState([]);
  const [tipoAbierto, setTipoAbierto] = useState(false);
  const [vinculo, setVinculo] = useState(
    eventoEdit?.expediente_id?'expediente':eventoEdit?.cliente_id?'cliente':'ninguno'
  );
  const [vincQ, setVincQ] = useState('');
  const [vincId, setVincId] = useState(eventoEdit?.expediente_id||eventoEdit?.cliente_id||'');
  const [vincNombre, setVincNombre] = useState(()=>{
    if (eventoEdit?.expediente_id) return expedientes.find(e=>e.id===eventoEdit.expediente_id)?.caratula||'';
    if (eventoEdit?.cliente_id) return nombreCompleto(clientes.find(c=>c.id===eventoEdit.cliente_id))||'';
    return '';
  });
  const [vincAbierto, setVincAbierto] = useState(false);
  const set = (k,v)=>setF(p=>({...p,[k]:v}));

  useEffect(()=>{
    supabase.from('agenda_tipos').select('nombre')
      .eq('estudio_id','51cc9627-71d2-4cab-a3d5-c5490b3b3e4b')
      .eq('modulo',tabla)
      .order('nombre')
      .then(({data})=>setTiposCustom((data||[]).map(r=>r.nombre)));
  },[]);

  const allTipos = [...new Set([...tipos,...tiposCustom])];
  const tiposSugs = f.tipo
    ? allTipos.filter(t=>t.toLowerCase().includes(f.tipo.toLowerCase()))
    : allTipos;
  const esNuevoTipo = f.tipo && !allTipos.map(t=>t.toLowerCase()).includes(f.tipo.toLowerCase());

  const sugsExp = vinculo==='expediente'&&vincQ ? expedientes.filter(e=>(e.caratula||'').toLowerCase().includes(vincQ.toLowerCase())||(e.numero||'').includes(vincQ)).slice(0,8) : [];
  const sugsCli = vinculo==='cliente'&&vincQ ? clientes.filter(c=>(nombreCompleto(c)||'').toLowerCase().includes(vincQ.toLowerCase())).slice(0,8) : [];

  async function guardar() {
    if (!f.fecha) { alert('La fecha es obligatoria.'); return; }
    if (f.tipo && esNuevoTipo) {
      await supabase.from('agenda_tipos').insert({
        estudio_id:'51cc9627-71d2-4cab-a3d5-c5490b3b3e4b', modulo:tabla, nombre:f.tipo
      });
    }
    onGuardar({
      fecha: f.fecha,
      hora: f.hora||null,
      tipo: f.tipo||null,
      descripcion: f.descripcion||null,
      responsable: f.responsable||null,
      expediente_id: vinculo==='expediente'?vincId||null:null,
      cliente_id: vinculo==='cliente'?vincId||null:null,
    });
  }

  return (
    <Card title={eventoEdit?'Editar evento':'Nuevo evento'}>
      <div style={{maxWidth:520}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Fecha *</label>
            <input type="date" style={inputStyle} value={f.fecha} onChange={e=>set('fecha',e.target.value)} />
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Hora</label>
            <input type="time" style={inputStyle} value={f.hora} onChange={e=>set('hora',e.target.value)} />
          </div>
        </div>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Tipo</label>
        <div style={{position:'relative',marginBottom:12}}>
          <input style={{...inputStyle,marginBottom:0}}
            placeholder="Escribí o elegí un tipo..."
            value={f.tipo}
            onChange={e=>{set('tipo',e.target.value);setTipoAbierto(true);}}
            onFocus={()=>setTipoAbierto(true)}
            onBlur={()=>setTimeout(()=>setTipoAbierto(false),150)} />
          {tipoAbierto&&tiposSugs.length>0&&(
            <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1px solid #DDDCDA',
              borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:10,maxHeight:200,overflowY:'auto',marginTop:2}}>
              {tiposSugs.map(t=>(
                <div key={t} onMouseDown={e=>e.preventDefault()}
                  onClick={()=>{set('tipo',t);setTipoAbierto(false);}}
                  style={{padding:'9px 12px',cursor:'pointer',fontSize:13,borderBottom:'1px solid #F0EFED',color:'#1a1a1a',
                    display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>{t}</span>
                  {!tipos.includes(t)&&<span style={{fontSize:10,color:'#9B4F6A',background:'#FBEAF0',borderRadius:4,padding:'1px 5px',flexShrink:0,marginLeft:8}}>personalizado</span>}
                </div>
              ))}
            </div>
          )}
          {esNuevoTipo&&<div style={{fontSize:11,color:'#9B4F6A',marginTop:4}}>Se guardará como tipo personalizado</div>}
        </div>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Vincular a</label>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {[['ninguno','Sin vincular'],['expediente','Expediente'],['cliente','Cliente']].map(([v,l])=>(
            <button key={v} type="button" onClick={()=>{setVinculo(v);setVincQ('');setVincId('');setVincNombre('');}}
              style={{flex:1,padding:'7px 6px',border:vinculo===v?'1px solid #2B6CB0':'1px solid #e2e2e2',borderRadius:8,
                fontSize:12,fontWeight:500,cursor:'pointer',background:vinculo===v?'#E6F1FB':'#f9f8f5',
                color:vinculo===v?'#0C447C':'#4a4a4a',fontFamily:'system-ui'}}>{l}</button>
          ))}
        </div>
        {(vinculo==='expediente'||vinculo==='cliente')&&(
          <div style={{position:'relative',marginBottom:12}}>
            <input style={{...inputStyle,marginBottom:0}}
              placeholder={vinculo==='expediente'?'N° o carátula...':'Nombre del cliente...'}
              value={vincNombre||vincQ}
              onChange={ev=>{setVincQ(ev.target.value);setVincId('');setVincNombre('');setVincAbierto(true);}}
              onFocus={()=>setVincAbierto(true)}
              onBlur={()=>setTimeout(()=>setVincAbierto(false),150)} />
            {vincId&&<div style={{fontSize:11,color:'#27500A',marginTop:4}}>✓ {vincNombre}</div>}
            {vincAbierto&&(vinculo==='expediente'?sugsExp:sugsCli).length>0&&(
              <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1px solid #DDDCDA',
                borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:10,maxHeight:200,overflowY:'auto',marginTop:2}}>
                {(vinculo==='expediente'?sugsExp:sugsCli).map(item=>(
                  <div key={item.id} onMouseDown={e=>e.preventDefault()}
                    onClick={()=>{setVincId(item.id);setVincNombre(vinculo==='expediente'?item.caratula:nombreCompleto(item));setVincQ('');setVincAbierto(false);}}
                    style={{padding:'9px 12px',cursor:'pointer',fontSize:12,borderBottom:'1px solid #F0EFED',color:'#1a1a1a'}}>
                    {vinculo==='expediente'
                      ?<><span style={{color:'#6B7280',fontSize:11}}>{item.numero} — </span>{item.caratula}</>
                      :nombreCompleto(item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Descripción</label>
        <textarea style={{...inputStyle,minHeight:64,resize:'vertical'}} value={f.descripcion} onChange={e=>set('descripcion',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Responsable</label>
        <SocioChips value={f.responsable} onChange={v=>set('responsable',v)} />
        <div style={{display:'flex',gap:8,marginTop:4}}>
          <button onClick={guardar} style={btnPrimary}>Guardar</button>
          <button onClick={onCancelar} style={{padding:'9px 16px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',fontFamily:'system-ui'}}>Cancelar</button>
        </div>
      </div>
    </Card>
  );
}

function AgendaUnificada({ expedientes, clientes, tareas, perfil, setVista, setExpActual, filtro }) {
  const [audiencias, setAudiencias] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [vistaAg, setVistaAg] = useState('mes');
  const [navDate, setNavDate] = useState(new Date(HOY+'T00:00:00'));
  const [detalleEv, setDetalleEv] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [fechaPres, setFechaPres] = useState(HOY);

  useEffect(()=>{ cargar(); },[]);

  async function cargar() {
    const [{ data: a },{ data: t }] = await Promise.all([
      supabase.from('audiencias').select('*').eq('estudio_id','51cc9627-71d2-4cab-a3d5-c5490b3b3e4b'),
      supabase.from('turnos').select('*').eq('estudio_id','51cc9627-71d2-4cab-a3d5-c5490b3b3e4b'),
    ]);
    setAudiencias(a||[]);
    setTurnos(t||[]);
  }

  async function eliminarEvento(ev) {
    if (ev._tipo!=='audiencia'&&ev._tipo!=='turno') return;
    const tabla = ev._tipo==='audiencia'?'audiencias':'turnos';
    if (!confirm('¿Eliminar este evento?')) return;
    await supabase.from(tabla).delete().eq('id',ev.id);
    setDetalleEv(null);
    cargar();
  }

  function abrirNuevo(fecha) { setFechaPres(fecha||HOY); setDetalleEv(null); setMostrarForm(true); }
  function cerrarForm() { setMostrarForm(false); }
  async function guardarEvento(datos) {
    const tablaEv = filtro==='audiencias'?'audiencias':'turnos';
    await supabase.from(tablaEv).insert({...datos,estudio_id:'51cc9627-71d2-4cab-a3d5-c5490b3b3e4b'});
    cerrarForm();
    cargar();
  }

  const vencFiltrados = (expedientes||[]).filter(e=>e.proximo_vencimiento);
  const tareasConDeadline = (tareas||[]).filter(e=>e.deadline&&normEstado(e.estado)!=='terminado');
  const AU_COLOR = '#9B4F6A';
  const TU_COLOR = '#2B6CB0';
  const VE_COLOR = '#B45309';
  const TA_COLOR = '#D97706';

  const filtroToTipo = {vencimientos:'vencimiento',audiencias:'audiencia',turnos:'turno',tareas:'tarea'};
  const tipoActivo = filtro ? filtroToTipo[filtro] : null;

  function chipColor(tipo) {
    if (tipo==='audiencia') return AU_COLOR;
    if (tipo==='turno') return TU_COLOR;
    if (tipo==='tarea') return TA_COLOR;
    return VE_COLOR;
  }

  function dateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function eventosDelDia(fs) {
    const todos = [
      ...(!tipoActivo||tipoActivo==='audiencia'?audiencias.filter(e=>e.fecha===fs).map(e=>({...e,_tipo:'audiencia'})):[]),
      ...(!tipoActivo||tipoActivo==='turno'?turnos.filter(e=>e.fecha===fs).map(e=>({...e,_tipo:'turno'})):[]),
      ...(!tipoActivo||tipoActivo==='tarea'?tareasConDeadline.filter(e=>e.deadline===fs).map(e=>({...e,_tipo:'tarea'})):[]),
      ...(!tipoActivo||tipoActivo==='vencimiento'?vencFiltrados.filter(e=>e.proximo_vencimiento===fs).map(e=>({...e,_tipo:'vencimiento'})):[]),
    ];
    return todos.sort((a,b)=>{
      const orden = {audiencia:0,turno:1,tarea:2,vencimiento:3};
      if (orden[a._tipo]!==orden[b._tipo]) return orden[a._tipo]-orden[b._tipo];
      return (a.hora||'').localeCompare(b.hora||'');
    });
  }

  function fmtH(h) { return h?h.substring(0,5):''; }

  function chipLabel(ev) {
    if (ev._tipo==='vencimiento') return (ev.motivo_vencimiento||(ev.caratula||'').split(' c/')[0]).substring(0,20);
    if (ev._tipo==='tarea') return (ev.descripcion||'Tarea').substring(0,20);
    return `${fmtH(ev.hora)?fmtH(ev.hora)+' ':''}${(ev.tipo||'').substring(0,16)}`;
  }

  function handleChipClick(e, ev) {
    e.stopPropagation();
    if (ev._tipo==='vencimiento') {
      const exp = expedientes.find(x=>x.id===ev.id);
      if (exp) { setExpActual(exp); setVista('detalle'); }
    } else if (ev._tipo==='tarea') {
      setVista('tareas');
    } else {
      setDetalleEv(ev);
    }
  }

  function handleEvClick(ev) {
    if (ev._tipo==='vencimiento') {
      const exp = expedientes.find(x=>x.id===ev.id);
      if (exp) { setExpActual(exp); setVista('detalle'); }
    } else if (ev._tipo==='tarea') {
      setVista('tareas');
    } else {
      setDetalleEv(ev);
    }
  }

  const año = navDate.getFullYear();
  const mes = navDate.getMonth();

  function navAnt() {
    if (vistaAg==='mes') setNavDate(new Date(año,mes-1,1));
    else if (vistaAg==='semana') setNavDate(new Date(navDate.getTime()-7*864e5));
    else setNavDate(new Date(navDate.getTime()-864e5));
  }
  function navSig() {
    if (vistaAg==='mes') setNavDate(new Date(año,mes+1,1));
    else if (vistaAg==='semana') setNavDate(new Date(navDate.getTime()+7*864e5));
    else setNavDate(new Date(navDate.getTime()+864e5));
  }

  const lunSem = new Date(navDate);
  lunSem.setDate(navDate.getDate()-((navDate.getDay()+6)%7));

  let navTit = '';
  if (vistaAg==='mes') navTit = `${MESES_AG[mes]} ${año}`;
  else if (vistaAg==='semana') {
    const domSem = new Date(lunSem); domSem.setDate(lunSem.getDate()+6);
    navTit = `${lunSem.getDate()} ${MESES_AG[lunSem.getMonth()].substring(0,3)} — ${domSem.getDate()} ${MESES_AG[domSem.getMonth()].substring(0,3)} ${domSem.getFullYear()}`;
  } else {
    navTit = `${navDate.getDate()} de ${MESES_AG[mes]} ${año}`;
  }

  const leyendaTodos = [[AU_COLOR,'Audiencias'],[TU_COLOR,'Turnos'],[TA_COLOR,'Tareas'],[VE_COLOR,'Vencimientos']];
  const leyendaLabel = {vencimientos:'Vencimientos',audiencias:'Audiencias',turnos:'Turnos',tareas:'Tareas c/vencimiento'};
  const leyenda = tipoActivo ? [[chipColor(tipoActivo),leyendaLabel[filtro]]] : leyendaTodos;

  const tituloLabel = {vencimientos:'Vencimientos',audiencias:'Audiencias',turnos:'Turnos',tareas:'Tareas c/vencimiento'};
  const tituloEmoji = {vencimientos:'⚠️',audiencias:'⚖️',turnos:'🕐',tareas:'✅'};
  const tituloTexto = filtro ? `${tituloEmoji[filtro]||'📅'} ${tituloLabel[filtro]}` : '🗓️ Agenda';

  function renderChip(ev, i) {
    const bg = chipColor(ev._tipo);
    return (
      <div key={`${ev._tipo}-${ev.id}-${i}`}
        onClick={e=>handleChipClick(e,ev)}
        style={{fontSize:10,background:bg,color:'#fff',borderRadius:4,padding:'1px 4px',
          marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer'}}>
        {chipLabel(ev)}
      </div>
    );
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:22,fontWeight:700,color:'#1A1A1A'}}>{tituloTexto}</div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{display:'flex',border:'1px solid #DDDCDA',borderRadius:8,overflow:'hidden'}}>
            {[['mes','Mes'],['semana','Semana'],['dia','Día']].map(([v,l])=>(
              <button key={v} onClick={()=>setVistaAg(v)}
                style={{padding:'6px 14px',fontSize:12,fontWeight:vistaAg===v?600:400,cursor:'pointer',border:'none',
                  background:vistaAg===v?'#4A5568':'#fff',color:vistaAg===v?'#fff':'#6B7280',fontFamily:'system-ui'}}>
                {l}
              </button>
            ))}
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            {leyenda.map(([bg,label])=>(
              <div key={label} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#6B7280'}}>
                <span style={{width:10,height:10,borderRadius:3,background:bg,display:'inline-block',flexShrink:0}}></span>
                {label}
              </div>
            ))}
          </div>
          {(filtro==='audiencias'||filtro==='turnos')&&(
            <button onClick={()=>abrirNuevo(HOY)} style={btnPrimary}>
              + {filtro==='audiencias'?'Nueva audiencia':'Nuevo turno'}
            </button>
          )}
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
        <button onClick={navAnt} style={{background:'none',border:'1px solid #DDDCDA',borderRadius:8,padding:'4px 12px',cursor:'pointer',fontSize:16,color:'#4a4a4a'}}>‹</button>
        <span style={{fontWeight:600,fontSize:14,color:'#2c2c2c',minWidth:220,textAlign:'center'}}>{navTit}</span>
        <button onClick={navSig} style={{background:'none',border:'1px solid #DDDCDA',borderRadius:8,padding:'4px 12px',cursor:'pointer',fontSize:16,color:'#4a4a4a'}}>›</button>
        <button onClick={()=>setNavDate(new Date(HOY+'T00:00:00'))} style={{fontSize:11,color:'#6B7280',background:'none',border:'1px solid #DDDCDA',borderRadius:6,padding:'3px 8px',cursor:'pointer',fontFamily:'system-ui'}}>Hoy</button>
      </div>

      {vistaAg==='mes' && (()=>{
        const primer = new Date(año,mes,1).getDay();
        const offset = (primer+6)%7;
        const ultDia = new Date(año,mes+1,0).getDate();
        const celdas = [];
        for (let i=0;i<offset;i++) celdas.push(null);
        for (let d=1;d<=ultDia;d++) celdas.push(d);
        return (
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4}}>
              {DIAS_SEM_AG.map(d=><div key={d} style={{textAlign:'center',fontSize:11,fontWeight:600,color:'#8a8a8a',padding:'4px 0'}}>{d}</div>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
              {celdas.map((d,i)=>{
                if (!d) return <div key={`b${i}`} style={{minHeight:80}} />;
                const fs = `${año}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                const evs = eventosDelDia(fs);
                const esHoy = fs===HOY;
                return (
                  <div key={d}
                    style={{minHeight:80,borderRadius:8,padding:'5px 4px',
                      background:esHoy?'#EBF2FA':'#F7F6F3',border:esHoy?'1.5px solid #2B6CB0':'1.5px solid transparent'}}>
                    <div style={{fontSize:12,fontWeight:esHoy?700:400,color:esHoy?'#2B6CB0':'#4a4a4a',marginBottom:2}}>{d}</div>
                    {evs.slice(0,3).map((ev,i)=>renderChip(ev,i))}
                    {evs.length>3&&<div style={{fontSize:9,color:'#8a8a8a'}}>+{evs.length-3} más</div>}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {vistaAg==='semana' && (()=>{
        const dias = Array.from({length:7},(_,i)=>{const d=new Date(lunSem);d.setDate(lunSem.getDate()+i);return d;});
        return (
          <Card>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
              {dias.map(d=>{
                const fs = dateStr(d);
                const evs = eventosDelDia(fs);
                const esHoy = fs===HOY;
                return (
                  <div key={fs}
                    style={{minHeight:120,borderRadius:10,padding:'8px 6px',
                      background:esHoy?'#EBF2FA':'#F7F6F3',border:esHoy?'1.5px solid #2B6CB0':'1.5px solid transparent'}}>
                    <div style={{fontSize:11,fontWeight:600,color:esHoy?'#2B6CB0':'#4a4a4a'}}>{DIAS_SEM_AG[(d.getDay()+6)%7]}</div>
                    <div style={{fontSize:18,fontWeight:700,color:esHoy?'#2B6CB0':'#1a1a1a',marginBottom:6}}>{d.getDate()}</div>
                    {evs.map((ev,i)=>renderChip(ev,i))}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {vistaAg==='dia' && (()=>{
        const fs = dateStr(navDate);
        const evs = eventosDelDia(fs);
        return (
          <Card>
            <div style={{fontSize:14,fontWeight:600,color:'#1a1a1a',marginBottom:14}}>Eventos del día</div>
            {evs.length===0&&<div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:30}}>Sin eventos para este día.</div>}
            {evs.map((ev,i)=>{
              const bg = chipColor(ev._tipo);
              const expVinc = (ev._tipo==='audiencia'||ev._tipo==='turno') ? (expedientes||[]).find(e=>e.id===ev.expediente_id) : null;
              const cliVinc = (ev._tipo==='audiencia'||ev._tipo==='turno') ? (clientes||[]).find(c=>c.id===ev.cliente_id) : null;
              const vinc = expVinc?expVinc.caratula:cliVinc?nombreCompleto(cliVinc):'';
              const icono = ev._tipo==='audiencia'?'⚖️':ev._tipo==='turno'?'🕐':ev._tipo==='tarea'?'✅':'⚠️';
              const titulo = ev._tipo==='vencimiento'
                ? (ev.motivo_vencimiento||ev.caratula)
                : ev._tipo==='tarea'
                ? (ev.descripcion||'Tarea')
                : (ev.tipo||ev._tipo);
              return (
                <div key={`${ev._tipo}-${ev.id}-${i}`}
                  onClick={()=>handleEvClick(ev)}
                  style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid #F0EFED',cursor:'pointer',alignItems:'flex-start'}}>
                  <div style={{width:48,flexShrink:0,textAlign:'right'}}>
                    {ev.hora
                      ?<div style={{fontSize:14,fontWeight:700,color:bg}}>{fmtH(ev.hora)}</div>
                      :<div style={{fontSize:12,color:'#c0c0c0'}}>—</div>}
                  </div>
                  <div style={{fontSize:16,flexShrink:0,marginTop:1}}>{icono}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{titulo}</div>
                    {ev._tipo==='tarea'&&ev.descripcion&&<div style={{fontSize:12,color:'#4a4a4a',marginBottom:2}}>{ev.descripcion}</div>}
                    {ev._tipo==='tarea'&&ev.responsable&&<div style={{fontSize:11,color:'#8a8a8a'}}>👤 {ev.responsable}</div>}
                    {(ev._tipo==='audiencia'||ev._tipo==='turno')&&ev.descripcion&&<div style={{fontSize:12,color:'#4a4a4a',marginBottom:2}}>{ev.descripcion}</div>}
                    {vinc&&<div style={{fontSize:11,color:'#8a8a8a'}}>📁 {vinc}</div>}
                    {ev._tipo==='vencimiento'&&ev.numero&&<div style={{fontSize:11,color:'#8a8a8a'}}>{ev.numero}</div>}
                  </div>
                  <div style={{width:8,height:8,borderRadius:2,background:bg,flexShrink:0,marginTop:6}}></div>
                </div>
              );
            })}
          </Card>
        );
      })()}

      {detalleEv&&(
        <AgendaDetalle ev={detalleEv} expedientes={expedientes||[]} clientes={clientes||[]}
          onEditar={()=>{ setVista(detalleEv._tipo==='audiencia'?'audiencias':'turnos'); setDetalleEv(null); }}
          onEliminar={()=>eliminarEvento(detalleEv)}
          onCerrar={()=>setDetalleEv(null)} />
      )}
      {mostrarForm&&(filtro==='audiencias'||filtro==='turnos')&&(
        <AgendaForm
          tabla={filtro==='audiencias'?'audiencias':'turnos'}
          tipos={filtro==='audiencias'?TIPOS_AUDIENCIA:TIPOS_TURNO}
          fechaPres={fechaPres}
          eventoEdit={null}
          expedientes={expedientes||[]} clientes={clientes||[]} perfil={perfil}
          onGuardar={guardarEvento} onCancelar={cerrarForm} />
      )}
    </div>
  );
}