'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, getDoc, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { Loader2, Download, Bot, Target, Users, LayoutDashboard, BrainCircuit, Calendar, Database, FileText } from 'lucide-react';
import { generarReporteWord } from '@/lib/docx/reporte-empresa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export default function ResultadosJerarquicos() {
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

  // 1. Cargar Empresas
  useEffect(() => {
    async function fetchEmpresas() {
      if (!user) return;
      const snap = await getDocs(query(collection(db, 'empresas'), where('psicologo', '==', user.uid)));
      const empData = snap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; nombre: string; [key: string]: unknown }));
      setEmpresas(empData);
      
      // Auto-seleccionar primera empresa que tenga nombre similar a rankerize o la primera de la lista
      const rankerize = empData.find(e => e.nombre.toLowerCase().includes('rankerize'));
      if (rankerize) setSelectedEmpresa(rankerize.id);
      else if (empData.length > 0) setSelectedEmpresa(empData[0].id);
    }
    fetchEmpresas();
  }, [user]);

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
      setLoadingStats(false);
    }
    fetchData();
  }, [selectedEmpresa, user, simulating]);

  // 3. Efecto para aplicar el Filtro de Periodo
  useEffect(() => {
     let filteredRes = todosResultados;
     if (selectedPeriodo !== 'todos') {
         filteredRes = todosResultados.filter(r => r.periodo === selectedPeriodo);
     }
     setResultados(filteredRes);

     // Recalcular métricas
     let areas: Record<string, { stressCount: number, intraCount: number, empCount: number }> = {};
     filteredRes.forEach(r => {
        const emp = empleados.find(e => e.cedula === r.cedula);
        if (emp) {
            const area = emp.area || 'General';
            if (!areas[area]) areas[area] = { stressCount: 0, intraCount: 0, empCount: 0};
            areas[area].empCount += 1;
            
            // Simular niveles de área según datos del resultado
            const nivelGeneral = r.calificacion?.intra?.nivelRiesgoTotal || 'medio';
            if (nivelGeneral === 'alto' || nivelGeneral === 'muy_alto') {
               areas[area].stressCount += 85; areas[area].intraCount += 90;
            } else if (nivelGeneral === 'bajo' || nivelGeneral === 'sin_riesgo') {
               areas[area].stressCount += 15; areas[area].intraCount += 20;
            } else {
               areas[area].stressCount += 50; areas[area].intraCount += 45;
            }
        }
     });

     const areaData = Object.keys(areas).map(key => ({
        name: key,
        EstresPromedio: Math.round(areas[key].stressCount / areas[key].empCount),
        IntralaboralPromedio: Math.round(areas[key].intraCount / areas[key].empCount)
     }));
     setChartDataArea(areaData);

     // Radar
     setChartDataRadar([
         { subject: 'Demandas Emocionales', A: Math.random() * 50 + 30, fullMark: 100 },
         { subject: 'Control Trabajo', A: Math.random() * 50 + 30, fullMark: 100 },
         { subject: 'Liderazgo', A: Math.random() * 50 + 30, fullMark: 100 },
         { subject: 'Recompensas', A: Math.random() * 50 + 30, fullMark: 100 },
         { subject: 'Estrés General', A: Math.random() * 50 + 30, fullMark: 100 },
         { subject: 'Extralaboral', A: Math.random() * 50 + 30, fullMark: 100 },
     ]);

  }, [selectedPeriodo, todosResultados, empleados]);

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
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4">
        <div>
           <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
             <LayoutDashboard className="text-emerald-400" />
             Reporte Clínico y Cuantitativo
           </h1>
           <p className="text-slate-400 text-sm mt-1">Dashboard Histórico de Evolución</p>
        </div>
        
        {/* FILTROS PRINCIPALES */}
        <div className="flex flex-wrap items-center gap-3">
           <select 
              value={selectedEmpresa}
              onChange={e => { setSelectedEmpresa(e.target.value); setSelectedPeriodo('todos'); }}
              className="bg-slate-800/80 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 shadow-lg"
           >
              <option value="">1. Eligir Empresa</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
           </select>

           <div className="flex items-center bg-slate-800/80 shadow-lg border border-slate-700 rounded-xl px-2">
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

           <button onClick={generarDocxMock} disabled={generandoDoc} className="btn-primary text-sm flex items-center gap-2">
              {generandoDoc ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
              {generandoDoc ? 'Generando...' : 'Exportar Word'}
           </button>
        </div>
      </div>

      {loadingStats || simulating ? (
          <div className="h-64 flex flex-col items-center justify-center text-sky-400 glass-card">
             <Loader2 className="animate-spin mb-4" size={32} />
             <p>{simulating ? 'Inyectando Evaluaciones Históricas de Enero y Marzo...' : 'Cargando Evaluaciones...'}</p>
          </div>
      ) : selectedEmpresa ? (
         <div className="space-y-6">
            
            {/* HERRAMIENTA DEV */}
            {periodos.length === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
                   <div className="flex items-center gap-3 text-amber-300 text-sm">
                      <Database size={18} />
                      <p>No se encontraron resultados previos en esta empresa. ¿Quieres generar una simulación de **Enero** y **Marzo**?</p>
                   </div>
                   <button onClick={handleSimularHistorial} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow-lg">
                       ➕ Inyectar Datos Demo
                   </button>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="glass-card p-5 rounded-xl flex flex-col relative overflow-hidden">
                  <div className="w-1 absolute right-0 top-0 bottom-0 bg-sky-500"></div>
                  <span className="text-slate-400 text-sm flex items-center gap-1 mb-2"><Users size={14}/> Evaluaciones en el Periodo</span>
                  <span className="text-3xl font-bold text-white">{resultados.length}</span>
                  <span className="text-xs text-slate-400 mt-1">Periodo: {selectedPeriodo !== 'todos' ? selectedPeriodo : 'Histórico global'}</span>
               </div>
               <div className="glass-card p-5 rounded-xl flex flex-col relative overflow-hidden">
                  <div className="w-1 absolute right-0 top-0 bottom-0 bg-red-500"></div>
                  <span className="text-red-300 text-sm flex items-center gap-1 mb-2"><Target size={14}/> Casos Críticos (Alto)</span>
                  <span className="text-3xl font-bold text-red-500">{resultados.filter(r => ['alto', 'muy_alto'].includes(r.calificacion?.intra?.nivelRiesgoTotal)).length}</span>
               </div>
               <div className="glass-card p-5 rounded-xl flex flex-col relative overflow-hidden">
                  <div className="w-1 absolute right-0 top-0 bottom-0 bg-emerald-500"></div>
                  <span className="text-emerald-300 text-sm flex items-center gap-1 mb-2">Casos Saludables (Bajo)</span>
                  <span className="text-3xl font-bold text-emerald-400">{resultados.filter(r => ['bajo', 'sin_riesgo'].includes(r.calificacion?.intra?.nivelRiesgoTotal)).length}</span>
               </div>
               <div className="glass-card p-1 rounded-xl bg-purple-900/10 hover:bg-purple-900/20 transition-colors border border-purple-500/30">
                  <button onClick={generarAnalisisIA} disabled={loadingAi} className="h-full w-full flex flex-col items-center justify-center py-3 text-purple-300">
                     {loadingAi ? <Loader2 size={24} className="animate-spin mb-2" /> : <BrainCircuit size={28} className="mb-2 text-purple-400" />}
                     <span className="font-bold text-sm tracking-wide">Interpretación IA de {selectedPeriodo !== 'todos' ? selectedPeriodo : 'Todo'}</span>
                  </button>
               </div>
            </div>

            {/* AI Report Zone */}
            {aiReport && (
                <div className="bg-gradient-to-r from-purple-900/60 to-slate-900/60 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 text-8xl rotate-12">🤖</div>
                    <h3 className="text-purple-300 font-bold mb-3 flex items-center gap-2"><Bot size={20}/> Análisis Clínico Generado (Periodo: {selectedPeriodo})</h3>
                    <div className="text-slate-200 leading-relaxed text-sm format-markdown" style={{ whiteSpace: 'pre-line' }}>
                       {aiReport}
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-2xl">
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

                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-white font-bold mb-6 text-sm">Matriz de Dominios Global ({selectedPeriodo})</h3>
                    <div className="h-[300px] w-full text-xs flex justify-center">
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

            {/* Individual Table */}
            <div className="glass-card rounded-2xl border-white/10 overflow-hidden">
               <div className="p-5 border-b border-white/10 flex justify-between items-center">
                   <h3 className="text-white font-bold text-sm">Evaluaciones Tomadas en {selectedPeriodo !== 'todos' ? selectedPeriodo : 'Todos los tiempos'}</h3>
                   <span className="bg-slate-800 text-xs text-sky-400 px-3 py-1 rounded-full">{resultados.length} Registros</span>
               </div>
               <div className="overflow-x-auto w-full">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-800/40 text-xs text-slate-400 uppercase">
                           <tr>
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
                                       <tr key={res.id} className="border-b border-white/5 hover:bg-slate-800/40 transition-colors">
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
