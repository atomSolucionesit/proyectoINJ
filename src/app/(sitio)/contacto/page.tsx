"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";

export default function ContactoPage() {
  const [enviado, setEnviado] = useState(false);
  const [datos, setDatos] = useState({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "consulta_general",
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-900">
            Canales de Comunicación
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-950 tracking-tight">
            Contacto con la Institución
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Estamos a tu disposición para responder dudas, coordinar entrevistas y brindar asesoramiento sobre nuestra propuesta educativa en Paso de los Libres.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Canales de contacto directos */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-blue-950 text-white p-8 space-y-6">
              <h2 className="text-2xl font-bold text-amber-300">Instituto Niño Jesús I-9</h2>
              
              <div className="space-y-4 text-sm text-slate-200">
                <div className="flex items-start gap-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <strong className="block text-white">Dirección</strong>
                    <p className="text-xs text-slate-300">{siteConfig.contacto.direccion}</p>
                    <p className="text-xs text-slate-400">Paso de los Libres, Corrientes, Argentina</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">📞</span>
                  <div>
                    <strong className="block text-white">Teléfono de Secretaría</strong>
                    <p className="text-xs text-slate-300">{siteConfig.contacto.telefono}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">💬</span>
                  <div>
                    <strong className="block text-white">WhatsApp Institucional</strong>
                    <p className="text-xs text-slate-300">{siteConfig.contacto.whatsapp}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">✉️</span>
                  <div>
                    <strong className="block text-white">Correo Electrónico</strong>
                    <p className="text-xs text-slate-300">{siteConfig.contacto.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">🕒</span>
                  <div>
                    <strong className="block text-white">Horario de Atención</strong>
                    <p className="text-xs text-slate-300">{siteConfig.contacto.horario}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <span className="text-xs font-semibold text-amber-400">
                  Diócesis de Santo Tomé • Gestión Privada
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs">
              <h3 className="font-bold text-blue-950 text-base mb-2">¿Querés una entrevista presencial?</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Podés solicitar una cita para recorrer el edificio escolar, conocer las aulas del nivel correspondiente y dialogar con los directores de estudio.
              </p>
              <a
                href={`tel:${siteConfig.contacto.telefono}`}
                className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-amber-400 text-blue-950 font-bold text-xs hover:bg-amber-300 transition-colors"
              >
                Llamar a Secretaría: {siteConfig.contacto.telefono}
              </a>
            </div>
          </div>

          {/* Formulario de Mensaje */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-blue-950 mb-2">Envianos tu consulta</h2>
            <p className="text-xs text-slate-600 mb-6">
              Completá el formulario a continuación y te responderemos a la brevedad.
            </p>

            {enviado ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center space-y-3">
                <span className="text-4xl">✉️</span>
                <h3 className="text-lg font-bold text-emerald-900">¡Mensaje enviado con éxito!</h3>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Muchas gracias por comunicarte con el Instituto Niño Jesús. Te estaremos respondiendo al correo electrónico especificado dentro de las próximas 24 horas hábiles.
                </p>
                <button
                  type="button"
                  onClick={() => setEnviado(false)}
                  className="mt-2 text-xs font-bold text-emerald-900 underline"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre y Apellido</label>
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre completo"
                    value={datos.nombre}
                    onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      placeholder="tucorreo@ejemplo.com"
                      value={datos.email}
                      onChange={(e) => setDatos({ ...datos, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 3772 123456"
                      value={datos.telefono}
                      onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Área o Asunto</label>
                  <select
                    value={datos.asunto}
                    onChange={(e) => setDatos({ ...datos, asunto: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-hidden"
                  >
                    <option value="consulta_general">Consulta General</option>
                    <option value="admisiones">Admisiones e Inscripciones</option>
                    <option value="nivel_inicial">Nivel Inicial</option>
                    <option value="nivel_primario">Nivel Primario</option>
                    <option value="nivel_secundario">Nivel Secundario</option>
                    <option value="administracion">Administración y Aranceles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mensaje</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Escribí aquí tu mensaje o consulta..."
                    value={datos.mensaje}
                    onChange={(e) => setDatos({ ...datos, mensaje: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-900 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition-colors"
                >
                  Enviar Mensaje a Secretaría
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
