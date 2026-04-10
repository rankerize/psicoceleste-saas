'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, AlertCircle, Loader2, RefreshCw,
  ClipboardList, TrendingUp, Activity, Brain, Home, FileDown
} from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection, query, where, getDocs, orderBy, limit
} from 'firebase/firestore';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type NivelRiesgo = 'sin_riesgo' | 'bajo' | 'medio' | 'alto' | 'muy_alto';

const NIVEL_CONFIG: Record<NivelRiesgo, { label: string; color: string; bg: string; bar: string }> = {
  sin_riesgo: { label: 'Sin riesgo',    color: 'text-emerald-400',  bg: 'bg-emerald-500/15', bar: 'bg-emerald-500' },
  bajo:       { label: 'Riesgo bajo',   color: 'text-sky-400',      bg: 'bg-sky-500/15',     bar: 'bg-sky-500' },
  medio:      { label: 'Riesgo medio',  color: 'text-amber-400',    bg: 'bg-amber-500/15',   bar: 'bg-amber-500' },
  alto:       { label: 'Riesgo alto',   color: 'text-orange-400',   bg: 'bg-orange-500/15',  bar: 'bg-orange-500' },
  muy_alto:   { label: 'Riesgo muy alto', color: 'text-red-400',    bg: 'bg-red-500/15',     bar: 'bg-red-500' },
};

const NOMBRES_DIM_INTRA: Record<string, string> = {
  liderazgo:              'Características del liderazgo',
  relaciones_sociales:    'Relaciones sociales en el trabajo',
  retroalimentacion:      'Retroalimentación del desempeño',
  colaboradores:          'Relación con colaboradores',
  claridad_rol:           'Claridad de rol',
  capacitacion:           'Capacitación',
  participacion_cambio:   'Participación y manejo del cambio',
  uso_habilidades:        'Uso y desarrollo de habilidades',
  control_autonomia:      'Control y autonomía sobre el trabajo',
  ambiente_fisico:        'Demandas ambientales y esfuerzo físico',
  demandas_emocionales:   'Demandas emocionales',
  demandas_cuantitativas: 'Demandas cuantitativas',
  influencia_trabajo:     'Influencia del trabajo sobre el entorno extralaboral',
  responsabilidad:        'Exigencias de responsabilidad del cargo',
  carga_mental:           'Demandas de carga mental',
  consistencia_rol:       'Consistencia del rol',
  jornada:                'Demandas de la jornada de trabajo',
  recompensas:            'Recompensas derivadas de la pertenencia',
  reconocimiento:         'Reconocimiento y compensación',
};

const NOMBRES_DIM_EXTRA: Record<string, string> = {
  tiempo_fuera:            'Tiempo fuera del trabajo',
  relaciones_familiares:   'Relaciones familiares',
  comunicacion_relaciones: 'Comunicación y relaciones interpersonales',
  situacion_economica:     'Situación económica del grupo familiar',
  vivienda_entorno:        'Características de la vivienda y su entorno',
  influencia_extralaboral: 'Influencia del entorno extralaboral sobre el trabajo',
  desplazamiento:          'Desplazamiento vivienda–trabajo–vivienda',
};

// ─── Badge de nivel ───────────────────────────────────────────────────────────

function NivelBadge({ nivel }: { nivel: NivelRiesgo }) {
  const cfg = NIVEL_CONFIG[nivel] ?? NIVEL_CONFIG.sin_riesgo;
  return (
    <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Barra de puntaje ─────────────────────────────────────────────────────────

function ScoreBar({ puntaje, nivel }: { puntaje: number; nivel: NivelRiesgo }) {
  const cfg = NIVEL_CONFIG[nivel] ?? NIVEL_CONFIG.sin_riesgo;
  return (
    <div className="flex items-center gap-3 mt-1.5">
      <div className="flex-1 bg-white/5 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${cfg.bar}`}
          style={{ width: `${Math.min(100, puntaje)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-400 w-10 text-right">{puntaje.toFixed(1)}</span>
    </div>
  );
}

// ─── Tarjeta de dominio/sección ──────────────────────────────────────────────

function TarjetaResumen({
  icono, titulo, nivel, puntaje, detalle,
}: {
  icono: React.ReactNode;
  titulo: string;
  nivel: NivelRiesgo;
  puntaje: number;
  detalle?: { nombre: string; puntaje: number; nivel: NivelRiesgo }[];
}) {
  const [abierto, setAbierto] = useState(false);
  const cfg = NIVEL_CONFIG[nivel] ?? NIVEL_CONFIG.sin_riesgo;

  return (
    <div className={`glass-card p-5 border ${cfg.bg} border-opacity-30`}>
      <button
        className="w-full text-left"
        onClick={() => setAbierto(a => !a)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`${cfg.color} opacity-80`}>{icono}</div>
            <div>
              <p className="text-white font-semibold text-sm">{titulo}</p>
              <ScoreBar puntaje={puntaje} nivel={nivel} />
            </div>
          </div>
          <NivelBadge nivel={nivel} />
        </div>
      </button>

      {abierto && detalle && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
          {detalle.map(d => (
            <div key={d.nombre}>
              <div className="flex justify-between items-center">
                <p className="text-slate-300 text-xs">{d.nombre}</p>
                <NivelBadge nivel={d.nivel} />
              </div>
              <ScoreBar puntaje={d.puntaje} nivel={d.nivel} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function ResultadoEmpleadoPage() {
  const params = useParams();
  const empleadoId = params.empleadoId as string;

  const [resultado, setResultado]     = useState<Record<string, unknown> | null>(null);
  const [empleado, setEmpleado]       = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading]         = useState(true);
  const [calificando, setCalificando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error, setError]             = useState('');

  const descargarPDF = async () => {
    setDescargando(true);
    setError('');
    try {
      const res = await fetch(`/api/reporte-pdf?empleadoId=${empleadoId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Error generando PDF');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `perfil-riesgo-${(empleado as Record<string,unknown>)?.nombre?.toString()?.replace(/\s+/g, '-') ?? empleadoId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Error descargando PDF');
    } finally {
      setDescargando(false);
    }
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Cargar datos del empleado
      const { doc, getDoc } = await import('firebase/firestore');
      const empSnap = await getDoc(doc(db, 'empleados', empleadoId));
      if (empSnap.exists()) setEmpleado({ id: empSnap.id, ...empSnap.data() });

      // Ultimo resultado del empleado
      const q = query(
        collection(db, 'resultados'),
        where('empleadoId', '==', empleadoId),
        orderBy('fechaAplicacion', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) setResultado({ id: snap.docs[0].id, ...snap.docs[0].data() });
    } catch {
      setError('Error al cargar los resultados');
    } finally {
      setLoading(false);
    }
  }, [empleadoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const calificar = async () => {
    if (!resultado) return;
    setCalificando(true);
    setError('');
    try {
      const res = await fetch('/api/calificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultadoId: (resultado as { id: string }).id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await cargar(); // reload with calificacion
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Error al calificar');
    } finally {
      setCalificando(false);
    }
  };

  // ── Datos de calificación ─────────────────────────────────────────────────

  const cal = resultado && (resultado as Record<string, unknown>).calificacion as {
    intra?: Record<string, unknown>;
    extra?: { dimensiones?: { dimension: string; puntajeTransformado: number; nivelRiesgo: NivelRiesgo }[]; puntajeTransformadoTotal?: number; nivelRiesgoTotal?: NivelRiesgo };
    estres?: { puntajeTransformado?: number; nivelRiesgo?: NivelRiesgo; categorias?: Record<string, number> };
  } | null;

  const intra = cal?.intra as Record<string, unknown> | undefined;
  const extra = cal?.extra;
  const estres = cal?.estres;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/dashboard" className="hover:text-sky-400 transition-colors flex items-center gap-1">
          <ChevronLeft size={15} /> Dashboard
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/empresas/${(empleado as Record<string,unknown>)?.empresaId as string ?? ''}`}
          className="hover:text-sky-400 transition-colors"
        >
          Empleados
        </Link>
        <span>/</span>
        <span className="text-white">Resultados</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-sky-400" size={36} />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="glass-card p-5 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 flex items-center justify-center text-2xl font-bold text-sky-400">
                  {((empleado as Record<string,unknown>)?.nombre as string ?? 'E').charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{(empleado as Record<string,unknown>)?.nombre as string}</h1>
                  <p className="text-slate-400 text-sm">{(empleado as Record<string,unknown>)?.cargo as string} — {(empleado as Record<string,unknown>)?.area as string}</p>
                  <p className="text-slate-500 text-xs mt-0.5">CC: {(empleado as Record<string,unknown>)?.cedula as string}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {resultado && !cal && (
                  <button
                    id="btn-calificar"
                    onClick={calificar}
                    disabled={calificando}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    {calificando
                      ? <><Loader2 size={15} className="animate-spin" /> Calificando...</>
                      : <><TrendingUp size={15} /> Generar resultados</>
                    }
                  </button>
                )}

                {/* Botón descargar PDF — visible solo cuando hay resultado calificado */}
                {cal && (
                  <button
                    id="btn-descargar-pdf"
                    onClick={descargarPDF}
                    disabled={descargando}
                    className="btn-primary flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                  >
                    {descargando
                      ? <><Loader2 size={15} className="animate-spin" /> Generando PDF...</>
                      : <><FileDown size={15} /> Descargar PDF</>
                    }
                  </button>
                )}

                <button
                  onClick={cargar}
                  className="btn-secondary flex items-center gap-1 text-sm"
                >
                  <RefreshCw size={14} /> Actualizar
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Sin resultado */}
          {!resultado && !loading && (
            <div className="glass-card p-12 text-center">
              <ClipboardList className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-300 text-lg font-medium">Este empleado aún no ha completado la batería</p>
              <p className="text-slate-500 text-sm mt-2">
                Envía el link de aplicación:{' '}
                <code className="bg-white/10 px-2 py-0.5 rounded text-sky-400 text-xs">
                  /bateria/{(empleado as Record<string,unknown>)?.cedula as string}?empleadoId={empleadoId}
                </code>
              </p>
            </div>
          )}

          {/* Resultado sin calificar */}
          {resultado && !cal && (
            <div className="glass-card p-8 text-center border-amber-500/20">
              <Activity className="mx-auto text-amber-400 mb-4" size={40} />
              <p className="text-white text-lg font-semibold mb-2">Batería aplicada — pendiente de calificación</p>
              <p className="text-slate-400 text-sm mb-6">Las respuestas están guardadas. Haz clic en "Generar resultados" para obtener el perfil de riesgo.</p>
            </div>
          )}

          {/* Resultados calificados */}
          {cal && (
            <div className="space-y-5">

              {/* ── Intralaboral ── */}
              {intra && (
                <div>
                  <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <ClipboardList className="text-violet-400" size={18} />
                    Cuestionario Intralaboral — Forma {(resultado as Record<string,unknown>).forma as string}
                  </h2>

                  {/* Total general */}
                  <div className="glass-card p-5 mb-3 border-violet-500/20">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-slate-300 text-sm">Total general de riesgo psicosocial intralaboral</p>
                        <ScoreBar
                          puntaje={(intra.puntajeTransformadoTotal as number) ?? 0}
                          nivel={(intra.nivelRiesgoTotal as NivelRiesgo) ?? 'sin_riesgo'}
                        />
                      </div>
                      <NivelBadge nivel={(intra.nivelRiesgoTotal as NivelRiesgo) ?? 'sin_riesgo'} />
                    </div>
                  </div>

                  {/* Dominios */}
                  <div className="grid gap-3">
                    {(intra.dominios as { id: string; nombre: string; puntajeTransformado: number; nivelRiesgo: NivelRiesgo; dimensiones?: { id: string; puntajeTransformado: number; nivelRiesgo: NivelRiesgo }[] }[] ?? []).map((dominio) => (
                      <TarjetaResumen
                        key={dominio.id}
                        icono={<TrendingUp size={18} />}
                        titulo={dominio.nombre}
                        nivel={dominio.nivelRiesgo}
                        puntaje={dominio.puntajeTransformado}
                        detalle={(dominio.dimensiones ?? []).map(dim => ({
                          nombre: NOMBRES_DIM_INTRA[dim.id] ?? dim.id,
                          puntaje: dim.puntajeTransformado,
                          nivel: dim.nivelRiesgo,
                        }))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Extralaboral ── */}
              {extra && (
                <div className="mt-6">
                  <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <Home className="text-emerald-400" size={18} />
                    Cuestionario Extralaboral
                  </h2>
                  <div className="glass-card p-5 mb-3 border-emerald-500/20">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-slate-300 text-sm">Total riesgo extralaboral</p>
                        <ScoreBar
                          puntaje={extra.puntajeTransformadoTotal ?? 0}
                          nivel={extra.nivelRiesgoTotal ?? 'sin_riesgo'}
                        />
                      </div>
                      <NivelBadge nivel={extra.nivelRiesgoTotal ?? 'sin_riesgo'} />
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {(extra.dimensiones ?? []).map(dim => (
                      <div key={dim.dimension} className="glass-card p-4 flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-slate-300 text-xs">{NOMBRES_DIM_EXTRA[dim.dimension] ?? dim.dimension}</p>
                          <ScoreBar puntaje={dim.puntajeTransformado} nivel={dim.nivelRiesgo} />
                        </div>
                        <NivelBadge nivel={dim.nivelRiesgo} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Estrés ── */}
              {estres && (
                <div className="mt-6">
                  <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <Brain className="text-rose-400" size={18} />
                    Cuestionario de Estrés
                  </h2>
                  <div className="glass-card p-5 border-rose-500/20">
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                      <div className="flex-1">
                        <p className="text-slate-300 text-sm">Nivel general de estrés</p>
                        <ScoreBar
                          puntaje={estres.puntajeTransformado ?? 0}
                          nivel={estres.nivelRiesgo ?? 'sin_riesgo'}
                        />
                      </div>
                      <NivelBadge nivel={estres.nivelRiesgo ?? 'sin_riesgo'} />
                    </div>
                    {estres.categorias && (
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                        {Object.entries(estres.categorias).map(([cat, puntaje]) => (
                          <div key={cat} className="bg-white/3 rounded-xl p-3">
                            <p className="text-slate-400 text-xs mb-1 capitalize">{cat.replace(/_/g, ' ')}</p>
                            <p className="text-white font-bold text-lg">{puntaje as number}</p>
                            <p className="text-slate-500 text-xs">puntos brutos</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interpretación general */}
              <div className="glass-card p-5 mt-6 border-sky-500/10">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">📋 Marco legal</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Evaluación realizada conforme a la Resolución 2646 de 2008 y la Batería de Instrumentos para
                  la Evaluación de Factores de Riesgo Psicosocial del Ministerio de la Protección Social (2010).
                  Los resultados deben ser interpretados por un psicólogo con licencia en salud ocupacional vigente.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
