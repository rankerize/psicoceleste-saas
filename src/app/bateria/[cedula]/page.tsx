'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ChevronRight, ChevronLeft, CheckCircle2, AlertCircle,
  Loader2, ClipboardList, Save
} from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  doc, getDoc, updateDoc, collection, addDoc,
  serverTimestamp, query, where, getDocs
} from 'firebase/firestore';
import {
  FORMA_A, FORMA_B, EXTRALABORAL, ESTRES,
  ESCALA_RESPUESTAS, getCuestionario, determinarForma,
  type SeccionCuestionario, type Opcion
} from '@/lib/bateria/cuestionarios';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fase = 'identificacion' | 'intralaboral' | 'extralaboral' | 'estres' | 'completado';
type Respuestas = Record<string, string>;

interface Empleado {
  id: string;
  nombre: string;
  cedula: string;
  tipoCargo: string;
  empresaId: string;
  empresaNombre?: string;
}

// Valores numéricos para cada opción (dirección normal)
const VALOR_OPCION: Record<string, number> = {
  siempre: 4, casi_siempre: 3, algunas_veces: 2, casi_nunca: 1, nunca: 0
};

// ─── Barra de progreso ────────────────────────────────────────────────────────

function ProgressBar({ pct, color = 'sky' }: { pct: number; color?: string }) {
  return (
    <div className="w-full bg-white/5 rounded-full h-2">
      <div
        className={`h-2 rounded-full bg-${color}-500 transition-all duration-500`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

// ─── Componente de escala Likert ──────────────────────────────────────────────

function PreguntaLikert({
  numero,
  texto,
  valor,
  onChange,
  escala = ESCALA_RESPUESTAS,
}: {
  numero: number;
  texto: string;
  valor: string;
  onChange: (v: string) => void;
  escala?: typeof ESCALA_RESPUESTAS;
}) {
  return (
    <div className="glass-card p-5 transition-all hover:border-sky-500/30">
      <p className="text-white text-sm mb-4 leading-relaxed">
        <span className="text-sky-400 font-bold mr-2">{numero}.</span>
        {texto}
      </p>
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {escala.map(op => (
          <button
            key={op.valor}
            type="button"
            onClick={() => onChange(op.valor)}
            className={`
              py-2 px-1 rounded-xl text-xs font-medium transition-all border
              ${valor === op.valor
                ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20 scale-105'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            {op.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

function BateriaContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const cedula = params.cedula as string;
  const empresaId = searchParams.get('empresaId') ?? '';
  const empleadoId = searchParams.get('empleadoId') ?? '';

  const [empleado, setEmpleado]       = useState<Empleado | null>(null);
  const [fase, setFase]               = useState<Fase>('identificacion');
  const [loadingEmp, setLoadingEmp]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [cedulaInput, setCedulaInput] = useState(cedula ?? '');

  // Respuestas por cuestionario
  const [respIntra, setRespIntra]       = useState<Respuestas>({});
  const [respExtra, setRespExtra]       = useState<Respuestas>({});
  const [respEstres, setRespEstres]     = useState<Respuestas>({});

  // Estado filtros
  const [atiendaClientes, setAtiendaClientes] = useState<boolean | null>(null);
  const [esJefe, setEsJefe]                  = useState<boolean | null>(null);

  // Sección actual dentro del cuestionario intralaboral
  const [seccionIdx, setSeccionIdx] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  // ── Buscar empleado ────────────────────────────────────────────────────────

  const buscarEmpleado = useCallback(async () => {
    if (!cedulaInput.trim()) return;
    setLoadingEmp(true);
    setError('');
    try {
      let empData: Empleado | null = null;

      if (empleadoId) {
        const snap = await getDoc(doc(db, 'empleados', empleadoId));
        if (snap.exists()) empData = { id: snap.id, ...snap.data() } as Empleado;
      } else {
        const q = query(
          collection(db, 'empleados'),
          where('cedula', '==', cedulaInput.trim()),
          where('empresaId', '==', empresaId)
        );
        const snap = await getDocs(q);
        if (!snap.empty) empData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Empleado;
      }

      if (!empData) {
        setError('No se encontró un empleado con esa cédula en este proceso.');
        return;
      }

      // Obtener nombre empresa
      if (empData.empresaId) {
        const empDoc = await getDoc(doc(db, 'empresas', empData.empresaId));
        if (empDoc.exists()) empData.empresaNombre = empDoc.data().nombre;
      }

      setEmpleado(empData);
      setFase('intralaboral');
    } catch {
      setError('Error al buscar empleado. Intenta nuevamente.');
    } finally {
      setLoadingEmp(false);
    }
  }, [cedulaInput, empleadoId, empresaId]);

  useEffect(() => {
    if (cedula && (empleadoId || empresaId)) buscarEmpleado();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll to top en cambio de sección ───────────────────────────────────

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [seccionIdx, fase]);

  // ── Cuestionario intralaboral según forma ─────────────────────────────────

  const forma = empleado ? determinarForma(empleado.tipoCargo as Parameters<typeof determinarForma>[0]) : 'B';
  const secciones: SeccionCuestionario[] = getCuestionario(forma);

  // Filtrar secciones condicionales
  const seccionesFiltradas = secciones.filter(sec => {
    if (sec.id === 'clientes_filtro' && atiendaClientes === false) return false;
    if (sec.id === 'colaboradores_filtro' && esJefe === false) return false;
    return true;
  });

  const seccionActual = seccionesFiltradas[seccionIdx];
  const totalSecciones = seccionesFiltradas.length;
  const pctIntra = Math.round((seccionIdx / totalSecciones) * 100);

  const responderPregunta = (numStr: string, valor: string) => {
    if (fase === 'intralaboral') setRespIntra(r => ({ ...r, [numStr]: valor }));
    else if (fase === 'extralaboral') setRespExtra(r => ({ ...r, [numStr]: valor }));
    else if (fase === 'estres') setRespEstres(r => ({ ...r, [numStr]: valor }));
  };

  // ── Validar sección actual ────────────────────────────────────────────────

  const seccionCompleta = (): boolean => {
    if (!seccionActual) return true;
    const pregs = seccionActual.preguntas.filter(p => !p.esFiltro);
    return pregs.every(p => !!respIntra[String(p.numero)]);
  };

  // ── Guardar en Firestore ──────────────────────────────────────────────────

  const guardarResultados = async () => {
    if (!empleado) return;
    setSaving(true);
    try {
      const resultado = {
        empleadoId: empleado.id,
        cedula: empleado.cedula,
        nombre: empleado.nombre,
        empresaId: empleado.empresaId,
        forma,
        respuestasIntralaboral: respIntra,
        respuestasExtralaboral: respExtra,
        respuestasEstres: respEstres,
        atiendaClientes,
        esJefe,
        estado: 'pendiente_calificacion',
        fechaAplicacion: serverTimestamp(),
      };

      // Guardar resultado
      await addDoc(collection(db, 'resultados'), resultado);

      // Actualizar estado del empleado
      await updateDoc(doc(db, 'empleados', empleado.id), {
        estadoBateria: 'completado',
      });

      setFase('completado');
    } catch {
      setError('Error al guardar. No pierdas tus respuestas — intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  // ── Pantalla de identificación ────────────────────────────────────────────

  if (fase === 'identificacion') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--navy-900)' }}>
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center mx-auto mb-4 text-3xl shadow-2xl shadow-sky-500/30">
              🩵
            </div>
            <h1 className="text-2xl font-bold text-white">PsicoCeleste</h1>
            <p className="text-slate-400 text-sm mt-1">Batería de Riesgo Psicosocial</p>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Ingresa tu número de cédula</h2>
            <p className="text-slate-400 text-sm mb-6">
              Esta evaluación es <strong className="text-white">confidencial</strong>. Tus respuestas son anónimas
              y solo se usarán con fines estadísticos para mejorar tu bienestar laboral.
            </p>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg text-sm mb-4">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="relative mb-4">
              <input
                id="input-cedula-bateria"
                type="number"
                value={cedulaInput}
                onChange={e => setCedulaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarEmpleado()}
                className="input-field w-full text-center text-2xl tracking-widest font-bold"
                placeholder="0000000000"
                autoFocus
              />
            </div>

            <button
              id="btn-iniciar-bateria"
              onClick={buscarEmpleado}
              disabled={loadingEmp || !cedulaInput}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loadingEmp
                ? <><Loader2 size={18} className="animate-spin" /> Buscando...</>
                : <><ClipboardList size={18} /> Iniciar evaluación</>
              }
            </button>

            <p className="text-xs text-slate-500 text-center mt-4">
              Resolución 2646 de 2008 — Ministerio de la Protección Social de Colombia
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Pantalla: completado ──────────────────────────────────────────────────

  if (fase === 'completado') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--navy-900)' }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-emerald-400" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">¡Evaluación completada!</h1>
          <p className="text-slate-400 mb-2">
            Gracias, <strong className="text-white">{empleado?.nombre}</strong>.
          </p>
          <p className="text-slate-400 text-sm mb-8">
            Tus respuestas han sido guardadas de forma segura. El psicólogo encargado
            procesará los resultados y te informará oportunamente.
          </p>
          <div className="glass-card p-4 text-left text-xs text-slate-500">
            <div className="flex justify-between mb-1"><span>Empresa</span><span className="text-slate-300">{empleado?.empresaNombre}</span></div>
            <div className="flex justify-between mb-1"><span>Cédula</span><span className="text-slate-300">{empleado?.cedula}</span></div>
            <div className="flex justify-between"><span>Forma aplicada</span><span className="text-sky-300 font-semibold">Intralaboral Forma {forma}</span></div>
          </div>
        </div>
      </div>
    );
  }

  // ── Cuestionario intralaboral ─────────────────────────────────────────────

  if (fase === 'intralaboral' && seccionActual) {
    const preguntas = seccionActual.preguntas;
    const hayFiltro = preguntas.some(p => p.esFiltro);
    const preguntasFiltro = preguntas.filter(p => p.esFiltro);
    const preguntasNormales = preguntas.filter(p => !p.esFiltro);

    return (
      <div ref={topRef} className="min-h-screen" style={{ background: 'var(--navy-900)' }}>
        {/* Header sticky */}
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-white/5 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="text-lg">🩵</div>
              <div>
                <p className="text-xs text-slate-400">{empleado?.nombre}</p>
                <p className="text-xs text-sky-400 font-semibold">Intralaboral Forma {forma}</p>
              </div>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Sección {seccionIdx + 1} / {totalSecciones}</span>
                <span>{pctIntra}%</span>
              </div>
              <ProgressBar pct={pctIntra} />
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto p-4 pb-24">
          {/* Instrucción sección */}
          {seccionActual.instruccion && (
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl px-4 py-3 mb-5 text-sm text-sky-200">
              {seccionActual.instruccion}
            </div>
          )}

          {/* Pregunta filtro */}
          {hayFiltro && preguntasFiltro.map(pf => (
            <div key={pf.numero} className="glass-card p-5 mb-5">
              <p className="text-white text-sm mb-3 font-medium">{pf.texto}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => pf.seccionFiltro === 'clientes' ? setAtiendaClientes(true) : setEsJefe(true)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    (pf.seccionFiltro === 'clientes' ? atiendaClientes : esJefe) === true
                      ? 'bg-sky-500 border-sky-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Sí
                </button>
                <button
                  onClick={() => pf.seccionFiltro === 'clientes' ? setAtiendaClientes(false) : setEsJefe(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    (pf.seccionFiltro === 'clientes' ? atiendaClientes : esJefe) === false
                      ? 'bg-slate-600 border-slate-500 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          ))}

          {/* Preguntas normales — solo si filtro fue Sí o no hay filtro */}
          {(!hayFiltro ||
            (seccionActual.id === 'clientes_filtro' && atiendaClientes === true) ||
            (seccionActual.id === 'colaboradores_filtro' && esJefe === true)
          ) && (
            <div className="space-y-3">
              {preguntasNormales.map(p => (
                <PreguntaLikert
                  key={p.numero}
                  numero={p.numero}
                  texto={p.texto}
                  valor={respIntra[String(p.numero)] ?? ''}
                  onChange={v => responderPregunta(String(p.numero), v)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer navegación */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/5 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <button
              onClick={() => setSeccionIdx(i => Math.max(0, i - 1))}
              disabled={seccionIdx === 0}
              className="btn-secondary flex items-center gap-1 px-4"
            >
              <ChevronLeft size={16} /> Anterior
            </button>

            <span className="text-xs text-slate-500 hidden sm:block">
              {Object.keys(respIntra).length} respuestas guardadas
            </span>

            {seccionIdx < totalSecciones - 1 ? (
              <button
                id="btn-siguiente-seccion"
                onClick={() => setSeccionIdx(i => i + 1)}
                className="btn-primary flex items-center gap-1 px-4"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <button
                id="btn-ir-extralaboral"
                onClick={() => setFase('extralaboral')}
                className="btn-primary flex items-center gap-1 px-4 bg-emerald-600 hover:bg-emerald-500"
              >
                Continuar <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Cuestionario extralaboral ─────────────────────────────────────────────

  if (fase === 'extralaboral') {
    const totalPregsExtra = EXTRALABORAL.flatMap(s => s.preguntas).length;
    const respondidas = Object.keys(respExtra).length;
    return (
      <div ref={topRef} className="min-h-screen" style={{ background: 'var(--navy-900)' }}>
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-white/5 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="text-lg">🩵</div>
              <div>
                <p className="text-xs text-slate-400">{empleado?.nombre}</p>
                <p className="text-xs text-emerald-400 font-semibold">Cuestionario Extralaboral</p>
              </div>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{respondidas} / {totalPregsExtra} ítems</span>
                <span>{Math.round((respondidas / totalPregsExtra) * 100)}%</span>
              </div>
              <ProgressBar pct={(respondidas / totalPregsExtra) * 100} color="emerald" />
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto p-4 pb-24">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-5 text-sm text-emerald-200">
            Ahora responde las preguntas sobre tu vida <strong>fuera del trabajo</strong> —
            familia, tiempo libre, vivienda y situación económica.
          </div>

          {EXTRALABORAL.map(seccion => (
            <div key={seccion.id} className="mb-6">
              {seccion.instruccion && (
                <div className="bg-white/5 rounded-xl px-4 py-2 mb-3 text-sm text-slate-300">
                  {seccion.instruccion}
                </div>
              )}
              <div className="space-y-3">
                {seccion.preguntas.map(p => (
                  <PreguntaLikert
                    key={p.numero}
                    numero={p.numero}
                    texto={p.texto}
                    valor={respExtra[String(p.numero)] ?? ''}
                    onChange={v => setRespExtra(r => ({ ...r, [String(p.numero)]: v }))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/5 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <button onClick={() => setFase('intralaboral')} className="btn-secondary flex items-center gap-1 px-4">
              <ChevronLeft size={16} /> Anterior
            </button>
            <button
              id="btn-ir-estres"
              onClick={() => setFase('estres')}
              className="btn-primary flex items-center gap-1 px-4"
            >
              Continuar <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Cuestionario de estrés ────────────────────────────────────────────────

  if (fase === 'estres') {
    const ESCALA_ESTRES = [
      { valor: 'siempre',      label: 'Siempre' },
      { valor: 'casi_siempre', label: 'Casi siempre' },
      { valor: 'algunas_veces', label: 'A veces' },
      { valor: 'nunca',        label: 'Nunca' },
    ];
    const totalEstres = ESTRES.flatMap(s => s.preguntas).length;
    const respEst = Object.keys(respEstres).length;

    return (
      <div ref={topRef} className="min-h-screen" style={{ background: 'var(--navy-900)' }}>
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-white/5 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="text-lg">🩵</div>
              <div>
                <p className="text-xs text-slate-400">{empleado?.nombre}</p>
                <p className="text-xs text-violet-400 font-semibold">Cuestionario de Estrés</p>
              </div>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{respEst} / {totalEstres} síntomas</span>
                <span>{Math.round((respEst / totalEstres) * 100)}%</span>
              </div>
              <ProgressBar pct={(respEst / totalEstres) * 100} color="violet" />
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto p-4 pb-24">
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 mb-5 text-sm text-violet-200">
            Indica con qué frecuencia has experimentado cada uno de los siguientes síntomas
            durante el <strong>último mes</strong>.
          </div>

          {ESTRES.map(seccion => (
            <div key={seccion.id} className="mb-6">
              {seccion.instruccion && (
                <div className="bg-white/5 rounded-xl px-4 py-2 mb-3 text-sm text-slate-300">
                  {seccion.instruccion}
                </div>
              )}
              <div className="space-y-3">
                {seccion.preguntas.map(p => (
                  <PreguntaLikert
                    key={p.numero}
                    numero={p.numero}
                    texto={p.texto}
                    valor={respEstres[String(p.numero)] ?? ''}
                    onChange={v => setRespEstres(r => ({ ...r, [String(p.numero)]: v }))}
                    escala={ESCALA_ESTRES as typeof ESCALA_RESPUESTAS}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/5 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <button onClick={() => setFase('extralaboral')} className="btn-secondary flex items-center gap-1 px-4">
              <ChevronLeft size={16} /> Anterior
            </button>
            <button
              id="btn-finalizar-bateria"
              onClick={guardarResultados}
              disabled={saving}
              className="btn-primary px-6 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                : <><Save size={16} /> Finalizar y guardar</>
              }
            </button>
          </div>
        </div>

        {error && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-500/90 text-white px-4 py-3 rounded-xl text-sm shadow-xl">
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function BateriaPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--navy-900)' }}><div className="spinner" /></div>}>
      <BateriaContent />
    </Suspense>
  );
}
