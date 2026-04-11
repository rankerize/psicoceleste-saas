'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Camera, FileUp, Loader2, CheckCircle2, AlertCircle, Trash2, Building2, User, Save,
  ChevronRight, ArrowLeft, Copy, Link as LinkIcon, FileSpreadsheet
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
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          Registro de Resultados
        </h1>
      </div>

      <p className="text-slate-400 max-w-3xl">
        Asistente paso a paso para digitalizar y registrar los resultados de la Batería Psicosocial. 
      </p>

      {/* STEPPER UI */}
      <div className="flex items-center justify-center mb-8 bg-slate-800/30 p-4 rounded-2xl border border-white/5">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-sky-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-sky-500 text-white shadow-lg' : 'bg-slate-800'}`}>1</div>
          <span className="font-medium hidden sm:block">Empresa</span>
        </div>
        <div className={`w-8 h-px mx-2 sm:mx-4 ${step >= 2 ? 'bg-sky-400' : 'bg-slate-700'}`}></div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-purple-500 text-white shadow-lg' : 'bg-slate-800'}`}>2</div>
          <span className="font-medium hidden sm:block">Modalidad</span>
        </div>
        <div className={`w-8 h-px mx-2 sm:mx-4 ${step >= 3 ? 'bg-purple-400' : 'bg-slate-700'}`}></div>
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-800'}`}>3</div>
          <span className="font-medium hidden sm:block">Captura</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={20} className="shrink-0" /> <p>{error}</p>
        </div>
      )}

      {/* --- PASO 1 --- */}
      {step === 1 && (
        <div className="glass-card p-8 rounded-2xl border border-slate-700 flex flex-col items-center text-center max-w-2xl mx-auto">
          <Building2 size={48} className="text-sky-400 mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Selecciona la Empresa</h2>
          <p className="text-slate-400 mb-8 text-sm">Elige la empresa a la que pertenece el grupo de empleados que vas a registrar.</p>
          
          <select 
             className="input-field w-full max-w-md bg-slate-800 border-white/10 text-center mb-8" 
             value={selectedEmpresa} 
             onChange={e => setSelectedEmpresa(e.target.value)}
          >
             <option value="">-- Click para seleccionar Empresa --</option>
             {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
          </select>

          <button 
             onClick={() => {
                setError(null);
                if(!selectedEmpresa) { setError('Debes seleccionar una empresa para continuar.'); return; }
                setStep(2);
             }}
             disabled={!selectedEmpresa}
             className="btn-primary w-full max-w-md py-3 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
             Continuar <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* --- PASO 2 --- */}
      {step === 2 && (
        <div className="animate-fade-in-up">
           <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white flex items-center gap-2 mb-6 font-medium text-sm transition-colors">
              <ArrowLeft size={16}/> Volver a Selección de Empresa
           </button>
           
           <h2 className="text-xl font-bold text-white mb-6 text-center">Elige el método de captura de datos</h2>
           
           <div className="grid md:grid-cols-3 gap-6">
              {/* Opción IA */}
              <button 
                 onClick={() => { setMetodo('ia'); setStep(3); setError(null); }}
                 className="glass-card p-8 flex flex-col items-center justify-center border border-slate-700 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left group"
              >
                 <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-purple-400 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                   <Camera size={32} />
                 </div>
                 <h3 className="text-white font-bold text-lg mb-2 text-center group-hover:text-purple-400 transition-colors">Escáner Óptico IA</h3>
                 <p className="text-slate-400 text-sm text-center">Tomas una foto al cuadernillo y la IA extrae los resultados matemáticamente en segundos.</p>
              </button>

              {/* Opción Manual */}
              <button 
                 onClick={() => { setMetodo('manual'); setStep(3); setError(null); }}
                 className="glass-card p-8 flex flex-col items-center justify-center border border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all text-left group"
              >
                 <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-sky-400 shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
                   <FileUp size={32} />
                 </div>
                 <h3 className="text-white font-bold text-lg mb-2 text-center group-hover:text-sky-400 transition-colors">Digitalización Manual</h3>
                 <p className="text-slate-400 text-sm text-center">Abre el formulario digital para transcribir las respuestas o envíale el enlace directamente al trabajador.</p>
              </button>

              {/* Opción CSV */}
              <button 
                 onClick={() => { setMetodo('csv'); setStep(3); setError(null); }}
                 className="glass-card p-8 flex flex-col items-center justify-center border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group relative overflow-hidden"
              >
                 <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-emerald-400 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                   <FileSpreadsheet size={32} />
                 </div>
                 <h3 className="text-white font-bold text-lg mb-2 text-center group-hover:text-emerald-400 transition-colors">Subida Masiva CSV</h3>
                 <p className="text-slate-400 text-sm text-center">Importa resultados de cientos de empleados mediante una plantilla de Excel o archivo CSV.</p>
              </button>
           </div>
        </div>
      )}

      {/* --- PASO 3 --- */}
      {step === 3 && (
        <div className="animate-fade-in-up">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
               <button onClick={() => { setStep(2); clearIA(); }} className="text-slate-400 hover:text-white flex items-center gap-2 font-medium text-sm transition-colors">
                  <ArrowLeft size={16}/> Volver a Modalidad
               </button>
               <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-xl text-sm text-slate-300 font-medium">
                  Empresa Activa: <span className="text-white font-bold">{empresas.find(e=>e.id===selectedEmpresa)?.nombre}</span>
               </div>
           </div>

           {metodo === 'ia' && (
             <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-6">
                 {/* Selector Empleado */}
                 <div className="glass-card p-6 border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
                    <label className="text-white font-bold flex items-center gap-2 mb-4">
                      <User className="text-purple-400" size={18}/> 1. Empleado Evaluado
                    </label>
                    <select 
                       className="input-field w-full bg-slate-900 border-slate-700 focus:border-purple-500" 
                       value={selectedEmpleado} 
                       onChange={e => setSelectedEmpleado(e.target.value)}
                    >
                       <option value="">-- Escoge Empleado --</option>
                       {empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.cedula})</option>)}
                    </select>
                 </div>

                 {/* Carga de imagen */}
                 {photos.length === 0 ? (
                   <div 
                     onDragOver={e => e.preventDefault()}
                     onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                     onClick={() => selectedEmpleado ? fileInputRef.current?.click() : setError('Selecciona un empleado primero')}
                     className={`glass-card p-10 flex flex-col items-center justify-center border-dashed border-2 rounded-2xl h-[300px] transition-all ${selectedEmpleado ? 'border-purple-500/40 hover:bg-purple-500/5 hover:border-purple-500 cursor-pointer' : 'border-slate-800 opacity-50 cursor-not-allowed'}`}
                   >
                     <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={e => handleFiles(e.target.files)} capture="environment" />
                     <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-purple-400 shadow-xl shadow-purple-500/20">
                       <Camera size={28} />
                     </div>
                     <h3 className="text-white font-bold mb-2">Capturar Cuadernillo</h3>
                     <p className="text-slate-400 text-sm text-center">Toma foto de la hoja de respuestas Intralaboral Forma A o B.</p>
                   </div>
                 ) : (
                   <div className="glass-card p-6 rounded-2xl border-purple-500/30 flex flex-col items-center max-h-[500px] overflow-y-auto">
                     <div className="flex flex-wrap gap-4 justify-center mb-6">
                       {previewUrls.map((url, i) => (
                          <img key={url} src={url} alt={`Escaneo ${i+1}`} className="max-h-[150px] object-contain rounded-xl shadow-lg border border-slate-700" />
                       ))}
                     </div>
                     
                     <div className="flex gap-4 w-full">
                       <button onClick={clearIA} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2">
                         <Trash2 size={18} /> Descartar
                       </button>
                       <button onClick={procesarImagen} disabled={loading} className="flex-[2] py-3 bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/25 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2">
                         {loading ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
                         {loading ? 'Analizando IA...' : 'Extraer IA'}
                       </button>
                     </div>
                   </div>
                 )}
               </div>

               {/* Resultados Panel */}
               <div className="glass-card rounded-2xl p-6 h-[480px] overflow-y-auto relative hidden-scrollbar border border-slate-700/50">
                 <div className="sticky top-0 bg-[#0a0f1e]/90 backdrop-blur-md pb-4 mb-4 border-b border-white/5 z-10 flex items-center justify-between">
                   <h2 className="text-white font-bold flex items-center gap-2">
                     <CheckCircle2 className="text-emerald-400" size={20} /> Previsualización
                   </h2>
                   {results && <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">{Object.keys(results).length} Preguntas Leídas</span>}
                 </div>

                 {!results && !loading && (
                   <div className="h-full flex flex-col items-center justify-center text-slate-500 pb-12">
                      <span className="text-5xl mb-4 opacity-50">🤖</span>
                      <p className="text-center text-sm px-8">La inteligencia artificial extraerá las cruces de la tabla aquí para que puedas verificarlas antes de guardar.</p>
                   </div>
                 )}
                 
                 {loading && (
                   <div className="h-full flex flex-col items-center justify-center text-purple-400 pb-12">
                      <Loader2 className="animate-spin mb-4" size={40} />
                      <p className="text-center text-sm font-medium">Reconociendo tinta y geometría espacial...</p>
                   </div>
                 )}

                 {successMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 rounded-xl flex flex-col items-center justify-center h-full text-center">
                       <CheckCircle2 size={48} className="mb-4" />
                       <h3 className="text-xl font-bold text-white mb-2">¡Asignación Exitosa!</h3>
                       <p className="text-sm">{successMsg}</p>
                    </div>
                 )}

                 {results && !successMsg && (
                   <div className="animate-fade-in-up">
                     <div className="bg-purple-900/40 p-4 rounded-xl border border-purple-500/30 mb-6">
                       <p className="text-purple-200 text-sm mb-3">Revisa rápidamente que los números coincidan con lo que marcó el empleado. Si todo está en orden, procede a guardar.</p>
                       <button 
                         onClick={guardarResultadoHaciaDB}
                         disabled={saving || !selectedEmpleado}
                         className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 py-3 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                       >
                         {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar y Calificar
                       </button>
                     </div>

                     <div className="space-y-2">
                       <div className="grid grid-cols-2 text-xs font-bold text-slate-500 mb-2 px-2 uppercase tracking-wider">
                         <span>Pregunta</span><span>Escala (1-5)</span>
                       </div>
                       {Object.entries(results).map(([qNum, val]) => (
                         <div key={qNum} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-all">
                           <span className="text-slate-300 font-medium">Pregunta {qNum}</span>
                           <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500 text-white font-bold shadow">{val}</div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             </div>
           )}

           {metodo === 'manual' && (
             <div className="max-w-3xl mx-auto space-y-6">
                 {/* Selector Empleado (Manual) */}
                 <div className="glass-card p-6 border-sky-500/20 shadow-[0_0_30px_rgba(14,165,233,0.05)]">
                    <label className="text-white font-bold flex items-center gap-2 mb-4">
                      <User className="text-sky-400" size={18}/> 1. Buscar Empleado
                    </label>
                    <select 
                       className="input-field w-full bg-slate-900 border-slate-700 focus:border-sky-500" 
                       value={selectedEmpleado} 
                       onChange={e => setSelectedEmpleado(e.target.value)}
                    >
                       <option value="">-- Elige un empleado del directorio --</option>
                       {empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.cedula})</option>)}
                    </select>
                 </div>

                 {selectedEmpleado ? (
                   <div className="grid sm:grid-cols-2 gap-4 animate-fade-in-up">
                      <div className="glass-card p-6 border border-slate-700 flex flex-col justify-between">
                         <div>
                            <h3 className="text-white font-bold flex items-center gap-2 mb-2"><FileUp size={18} className="text-sky-400"/> Digitación en Vivo</h3>
                            <p className="text-slate-400 text-sm mb-6">Abre el cuestionario en otra pestaña. Útil si tienes los papeles físicos a tu lado y tú mismo transcribes.</p>
                         </div>
                         <a 
                            href={`/bateria/${empleados.find(e => e.id === selectedEmpleado)?.cedula}?empresaId=${selectedEmpresa}&empleadoId=${selectedEmpleado}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-xl text-center w-full transition-all flex items-center justify-center gap-2"
                         >
                            Abrir Formulario Web
                         </a>
                      </div>

                      <div className="glass-card p-6 border border-slate-700 flex flex-col justify-between bg-slate-800/20">
                         <div>
                            <h3 className="text-white font-bold flex items-center gap-2 mb-2"><LinkIcon size={18} className="text-emerald-400"/> Generar Enlace Remoto</h3>
                            <p className="text-slate-400 text-sm mb-6">Copia la URL única de este empleado para enviarla por WhatsApp o Correo y evita imprimir papel.</p>
                         </div>
                         <button 
                            onClick={handleCopyLink}
                            className={`font-bold py-3 px-4 rounded-xl text-center w-full transition-all flex items-center justify-center gap-2 ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                         >
                            {copySuccess ? <><CheckCircle2 size={18}/> ¡Enlace Copiado!</> : <><Copy size={18}/> Copiar Enlace Mágico</>}
                         </button>
                      </div>
                   </div>
                 ) : (
                   <div className="p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                      Selecciona un empleado arriba para habilitar las herramientas manuales.
                   </div>
                 )}
             </div>
           )}

           {metodo === 'csv' && (
             <div className="max-w-2xl mx-auto text-center glass-card p-12 border-emerald-500/20">
                 <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-6">
                    <FileSpreadsheet size={40} />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-4">Carga Masiva (CSV/Excel)</h2>
                 <p className="text-slate-400 mb-8">
                    El módulo de importación masiva permitirá descargar una plantilla de Excel donde podrás pegar los resultados tabulares de cientos de empleados simultáneamente, para luego subirlos en un solo clic y calcular todas las baterías de la empresa (Intralaboral Forma A, B, Extralaboral, Estrés) a la vez.
                 </p>
                 <div className="inline-block border border-amber-500/30 bg-amber-500/10 text-amber-400 px-6 py-3 rounded-full font-bold text-sm">
                    🚧 En construcción... Muy pronto 🚧
                 </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
