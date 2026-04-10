"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { EMPLEADOS_SEMILLA } from "@/lib/seed-empleados";
import { calificarIntralaboral } from "@/lib/bateria/scoring-intralaboral";
import { calcularExtralaboral } from "@/lib/bateria/scoring-extralaboral";
import { calcularEstres } from "@/lib/bateria/scoring-estres";
import { CheckCircle, AlertCircle, PlayCircle, Loader2 } from "lucide-react";

export default function SeedingPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [logs, setLogs] = useState<string[]>([]);

  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const handleSeed = async () => {
    if (!db) {
        appendLog("⚠️ Error: Firebase DB no está inicializado. Verifica .env.local.");
        setStatus("error");
        return;
    }

    setLoading(true);
    setStatus("loading");
    setLogs([]);
    appendLog("Iniciando inyección de datos semilla...");

    try {
      // 1. Crear Empresa Demo
      const idEmpresa = "demo-empresa-123";
      const empresaRef = doc(collection(db, "empresas"), idEmpresa);
      await setDoc(empresaRef, {
        nombre: "Empresa Demo S.A.S.",
        nit: "900.xxx.xxx-1",
        sectoreconomico: "Tecnología",
        createdAt: serverTimestamp(),
        esDemo: true,
      });
      appendLog("✅ Empresa Demo S.A.S. creada en Firestore.");

      // 2. Procesar e insertar Empleados
      // Para cada empleado, calculamos los resultados y los subimos
      for (const empleado of EMPLEADOS_SEMILLA) {
        appendLog(`Procesando a ${empleado.nombre}...`);
        
        // Ejecutar los tres motores de cálculo
        const resultadoIntra = calificarIntralaboral(
          empleado.forma,
          empleado.respuestasIntra,
          empleado.esJefeDePersonas,
          empleado.tieneClientesUsuarios,
          empleado.esMandoSinJefe
        );

        const resultadoExtra = calcularExtralaboral(
          empleado.respuestasExtra,
          empleado.tipoCargo
        );

        const resultadoEstres = calcularEstres(empleado.respuestasEstres);

        // Crear documento en la colección 'empleados_evaluaciones'
        const empleadoId = `demo-emp-${empleado.nombre.replace(/\s+/g, '-').toLowerCase()}`;
        const empleadoRef = doc(collection(db, "empleados_evaluaciones"), empleadoId);

        await setDoc(empleadoRef, {
          empresaId: idEmpresa,
          perfil: {
            nombre: empleado.nombre,
            cargo: empleado.cargo,
            area: empleado.area,
            tipoCargo: empleado.tipoCargo,
            forma: empleado.forma,
            esJefeDePersonas: empleado.esJefeDePersonas,
            tieneClientesUsuarios: empleado.tieneClientesUsuarios,
            esMandoSinJefe: empleado.esMandoSinJefe,
          },
          respuestasCrudas: {
            intralaboral: empleado.respuestasIntra,
            extralaboral: empleado.respuestasExtra,
            estres: empleado.respuestasEstres,
          },
          resultados: {
            intralaboral: resultadoIntra,
            extralaboral: resultadoExtra,
            estres: resultadoEstres,
          },
          createdAt: serverTimestamp(),
          esDemo: true,
        });

        appendLog(`✅ ${empleado.nombre} inyectado exitosamente.`);
      }

      appendLog("🎉 ¡Proceso de inyección de datos finalizado exitosamente!");
      setStatus("success");
    } catch (error: any) {
      console.error("Error seeding data:", error);
      appendLog(`❌ Error fatal: ${error.message}`);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <PlayCircle className="text-blue-600 h-8 w-8" />
          Herramienta de Inyección de Semillas (Dev)
        </h1>
        <p className="text-gray-500 mt-2">
          Este panel toma los perfiles de demostración (Andrea, Juan, Rosa), ejecuta los motores de cálculo en vivo y empuja la data estructurada a <strong>Firebase Firestore</strong> en las colecciones <code>empresas</code> y <code>empleados_evaluaciones</code>.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Inyectar Demo Data a Firestore
            </h2>
            <p className="text-sm text-gray-500">
              Se creará la empresa demo y 3 empleados evaluados.
            </p>
          </div>
          
          <button
            onClick={handleSeed}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {loading ? "Inyectando..." : "Inyectar Semilla"}
          </button>
        </div>

        {/* Logs Console */}
        <div className="bg-gray-900 rounded-xl p-4 min-h-[300px] font-mono text-sm overflow-y-auto">
          <div className="text-gray-400 mb-2 border-b border-gray-800 pb-2">
            {'//'} Terminal de Inyección de Firebase Firestore
          </div>
          {logs.length === 0 && !loading && (
             <div className="text-gray-600 italic">Esperando instrucción...</div>
          )}
          {logs.map((log, index) => (
            <div key={index} className={`mb-1 ${
              log.includes('❌') || log.includes('⚠️') ? 'text-red-400' : 
              log.includes('✅') || log.includes('🎉') ? 'text-green-400' : 
              'text-gray-300'
            }`}>
              {log}
            </div>
          ))}
        </div>
        
        {status === "error" && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-200">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>Ocurrió un error escribiendo en la base de datos. Verifica que las reglas de seguridad de Firestore permitan escritura durante desarrollo y que el archivo <code>.env.local</code> tenga las llaves correctas de Firebase.</p>
            </div>
        )}
      </div>
    </div>
  );
}
