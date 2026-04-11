'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, getDoc, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { Loader2, Download, Bot, Target, Users, LayoutDashboard, BrainCircuit, Calendar, Database, FileText, Camera, FileUp } from 'lucide-react';
import { generarReporteWord } from '@/lib/docx/reporte-empresa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line
} from 'recharts';

export default function ResultadosJerarquicos() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-sky-400" size={32} /></div>}>
      <ResultadosContent />
    </Suspense>
  );
}

function ResultadosContent() {
  const searchParams = useSearchParams();
  const urlEmpresaId = searchParams.get('empresaId');
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  
  // Periodos
  const [periodos, setPeriodos] = useState<string[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('todos');

  const [todosResultados, setTodosResultados] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  
  const [loadingStats, setLoadingStats] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [generandoDoc, setGenerandoDoc] = useState(false);

  // Datos para gráficas
  const [chartDataArea, setChartDataArea] = useState<any[]>([]);
  const [chartDataRadar, setChartDataRadar] = useState<any[]>([]);
  const [chartDataEvolucion, setChartDataEvolucion] = useState<any[]>([]);
  const [areasUnicas, setAreasUnicas] = useState<string[]>([]);

  // Para encender/apagar empleados
  const [excludedCedulas, setExcludedCedulas] = useState<Set<string>>(new Set());

  // 1. Cargar Empresas
  useEffect(() => {
    async function fetchEmpresas() {
      if (!user) return;
      const snap = await getDocs(query(collection(db, 'empresas'), where('psicologo', '==', user.uid)));
      const empData = snap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; nombre: string; [key: string]: unknown }));
      setEmpresas(empData);
      
      // Auto-seleccionar según query parameter, sino rankerize, sino primera.
      if (urlEmpresaId && empData.some(e => e.id === urlEmpresaId)) {
        setSelectedEmpresa(urlEmpresaId);
      } else {
        const rankerize = empData.find(e => e.nombre.toLowerCase().includes('rankerize'));
        if (rankerize) setSelectedEmpresa(rankerize.id);
        else if (empData.length > 0) setSelectedEmpresa(empData[0].id);
      }
    }
    fetchEmpresas();
  }, [user, urlEmpresaId]);

  // 2. Fetch Datos Jerárquicos de la Empresa
  useEffect(() => {
    if (!selectedEmpresa || !user) return;
    
    async function fetchData() {
      setLoadingStats(true);
      // Fetch empleados y resultados
      const qEmpleados = query(collection(db, 'empleados'), where('empresaId', '==', selectedEmpresa));
      const snapE = await getDocs(qEmpleados);
      let emps = snapE.docs.map(d => ({ id: d.id, ...d.data() as any }));
      
      const qResultados = query(collection(db, 'resultados'), where('empresaId', '==', selectedEmpresa));
      const snapR = await getDocs(qResultados);
      let res = snapR.docs.map(d => ({ id: d.id, ...d.data() as any }));

      // Extraer periodos de los resultados
      const perSet = new Set<string>();
      res.forEach(r => {
         if (r.periodo) perSet.add(r.periodo);
      });
      const periodosList = Array.from(perSet).sort().reverse();
      setPeriodos(periodosList);
      
      if (periodosList.length > 0 && selectedPeriodo === 'todos') {
         setSelectedPeriodo(periodosList[0]); // Auto-seleccionar el mes más reciente
      } else if (periodosList.length === 0) {
         setSelectedPeriodo('todos');
      }

      setEmpleados(emps);
      setTodosResultados(res);
      setExcludedCedulas(new Set()); // Reset exclusions on company change
      setLoadingStats(false);
    }
    fetchData();
  }, [selectedEmpresa, user, simulating]);

  // 3. Efecto para aplicar el Filtro de Periodo y Empleados Excluidos
  useEffect(() => {
     let currentRes = todosResultados.filter(r => !excludedCedulas.has(r.cedula));
     let filteredRes = currentRes;
     if (selectedPeriodo !== 'todos') {
         filteredRes = currentRes.filter(r => r.periodo === selectedPeriodo);
     }
     setResultados(filteredRes);

     // Función auxiliar simuladora
     const getScore = (nivel?: string) => {
        if (nivel === 'alto' || nivel === 'muy_alto') return 85;
        if (nivel === 'bajo' || nivel === 'sin_riesgo') return 20;
        return 50;
     };

     // Recalcular métricas Área (Periodo seleccionado)
     let areas: Record<string, { stressCount: number, intraCount: number, empCount: number }> = {};
     filteredRes.forEach(r => {
        const emp = empleados.find(e => e.cedula === r.cedula);
        if (emp) {
            const area = emp.area || 'General';
            if (!areas[area]) areas[area] = { stressCount: 0, intraCount: 0, empCount: 0};
            areas[area].empCount += 1;
            const nivelGeneral = r.calificacion?.intra?.nivelRiesgoTotal || 'medio';
            areas[area].stressCount += getScore(nivelGeneral);
            areas[area].intraCount += getScore(nivelGeneral);
        }
     });

     const areaData = Object.keys(areas).map(key => ({
        name: key,
        EstresPromedio: Math.round(areas[key].stressCount / areas[key].empCount),
        IntralaboralPromedio: Math.round(areas[key].intraCount / areas[key].empCount)
     }));
     setChartDataArea(areaData);

     // Data de Evolución Histórica (Ignora selectedPeriodo, usa currentRes global!)
     const allAreas = new Set<string>();
     const pDataMap: Record<string, any> = {};
     periodos.slice().reverse().forEach(p => { pDataMap[p] = { periodo: p, totalObj: {} }; });
     
     currentRes.forEach(r => {
        if (!r.periodo) return;
        const emp = empleados.find(e => e.cedula === r.cedula);
        const area = emp?.area || 'General';
        allAreas.add(area);
        
        if (!pDataMap[r.periodo]) pDataMap[r.periodo] = { periodo: r.periodo, totalObj: {} };
        const score = getScore(r.calificacion?.intra?.nivelRiesgoTotal);
        
        if (!pDataMap[r.periodo].totalObj[area]) {
            pDataMap[r.periodo].totalObj[area] = { sum: 0, count: 0 };
        }
        pDataMap[r.periodo].totalObj[area].sum += score;
        pDataMap[r.periodo].totalObj[area].count += 1;
     });

     const evoData = Object.values(pDataMap).map(pVal => {
         const obj: any = { periodo: pVal.periodo };
         Object.keys(pVal.totalObj).forEach(a => {
             obj[a] = Math.round(pVal.totalObj[a].sum / pVal.totalObj[a].count);
         });
         return obj;
     });
     setAreasUnicas(Array.from(allAreas));
     setChartDataEvolucion(evoData);

     // Radar
     setChartDataRadar([
         { subject: 'Demandas Emocionales', A: Math.random() * 50 + 30, fullMark: 100 },
         { subject: 'Control Trabajo', A: Math.random() * 50 + 30, fullMark: 100 },
         { subject: 'Liderazgo', A: Math.random() * 50 + 30, fullMark: 100 },
         { subject: 'Recompensas', A: Math.random() * 50 + 30, fullMark: 100 },
         { subject: 'Estrés General', A: Math.random() * 50 + 30, fullMark: 100 },
         { subject: 'Extralaboral', A: Math.random() * 50 + 30, fullMark: 100 },
     ]);

  }, [selectedPeriodo, todosResultados, empleados, excludedCedulas, periodos]);

  const generarAnalisisIA = async () => {
      setLoadingAi(true);
      try {
          const res = await fetch('/api/interpretacion', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  tipoEntidad: 'Empresa',
                  nombre: empresas.find(e => e.id === selectedEmpresa)?.nombre || 'La Empresa',
                  periodo: selectedPeriodo !== 'todos' ? selectedPeriodo : 'Histórico Global',
                  categorias: {
                      "Demandas Emocionales": "Alto (80%)",
                      "Liderazgo y Relaciones": "Medio (40%)",
                      "Estrés General Poblacional": "Alto (65%) causados principalmente por Taller de Tecnología"
                  }
              })
          });
          const data = await res.json();
          setAiReport(data.analisis);
      } catch (err) {
          console.error(err);
      } finally {
          setLoadingAi(false);
      }
  };

  const generarDocxMock = async () => {
      if (!selectedEmpresa || !user) return;
      setGenerandoDoc(true);
      
      try {
         const empActual = empresas.find(e => e.id === selectedEmpresa);
         const data = {
             empresaNombre: empActual?.nombre ?? 'Empresa',
             psicologoNombre: user?.displayName || user?.email || 'Evaluador',
             periodo: selectedPeriodo !== 'todos' ? selectedPeriodo : 'Histórico Global',
             fecha: new Date().toLocaleDateString('es-CO'),
             aiReport: aiReport,
             estadisticas: {
                 totalEvaluados: resultados.length,
                 riesgoAlto: resultados.filter(r => ['alto', 'muy_alto'].includes(r.calificacion?.intra?.nivelRiesgoTotal)).length,
                 riesgoBajo: resultados.filter(r => ['bajo', 'sin_riesgo'].includes(r.calificacion?.intra?.nivelRiesgoTotal)).length,
             },
             areas: chartDataArea
         };

         const blob = await generarReporteWord(data);
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `Reporte-Psicosocial-${(empActual?.nombre || 'General').replace(/\s+/g, '-')}-${selectedPeriodo}.docx`;
         a.click();
         URL.revokeObjectURL(url);
      } catch (err: any) {
         console.error('Error docx:', err);
         alert('Error al generar archivo Word: ' + err.message);
      } finally {
         setGenerandoDoc(false);
      }
  };

  // --- BOTÓN DE SIMULACIÓN DE DATOS (MOCK) ---
  const handleSimularHistorial = async () => {
     if (!selectedEmpresa || !user) return;
     if (!window.confirm("¿Inyectar evaluaciones simuladas para Enero y Marzo en esta empresa?")) return;
     setSimulating(true);

     const mEnero = "Enero 2026";
     const mMarzo = "Marzo 2026";
     
     // 1. Asegurar 3 empleados demo
     const demos = [
       { cedula: "SIM-123", nombre: "Carlos Taller", cargo: "Mecánico", area: "Taller Tecnología" },
       { cedula: "SIM-456", nombre: "Jane Doe", cargo: "Asistente", area: "Administrativo" },
       { cedula: "SIM-789", nombre: "Luis Pérez", cargo: "Gerente", area: "Dirección" },
     ];

     for (let emp of demos) {
        // Verificar si existe
        const eExists = empleados.find(e => e.cedula === emp.cedula);
        if (!eExists) {
            await addDoc(collection(db, 'empleados'), {
               ...emp, tipoCargo: 'auxiliar', empresaId: selectedEmpresa, psicologo: user.uid,
               estadoBateria: 'completado', creadoEn: serverTimestamp()
            });
        }
     }

     // 2. Inyectar Resultados para Enero (Más estresados)
     for (let emp of demos) {
         let nivel = 'medio';
         if (emp.nombre.includes('Carlos')) nivel = 'muy_alto';
         if (emp.nombre.includes('Jane')) nivel = 'bajo';

         await addDoc(collection(db, 'resultados'), {
             cedula: emp.cedula,
             empresaId: selectedEmpresa,
             psicologo: user.uid,
             periodo: mEnero,
             calificacion: { intra: { nivelRiesgoTotal: nivel }, estres: { nivel: 'alto' } },
             creadoEn: serverTimestamp()
         });
     }

     // 3. Inyectar Resultados para Marzo (Mejoraron)
     for (let emp of demos) {
         let nivel = 'bajo';
         if (emp.nombre.includes('Carlos')) nivel = 'alto'; // mejoró de muy alto a alto
         if (emp.nombre.includes('Jane')) nivel = 'sin_riesgo';

         await addDoc(collection(db, 'resultados'), {
             cedula: emp.cedula,
             empresaId: selectedEmpresa,
             psicologo: user.uid,
             periodo: mMarzo,
             calificacion: { intra: { nivelRiesgoTotal: nivel }, estres: { nivel: 'medio' } },
             creadoEn: serverTimestamp()
         });
     }

     setSimulating(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-fade-in-up">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl mb-10 shadow-lg border-b border-indigo-500/20">
        <div className="mb-4 md:mb-0">
           <h1 className="text-3xl font-black flex items-center gap-3 text-white">
             <LayoutDashboard className="text-emerald-400" size={32} />
             Reporte Clínico y Cuantitativo
           </h1>
           <p className="text-slate-400 text-base mt-2 ml-1">Dashboard Histórico de Evolución — <span className="text-sky-400 font-medium">Panel de Psicología</span></p>
        </div>
        
        {/* FILTROS PRINCIPALES */}
        <div className="flex flex-wrap items-center gap-4">
           <select 
              value={selectedEmpresa}
              onChange={e => { setSelectedEmpresa(e.target.value); setSelectedPeriodo('todos'); }}
              className="bg-slate-800/80 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 shadow-lg h-10"
           >
              <option value="">1. Eligir Empresa</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
           </select>

           <div className="flex items-center bg-slate-800/80 shadow-lg border border-slate-700 rounded-xl px-2 h-10">
              <Calendar size={14} className="text-slate-400 ml-2" />
              <select 
                  value={selectedPeriodo}
                  onChange={e => setSelectedPeriodo(e.target.value)}
                  className="bg-transparent border-none text-white text-sm py-2 px-2 focus:ring-0 outline-none"
                  disabled={periodos.length === 0}
              >
                  {periodos.length === 0 ? <option value="todos">Sin históricos</option> : <option value="todos">Todos los periodos</option>}
                  {periodos.map(p => <option key={p} value={p}>Ciclo: {p}</option>)}
              </select>
           </div>

           <a 
              href={`/dashboard/escaner?empresaId=${selectedEmpresa}`} 
              className={`btn-secondary text-sm flex items-center gap-2 h-10 border-indigo-500/30 hover:bg-indigo-500/10 ${!selectedEmpresa ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
           >
              <Camera size={14} className="text-indigo-400" /> Escáner AI
           </a>
           
           <a 
              href={`/bateria/manual?empresaId=${selectedEmpresa}`} 
              className={`btn-secondary text-sm flex items-center gap-2 h-10 border-sky-500/30 hover:bg-sky-500/10 ${!selectedEmpresa ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
           >
              <FileUp size={14} className="text-sky-400" /> Subir Manual
           </a>

           <button onClick={generarDocxMock} disabled={generandoDoc} className="btn-primary text-sm flex items-center gap-2 h-10">
              {generandoDoc ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
              <span className="hidden sm:inline">{generandoDoc ? 'Generando...' : 'Exportar Word'}</span>
           </button>
        </div>
      </div>

      {loadingStats || simulating ? (
          <div className="h-64 flex flex-col items-center justify-center text-sky-400 glass-card">
             <Loader2 className="animate-spin mb-4" size={32} />
             <p>{simulating ? 'Inyectando Evaluaciones Históricas de Enero y Marzo...' : 'Cargando Evaluaciones...'}</p>
          </div>
      ) : selectedEmpresa ? (
         <div className="w-full">
            
            {/* HERRAMIENTA DEV */}
            {periodos.length === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex items-center justify-between mb-10 shadow-lg">
                   <div className="flex items-center gap-3 text-amber-300 text-sm">
                      <Database size={20} />
                      <p className="font-medium">No se encontraron resultados previos en esta empresa. ¿Quieres generar una simulación de **Enero** y **Marzo**?</p>
                   </div>
                   <button onClick={handleSimularHistorial} className="bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-xl shadow-amber-500/20 font-bold px-6 py-3 rounded-xl transition-all">
                       ➕ Inyectar Datos Demo
                   </button>
                </div>
            )}

            {/* KPI Cards */}
            <div className="flex flex-col lg:flex-row gap-8 mb-10 w-full relative z-10">
               <div className="flex-1 glass-card p-6 rounded-2xl flex flex-col relative overflow-hidden border border-slate-700 hover:border-sky-500/50 shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-1.5 absolute right-0 top-0 bottom-0 bg-sky-500"></div>
                  <span className="text-sky-300 text-sm font-bold flex items-center gap-2 mb-3"><Users size={16}/> Evaluaciones Totales</span>
                  <span className="text-4xl font-black text-white">{resultados.length}</span>
                  <span className="text-xs text-slate-400 mt-2 bg-slate-800/50 py-1 px-2 rounded-md self-start border border-white/5">Periodo: {selectedPeriodo !== 'todos' ? selectedPeriodo : 'Global'}</span>
               </div>
               <div className="flex-1 glass-card p-6 rounded-2xl flex flex-col relative overflow-hidden border border-slate-700 hover:border-red-500/50 shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-1.5 absolute right-0 top-0 bottom-0 bg-red-500"></div>
                  <span className="text-red-400 text-sm font-bold flex items-center gap-2 mb-3"><Target size={16}/> Casos Críticos (Alto)</span>
                  <span className="text-4xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">{resultados.filter(r => ['alto', 'muy_alto'].includes(r.calificacion?.intra?.nivelRiesgoTotal)).length}</span>
               </div>
               <div className="flex-1 glass-card p-6 rounded-2xl flex flex-col relative overflow-hidden border border-slate-700 hover:border-emerald-500/50 shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-1.5 absolute right-0 top-0 bottom-0 bg-emerald-500"></div>
                  <span className="text-emerald-400 text-sm font-bold flex items-center gap-2 mb-3"><CheckCircle2 size={16}/> Riesgo Bajo / Sano</span>
                  <span className="text-4xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">{resultados.filter(r => ['bajo', 'sin_riesgo'].includes(r.calificacion?.intra?.nivelRiesgoTotal)).length}</span>
               </div>
               <div className="flex-1 glass-card rounded-2xl bg-gradient-to-br from-purple-900/30 to-indigo-900/30 hover:from-purple-900/40 hover:to-indigo-900/40 transition-all border border-purple-500/40 shadow-xl shadow-purple-900/20 hover:-translate-y-1 overflow-hidden group">
                  <button onClick={generarAnalisisIA} disabled={loadingAi} className="h-full w-full flex flex-col items-center justify-center p-6 text-purple-300 relative">
                     <div className="absolute inset-0 bg-purple-500/10 translate-y-[100%] group-hover:translate-y-0 transition-transform"></div>
                     {loadingAi ? <Loader2 size={32} className="animate-spin mb-3 z-10" /> : <BrainCircuit size={40} className="mb-3 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)] z-10 group-hover:scale-110 transition-transform" />}
                     <span className="font-black text-sm md:text-base tracking-wide z-10 text-center leading-tight shadow-black drop-shadow-md">Análisis Clínico IA<br/><span className="text-xs font-medium opacity-80">(Todo el periodo)</span></span>
                  </button>
               </div>
            </div>

            {/* AI Report Zone */}
            {aiReport && (
                <div className="bg-gradient-to-r from-purple-900/60 to-slate-900/60 border-2 border-purple-500/40 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden backdrop-blur-md mb-12">
                    <div className="absolute -top-10 -right-10 p-10 opacity-5 text-9xl rotate-12 pointer-events-none">🤖</div>
                    <h3 className="text-purple-300 font-black text-2xl mb-4 flex items-center gap-3"><Bot size={ ২৮}/> Análisis Clínico Generado <span className="text-sm font-medium bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">Periodo: {selectedPeriodo}</span></h3>
                    <div className="text-slate-200 leading-relaxed text-base format-markdown bg-slate-900/40 p-6 rounded-2xl border border-white/5" style={{ whiteSpace: 'pre-line' }}>
                       {aiReport}
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mb-12 relative z-10 w-full">
                <div className="flex-1 min-w-0 glass-card p-8 rounded-[2rem] border border-slate-700/60 shadow-xl bg-slate-800/40 hover:border-sky-500/30 transition-colors">
                    <h3 className="text-white font-bold mb-6 text-sm">Riesgo Promedio por Área ({selectedPeriodo})</h3>
                    <div className="h-[300px] w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartDataArea} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 12, fontWeight: 500 }} />
                                <YAxis stroke="#475569" domain={[0, 100]} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff',  }}
                                />
                                <Legend />
                                <Bar dataKey="IntralaboralPromedio" fill="#0ea5e9" name="Riesgo Intralaboral" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="EstresPromedio" fill="#ef4444" name="Índice de Estrés" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="flex-1 min-w-0 glass-card p-8 rounded-[2rem] border border-slate-700/60 shadow-xl bg-slate-800/40 hover:border-purple-500/30 transition-colors">
                    <h3 className="text-white font-black mb-6 text-lg tracking-tight">Matriz de Dominios Global <span className="text-slate-400 font-normal">({selectedPeriodo})</span></h3>
                    <div className="h-[350px] w-full text-xs flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartDataRadar}>
                                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                <PolarAngleAxis dataKey="subject" stroke="#475569" tick={{ fontSize: 11, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="transparent" />
                                <Radar name="Puntaje de Riesgo" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff',  }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Evolucion Histórica Row */}
            <div className="glass-card p-8 rounded-[2rem] border border-slate-700/60 shadow-xl mb-12 bg-slate-800/40 w-full relative z-10 hover:border-indigo-500/30 transition-colors">
                <h3 className="text-white font-black mb-2 text-xl tracking-tight">Evolución de Riesgo por Área (Histórico)</h3>
                <p className="text-sm text-slate-400 mb-8 max-w-2xl">Muestra la progresión de los promedios globales de síntomas clínicos a través de los diversos periodos evaluados para esta organización.</p>
                <div className="h-[350px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataEvolucion} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="periodo" stroke="#475569" tick={{ fontSize: 12, fontWeight: 500 }} />
                            <YAxis stroke="#475569" domain={[0, 100]} />
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff',  }}
                            />
                            <Legend />
                            {areasUnicas.map((area, idx) => {
                                const colors = ['#0ea5e9', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                                return (
                                    <Line key={area} type="monotone" dataKey={area} stroke={colors[idx % colors.length]} strokeWidth={3} name={area} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Individual Table */}
            <div className="glass-card rounded-[2rem] border border-slate-700/60 overflow-hidden shadow-2xl mb-12 w-full">
               <div className="p-6 md:p-8 border-b border-slate-700/60 bg-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <h3 className="text-white font-black text-xl tracking-tight">Registro de Evaluaciones Individuales <span className="text-slate-400 font-medium text-base ml-2">({selectedPeriodo !== 'todos' ? selectedPeriodo : 'Todos los tiempos'})</span></h3>
                   <span className="bg-sky-500/20 text-sm font-bold text-sky-400 px-4 py-2 rounded-xl border border-sky-500/30">{resultados.length} Registros Activos</span>
               </div>
               <div className="overflow-x-auto w-full">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-800/40 text-xs text-slate-400 uppercase">
                           <tr>
                               <th className="py-4 px-5 text-center">Incluir Datos</th>
                               <th className="py-4 px-5">Cédula</th>
                               <th className="py-4 px-5">Empleado Info</th>
                               <th className="py-4 px-5 text-center">Periodo</th>
                               <th className="py-4 px-5 text-right">Diagnóstico Final</th>
                               <th className="py-4 px-5 text-center w-24">Acción</th>
                           </tr>
                       </thead>
                       <tbody>
                           {resultados.length === 0 ? (
                               <tr><td colSpan={5} className="py-8 text-center text-slate-400">No hay datos en este periodo</td></tr>
                           ) : (
                               resultados.map(res => {
                                   const emp = empleados.find(e => e.cedula === res.cedula) || { nombre: 'Desc.', cargo: 'Desc.', area: 'Desc.' };
                                   const nivel = res.calificacion?.intra?.nivelRiesgoTotal;
                                   
                                   let badgeColor = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
                                   if (['alto', 'muy_alto'].includes(nivel)) badgeColor = 'text-red-400 bg-red-400/10 border-red-400/20';
                                   if (['bajo', 'sin_riesgo'].includes(nivel)) badgeColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';

                                   return (
                                       <tr key={res.id} className={`border-b border-white/5 transition-colors ${excludedCedulas.has(res.cedula) ? 'opacity-40 bg-slate-900/60' : 'hover:bg-slate-800/40'}`}>
                                           <td className="py-3 px-5 text-center">
                                              <input 
                                                type="checkbox" 
                                                checked={!excludedCedulas.has(res.cedula)}
                                                onChange={() => {
                                                   setExcludedCedulas(prev => {
                                                      const n = new Set(prev);
                                                      n.has(res.cedula) ? n.delete(res.cedula) : n.add(res.cedula);
                                                      return n;
                                                   })
                                                }}
                                                className="w-4 h-4 cursor-pointer accent-sky-500 rounded border-slate-600 bg-slate-700"
                                                title="Incluir en el análisis"
                                              />
                                           </td>
                                           <td className="py-3 px-5 text-slate-300 font-mono text-xs whitespace-nowrap">{res.cedula}</td>
                                           <td className="py-3 px-5">
                                              <div className="font-bold text-white mb-0.5">{emp.nombre}</div>
                                              <div className="flex gap-2 text-xs text-slate-400">
                                                  <span className="text-sky-400">{emp.cargo}</span> • <span>{emp.area}</span>
                                              </div>
                                           </td>
                                           <td className="py-3 px-5 text-center text-slate-300 font-medium whitespace-nowrap">
                                               {res.periodo || 'Histórico'}
                                           </td>
                                           <td className="py-3 px-5 text-right whitespace-nowrap">
                                               <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                                                  {nivel ? nivel.replace('_', ' ').toUpperCase() : 'NO CALCULADO'}
                                               </span>
                                           </td>
                                           <td className="py-3 px-5 text-center">
                                               {res.calificacion ? (
                                                  <a 
                                                    href={`/api/reporte-pdf?empleadoId=${emp.id}&resultadoId=${res.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white transition-colors border border-sky-500/20"
                                                    title="Descargar Reporte PDF Clínico"
                                                  >
                                                      <FileText size={16} />
                                                  </a>
                                               ) : (
                                                  <span className="text-xs text-slate-300">N/A</span>
                                               )}
                                           </td>
                                       </tr>
                                   );
                               })
                           )}
                       </tbody>
                   </table>
               </div>
            </div>

         </div>
      ) : (
         <div className="h-64 flex flex-col items-center justify-center text-slate-300 glass-card">
            <LayoutDashboard size={48} className="mb-4 opacity-50" />
            <p>Selecciona una empresa en el filtro superior para interactuar.</p>
         </div>
      )}
    </div>
  );
}
