'use client';

import { useState, useEffect, useRef } from 'react';
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

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'system-ui',background:'#F7F6F3',color:'#1A1A1A'}}>
      <div style={{width:224,minWidth:224,background:'#9B4F6A',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'20px 18px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:'#fff',color:'#9B4F6A',fontSize:15,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>GE</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'#fff',lineHeight:1.25}}>Guazzaroni<br/>Escuredo</div>
              <div style={{fontSize:11,color:'#D4A0B5',marginTop:2}}>General Pico, LP</div>
            </div>
          </div>
        </div>
        <div style={{padding:'10px 10px',flex:1,overflowY:'auto'}}>
          {[
            ['dashboard','🏠','Inicio',false],
            ['vencimientos','📅','Vencimientos',false],
            ['clientes','👥','Clientes',false],
            ['expedientes','📁','Expedientes',false],
            ['nuevo-exp','➕','Nuevo expediente',true],
            ['notas','📝','Anotaciones',false],
            ['consultas','💬','Consultas',false],
            ['nueva-consulta','➕','Nueva consulta',true],
            ['tareas','✅','Tareas',false],
            ['nueva-tarea','➕','Nueva tarea',true],
            ['honorarios','💰','Honorarios',false]
          ].map(([id,emoji,label,indented])=>(
            <button key={id} onClick={()=>{setVista(id);setExpActual(null);}}
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',textAlign:'left',
                padding:'8px 10px',paddingLeft: indented ? 26 : 10,
                borderRadius:8,fontSize: indented ? 12 : 13,border:'none',
                background:vista===id?'rgba(255,255,255,0.15)':'none',
                color: vista===id ? '#fff' : indented ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.92)',
                fontWeight: vista===id ? 700 : indented ? 400 : 500,cursor:'pointer',marginBottom:1,fontFamily:'system-ui'}}>
              <span style={{fontSize: indented ? 12 : 14,flexShrink:0}}>{emoji}</span>{label}
            </button>
          ))}
        </div>
        <div style={{padding:'12px 14px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:9}}>
          <div style={{width:30,height:30,borderRadius:'50%',background:socioColor(perfil?.nombre).bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:socioColor(perfil?.nombre).color,flexShrink:0}}>
            {perfil?.nombre?.[0] || session.user.email[0].toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{perfil?.nombre || session.user.email}</div>
            <div style={{display:'flex',gap:8,marginTop:1}}>
              <button onClick={logout} style={{fontSize:11,color:'#D4A0B5',background:'none',border:'none',padding:0,cursor:'pointer'}}>Cerrar sesión</button>
              <button onClick={()=>setVista('cambiar-password')} style={{fontSize:11,color:'#D4A0B5',background:'none',border:'none',padding:0,cursor:'pointer'}}>Contraseña</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:24}}>
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
const inputStyle = {width:'100%',padding:'9px 12px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,background:'#F7F6F3',outline:'none',fontFamily:'system-ui',marginBottom:12,boxSizing:'border-box'};
const btnPrimary = {padding:'9px 16px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #2B6CB0',background:'#2B6CB0',color:'#fff',fontFamily:'system-ui',fontWeight:500};

function ClienteAutocompletar({ clientes, clienteId, onSelect, estiloInput, wrapperStyle, placeholder, recargar }) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const cl = (clientes||[]).find(c => c.id === clienteId);
    setTexto(cl?.nombre || '');
  }, [clienteId, clientes]);

  useEffect(() => {
    function handleFuera(ev) {
      if (containerRef.current && !containerRef.current.contains(ev.target)) {
        setAbierto(false);
        const cl = (clientes||[]).find(c => c.id === clienteId);
        setTexto(cl?.nombre || '');
      }
    }
    document.addEventListener('mousedown', handleFuera);
    return () => document.removeEventListener('mousedown', handleFuera);
  }, [clienteId, clientes]);

  const filtrados = texto.trim().length >= 1
    ? (clientes||[]).filter(cl => (cl.nombre||'').toLowerCase().includes(texto.toLowerCase())).slice(0, 8)
    : [];

  async function crearCliente() {
    const nombre = texto.trim();
    if (!nombre) return;
    const { data, error } = await supabase.from('clientes').insert({
      nombre,
      estudio_id: '51cc9627-71d2-4cab-a3d5-c5490b3b3e4b'
    }).select().single();
    if (error || !data) { alert('Error al crear cliente: ' + (error?.message || 'desconocido')); return; }
    setTexto(data.nombre);
    setAbierto(false);
    onSelect(data.id);
    if (recargar) recargar();
  }

  const estiloBase = estiloInput || {width:'100%',padding:'9px 12px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,background:'#F7F6F3',outline:'none',fontFamily:'system-ui',boxSizing:'border-box'};

  return (
    <div ref={containerRef} style={{position:'relative',...(wrapperStyle||{})}}>
      <input
        type="text"
        value={texto}
        onChange={ev => {
          const v = ev.target.value;
          setTexto(v);
          setAbierto(v.trim().length >= 1);
          if (!v.trim()) onSelect(null);
        }}
        onFocus={() => { if (texto.trim().length >= 1) setAbierto(true); }}
        placeholder={placeholder || 'Buscar cliente...'}
        style={{...estiloBase, marginBottom:0}}
      />
      {abierto && texto.trim().length >= 1 && (
        <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1px solid #DDDCDA',borderRadius:8,boxShadow:'0 4px 16px rgba(0,0,0,0.12)',zIndex:1000,maxHeight:240,overflowY:'auto',marginTop:2}}>
          {filtrados.map(cl => (
            <div key={cl.id}
              onMouseDown={ev => { ev.preventDefault(); setTexto(cl.nombre); setAbierto(false); onSelect(cl.id); }}
              style={{padding:'9px 12px',cursor:'pointer',fontSize:13,fontFamily:'system-ui',borderBottom:'1px solid #F0EFED'}}
              onMouseEnter={ev => ev.currentTarget.style.background='#F7F6F3'}
              onMouseLeave={ev => ev.currentTarget.style.background='#fff'}
            >
              {cl.nombre}
            </div>
          ))}
          <div
            onMouseDown={ev => { ev.preventDefault(); crearCliente(); }}
            style={{padding:'9px 12px',cursor:'pointer',fontSize:13,fontFamily:'system-ui',color:'#2B6CB0',fontWeight:600,borderTop:filtrados.length>0?'1px solid #DDDCDA':'none'}}
            onMouseEnter={ev => ev.currentTarget.style.background='#EBF2FA'}
            onMouseLeave={ev => ev.currentTarget.style.background='#fff'}
          >
            + Crear cliente "{texto.trim()}"
          </div>
        </div>
      )}
    </div>
  );
}

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
  if (vista === 'tareas') return <Tareas {...props} />;
  if (vista === 'nueva-tarea') return <NuevaTarea {...props} />;
  if (vista === 'cambiar-password') return <CambiarPassword {...props} />;
  return null;
}

function Dashboard({ expedientes, consultas, tareas, notas, setVista, setExpActual }) {
  const mes = HOY.substring(0,7);
  const activos = expedientes.filter(e=>e.estado==='activo').length;
  const consMes = consultas.filter(c=>c.fecha&&c.fecha.startsWith(mes)).length;
  const tareasPend = tareas.filter(t=>t.estado==='pendiente').length;
  const vencSemana = expedientes.filter(e=>{ const d=diasHasta(e.proximo_vencimiento); return d!==null && d<=7; });
  const vencProximos = expedientes.filter(e=>e.proximo_vencimiento && e.estado!=='archivado')
    .sort((a,b)=>a.proximo_vencimiento.localeCompare(b.proximo_vencimiento)).slice(0,6);
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:22}}>
        {[['📁','Expedientes activos',activos,null],['⚠️','Vencimientos esta semana',vencSemana.length,vencSemana.length>0?'#C53030':null],['✅','Tareas pendientes',tareasPend,null],['💬','Consultas este mes',consMes,null]].map(([emoji,l,v,col])=>(
          <div key={l} style={{background:'#fff',borderRadius:14,padding:'18px 20px',border:'1px solid #EBEBEA',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <span style={{fontSize:28,display:'block',marginBottom:8}}>{emoji}</span>
            <div style={{fontSize:32,fontWeight:700,color:col||'#1A1A1A',lineHeight:1}}>{v}</div>
            <div style={{fontSize:12,color:'#6B7280',marginTop:8,lineHeight:1.4}}>{l}</div>
          </div>
        ))}
      </div>
      <Card title="📅 Próximos vencimientos">
        {vencProximos.length ? vencProximos.map(e=>{
          const vc = vencColor(e.proximo_vencimiento);
          return <div key={e.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:vc.bg,borderRadius:8,marginBottom:4,cursor:'pointer'}} onClick={()=>{setExpActual(e);setVista('detalle');}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{e.caratula}</div>
              <div style={{fontSize:11,color:'#8a8a8a'}}>{e.numero} · {e.motivo_vencimiento||'Vencimiento'}</div>
            </div>
            <Badge bg={vc.bg} color={vc.color}>{formatFecha(e.proximo_vencimiento)} · {vc.label}</Badge>
          </div>;
        }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:20}}>No hay vencimientos cargados. Cargá las fechas al crear o editar un expediente.</div>}
      </Card>
      <Card title="📝 Últimas anotaciones">
        {notas.length ? notas.slice(0,5).map(n=>{
          const ex = expedientes.find(e=>e.id===n.expediente_id);
          return <div key={n.id} style={{padding:'9px 0',borderBottom:'1px solid #F0EFED',cursor:ex?'pointer':'default'}} onClick={()=>{if(ex){setExpActual(ex);setVista('detalle');}}}>
            <div style={{fontSize:11,color:'#8a8a8a',marginBottom:2}}>{ex?ex.caratula:''} · {formatFecha(n.fecha)} · {n.autora}</div>
            <div style={{fontSize:12}}>{n.texto.length>100?n.texto.slice(0,100)+'…':n.texto}</div>
          </div>;
        }) : <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:20}}>Sin anotaciones aún</div>}
      </Card>
    </div>
  );
}

function estadoColor(estado) {
  if (estado === 'Activo') return { bg:'#E6F4EA', color:'#27500A' };
  if (estado === 'Activo en Cámara') return { bg:'#E8F0FE', color:'#0C447C' };
  if (estado === 'Finalizado - Debe Mediar') return { bg:'#FEF9E7', color:'#7D6608' };
  if (estado === 'No Presentada en Juzgado') return { bg:'#FEF0E6', color:'#633806' };
  if (estado === 'Rechazado') return { bg:'#FDECEA', color:'#7B1F1A' };
  return { bg:'#F1F3F4', color:'#5F6368' };
}

function Expedientes({ expedientes, setVista, setExpActual }) {
  const [q, setQ] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [orden, setOrden] = useState('num-desc');

  const lista = expedientes
    .filter(e => {
      if (filtroEstado === 'Activos') return e.estado === 'Activo' || e.estado === 'Activo en Cámara';
      if (filtroEstado === 'Finalizados') return (e.estado||'').startsWith('Finalizado') && e.estado !== 'Finalizado (Archivado)';
      if (filtroEstado === 'Archivados') return e.estado === 'Finalizado (Archivado)';
      return true;
    })
    .filter(e => !q || (e.caratula||'').toLowerCase().includes(q.toLowerCase()) || (e.numero||'').toLowerCase().includes(q.toLowerCase()))
    .sort((a,b)=>{
      if (orden==='num-desc') return (b.numero||'').localeCompare(a.numero||'',undefined,{numeric:true});
      if (orden==='num-asc') return (a.numero||'').localeCompare(b.numero||'',undefined,{numeric:true});
      if (orden==='car-az') return (a.caratula||'').localeCompare(b.caratula||'');
      if (orden==='car-za') return (b.caratula||'').localeCompare(a.caratula||'');
      return 0;
    });

  return (
    <Card title="📁 Expedientes">
      <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
        {['Todos','Activos','Finalizados','Archivados'].map(f=>(
          <button key={f} onClick={()=>setFiltroEstado(f)}
            style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:filtroEstado===f?600:400,cursor:'pointer',border:'none',
              background:filtroEstado===f?'#9B4F6A':'#F1F3F4',
              color:filtroEstado===f?'#fff':'#5F6368',fontFamily:'system-ui'}}>
            {f}
          </button>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <input style={{...inputStyle,marginBottom:0,flex:1}} placeholder="Buscar expediente..." value={q} onChange={e=>setQ(e.target.value)} />
        <select style={{...inputStyle,marginBottom:0,width:'auto'}} value={orden} onChange={e=>setOrden(e.target.value)}>
          <option value="num-desc">Número mayor primero</option>
          <option value="num-asc">Número menor primero</option>
          <option value="car-az">Carátula A→Z</option>
          <option value="car-za">Carátula Z→A</option>
        </select>
      </div>
      {lista.length ? (
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr style={{background:'#F7F6F3'}}>{['N°','Carátula','Proceso','Etapa actual','Estado','Responsable'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 10px',fontSize:11,color:'#6B7280',borderBottom:'1px solid #EBEBEA',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>)}</tr></thead>
          <tbody>
            {lista.map(e=>{
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
              const ec = estadoColor(e.estado);
              return <tr key={e.id} style={{cursor:'pointer',background:hoveredRow===e.id?'#F7F6F3':'transparent'}}
                onMouseEnter={()=>setHoveredRow(e.id)} onMouseLeave={()=>setHoveredRow(null)}
                onClick={()=>{setExpActual(e);setVista('detalle');}}>
                <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontSize:11,color:'#6B7280'}}>{e.numero}</td>
                <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:ec.color,display:'inline-block',flexShrink:0}}></span>
                    <span style={{fontWeight:500}}>{e.caratula}</span>
                  </div>
                </td>
                <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontSize:12,color:'#6B7280'}}>{mapa?mapa.nombre:'—'}</td>
                <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}>{etapaActual==='Finalizado'?<Badge bg="#EAF3DE" color="#27500A">Finalizado</Badge>:<span style={{fontSize:12,color:'#4a4a4a'}}>{etapaActual}</span>}</td>
                <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}><Badge bg={ec.bg} color={ec.color}>{e.estado}</Badge></td>
                <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}><Badge bg={socioColor(e.responsable).bg} color={socioColor(e.responsable).color}>{e.responsable||'—'}</Badge></td>
              </tr>;
            })}
          </tbody>
        </table>
      ) : <div style={{color:'#6B7280',fontSize:13,textAlign:'center',padding:30}}>Sin expedientes{filtroEstado!=='Todos'?` con estado "${filtroEstado.toLowerCase()}"`:' todavía. Cargá el primero desde "Nuevo expediente"'}.</div>}
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
          <select value={e.rol||'actora'} onChange={ev=>{
            const nuevoRol = ev.target.value;
            actualizarVencimiento('rol', nuevoRol);
            if (nuevoRol === 'mediacion') actualizarVencimiento('estado', 'finalizado');
          }}
            style={{padding:'4px 8px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,background:'#F7F6F3',fontFamily:'system-ui'}}>
            <option value="actora">Actora</option>
            <option value="demandada">Demandada</option>
            <option value="mediacion">Mediación</option>
          </select>
          {e.rol === 'mediacion' && (
            <span style={{fontSize:12,background:'#FEF0E6',color:'#633806',padding:'3px 10px',borderRadius:20,fontWeight:600}}>⚖️ Mediación → Finalizado</span>
          )}
          <span style={{fontSize:12,color:'#8a8a8a',marginLeft:4}}>Cliente:</span>
          <ClienteAutocompletar
            clientes={clientes}
            clienteId={e.cliente_id||null}
            onSelect={id=>actualizarVencimiento('cliente_id',id)}
            estiloInput={{padding:'4px 8px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,background:'#F7F6F3',fontFamily:'system-ui',outline:'none',boxSizing:'border-box',minWidth:150}}
            placeholder="Sin vincular"
            recargar={recargar}
          />
          <span style={{fontSize:12,color:'#8a8a8a',marginLeft:4}}>Tipo:</span>
          <select value={e.tipo_proceso||''} onChange={ev=>actualizarVencimiento('tipo_proceso', ev.target.value)}
            style={{padding:'4px 8px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,background:'#F7F6F3',fontFamily:'system-ui'}}>
            <option value="">Sin asignar</option>
            <option value="ordinario">Ordinario (conocimiento)</option>
            <option value="ejecutivo">Ejecutivo (monitorio)</option>
            <option value="ejecucion">Ejecución de sentencia</option>
            <option value="sucesorio">Sucesorio</option>
            <option value="alimentos">Alimentos</option>
            <option value="regimen">Régimen comunicacional</option>
            <option value="divorcio">Divorcio</option>
            <option value="otro">Otro / sin mapa</option>
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
  const set = (k,v) => setF({...f,[k]:v});
  async function guardar() {
    if (!f.numero||!f.caratula||!f.tipo_proceso||!f.responsable) { alert('Completá los campos obligatorios (*)'); return; }
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    const estadoFinal = f.rol === 'mediacion' ? 'finalizado' : f.estado;
    const payload = { ...f, estado: estadoFinal, estudio_id: perfil.estudio_id, progreso: {}, cliente_id: f.cliente_id||null };
    const { error } = await supabase.from('expedientes').insert(payload);
    if (error) { alert('Error: '+error.message); return; }
    setMsg(`Expediente ${f.numero} guardado.`);
    setF({ numero:'', caratula:'', juzgado:'', tipo_proceso:'', estado:'activo', proximo_vencimiento:'', motivo_vencimiento:'', responsable:'', notas:'', cliente_id:'', hipotesis_maxima:'', hipotesis_minima:'', rol:'actora' });
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
          <option value="mediacion">Mediación</option>
        </select>
        {f.rol === 'mediacion' && (
          <div style={{background:'#FEF0E6',border:'1px solid #EF9F27',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#633806',marginBottom:12}}>
            ⚖️ Al guardar, el estado quedará como <strong>Finalizado</strong> automáticamente.
          </div>
        )}
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
        <select style={inputStyle} value={f.responsable} onChange={e=>set('responsable',e.target.value)}>
          <option value="">Seleccioná</option>
          {ABOGADAS.map(a=><option key={a}>{a}</option>)}
        </select>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Cliente</label>
        <ClienteAutocompletar
          clientes={clientes}
          clienteId={f.cliente_id||null}
          onSelect={id=>set('cliente_id',id||'')}
          estiloInput={inputStyle}
          wrapperStyle={{marginBottom:12}}
          placeholder="Sin vincular"
          recargar={recargar}
        />
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
  const [orden, setOrden] = useState('reciente');
  const mes = HOY.substring(0,7);
  const mesA = consultas.filter(c=>c.fecha&&c.fecha.startsWith(mes));
  const lista = consultas
    .filter(c=>!q||(c.cliente||'').toLowerCase().includes(q.toLowerCase())||(c.motivo||'').toLowerCase().includes(q.toLowerCase()))
    .sort((a,b)=>{
      if (orden==='reciente') return (b.fecha||'').localeCompare(a.fecha||'');
      if (orden==='antiguo') return (a.fecha||'').localeCompare(b.fecha||'');
      if (orden==='cliente-az') return (a.cliente||'').localeCompare(b.cliente||'');
      return 0;
    });

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
        {[['💬','Consultas este mes',mesA.length],['✨','Primeras',mesA.filter(c=>c.tipo==='primera').length],['🔄','Seguimientos',mesA.filter(c=>c.tipo==='seguimiento').length],['👤','Clientes únicos',new Set(mesA.map(c=>c.cliente)).size]].map(([emoji,l,v])=>(
          <div key={l} style={{background:'#fff',borderRadius:14,padding:'18px 20px',border:'1px solid #EBEBEA',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <span style={{fontSize:24,display:'block',marginBottom:6}}>{emoji}</span>
            <div style={{fontSize:28,fontWeight:700,color:'#1A1A1A',lineHeight:1}}>{v}</div>
            <div style={{fontSize:12,color:'#6B7280',marginTop:6}}>{l}</div>
          </div>
        ))}
      </div>
      <Card title="💬 Registro de consultas">
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <input style={{...inputStyle,marginBottom:0,flex:1}} placeholder="Buscar cliente o motivo..." value={q} onChange={e=>setQ(e.target.value)} />
          <select style={{...inputStyle,marginBottom:0,width:'auto'}} value={orden} onChange={e=>setOrden(e.target.value)}>
            <option value="reciente">Más reciente primero</option>
            <option value="antiguo">Más antiguo primero</option>
            <option value="cliente-az">Cliente A→Z</option>
          </select>
        </div>
        {lista.length ? lista.map(c=>{
          const esEditando = editandoId===c.id;
          return <div key={c.id} style={{padding:'10px 0',borderBottom:'1px solid #F0EFED'}}>
            {esEditando ? (
              <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:480}}>
                <div style={{display:'flex',gap:8}}>
                  {[['primera','Primera consulta'],['seguimiento','Seguimiento']].map(([v,l])=>(
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
                <textarea value={editForm.comentario||''} onChange={ev=>setEditForm({...editForm,comentario:ev.target.value})} placeholder="Comentario (opcional)"
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
                      <Badge bg={c.tipo==='primera'?'#FAEEDA':'#EAF3DE'} color={c.tipo==='primera'?'#633806':'#27500A'}>{c.tipo==='primera'?'Primera consulta':'Seguimiento'}</Badge>
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

function NuevaConsulta({ perfil, recargar }) {
  const [f, setF] = useState({ tipo:'primera', cliente:'', fecha:HOY, abogada:'', motivo:'', comentario:'' });
  useEffect(()=>{ if(perfil?.nombre) setF(prev=>({...prev, abogada: prev.abogada||perfil.nombre})); }, [perfil]);
  const [msg, setMsg] = useState('');
  const set = (k,v)=>setF({...f,[k]:v});
  async function guardar() {
    if (!f.cliente||!f.fecha||!f.abogada||!f.motivo) { alert('Completá los obligatorios (*)'); return; }
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    const { error } = await supabase.from('consultas').insert({ ...f, estudio_id: perfil.estudio_id });
    if (error) { alert('Error: '+error.message); return; }
    setMsg(`Consulta de ${f.cliente} guardada.`);
    setF({ tipo:'primera', cliente:'', fecha:HOY, abogada:'', motivo:'', comentario:'' });
    recargar();
    setTimeout(()=>setMsg(''),3000);
  }
  return (
    <Card title="💬 Registrar consulta">
      {msg && <div style={{background:'#EAF3DE',border:'1px solid #C0DD97',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#27500A',marginBottom:14}}>✓ {msg}</div>}
      <div style={{maxWidth:520}}>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Tipo *</label>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {[['primera','Primera consulta (paga)'],['seguimiento','Seguimiento']].map(([v,l])=>(
            <button key={v} onClick={()=>set('tipo',v)} style={{flex:1,padding:9,border:f.tipo===v?'1px solid #2B6CB0':'1px solid #e2e2e2',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',background:f.tipo===v?'#E6F1FB':'#f9f8f5',color:f.tipo===v?'#0C447C':'#4a4a4a'}}>{l}</button>
          ))}
        </div>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Cliente *</label>
        <input style={inputStyle} value={f.cliente} onChange={e=>set('cliente',e.target.value)} />
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

const ESTADOS_TAREA = ['pendiente','en proceso','terminado'];
const ESTADO_COLOR = {
  'pendiente': { bg:'#FAEEDA', color:'#633806' },
  'en proceso': { bg:'#E6F1FB', color:'#0C447C' },
  'terminado': { bg:'#EAF3DE', color:'#27500A' }
};
// compatibilidad con tareas viejas que tenían 'completada'
function normEstado(e) { return e==='completada' ? 'terminado' : (e||'pendiente'); }

function Tareas({ tareas, recargar }) {
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
  const [ordenTarea, setOrdenTarea] = useState('venc');
  const lista = tareas
    .map(t=>({...t, estado: normEstado(t.estado)}))
    .filter(t=> filtro==='todas' ? true : (filtro==='activas' ? t.estado!=='terminado' : t.estado===filtro))
    .sort((a,b)=>{
      if (ordenTarea==='reciente') return (b.creado_en||'').localeCompare(a.creado_en||'');
      if (ordenTarea==='antiguo') return (a.creado_en||'').localeCompare(b.creado_en||'');
      if (ordenTarea==='nombre-az') return (a.descripcion||'').localeCompare(b.descripcion||'');
      const ord = { 'pendiente':0, 'en proceso':1, 'terminado':2 };
      if(ord[a.estado]!==ord[b.estado]) return ord[a.estado]-ord[b.estado];
      if(!a.deadline&&!b.deadline) return 0; if(!a.deadline) return 1; if(!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    });
  return (
    <Card title="✅ Tareas">
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <select style={{...inputStyle,marginBottom:0,width:'auto'}} value={filtro} onChange={e=>setFiltro(e.target.value)}>
          <option value="activas">Activas (pendiente + en proceso)</option>
          <option value="pendiente">Solo pendientes</option>
          <option value="en proceso">Solo en proceso</option>
          <option value="terminado">Solo terminadas</option>
          <option value="todas">Todas</option>
        </select>
        <select style={{...inputStyle,marginBottom:0,width:'auto'}} value={ordenTarea} onChange={e=>setOrdenTarea(e.target.value)}>
          <option value="venc">Vencimiento próximo primero</option>
          <option value="reciente">Más reciente primero</option>
          <option value="antiguo">Más antiguo primero</option>
          <option value="nombre-az">Nombre A→Z</option>
        </select>
      </div>
      {lista.length ? lista.map(t=>{
        const done = t.estado==='terminado';
        const esEditando = editandoId===t.id;
        const verComentario = comentarioId===t.id;
        return <div key={t.id} style={{padding:'12px 0',borderBottom:'1px solid #F0EFED'}}>
          {esEditando ? (
            <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:480}}>
              <input value={editForm.descripcion} onChange={ev=>setEditForm({...editForm,descripcion:ev.target.value})}
                style={{padding:'7px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,fontFamily:'system-ui'}} />
              <div style={{display:'flex',gap:8}}>
                <select value={editForm.responsable} onChange={ev=>setEditForm({...editForm,responsable:ev.target.value})}
                  style={{padding:'6px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,fontFamily:'system-ui'}}>
                  {ABOGADAS.map(a=><option key={a}>{a}</option>)}
                </select>
                <input type="date" value={editForm.deadline||''} onChange={ev=>setEditForm({...editForm,deadline:ev.target.value})}
                  style={{padding:'6px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:12,fontFamily:'system-ui'}} />
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>guardarEdicion(t)} style={{...btnPrimary,padding:'6px 12px',fontSize:12}}>Guardar</button>
                <button onClick={()=>setEditandoId(null)} style={{padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff'}}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,textDecoration:done?'line-through':'none',color:done?'#8a8a8a':'#1a1a1a',marginBottom:6}}>{t.descripcion}</div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
                  <Badge bg={socioColor(t.responsable).bg} color={socioColor(t.responsable).color}>{t.responsable}</Badge>
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

        {/* SEPARADOR */}
        <div style={{borderTop:'1px solid #EEEDEA',marginBottom:16}} />

        {/* LISTA */}
        <div style={{fontSize:11,fontWeight:600,color:'#6B7280',marginBottom:10,letterSpacing:'0.04em',textTransform:'uppercase'}}>Todos los vencimientos</div>
        {ordenados.length === 0
          ? <div style={{color:'#8a8a8a',fontSize:13,textAlign:'center',padding:20}}>Sin vencimientos cargados.</div>
          : ordenados.map(e => {
              const col = vencColor(e.proximo_vencimiento);
              return (
                <div key={e.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #F0EFED'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:col.color,flexShrink:0}} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13,color:'#2c2c2c'}}>{e.caratula}</div>
                    {e.motivo_vencimiento && <div style={{fontSize:11,color:'#8a8a8a',marginTop:1}}>{e.motivo_vencimiento}</div>}
                  </div>
                  <div style={{fontSize:12,color:col.color,fontWeight:600,textAlign:'right',flexShrink:0}}>
                    {formatFecha(e.proximo_vencimiento)}<br/>
                    <span style={{fontSize:11,fontWeight:400}}>{col.label}</span>
                  </div>
                </div>
              );
            })
        }
      </Card>
    </div>
  );
}

function Clientes({ clientes, expedientes, setVista, setCliActual }) {
  const [q, setQ] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [orden, setOrden] = useState('nombre-az');
  const lista = clientes
    .filter(cl=>!q || (cl.nombre||'').toLowerCase().includes(q.toLowerCase()) || (cl.dni||'').includes(q))
    .sort((a,b)=>{
      if (orden==='nombre-az') return (a.nombre||'').localeCompare(b.nombre||'');
      if (orden==='nombre-za') return (b.nombre||'').localeCompare(a.nombre||'');
      if (orden==='reciente') return (b.creado_en||'').localeCompare(a.creado_en||'');
      if (orden==='antiguo') return (a.creado_en||'').localeCompare(b.creado_en||'');
      return 0;
    });
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,gap:8,flexWrap:'wrap'}}>
        <input style={{...inputStyle,marginBottom:0,flex:1,minWidth:180}} placeholder="Buscar cliente por nombre o DNI..." value={q} onChange={e=>setQ(e.target.value)} />
        <select style={{...inputStyle,marginBottom:0,width:'auto'}} value={orden} onChange={e=>setOrden(e.target.value)}>
          <option value="nombre-az">Nombre A→Z</option>
          <option value="nombre-za">Nombre Z→A</option>
          <option value="reciente">Más reciente primero</option>
          <option value="antiguo">Más antiguo primero</option>
        </select>
        <button onClick={()=>setVista('nuevo-cliente')} style={btnPrimary}>+ Nuevo cliente</button>
      </div>
      <Card>
        {lista.length ? (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr style={{background:'#F7F6F3'}}>{['Nombre','DNI','Teléfono','Quién lo lleva','Expedientes activos'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 10px',fontSize:11,color:'#6B7280',borderBottom:'1px solid #EBEBEA',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>)}</tr></thead>
            <tbody>
              {lista.map(cl=>{
                const exps = expedientes.filter(e=>e.cliente_id===cl.id && e.estado!=='archivado');
                return <tr key={cl.id} style={{cursor:'pointer',background:hoveredRow===cl.id?'#F7F6F3':'transparent'}}
                  onMouseEnter={()=>setHoveredRow(cl.id)} onMouseLeave={()=>setHoveredRow(null)}
                  onClick={()=>{setCliActual(cl);setVista('detalle-cliente');}}>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontWeight:500}}>{cl.nombre}</td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontSize:12,color:'#6B7280'}}>{cl.dni||'—'}</td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontSize:12}}>{cl.telefono||'—'}</td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}>{cl.responsable?<Badge bg={socioColor(cl.responsable).bg} color={socioColor(cl.responsable).color}>{cl.responsable}</Badge>:<span style={{fontSize:12,color:'#6B7280'}}>—</span>}</td>
                  <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}><Badge bg="#EAF3DE" color="#27500A">{exps.length}</Badge></td>
                </tr>;
              })}
            </tbody>
          </table>
        ) : <div style={{color:'#6B7280',fontSize:13,textAlign:'center',padding:30}}>Sin clientes todavía. Cargá el primero con "Nuevo cliente".</div>}
      </Card>
    </div>
  );
}

function DetalleCliente({ cliActual, setCliActual, expedientes, setVista, setExpActual, recargar }) {
  const cl = cliActual;
  const [editando, setEditando] = useState(false);
  const [f, setF] = useState(cl);
  if (!cl) return null;
  const exps = expedientes.filter(e=>e.cliente_id===cl.id);
  async function guardarDatos() {
    await supabase.from('clientes').update({ nombre:f.nombre, dni:f.dni, telefono:f.telefono, email:f.email, domicilio:f.domicilio, notas:f.notas, responsable:f.responsable }).eq('id', cl.id);
    setCliActual(f); setEditando(false); recargar();
  }
  async function eliminarCliente() {
    if (!confirm(`¿Seguro que querés eliminar a ${cl.nombre}? Esta acción no se puede deshacer.`)) return;
    await supabase.from('clientes').delete().eq('id', cl.id);
    recargar();
    setVista('clientes');
  }
  return (
    <div>
      <button onClick={()=>setVista('clientes')} style={{padding:'7px 13px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',marginBottom:12}}>← Volver a clientes</button>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div style={{fontSize:18,fontWeight:600,marginBottom:4}}>{cl.nombre}</div>
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
            {[['nombre','Nombre'],['dni','DNI'],['telefono','Teléfono'],['email','Email'],['domicilio','Domicilio']].map(([k,l])=>(
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
  const [f, setF] = useState({ nombre:'', dni:'', telefono:'', email:'', domicilio:'', notas:'', responsable:'' });
  const [msg, setMsg] = useState('');
  const set = (k,v)=>setF({...f,[k]:v});
  async function guardar() {
    if (!f.nombre) { alert('El nombre es obligatorio'); return; }
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    const { error } = await supabase.from('clientes').insert({ ...f, estudio_id: perfil.estudio_id });
    if (error) { alert('Error: '+error.message); return; }
    setMsg(`Cliente ${f.nombre} guardado.`);
    setF({ nombre:'', dni:'', telefono:'', email:'', domicilio:'', notas:'', responsable:'' });
    recargar();
    setTimeout(()=>setMsg(''),3000);
  }
  return (
    <Card title="👤 Nuevo cliente">
      {msg && <div style={{background:'#EAF3DE',border:'1px solid #C0DD97',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#27500A',marginBottom:14}}>✓ {msg}</div>}
      <div style={{maxWidth:520}}>
        {[['nombre','Nombre completo *'],['dni','DNI'],['telefono','Teléfono'],['email','Email'],['domicilio','Domicilio']].map(([k,l])=>(
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
  if (h.forma === 'porcentaje') return `${h.valor}%`;
  return fmtMoneda(h.valor);
}
const HON_ESTADO_COLOR = {
  'pendiente': { bg:'#FAEEDA', color:'#633806' },
  'en proceso': { bg:'#E6F1FB', color:'#0C447C' },
  'pagado': { bg:'#EAF3DE', color:'#27500A' }
};

function HonorariosTable({ lista, expedientes, clientes, cuotas, valorUhon, setHonActual, setVista }) {
  const [hoveredRow, setHoveredRow] = useState(null);
  return (
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
      <thead><tr style={{background:'#F7F6F3'}}>{['Concepto','Vinculado a','Monto pactado','Cuotas','Estado'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 10px',fontSize:11,color:'#6B7280',borderBottom:'1px solid #EBEBEA',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>)}</tr></thead>
      <tbody>
        {lista.map(h=>{
          const exp = expedientes.find(e=>e.id===h.expediente_id);
          const cli = clientes.find(c=>c.id===h.cliente_id);
          const vinc = exp?exp.caratula : (cli?cli.nombre : '—');
          const cuotasH = cuotas.filter(cu=>cu.honorario_id===h.id);
          const pagadas = cuotasH.filter(cu=>cu.estado==='pagada').length;
          const ec = HON_ESTADO_COLOR[h.estado] || HON_ESTADO_COLOR['pendiente'];
          return <tr key={h.id} style={{cursor:'pointer',background:hoveredRow===h.id?'#F7F6F3':'transparent'}}
            onMouseEnter={()=>setHoveredRow(h.id)} onMouseLeave={()=>setHoveredRow(null)}
            onClick={()=>{setHonActual(h);setVista('detalle-honorario');}}>
            <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontWeight:500}}>{h.concepto}</td>
            <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontSize:12,color:'#6B7280'}}>{vinc}</td>
            <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontSize:12}}>{formaLabel(h, valorUhon)}</td>
            <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED',fontSize:12}}>{h.en_cuotas?`${pagadas}/${cuotasH.length}`:'—'}</td>
            <td style={{padding:'12px 10px',borderBottom:'1px solid #F0EFED'}}><Badge bg={ec.bg} color={ec.color}>{h.estado}</Badge></td>
          </tr>;
        })}
      </tbody>
    </table>
  );
}

function Honorarios({ honorarios, cuotas, expedientes, clientes, valorUhon, setVista, setHonActual, recargar, perfil }) {
  const [q, setQ] = useState('');
  const [editUhon, setEditUhon] = useState(false);
  const [uhonInput, setUhonInput] = useState(valorUhon||'');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const mesActual = HOY.substring(0,7);
  const [periodoVista, setPeriodoVista] = useState(mesActual);
  const esMesActual = periodoVista === mesActual;

  function navPeriodo(dir) {
    const [y, m] = periodoVista.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    const nuevo = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (dir > 0 && nuevo > mesActual) return;
    setPeriodoVista(nuevo);
  }

  const nombreMesPeriodo = (()=>{
    const [y, m] = periodoVista.split('-').map(Number);
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${nombres[m-1]} ${y}`;
  })();

  async function guardarUhon() {
    const eid = perfil?.estudio_id;
    if (!eid) { alert('Error: no se pudo obtener el estudio.'); return; }
    await supabase.from('config').upsert({ estudio_id: eid, valor_uhon: Number(uhonInput) }, { onConflict: 'estudio_id' });
    setEditUhon(false);
    recargar();
  }

  const honPeriodo = honorarios.filter(h =>
    esMesActual ? (!h.periodo || h.periodo === mesActual) : h.periodo === periodoVista
  );

  const cobradosPeriodo = honPeriodo.filter(h=>h.estado==='pagado');
  const pendientesPeriodo = honPeriodo.filter(h=>h.estado!=='pagado');
  const uhonCobradosPeriodo = cobradosPeriodo.filter(h=>h.forma==='uhon').reduce((s,h)=>s+(Number(h.valor)||0),0);

  const [ordenHon, setOrdenHon] = useState('reciente');
  const lista = honPeriodo
    .filter(h=> filtroEstado==='todos' || h.estado===filtroEstado)
    .filter(h=>{
      if (!q) return true;
      const exp = expedientes.find(e=>e.id===h.expediente_id);
      const cli = clientes.find(c=>c.id===h.cliente_id);
      const blob = `${h.concepto} ${h.tipo_trabajo||''} ${exp?exp.caratula:''} ${cli?cli.nombre:''}`.toLowerCase();
      return blob.includes(q.toLowerCase());
    })
    .sort((a,b)=>{
      if (ordenHon==='monto-desc') return (Number(b.valor)||0)-(Number(a.valor)||0);
      if (ordenHon==='monto-asc') return (Number(a.valor)||0)-(Number(b.valor)||0);
      if (ordenHon==='cliente-az') {
        const expA=expedientes.find(e=>e.id===a.expediente_id); const cliA=clientes.find(c=>c.id===a.cliente_id);
        const expB=expedientes.find(e=>e.id===b.expediente_id); const cliB=clientes.find(c=>c.id===b.cliente_id);
        return (expA?expA.caratula:cliA?cliA.nombre:'').localeCompare(expB?expB.caratula:cliB?cliB.nombre:'');
      }
      return (b.creado_en||'').localeCompare(a.creado_en||'');
    });

  const totalPendiente = honorarios.filter(h=>h.estado!=='pagado').length;
  const totalUhonPendiente = honorarios.filter(h=>h.estado!=='pagado' && h.forma==='uhon').reduce((s,h)=>s+(Number(h.valor)||0),0);

  return (
    <div>
      {/* Tarjetas globales */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,gap:12,flexWrap:'wrap'}}>
        <div style={{background:'#fff',borderRadius:14,padding:'18px 20px',flex:1,minWidth:200,border:'1px solid #EBEBEA',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:6}}>💵 Valor actual del UHON</div>
          {!editUhon ? (
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:24,fontWeight:700}}>{valorUhon?fmtMoneda(valorUhon):'Sin cargar'}</span>
              <button onClick={()=>{setUhonInput(valorUhon||'');setEditUhon(true);}} style={{fontSize:11,color:'#2B6CB0',background:'none',border:'none',cursor:'pointer',textDecoration:'underline'}}>editar</button>
            </div>
          ) : (
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <input type="number" value={uhonInput} onChange={e=>setUhonInput(e.target.value)} placeholder="Ej: 45000"
                style={{padding:'6px 10px',border:'1px solid #DDDCDA',borderRadius:8,fontSize:13,width:120,fontFamily:'system-ui'}} />
              <button onClick={guardarUhon} style={{...btnPrimary,padding:'6px 12px'}}>OK</button>
              <button onClick={()=>setEditUhon(false)} style={{fontSize:12,color:'#6B7280',background:'none',border:'none',cursor:'pointer'}}>cancelar</button>
            </div>
          )}
        </div>
        <div style={{background:'#fff',borderRadius:14,padding:'18px 20px',flex:1,minWidth:160,border:'1px solid #EBEBEA',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:6}}>⏳ Sin cobrar (total)</div>
          <div style={{fontSize:28,fontWeight:700}}>{totalPendiente}</div>
        </div>
        <div style={{background:'#fff',borderRadius:14,padding:'18px 20px',flex:1,minWidth:160,border:'1px solid #EBEBEA',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:6}}>📊 UHON por cobrar</div>
          <div style={{fontSize:28,fontWeight:700}}>{totalUhonPendiente} {valorUhon?<span style={{fontSize:14,color:'#6B7280',fontWeight:400}}>({fmtMoneda(totalUhonPendiente*valorUhon)})</span>:null}</div>
        </div>
      </div>

      {/* Navegador de período */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={()=>navPeriodo(-1)} style={{background:'none',border:'1px solid #DDDCDA',borderRadius:8,padding:'4px 12px',cursor:'pointer',fontSize:16,color:'#4a4a4a'}}>‹</button>
          <span style={{fontWeight:600,fontSize:15,color:'#2c2c2c',minWidth:150,textAlign:'center'}}>{nombreMesPeriodo}</span>
          <button onClick={()=>navPeriodo(1)} disabled={esMesActual}
            style={{background:'none',border:'1px solid #DDDCDA',borderRadius:8,padding:'4px 12px',cursor:esMesActual?'default':'pointer',fontSize:16,color:esMesActual?'#c9c9c4':'#4a4a4a'}}>›</button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {!esMesActual && <span style={{fontSize:12,color:'#9C4221',background:'#FEF0E6',borderRadius:20,padding:'3px 10px',fontWeight:600}}>Solo lectura</span>}
          {esMesActual && <button onClick={()=>setVista('nuevo-honorario')} style={btnPrimary}>+ Nuevo honorario</button>}
        </div>
      </div>

      <Card>
        {/* Tarjetas resumen del período */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
          <div style={{background:'#EBF6E0',borderRadius:10,padding:'12px 14px',border:'1px solid #C0DD97'}}>
            <div style={{fontSize:11,color:'#27500A',fontWeight:600,marginBottom:4}}>💰 COBRADOS</div>
            <div style={{fontSize:22,fontWeight:700,color:'#27500A'}}>{cobradosPeriodo.length}</div>
          </div>
          <div style={{background:'#FAEEDA',borderRadius:10,padding:'12px 14px',border:'1px solid #F0CFAB'}}>
            <div style={{fontSize:11,color:'#633806',fontWeight:600,marginBottom:4}}>⏳ PENDIENTES</div>
            <div style={{fontSize:22,fontWeight:700,color:'#633806'}}>{pendientesPeriodo.length}</div>
          </div>
          <div style={{background:'#F7F6F3',borderRadius:10,padding:'12px 14px',border:'1px solid #DDDCDA'}}>
            <div style={{fontSize:11,color:'#6B7280',fontWeight:600,marginBottom:4}}>📊 UHON COBRADOS</div>
            <div style={{fontSize:22,fontWeight:700,color:'#444441'}}>
              {uhonCobradosPeriodo}
              {valorUhon && uhonCobradosPeriodo > 0 && <span style={{fontSize:12,fontWeight:400,color:'#6B7280',marginLeft:6}}>({fmtMoneda(uhonCobradosPeriodo*valorUhon)})</span>}
            </div>
          </div>
        </div>

        <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
          <input style={{...inputStyle,marginBottom:0,flex:1,minWidth:200}} placeholder="Buscar por concepto, cliente, expediente..." value={q} onChange={e=>setQ(e.target.value)} />
          <select style={{...inputStyle,marginBottom:0,width:'auto'}} value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="en proceso">En proceso</option>
            <option value="pagado">Pagados</option>
          </select>
          <select style={{...inputStyle,marginBottom:0,width:'auto'}} value={ordenHon} onChange={e=>setOrdenHon(e.target.value)}>
            <option value="reciente">Más reciente primero</option>
            <option value="monto-desc">Monto mayor primero</option>
            <option value="monto-asc">Monto menor primero</option>
            <option value="cliente-az">Cliente A→Z</option>
          </select>
        </div>
        {lista.length ? (
          <HonorariosTable lista={lista} expedientes={expedientes} clientes={clientes} cuotas={cuotas} valorUhon={valorUhon} setHonActual={setHonActual} setVista={setVista} />
        ) : <div style={{color:'#6B7280',fontSize:13,textAlign:'center',padding:30}}>Sin honorarios para {nombreMesPeriodo}.</div>}
      </Card>
    </div>
  );
}

function NuevoHonorario({ perfil, recargar, setVista, expedientes, clientes }) {
  const [f, setF] = useState({ concepto:'', tipo_trabajo:'', forma:'uhon', valor:'', expediente_id:'', cliente_id:'', en_cuotas:false, notas:'' });
  const [msg, setMsg] = useState('');
  const set = (k,v)=>setF({...f,[k]:v});
  async function guardar() {
    if (!f.concepto || !f.valor) { alert('Completá al menos el concepto y el valor.'); return; }
    if (!perfil) { alert('Esperá un segundo a que cargue tu perfil y probá de nuevo.'); return; }
    const payload = { concepto:f.concepto, tipo_trabajo:f.tipo_trabajo, forma:f.forma, valor:Number(f.valor),
      expediente_id:f.expediente_id||null, cliente_id:f.cliente_id||null, en_cuotas:f.en_cuotas, notas:f.notas,
      estado:'pendiente', estudio_id: perfil.estudio_id, periodo: HOY.substring(0,7) };
    const { error } = await supabase.from('honorarios').insert(payload);
    if (error) { alert('Error: '+error.message); return; }
    setMsg(`Honorario "${f.concepto}" guardado.` + (f.en_cuotas?' Ahora podés cargarle las cuotas desde su detalle.':''));
    setF({ concepto:'', tipo_trabajo:'', forma:'uhon', valor:'', expediente_id:'', cliente_id:'', en_cuotas:false, notas:'' });
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

        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Vincular a expediente</label>
        <select style={inputStyle} value={f.expediente_id} onChange={e=>set('expediente_id',e.target.value)}>
          <option value="">Sin vincular</option>
          {expedientes.map(ex=><option key={ex.id} value={ex.id}>{ex.caratula}</option>)}
        </select>

        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Vincular a cliente</label>
        <select style={inputStyle} value={f.cliente_id} onChange={e=>set('cliente_id',e.target.value)}>
          <option value="">Sin vincular</option>
          {clientes.map(cl=><option key={cl.id} value={cl.id}>{cl.nombre}</option>)}
        </select>

        <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,cursor:'pointer',fontSize:13}}>
          <input type="checkbox" checked={f.en_cuotas} onChange={e=>set('en_cuotas',e.target.checked)} style={{width:16,height:16,cursor:'pointer'}} />
          Se cobra en cuotas
        </label>
        {f.en_cuotas && <div style={{fontSize:11,color:'#8a8a8a',marginBottom:12,marginTop:-4,fontStyle:'italic'}}>Después de guardar, vas a poder cargar las cuotas (monto, vencimiento y estado) desde el detalle del honorario.</div>}

        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Notas</label>
        <textarea style={{...inputStyle,minHeight:56,resize:'vertical'}} value={f.notas} onChange={e=>set('notas',e.target.value)} />

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
    const nuevo = cu.estado==='pagada'?'pendiente':'pagada';
    await supabase.from('cuotas').update({ estado:nuevo }).eq('id', cu.id);
    // sugerir estado general
    const otras = cuotasH.filter(x=>x.id!==cu.id);
    const todasPagadas = [...otras, {...cu, estado:nuevo}].every(x=>x.estado==='pagada');
    const algunaPagada = [...otras, {...cu, estado:nuevo}].some(x=>x.estado==='pagada');
    let sugerido = h.estado;
    if (todasPagadas) sugerido='pagado'; else if (algunaPagada) sugerido='en proceso'; else sugerido='pendiente';
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

  const estadosDisp = h.en_cuotas ? ['pendiente','en proceso','pagado'] : ['pendiente','pagado'];

  return (
    <div>
      <button onClick={()=>setVista('honorarios')} style={{padding:'7px 13px',borderRadius:8,fontSize:13,cursor:'pointer',border:'1px solid #DDDCDA',background:'#fff',marginBottom:12}}>← Volver a honorarios</button>
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
            {cli && <Badge bg="#FBEAF0" color="#72243E">Cliente: {cli.nombre}</Badge>}
            {h.en_cuotas && <Badge bg="#FAEEDA" color="#633806">En cuotas</Badge>}
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

      {h.en_cuotas && (
        <Card title="🧾 Cuotas">
          {cuotasH.length ? cuotasH.map(cu=>(
            <div key={cu.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #F0EFED'}}>
              <div onClick={()=>toggleCuota(cu)} style={{width:16,height:16,borderRadius:4,border:cu.estado==='pagada'?'none':'1.5px solid #c9c9c4',background:cu.estado==='pagada'?'#2B6CB0':'#fff',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10}}>{cu.estado==='pagada'?'✓':''}</div>
              <div style={{flex:1}}>
                <span style={{fontSize:13,fontWeight:500}}>Cuota {cu.numero}</span>
                <span style={{fontSize:13,marginLeft:10}}>{fmtMoneda(cu.monto)}</span>
                {cu.vencimiento && <span style={{fontSize:11,color:'#8a8a8a',marginLeft:10}}>vence {formatFecha(cu.vencimiento)}</span>}
              </div>
              <Badge bg={cu.estado==='pagada'?'#EAF3DE':'#FAEEDA'} color={cu.estado==='pagada'?'#27500A':'#633806'}>{cu.estado}</Badge>
              <button onClick={()=>borrarCuota(cu)} style={{fontSize:11,color:'#A32D2D',background:'none',border:'none',cursor:'pointer'}}>borrar</button>
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

function NuevaTarea({ perfil, recargar }) {
  const [f, setF] = useState({ descripcion:'', responsable:'', deadline:'', comentario:'' });
  useEffect(()=>{ if(perfil?.nombre) setF(prev=>({...prev, responsable: prev.responsable||perfil.nombre})); }, [perfil]);
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
    <Card title="✅ Nueva tarea">
      {msg && <div style={{background:'#EAF3DE',border:'1px solid #C0DD97',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#27500A',marginBottom:14}}>✓ {msg}</div>}
      <div style={{maxWidth:520}}>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Descripción *</label>
        <textarea style={{...inputStyle,minHeight:72,resize:'vertical'}} value={f.descripcion} onChange={e=>set('descripcion',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Responsable *</label>
        <select style={inputStyle} value={f.responsable} onChange={e=>set('responsable',e.target.value)}>
          <option value="">Seleccioná</option>{ABOGADAS.map(a=><option key={a}>{a}</option>)}<option>Todos</option>
        </select>
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Vencimiento (opcional)</label>
        <input type="date" style={inputStyle} value={f.deadline} onChange={e=>set('deadline',e.target.value)} />
        <label style={{fontSize:12,fontWeight:500,color:'#4a4a4a',display:'block',marginBottom:5}}>Comentario (opcional)</label>
        <textarea style={{...inputStyle,minHeight:56,resize:'vertical'}} value={f.comentario} onChange={e=>set('comentario',e.target.value)} />
        <button onClick={guardar} style={btnPrimary}>Crear tarea</button>
      </div>
    </Card>
  );
}