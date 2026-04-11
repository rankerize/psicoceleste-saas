import React, { useState, useEffect } from 'react';
import { Loader2, X, Download, ShieldCheck, Mail, Sparkles } from 'lucide-react';

interface ReportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  empleadoId: string;
  resultadoId: string;
}

export function ReportPreview({ isOpen, onClose, empleadoId, resultadoId }: ReportPreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchAiReport = async () => {
      try {
        const response = await fetch(`/api/ai-html-report?empleadoId=${empleadoId}&resultadoId=${resultadoId}`);
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error || 'Error fetching report');
        }
        
        const data = await response.json();
        if (isMounted) {
          setHtmlContent(data.html);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAiReport();

    return () => { isMounted = false; };
  }, [isOpen, empleadoId, resultadoId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/60 shadow-2xl rounded-3xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 bg-slate-800/80 border-b border-slate-700/50 backdrop-blur-md z-10 shadow-lg">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-sky-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                <Sparkles className="text-white" size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                 Reporte Inteligente IA 
                 <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-wider border border-sky-500/30">Beta</span>
               </h2>
               <p className="text-sm text-slate-400">Previsualización de documento clínico de alta precisión</p>
             </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all border border-slate-700/50 hover:border-slate-500 hover:scale-105"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-900/50 relative overflow-hidden flex flex-col justify-center min-h-[500px]">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="relative w-24 h-24 mb-6 flex justify-center items-center">
                   <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-purple-500 animate-[spin_2s_linear_infinite]"></div>
                   <div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-sky-400 animate-[spin_3s_linear_infinite_reverse]"></div>
                   <Sparkles className="text-purple-400 absolute animate-pulse" size={32} />
                </div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400 mb-2">Generando Informe Computacional...</h3>
                <p className="text-slate-400 max-w-sm text-sm">La inteligencia artificial está estructurando los resultados, analizando los factores de riesgo y aplicando el estilo premium del reporte.</p>
             </div>
           ) : error ? (
             <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-red-500/5">
                <div className="w-16 h-16 rounded-3xl bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                   <X className="text-red-400" size={32} />
                </div>
                <p className="text-red-400 font-medium mb-6">{error}</p>
                <button onClick={() => { setLoading(true); setError(null); fetch(`/api/ai-html-report?empleadoId=${empleadoId}&resultadoId=${resultadoId}`); }} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all">Reintentar Conexión</button>
             </div>
           ) : htmlContent ? (
             <div className="w-full h-full p-6 bg-slate-800/20 overflow-hidden">
                 <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-white">
                    <iframe 
                        srcDoc={htmlContent}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
                        title="AI HTML Report Preview"
                    />
                 </div>
             </div>
           ) : null}
        </div>
      </div>
    </div>
  );
}
