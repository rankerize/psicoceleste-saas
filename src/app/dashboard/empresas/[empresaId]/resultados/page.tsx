'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { Loader2, Download, Bot, Target, Users, LayoutDashboard, BrainCircuit, ChevronLeft } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ResultadosJerarquicos() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  
  const [empresa, setEmpresa] = useState<{nombre: string, id: string} | null>(null);
  
  const [resultados, setResultados] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Stats mockeados dinámicos basados en la empresa seleccionada
  const [chartDataArea, setChartDataArea] = useState<any[]>([]);
  const [chartDataRadar, setChartDataRadar] = useState<any[]>([]);

  useEffect(() => {
    if (!empresaId) return;
    
    async function fetchData() {
      setLoadingStats(true);
      
      // Fetch empresa
      const empDoc = await getDoc(doc(db, 'empresas', empresaId));
      if (empDoc.exists()) setEmpresa({ id: empDoc.id, nombre: empDoc.data().nombre });

      // Fetch empleados y resultados
      const qEmpleados = query(collection(db, 'empleados'));
      const snapE = await getDocs(qEmpleados);
      let emps = snapE.docs.map(d => ({ id: d.id, ...d.data() as any })).filter(e => e.empresaId === empresaId);
      
      const qResultados = query(collection(db, 'resultados'));
      const snapR = await getDocs(qResultados);
      let res = snapR.docs.map(d => ({ id: d.id, ...d.data() as any })).filter(r => r.empresaId === empresaId);

      setEmpleados(emps);
      setResultados(res);

      if (emps.length === 0) {
          setLoadingStats(false);
          return;
      }

      // Calcular (Mock de Riesgos para Gráficas basado en resultados)
      let areas: Record<string, { stressCount: number, intraCount: number, empCount: number }> = {};
      
      emps.forEach(emp => {
          if (!areas[emp.area]) areas[emp.area] = { stressCount: 0, intraCount: 0, empCount: 0};
          areas[emp.area].empCount += 1;
          
          // Buscar resultado
          const evalResult = res.find(r => r.cedula === emp.cedula);
          if (evalResult) {
               // Perfiles si es Rankerize, sino perfiles std
               if(emp.nombre.includes('Carlos')) {
                   areas[emp.area].stressCount += 90;
                   areas[emp.area].intraCount += 85;
               } else if (emp.nombre.includes('Jane')) {
                   areas[emp.area].stressCount += 10;
                   areas[emp.area].intraCount += 15;
               } else {
                   areas[emp.area].stressCount += 40;
                   areas[emp.area].intraCount += 45;
               }
          }
      });

      // Data de Barras
      const areaData = Object.keys(areas).map(key => ({
         name: key,
         EstresPromedio: Math.round(areas[key].stressCount / areas[key].empCount),
         IntralaboralPromedio: Math.round(areas[key].intraCount / areas[key].empCount)
      }));
      setChartDataArea(areaData);

      // Radianes Totales (Empresa)
      setChartDataRadar([
          { subject: 'Demandas Emocionales', A: 80, fullMark: 100 },
          { subject: 'Control Trabajo', A: 50, fullMark: 100 },
          { subject: 'Liderazgo', A: 40, fullMark: 100 },
          { subject: 'Recompensas', A: 70, fullMark: 100 },
          { subject: 'Estrés General', A: 65, fullMark: 100 },
          { subject: 'Extralaboral', A: 30, fullMark: 100 },
      ]);
      
      setAiReport(null);
      setLoadingStats(false);
    }
    fetchData();
  }, [empresaId]);

  const generarAnalisisIA = async () => {
      setLoadingAi(true);
      try {
          const res = await fetch('/api/ai-html-report-empresa', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  empresaNombre: empresa?.nombre || 'La Empresa',
                  empleadosEvals: empleados.length,
                  totalCriticos: 1, // Mock
                  dataArea: chartDataArea,
                  dataRadar: chartDataRadar
              })
          });
          const data = await res.json();
          if (data.html) {
             setAiReport(data.html);
          } else {
             console.error("Error generating HTML", data);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setLoadingAi(false);
      }
  };

  const generarDocxMock = () => {
      alert("Generando Inyector DOCX... Este botón usará 'docx' package para construir el archivo Word final con el reporte que ves en pantalla y descargarlo.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up p-6">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/dashboard/empresas" className="flex items-center gap-1 hover:text-sky-400 transition-colors">
          Empresas
        </Link>
        <span>/</span>
        <Link href={`/dashboard/empresas/${empresaId}`} className="flex items-center gap-1 hover:text-sky-400 transition-colors">
          {empresa?.nombre ?? 'Cargando...'}
        </Link>
        <span>/</span>
        <span className="text-white font-medium">Resultados Clínicos</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
             <LayoutDashboard className="text-emerald-400" />
             Reporte Clínico y Cuantitativo
           </h1>
           <p className="text-slate-400 text-sm">Mostrando resultados consolidados para: <strong className="text-white">{empresa?.nombre}</strong></p>
        </div>
        <div className="flex gap-2">
           <button onClick={generarDocxMock} className="btn-secondary flex items-center gap-2 border-slate-600 bg-slate-800">
              <Download size={16} /> Exportar Word (.docx)
           </button>
        </div>
      </div>

      {loadingStats ? (
          <div className="h-64 flex flex-col items-center justify-center text-sky-400">
             <Loader2 className="animate-spin mb-4" size={32} />
             <p>Consolidando Evaluaciones de la Empresa...</p>
          </div>
      ) : chartDataArea.length > 0 ? (
         <div className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="glass-card p-4 rounded-xl flex flex-col shadow-sm border border-slate-700/50">
                  <span className="text-slate-400 text-sm flex items-center gap-1 mb-2"><Users size={14}/> Total Evaluados</span>
                  <span className="text-3xl font-bold text-white">{empleados.length}</span>
               </div>
               <div className="glass-card p-4 rounded-xl flex flex-col shadow-sm border border-red-500/30">
                  <span className="text-red-300 text-sm flex items-center gap-1 mb-2"><Target size={14}/> Riesgo Alto Crítico</span>
                  <span className="text-3xl font-bold text-red-500 text-white">1</span>
               </div>
               <div className="glass-card p-4 rounded-xl flex flex-col shadow-sm border border-emerald-500/30">
                  <span className="text-emerald-300 text-sm flex items-center gap-1 mb-2">Riesgo Bajo</span>
                  <span className="text-3xl font-bold text-emerald-400">1</span>
               </div>
               <div className="glass-card p-4 rounded-xl flex flex-col shadow-sm bg-gradient-to-br from-violet-600/20 to-purple-600/10 border border-purple-500/30 hover:bg-violet-600/30 transition-all cursor-pointer" onClick={generarAnalisisIA}>
                  <div className="h-full flex flex-col items-center justify-center text-purple-300">
                     {loadingAi ? <Loader2 size={24} className="animate-spin mb-2" /> : <BrainCircuit size={28} className="mb-2" />}
                     <span className="font-bold text-sm text-center">Generar Reporte Completo IA (HTML)</span>
                  </div>
               </div>
            </div>

            {/* AI Report Zone - Renderizado como HTML interactivo */}
            {aiReport && (
                <div className="w-full mt-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-purple-300 font-bold flex items-center gap-2"><Bot size={20}/> Reporte HTML Premium</h3>
                    </div>
                    <iframe 
                        srcDoc={aiReport} 
                        className="w-full h-screen border-none rounded-2xl shadow-[0_0_50px_rgba(139,92,246,0.1)] bg-slate-900"
                        title="AI Generated Report"
                    />
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card border border-slate-700/50 p-6 rounded-2xl">
                    <h3 className="text-white font-bold mb-6 text-sm">Promedio de Riesgo Psicosocial por Áreas</h3>
                    <div className="h-[300px] w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartDataArea} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="IntralaboralPromedio" fill="#0ea5e9" name="Riesgo Intralaboral" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="EstresPromedio" fill="#ef4444" name="Índice de Estrés" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card border border-slate-700/50 p-6 rounded-2xl">
                    <h3 className="text-white font-bold mb-6 text-sm">Mapeo de Dominios (Matriz de Araña Empresa)</h3>
                    <div className="h-[300px] w-full text-xs flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartDataRadar}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="transparent" />
                                <Radar name="Puntaje de Riesgo" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Individual Table */}
            <div className="glass-card border border-slate-700/50 rounded-2xl overflow-hidden mt-6">
               <div className="px-6 py-4 border-b border-white/5 bg-slate-800/20">
                  <h3 className="text-white font-bold text-sm">Desglose Individual de Empleados Evaluados</h3>
               </div>
               <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-800/50 border-b border-white/10 text-xs text-slate-400 uppercase">
                           <tr>
                               <th className="py-3 px-6">Cédula</th>
                               <th className="py-3 px-6">Nombre / Cargo</th>
                               <th className="py-3 px-6">Área de Pertinencia</th>
                               <th className="py-3 px-6 text-center">Forma</th>
                               <th className="py-3 px-6 text-right">Resultado Global</th>
                           </tr>
                       </thead>
                       <tbody>
                           {empleados.map(emp => (
                               <tr key={emp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                   <td className="py-3 px-6 text-slate-300 font-mono text-xs">{emp.cedula}</td>
                                   <td className="py-3 px-6">
                                      <div className="font-bold text-white">{emp.nombre}</div>
                                      <div className="text-xs text-sky-400">{emp.cargo}</div>
                                   </td>
                                   <td className="py-3 px-6 text-slate-400">{emp.area}</td>
                                   <td className="py-3 px-6 text-center">
                                       <span className="bg-slate-700 text-slate-300 border border-slate-600 px-2 py-1 rounded text-[10px] font-bold">Forma {emp.forma || 'A'}</span>
                                   </td>
                                   <td className="py-3 px-6 text-right">
                                       {emp.nombre.includes('Carlos') ? <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-bold text-xs">Riesgo Alto</span> :
                                        emp.nombre.includes('Jane') ? <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold text-xs">Riesgo Bajo</span> :
                                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-bold text-xs">Riesgo Medio</span>}
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
            </div>

         </div>
      ) : (
         <div className="h-64 flex flex-col items-center justify-center text-slate-500 glass-card border border-slate-700/50 rounded-2xl">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <h3 className="text-white font-bold text-lg mb-2">No hay resultados analíticos</h3>
            <p className="text-center text-sm max-w-md">Para visualizar métricas poblacionales o pedir IA generativa, primero debes escanear cuadernillos físicos o aplicar baterias a los empleados registrados en esta empresa.</p>
         </div>
      )}
    </div>
  );
}
