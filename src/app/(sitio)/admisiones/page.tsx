"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function AdmisionesPage() {
  const [enviado, setEnviado] = useState(false);
  const [formulario, setFormulario] = useState({
    nombreAlumno: "",
    apellidoAlumno: "",
    nivel: "inicial",
    anioIngreso: "2026",
    nombreTutor: "",
    telefono: "",
    email: "",
    mensaje: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnviado(true);
  };

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Cabecera */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
            Ciclo Lectivo 2026
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-950 tracking-tight">
            Admisiones e Inscripciones
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Te damos la bienvenida al Instituto Niño Jesús I-9 de Paso de los Libres. Conocé las etapas del proceso de postulación y solicitá una entrevista.
          </p>
        </div>

        {/* Pasos de Admisión */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              num: "01",
              titulo: "Solicitud Inicial",
              desc: "Completá el formulario online o acercate a la secretaría del colegio.",
            },
            {
              num: "02",
              titulo: "Entrevista Familiar",
              desc: "Nos reunimos con el equipo de orientación para dialogar sobre el proyecto educativo.",
            },
            {
              num: "03",
              titulo: "Documentación",
              desc: "Entrega de libreta de calificaciones, partida de nacimiento y certificado de salud.",
            },
            {
              num: "04",
              titulo: "Matriculación",
              desc: "Confirmación formal de la vacante y bienvenida a la familia del Instituto.",
            },
          ].map((paso) => (
            <div key={paso.num} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
              <span className="text-3xl font-black text-amber-400 block mb-2">{paso.num}</span>
              <h3 className="font-bold text-blue-950 text-base mb-1">{paso.titulo}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{paso.desc}</p>
            </div>
          ))}
        </div>

        {/* Formulario y Requisitos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Formulario de preinscripción */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-blue-950 mb-2">Formulario de Preinscripción</h2>
            <p className="text-xs text-slate-600 mb-6">
              Completá los datos y el equipo de admisiones del Instituto Niño Jesús se pondrá en contacto a la brevedad.
            </p>

            {enviado ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-3">
                <span className="text-4xl">🎉</span>
                <h3 className="text-lg font-bold text-emerald-900">¡Solicitud recibida con éxito!</h3>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Gracias por tu interés en el Instituto Niño Jesús I-9. Hemos registrado tus datos y nos comunicaremos con vos al teléfono proporcionado para coordinar una reunión.
                </p>
                <button
                  type="button"
                  onClick={() => setEnviado(false)}
                  className="mt-2 text-xs font-bold text-emerald-900 underline"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Alumno/a</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Martín"
                      value={formulario.nombreAlumno}
                      onChange={(e) => setFormulario({ ...formulario, nombreAlumno: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Apellido del Alumno/a</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. González"
                      value={formulario.apellidoAlumno}
                      onChange={(e) => setFormulario({ ...formulario, apellidoAlumno: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nivel al que postula</label>
                    <select
                      value={formulario.nivel}
                      onChange={(e) => setFormulario({ ...formulario, nivel: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-hidden"
                    >
                      <option value="inicial">Nivel Inicial (Jardín)</option>
                      <option value="primario">Nivel Primario (1° a 6° Grado)</option>
                      <option value="secundario">Nivel Secundario (1° a 6° Año)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ciclo Lectivo</label>
                    <input
                      type="text"
                      readOnly
                      value="2026"
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Padre / Madre / Tutor</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. María Pérez"
                      value={formulario.nombreTutor}
                      onChange={(e) => setFormulario({ ...formulario, nombreTutor: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp de Contacto</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 3772 123456"
                      value={formulario.telefono}
                      onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="tucorreo@ejemplo.com"
                    value={formulario.email}
                    onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Consultas o comentarios (Opcional)</label>
                  <textarea
                    rows={3}
                    placeholder="Indicanos dudas específicas sobre turno, idioma, o información del estudiante..."
                    value={formulario.mensaje}
                    onChange={(e) => setFormulario({ ...formulario, mensaje: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-900 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition-colors"
                >
                  Enviar Solicitud de Vacante
                </button>
              </form>
            )}
          </div>

          {/* Requisitos y atención */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-blue-950 text-white p-6 sm:p-8 space-y-4">
              <h3 className="text-xl font-bold text-amber-300">Documentación Básica</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Al momento de la entrevista se solicitará presentar:
              </p>
              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Fotocopia de DNI del alumno y tutores.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Partida de nacimiento actualizada.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Certificado de alumno regular o pase escolar.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Informe de calificaciones del ciclo actual.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Certificado de esquema de vacunación y apto físico.
                </li>
              </ul>
            </div>

            <div className="rounded-3xl bg-amber-50 border border-amber-200 p-6 space-y-3">
              <h3 className="text-base font-bold text-amber-950">Atención Personalizada</h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                Podés acercarte personalmente a la secretaría del Instituto Niño Jesús en Paso de los Libres, de lunes a viernes en el horario de 7:30 a 18:30 hs.
              </p>
              <div className="pt-2 text-xs font-semibold text-blue-900">
                <p>📍 {siteConfig.contacto.direccion}</p>
                <p>📞 {siteConfig.contacto.telefono}</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
