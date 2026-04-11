'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Camera, FileUp, Loader2, CheckCircle2, AlertCircle, Trash2, Building2, User, Save,
  ChevronRight, ArrowLeft, Copy, Link as LinkIcon, FileSpreadsheet, Download, FileText
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { collection, getDocs, addDoc, query, where, serverTimestamp, updateDoc, doc, getDoc, increment } from 'firebase/firestore';

export default function RegistroResultadosPage() {
  const { user } = useAuth();
  
  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [metodo, setMetodo] = useState<'ia' | 'manual' | 'csv' | null>(null);

  // States para Asignación
  const [empresas, setEmpresas] = useState<{id: string, nombre: string}[]>([]);
  const [empleados, setEmpleados] = useState<{id: string, nombre: string, cedula: string}[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  
  // Estados de carga e interfaz
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Estados Escáner IA
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar empresas al montar
  useEffect(() => {
    const fetchEmpresas = async () => {
      const snap = await getDocs(collection(db, 'empresas'));
      setEmpresas(snap.docs.map(d => ({ id: d.id, nombre: d.data().nombre })));
    };
    fetchEmpresas();
  }, []);

  // Cargar empleados al cambiar empresa
  useEffect(() => {
    if (!selectedEmpresa) {
      setEmpleados([]);
      setSelectedEmpleado('');
      return;
    }
    const fetchEmpleados = async () => {
      const q = query(collection(db, 'empleados'), where('empresaId', '==', selectedEmpresa));
      const snap = await getDocs(q);
      setEmpleados(snap.docs.map(d => ({ 
        id: d.id, 
        nombre: d.data().nombre,
        cedula: d.data().cedula
      })));
    };
    fetchEmpleados();
  }, [selectedEmpresa]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      setError('Solo se aceptan imágenes (JPG, PNG)');
      return;
    }

    setPhotos(prev => [...prev, ...validFiles]);
    const urls = validFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...urls]);
    setResults(null);
    setError(null);
  };

  const procesarImagen = async () => {
    if (photos.length === 0) return;
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      photos.forEach(p => formData.append('imagenes', p));

      const res = await fetch('/api/escaneo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error procesando la imagen');

      setResults(data.extraccion);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearIA = () => {
    setPhotos([]);
    setPreviewUrls([]);
    setResults(null);
    setError(null);
    setSuccessMsg('');
  };

  const guardarResultadoHaciaDB = async () => {
    if (!selectedEmpleado || !results) {
      setError('Por favor selecciona un empleado para asignar estas respuestas.');
      return;
    }
    
    if (!window.confirm('¿Estás seguro de asignar y calificar este cuadernillo? Se descontará una batería de tu plan.')) {
      return;
    }

    if (!user) {
      setError('No estás autenticado.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // 1. VERIFICAR LÍMITES DE BATERÍAS ANTES DE CALIFICAR/GUARDAR
      let esIlimitado = false;
      if (user.email === 'rankerize@gmail.com' || user.email?.endsWith('@rankerize.com')) {
         esIlimitado = true;
      }
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const plan = userDoc.exists() ? (userDoc.data().plan || 'free') : 'free';
      const baterias_usadas = userDoc.exists() ? (userDoc.data().baterias_usadas || 0) : 0;
      
      if (plan === 'pro') esIlimitado = true;

      const limit = plan === 'starter' ? 100 : 3;
      
      if (!esIlimitado && baterias_usadas >= limit) {
         setError(`Límite alcanzado. Tu plan (${plan.toUpperCase()}) permite analizar ${limit} formularios como máximo. Actualiza a PRO.`);
         setSaving(false);
         return;
      }

      const empleadoObj = empleados.find(e => e.id === selectedEmpleado);
      
      const resultado = {
        empleadoId: selectedEmpleado,
        cedula: empleadoObj?.cedula || '',
        nombre: empleadoObj?.nombre || '',
        empresaId: selectedEmpresa,
        forma: 'A', // OMR debe detectar esto o solicitarlo luego, default A
        respuestasIntralaboral: results, 
        respuestasExtralaboral: {},
        respuestasEstres: {},
        estado: 'pendiente_calificacion',
        origen: 'Escáner AI',
        fechaAplicacion: serverTimestamp(),
      };

      await addDoc(collection(db, 'resultados'), resultado);
      await updateDoc(doc(db, 'empleados', selectedEmpleado), { estadoBateria: 'completado' });
      await updateDoc(doc(db, 'users', user.uid), { baterias_usadas: increment(1) });

      setSuccessMsg(`Resultados asignados exitosamente a ${empleadoObj?.nombre}`);
      setTimeout(() => {
        clearIA();
        setSelectedEmpleado('');
      }, 3500);
    } catch (err: any) {
      setError('Error al guardar en base de datos: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if(!selectedEmpleado) return;
    const emp = empleados.find(e => e.id === selectedEmpleado);
    const url = `${window.location.origin}/bateria/${emp?.cedula}?empresaId=${selectedEmpresa}&empleadoId=${selectedEmpleado}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-8">
      {/* Toast Error Global */}
      {error && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl flex items-center gap-3 text-sm shadow-2xl shadow-red-500/20 animate-fade-in-down border border-red-400/50">
          <AlertCircle size={24} className="shrink-0" />
          <p className="font-bold">{error}</p>
        </div>
      )}

      {/* --- PASO 1: SELECCIÓN DE EMPRESA --- */}
      {step === 1 && (
        <div className="min-h-[85vh] flex items-center justify-center animate-fade-in-up py-12">
           <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center w-full">
              
              {/* Lado Izquierdo: Contexto */}
              <div className="space-y-8">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-400 font-bold text-xs tracking-widest border border-sky-500/20">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span> PASO 1 DE 3
                 </div>
                 
                 <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight">
                    Elige el entorno <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                      de evaluación
                    </span>
                 </h1>
                 
                 <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-lg">
                    Bienvenido al asistente. Primero, indícanos qué organización vamos a procesar hoy.
                 </p>

                 {/* Bloque Formatos */}
                 <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-[2rem] p-6 md:p-8 max-w-md backdrop-blur-sm">
                    <h3 className="text-white font-bold flex items-center gap-2 mb-5">
                       <Download size={20} className="text-indigo-400" />
                       Formatos Oficiales en Blanco
                    </h3>
                    <div className="grid grid-cols-1 gap-4 text-sm font-medium">
                       <a href="/formatos/Cuestionario-factores-intralaborales-Forma-A.pdf" download className="text-indigo-300/80 hover:text-white flex items-center gap-3 transition-colors group">
                          <div className="bg-indigo-500/20 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors"><FileText size={16} className="text-indigo-400 group-hover:text-white" /></div> Forma A (Jefes/Profesionales)
                       </a>
                       <a href="/formatos/Cuestionario-factores-extralaborales.pdf" download className="text-indigo-300/80 hover:text-white flex items-center gap-3 transition-colors group">
                          <div className="bg-indigo-500/20 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors"><FileText size={16} className="text-indigo-400 group-hover:text-white" /></div> Factores Extralaborales
                       </a>
                       <a href="/formatos/Cuestionario-estres.pdf" download className="text-indigo-300/80 hover:text-white flex items-center gap-3 transition-colors group">
                          <div className="bg-indigo-500/20 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors"><FileText size={16} className="text-indigo-400 group-hover:text-white" /></div> Cuestionario de Estrés
                       </a>
                       <a href="/formatos/Ficha-de-datos-generales.pdf" download className="text-indigo-300/80 hover:text-white flex items-center gap-3 transition-colors group">
                          <div className="bg-indigo-500/20 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors"><FileText size={16} className="text-indigo-400 group-hover:text-white" /></div> Ficha de Datos Generales
                       </a>
                    </div>
                 </div>
              </div>

              {/* Lado Derecho: Interacción asimétrica */}
              <div className="glass-card py-10 px-8 sm:px-10 rounded-[2rem] border border-white/5 bg-slate-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative backdrop-blur-3xl w-full max-w-md mx-auto lg:max-w-[480px]">
                 {/* Contenedor separado para contener el difuminado decorativo sin cortar el contenido principal */}
                 <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-sky-500/20 rounded-full blur-[80px]"></div>
                 </div>
                 
                 <div className="relative z-10 flex flex-col justify-center space-y-6 w-full">
                    <div>
                       <label className="text-sky-400 font-bold mb-3 block text-[13px] tracking-widest uppercase">Directorio Activo</label>
                       <select 
                          className="w-full bg-slate-900 border border-slate-700 hover:border-slate-500 text-white text-lg py-4 px-5 rounded-2xl focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all outline-none appearance-none cursor-pointer shadow-inner min-h-[60px]" 
                          value={selectedEmpresa} 
                          onChange={e => setSelectedEmpresa(e.target.value)}
                          style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.9rem auto' }}
                       >
                          <option value="">-- Toca para seleccionar --</option>
                          {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                       </select>
                    </div>

                    <button 
                       onClick={() => {
                          setError(null);
                          if(!selectedEmpresa) { setError('Por favor selecciona una empresa primero.'); return; }
                          setStep(2);
                       }}
                       disabled={!selectedEmpresa}
                       className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-lg py-4 rounded-2xl transition-all flex justify-center items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(14,165,233,0.3)] hover:scale-[1.02] min-h-[60px]"
                    >
                       Confirmar Entorno <ChevronRight size={20} />
                    </button>
                    <p className="text-slate-500 text-xs text-center">La configuración elegida afectará toda la sesión actual.</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- PASO 2: SELECCIÓN DE MÉTODO --- */}
      {step === 2 && (
        <div className="min-h-[85vh] flex flex-col justify-center animate-fade-in-up py-12 max-w-6xl mx-auto">
           {/* Header Flotante */}
           <div className="flex items-center justify-between mb-16">
               <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white flex items-center gap-3 font-bold text-sm transition-colors bg-slate-800/50 px-6 py-4 rounded-full hover:bg-slate-700/50 backdrop-blur-sm shadow-xl">
                  <ArrowLeft size={18}/> Cambiar Empresa
               </button>
               <div className="px-6 py-4 rounded-full bg-sky-500/10 text-sky-400 font-bold text-sm border border-sky-500/20 shadow-lg shadow-sky-500/5 backdrop-blur-sm">
                  <Building2 size={16} className="inline mr-2"/> {empresas.find(e=>e.id===selectedEmpresa)?.nombre}
               </div>
           </div>
           
           <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-400 font-bold text-xs tracking-widest border border-purple-500/20 mb-6">
                 <span className="w-2 h-2 rounded-full bg-purple-400"></span> PASO 2 DE 3
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">¿Cómo ingresarás los datos?</h2>
              <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                 Selecciona tu método preferido. La IA es ideal para grandes volúmenes de papel físico que requieren ahorro de tiempo.
              </p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {/* Opción IA */}
              <button 
                 onClick={() => { setMetodo('ia'); setStep(3); setError(null); }}
                 className="glass-card p-10 lg:p-12 flex flex-col items-center justify-center border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left group rounded-[3rem] relative overflow-hidden bg-slate-800/30"
              >
                 <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                 <div className="w-20 h-20 bg-slate-900 rounded-[1.5rem] flex items-center justify-center mb-8 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.2)] group-hover:scale-110 transition-transform">
                   <Camera size={36} />
                 </div>
                 <h3 className="text-white font-bold text-2xl mb-4 text-center group-hover:text-purple-400 transition-colors">Escáner IA</h3>
                 <p className="text-slate-400 text-base text-center leading-relaxed">Saca foto al cuadernillo. La IA extrae las marcas en segundos.</p>
              </button>

              {/* Opción Manual */}
              <button 
                 onClick={() => { setMetodo('manual'); setStep(3); setError(null); }}
                 className="glass-card p-10 lg:p-12 flex flex-col items-center justify-center border border-white/5 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all text-left group rounded-[3rem] relative overflow-hidden bg-slate-800/30"
              >
                 <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                 <div className="w-20 h-20 bg-slate-900 rounded-[1.5rem] flex items-center justify-center mb-8 text-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.2)] group-hover:scale-110 transition-transform">
                   <LinkIcon size={36} />
                 </div>
                 <h3 className="text-white font-bold text-2xl mb-4 text-center group-hover:text-sky-400 transition-colors">Digital Web</h3>
                 <p className="text-slate-400 text-base text-center leading-relaxed">Abre la web para transcribir o envía el enlace al celular del empleado.</p>
              </button>

              {/* Opción CSV */}
              <button 
                 onClick={() => { setMetodo('csv'); setStep(3); setError(null); }}
                 className="glass-card p-10 lg:p-12 flex flex-col items-center justify-center border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group rounded-[3rem] relative overflow-hidden bg-slate-800/30"
              >
                 <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                 <div className="w-20 h-20 bg-slate-900 rounded-[1.5rem] flex items-center justify-center mb-8 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform">
                   <FileSpreadsheet size={36} />
                 </div>
                 <h3 className="text-white font-bold text-2xl mb-4 text-center group-hover:text-emerald-400 transition-colors">Subida CSV</h3>
                 <p className="text-slate-400 text-base text-center leading-relaxed">Importa plantillas de Excel con resultados masivos.</p>
              </button>
           </div>
        </div>
      )}

      {/* --- PASO 3: PROCEDIMIENTO --- */}
      {step === 3 && (
        <div className="animate-fade-in-up py-8 max-w-6xl mx-auto">
           {/* Header Flotante */}
           <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-4">
               <button onClick={() => { setStep(2); clearIA(); }} className="text-slate-400 hover:text-white flex items-center gap-3 font-bold text-sm transition-colors bg-slate-800/50 px-6 py-4 rounded-full hover:bg-slate-700/50 backdrop-blur-sm shadow-xl">
                  <ArrowLeft size={18}/> Volver a Módulo
               </button>
               <div className="px-6 py-4 rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-sm border border-indigo-500/20 flex gap-4 backdrop-blur-sm shadow-xl shadow-indigo-500/5">
                  <span><Building2 size={16} className="inline mr-1"/> {empresas.find(e=>e.id===selectedEmpresa)?.nombre}</span>
                  <span className="text-slate-600">|</span>
                  <span className="uppercase tracking-widest">{metodo}</span>
               </div>
           </div>

           {/* --- MÉTODO IA --- */}
           {metodo === 'ia' && (
             <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-16 items-start">
               {/* Columna Izquierda: Herramienta */}
               <div className="space-y-10">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-400 font-bold text-xs tracking-widest border border-purple-500/20">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span> PASO 3 DE 3
                 </div>
                 <div>
                    <h2 className="text-5xl font-black text-white mb-4 tracking-tight">Escucha a la <span className="text-purple-400">IA</span></h2>
                    <p className="text-slate-400 text-lg leading-relaxed">Busca al empleado, sube la foto de su cuadernillo y verifica la tabla de la derecha antes de confirmar el guardado.</p>
                 </div>

                 {/* Selector Empleado */}
                 <div className="glass-card p-6 md:p-8 rounded-[2rem] border-white/5 bg-slate-800/40">
                    <label className="text-white font-bold flex items-center gap-3 mb-4 text-[15px]">
                      <User className="text-purple-400" size={20}/> Empleado a procesar
                    </label>
                    <select 
                       className="input-field w-full bg-slate-900 border-slate-700 focus:border-purple-500 py-4 px-5 text-lg rounded-2xl appearance-none shadow-inner min-h-[60px]" 
                       value={selectedEmpleado} 
                       onChange={e => setSelectedEmpleado(e.target.value)}
                       style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.9rem auto' }}
                    >
                       <option value="">-- Buscar en directorio --</option>
                       {empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.cedula})</option>)}
                    </select>
                 </div>

                 {/* Carga de imagen */}
                 {photos.length === 0 ? (
                   <div 
                     onDragOver={e => e.preventDefault()}
                     onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                     onClick={() => selectedEmpleado ? fileInputRef.current?.click() : setError('Elige al empleado arriba primero')}
                     className={`glass-card p-12 flex flex-col items-center justify-center border-dashed border-2 rounded-[2.5rem] min-h-[320px] transition-all ${selectedEmpleado ? 'border-purple-500/40 hover:bg-purple-500/5 hover:border-purple-500 cursor-pointer shadow-[0_0_30px_rgba(168,85,247,0.1)]' : 'border-slate-800 opacity-50 cursor-not-allowed bg-slate-900/50'}`}
                   >
                     <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={e => handleFiles(e.target.files)} capture="environment" />
                     <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-2xl ${selectedEmpleado ? 'bg-purple-600 text-white shadow-purple-500/40 transform rotate-3 hover:rotate-0 transition-transform cursor-pointer' : 'bg-slate-800 text-slate-500'}`}>
                       <Camera size={36} />
                     </div>
                     <h3 className="text-white font-bold text-2xl mb-3 text-center">Subir Cuadernillo</h3>
                     <p className="text-slate-400 text-base text-center max-w-xs">Toca aquí para escanear con la cámara o arrastra una imagen.</p>
                   </div>
                 ) : (
                   <div className="glass-card p-8 rounded-[2.5rem] border border-purple-500/30 flex flex-col items-center shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-slate-800/40">
                     <div className="flex flex-wrap gap-4 justify-center mb-8">
                       {previewUrls.map((url, i) => (
                          <img key={url} src={url} alt={`Escaneo ${i+1}`} className="max-h-[220px] object-cover rounded-2xl shadow-xl shadow-black/50 border-2 border-slate-600" />
                       ))}
                     </div>
                     
                     <div className="flex gap-4 w-full">
                       <button onClick={clearIA} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all font-bold flex items-center justify-center gap-2">
                         <Trash2 size={20} /> Borrar
                       </button>
                       <button onClick={procesarImagen} disabled={loading} className="flex-[2] py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-500/30 text-white rounded-2xl transition-all font-bold text-lg flex items-center justify-center gap-3">
                         {loading ? <Loader2 className="animate-spin" size={24} /> : <FileUp size={24} />}
                         {loading ? 'Analizando IA...' : 'Extraer Datos'}
                       </button>
                     </div>
                   </div>
                 )}
               </div>

               {/* Columna Derecha: Resultados Panel */}
               <div className="glass-card rounded-[3rem] p-8 lg:p-12 min-h-[650px] border border-slate-700/50 bg-slate-900/50 relative overflow-hidden flex flex-col shadow-2xl">
                 <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                   <h2 className="text-2xl font-black text-white flex items-center gap-3">
                     <CheckCircle2 className="text-emerald-400" size={32} /> Validación
                   </h2>
                   {results && <span className="text-sm font-bold bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20">{Object.keys(results).length} ítems</span>}
                 </div>

                 <div className="flex-1 overflow-y-auto hidden-scrollbar pr-4 relative">
                   {!results && !loading && (
                     <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <div className="w-32 h-32 bg-slate-800/50 rounded-full flex items-center justify-center mb-8 shadow-inner border border-white/5">
                           <span className="text-6xl opacity-40">🤖</span>
                        </div>
                        <h3 className="text-white font-bold text-2xl mb-3">Motor Inactivo</h3>
                        <p className="text-center text-lg max-w-sm leading-relaxed">Sube un cuadernillo y la Inteligencia Artificial presentará la matriz de datos geométricos aquí.</p>
                     </div>
                   )}
                   
                   {loading && (
                     <div className="h-full flex flex-col items-center justify-center text-purple-400">
                        <div className="relative mb-8">
                           <Loader2 className="animate-spin text-purple-500" size={72} />
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-purple-500 rounded-full blur-xl opacity-50"></div>
                        </div>
                        <h3 className="text-white font-black text-3xl mb-3 tracking-tight">Escaneando...</h3>
                        <p className="text-center text-lg font-medium text-purple-300/60 max-w-sm">Reconociendo tinta y calculando geometría espacial de las cruces.</p>
                     </div>
                   )}

                   {successMsg && (
                      <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in-up">
                         <div className="w-28 h-28 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20">
                            <CheckCircle2 size={56} />
                         </div>
                         <h3 className="text-4xl font-black text-white mb-4 tracking-tight">¡Puntaje Asignado!</h3>
                         <p className="text-xl text-emerald-200/80 max-w-md mx-auto">{successMsg}</p>
                      </div>
                   )}

                   {results && !successMsg && (
                     <div className="animate-fade-in-up">
                       <div className="bg-purple-500/10 p-8 rounded-3xl border border-purple-500/20 mb-10 backdrop-blur-md">
                         <p className="text-purple-200 text-lg mb-6 leading-relaxed">
                            <strong className="text-white bg-purple-500/20 px-2 py-1 rounded-md mr-2">Revisión Crucial:</strong> Confirma que estos números coinciden con la hoja física del empleado. Al guardar se asignará la calificación oficial.
                         </p>
                         <button 
                           onClick={guardarResultadoHaciaDB}
                           disabled={saving || !selectedEmpleado}
                           className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 py-5 rounded-2xl font-black text-xl text-slate-900 flex justify-center items-center gap-3 transition-all shadow-[0_0_40px_rgba(10,185,129,0.3)] hover:scale-[1.02]"
                         >
                           {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} 
                           Guardar Resultados Definitivos
                         </button>
                       </div>

                       <div className="grid grid-cols-[1fr_auto] gap-4 mb-4 text-sm font-black text-slate-500 px-6 uppercase tracking-widest pl-2">
                         <span>Ítem del Cuestionario</span><span>Valor</span>
                       </div>
                       <div className="space-y-4">
                         {Object.entries(results).map(([qNum, val]) => (
                           <div key={qNum} className="grid grid-cols-[1fr_auto] gap-4 items-center bg-slate-800/60 p-6 rounded-2xl border border-white/5 hover:border-purple-500/50 hover:bg-slate-800 transition-all group">
                             <span className="text-slate-300 font-bold text-xl group-hover:text-white transition-colors">Pregunta {qNum}</span>
                             <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-purple-500 text-white font-black text-2xl shadow-lg shadow-purple-500/20">{val}</div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             </div>
           )}

           {/* --- MÉTODO MANUAL --- */}
           {metodo === 'manual' && (
             <div className="max-w-4xl mx-auto py-8">
                 <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs tracking-widest border border-emerald-500/20 mb-6">
                       <span className="w-2 h-2 rounded-full bg-emerald-400"></span> PASO 3 DE 3
                    </div>
                    <h2 className="text-5xl font-black text-white mb-6 tracking-tight">Buscar Destinatario</h2>
                    <p className="text-slate-400 text-xl">Usa el sistema asimétrico de digitalización para empleados locales o remotos.</p>
                 </div>

                 {/* Selector Empleado (Manual) */}
                 <div className="glass-card p-8 md:p-10 rounded-[2.5rem] border border-sky-500/20 bg-slate-800/40 shadow-2xl mb-16 relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-[80px] pointer-events-none -mr-32 -mt-32"></div>
                    <div className="relative z-10 w-full">
                       <label className="text-sky-400 font-bold mb-4 block text-[13px] tracking-widest uppercase">1. Seleccionar Cédula / Nombre</label>
                       <select 
                          className="w-full bg-slate-900 border border-slate-700 hover:border-slate-500 focus:border-sky-500 text-white text-xl py-4 px-6 rounded-[1.5rem] outline-none appearance-none shadow-inner transition-all focus:ring-4 focus:ring-sky-500/20 min-h-[60px]" 
                          value={selectedEmpleado} 
                          onChange={e => setSelectedEmpleado(e.target.value)}
                          style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '1rem auto' }}
                       >
                          <option value="">-- Revelar Directorio --</option>
                          {empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.cedula})</option>)}
                       </select>
                    </div>
                 </div>

                 {selectedEmpleado ? (
                   <div className="grid md:grid-cols-2 gap-8 lg:gap-12 animate-fade-in-up">
                      <div className="glass-card p-12 rounded-[3.5rem] border border-slate-700 bg-slate-800/50 flex flex-col justify-between hover:border-sky-500/50 hover:bg-slate-800/70 transition-all group shadow-xl hover:-translate-y-2">
                         <div className="mb-10">
                            <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center text-sky-400 mb-8 border border-sky-500/20 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(14,165,233,0.15)]">
                               <FileUp size={36} />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4">Digitación <br/>en Vivo</h3>
                            <p className="text-slate-400 text-lg leading-relaxed">Abre el cuestionario en otra pestaña. Útil si tienes los papeles físicos a tu lado y tú vas a transcribir pregunta por pregunta.</p>
                         </div>
                         <a 
                            href={`/bateria/${empleados.find(e => e.id === selectedEmpleado)?.cedula}?empresaId=${selectedEmpresa}&empleadoId=${selectedEmpleado}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-sky-500 hover:bg-sky-400 text-white font-black py-5 px-6 rounded-2xl text-center w-full transition-all flex items-center justify-center gap-3 text-xl shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:scale-[1.02]"
                         >
                            Transcribir Web <ChevronRight size={24}/>
                         </a>
                      </div>

                      <div className="glass-card p-12 rounded-[3.5rem] border border-slate-700 bg-slate-800/50 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-slate-800/70 transition-all group shadow-xl hover:-translate-y-2">
                         <div className="mb-10">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                               <LinkIcon size={36} />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4">Compartir<br/>Enlace</h3>
                            <p className="text-slate-400 text-lg leading-relaxed">Genera un enlace mágico único de acceso directo para enviarlo al trabajador por Whatsapp para que él mismo la llene.</p>
                         </div>
                         <button 
                            onClick={handleCopyLink}
                            className={`font-black py-5 px-6 rounded-2xl text-center w-full transition-all flex items-center justify-center gap-3 text-xl hover:scale-[1.02] ${copySuccess ? 'bg-emerald-500 text-slate-900 shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-slate-700 hover:bg-slate-600 text-white shadow-xl'}`}
                         >
                            {copySuccess ? <><CheckCircle2 size={28}/> Url Copiada</> : <><Copy size={28}/> Copiar Url</>}
                         </button>
                      </div>
                   </div>
                 ) : (
                   <div className="p-20 text-center text-slate-500/50 font-bold text-2xl border-4 border-dashed border-slate-700 rounded-[3rem] bg-slate-800/10">
                      Selecciona un empleado arriba para revelar las opciones asimétricas.
                   </div>
                 )}
             </div>
           )}

           {/* --- MÉTODO CSV --- */}
           {metodo === 'csv' && (
             <div className="max-w-4xl mx-auto flex items-center justify-center py-16">
                 <div className="text-center glass-card p-16 md:p-24 rounded-[4xl] border border-emerald-500/20 bg-slate-800/30 backdrop-blur-xl relative overflow-hidden">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                     <div className="relative z-10">
                        <div className="w-32 h-32 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center text-emerald-400 mx-auto mb-10 shadow-2xl shadow-emerald-500/20 rotate-3">
                           <FileSpreadsheet size={64} />
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black text-white mb-8 tracking-tight">Carga <span className="text-emerald-400">Masiva</span></h2>
                        <p className="text-slate-400 text-xl leading-relaxed mb-12 max-w-2xl mx-auto">
                           Habilitaremos la opción de subir una plantilla con los extractos numéricos de cientos de empleados simultáneamente para calcular riesgos masivos.
                        </p>
                        <div className="inline-block border border-amber-500/40 bg-amber-500/10 text-amber-300 px-8 py-4 rounded-xl font-black tracking-widest text-sm uppercase shadow-xl">
                           🚧 Módulo en producción adelantada
                        </div>
                     </div>
                 </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
