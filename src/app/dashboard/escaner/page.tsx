'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, FileUp, Loader2, CheckCircle2, AlertCircle, Trash2, Building2, User, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, serverTimestamp, updateDoc, doc } from 'firebase/firestore';

export default function EscanerAIPage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States para Asignación
  const [empresas, setEmpresas] = useState<{id: string, nombre: string}[]>([]);
  const [empleados, setEmpleados] = useState<{id: string, nombre: string, cedula: string}[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se aceptan imágenes (JPG, PNG)');
      return;
    }
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResults(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const procesarImagen = async () => {
    if (!photo) return;
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('imagen', photo);

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

  const clear = () => {
    setPhoto(null);
    setPreviewUrl(null);
    setResults(null);
    setError(null);
    setSuccessMsg('');
  };

  const guardarResultadoHaciaDB = async () => {
    if (!selectedEmpleado || !results) {
      setError('Por favor selecciona un empleado para asignar estas respuestas.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const empleadoObj = empleados.find(e => e.id === selectedEmpleado);
      const empresaObj = empresas.find(e => e.id === selectedEmpresa);
      
      const resultado = {
        empleadoId: selectedEmpleado,
        cedula: empleadoObj?.cedula || '',
        nombre: empleadoObj?.nombre || '',
        empresaId: selectedEmpresa,
        forma: 'A', // OMR debe detectar esto o solicitarlo luego, default A
        respuestasIntralaboral: results, // Map OCR straight to Intralaboral for MVP
        respuestasExtralaboral: {},
        respuestasEstres: {},
        estado: 'pendiente_calificacion',
        origen: 'Escáner AI',
        fechaAplicacion: serverTimestamp(),
      };

      await addDoc(collection(db, 'resultados'), resultado);
      await updateDoc(doc(db, 'empleados', selectedEmpleado), { estadoBateria: 'completado' });

      setSuccessMsg(`Resultados asignados exitosamente a ${empleadoObj?.nombre}`);
      setTimeout(() => clear(), 3000); // Reset UI after 3s
    } catch (err: any) {
      setError('Error al guardar en base de datos: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">Escáner Óptico AI</h1>
        <span className="badge bg-purple-500/20 text-purple-400 border border-purple-500/30">
          Reconocimiento Inteligente (Gemini 1.5)
        </span>
      </div>

      <p className="text-slate-400 mb-8 max-w-3xl">
        Ahorra horas de digitación manual. Toma una foto buena y nítida de una página del cuadernillo diligenciado. 
        Evita sombras oscuras o páginas muy torcidas para garantizar una lectura matemática precisa.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Zona de Carga */}
        <div className="space-y-6">
          {!photo ? (
            <div 
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="glass-card p-12 flex flex-col items-center justify-center border-dashed border-2 border-slate-700 hover:border-purple-500/50 hover:bg-white/5 transition-all cursor-pointer rounded-2xl h-[400px]"
            >
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={e => e.target.files && handleFile(e.target.files[0])}
                capture="environment" // Habilita la cámara en tablets/celulares directamente
              />
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-purple-400">
                <Camera size={28} />
              </div>
              <h3 className="text-white font-bold mb-2">Toma una foto o sube un archivo</h3>
              <p className="text-slate-400 text-sm text-center">Formato JPG o PNG</p>
            </div>
          ) : (
            <div className="glass-card p-4 rounded-2xl border-purple-500/30 flex flex-col items-center">
              {previewUrl && (
                 <img src={previewUrl} alt="Escaneo" className="max-h-[300px] object-contain rounded-xl mb-6 shadow-lg shadow-black/50" />
              )}
              
              {error && (
                <div className="w-full bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-4 flex items-center gap-3 text-sm">
                  <AlertCircle size={20} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex gap-4 w-full">
                <button 
                  onClick={clear}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Descartar
                </button>
                <button 
                  onClick={procesarImagen}
                  disabled={loading}
                  className="flex-[2] py-3 bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/25 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
                  {loading ? 'Analizando con IA...' : 'Extraer Respuestas'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Zona de Resultados */}
        <div className="glass-card rounded-2xl p-6 h-[400px] overflow-y-auto relative">
          <div className="sticky top-0 bg-[#0a0f1e]/90 backdrop-blur-md pb-4 mb-4 border-b border-white/5 z-10 flex items-center justify-between">
            <h2 className="text-white font-bold flex items-center gap-2">
              <CheckCircle2 className="text-emerald-400" size={20} />
              Datos Extraídos (Validación)
            </h2>
            {results && (
              <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">
                {Object.keys(results).length} Preguntas Leídas
              </span>
            )}
          </div>

          {!results && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 pb-12">
               <span className="text-4xl mb-4">🤖</span>
               <p className="text-center text-sm">El motor de Inteligencia Artificial extraerá las cruces de la tabla aquí.</p>
            </div>
          )}
          
          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-12">
               <Loader2 className="animate-spin text-purple-500 mb-4" size={32} />
               <p className="text-center text-sm">Visión Computacional escaneando geometría métrica...</p>
            </div>
          )}

          {successMsg && (
             <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl mb-4 flex items-center gap-3 text-sm">
                <CheckCircle2 size={24} />
                <p className="font-bold">{successMsg}</p>
             </div>
          )}

          {results && !successMsg && (
            <>
              {/* Asignar a empleado */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 mb-4 space-y-3">
                <h3 className="text-white text-sm font-bold flex items-center gap-2 mb-2">
                  <User size={16} className="text-sky-400" /> Asignar a Empleado
                </h3>
                
                <select 
                  className="input-field w-full" 
                  value={selectedEmpresa} 
                  onChange={e => setSelectedEmpresa(e.target.value)}
                >
                  <option value="">-- Escoge Empresa --</option>
                  {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                </select>

                <select 
                  className="input-field w-full disabled:opacity-50" 
                  value={selectedEmpleado} 
                  onChange={e => setSelectedEmpleado(e.target.value)}
                  disabled={!selectedEmpresa}
                >
                  <option value="">-- Escoge Empleado --</option>
                  {empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.cedula})</option>)}
                </select>

                <button 
                  onClick={guardarResultadoHaciaDB}
                  disabled={saving || !selectedEmpleado}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 py-3 rounded-xl font-bold transition-all text-white flex justify-center items-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Asignar y Analizar Resultados
                </button>
              </div>

              <div className="space-y-2 pb-4">
                <div className="grid grid-cols-2 text-xs font-bold text-slate-500 mb-2 px-2 uppercase tracking-wider">
                <span>Nº Pregunta</span>
                <span>Calificación (1-5)</span>
              </div>
              {Object.entries(results).map(([qNum, val]) => (
                <div key={qNum} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 hover:border-purple-500/30 transition-all">
                  <span className="text-slate-300 font-medium">Pregunta {qNum}</span>
                  <div className="flex gap-1">
                     {[1,2,3,4,5].map(scale => (
                        <div 
                          key={scale}
                          className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold transition-all ${
                            val === scale 
                              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' 
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {scale}
                        </div>
                     ))}
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
