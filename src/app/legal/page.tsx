import { PublicHeader } from "@/components/PublicHeader";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
    <div className="max-w-3xl mx-auto px-6 py-16 text-sm text-gray-700 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Aviso Legal y Términos de Uso</h1>
        <p className="text-gray-500 text-xs">Última actualización: abril 2025</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">1. Información del titular</h2>
        <p className="text-gray-600">
          Repartio es una plataforma de software como servicio (SaaS) para la gestión de
          comunidades de autoconsumo colectivo en España, conforme al Real Decreto 244/2019.
          Contacto: <a href="mailto:hola@repartio.es" className="text-gray-900 underline">hola@repartio.es</a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">2. Objeto del servicio</h2>
        <p className="text-gray-600">
          Repartio proporciona herramientas para gestionar comunidades de autoconsumo colectivo,
          incluyendo: gestión de participantes, cálculo de coeficientes β, generación de ficheros
          .txt conforme al Anexo I del RD 244/2019, y gestión de firmas electrónicas de acuerdos de reparto.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">3. Responsabilidad</h2>
        <p className="text-gray-600">
          Repartio facilita la generación de ficheros de coeficientes según la normativa vigente,
          pero la responsabilidad de verificar la corrección de los datos introducidos (CUPS, CAU,
          coeficientes) corresponde al usuario. La plataforma no sustituye el asesoramiento legal o
          técnico especializado.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">4. Propiedad intelectual</h2>
        <p className="text-gray-600">
          Todos los elementos de la plataforma (diseño, código, marca) son propiedad de Repartio.
          Queda prohibida su reproducción o uso sin autorización expresa.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">5. Legislación aplicable</h2>
        <p className="text-gray-600">
          Los presentes términos se rigen por la legislación española. Para cualquier controversia,
          las partes se someten a los juzgados y tribunales competentes según la normativa aplicable.
        </p>
      </section>
    </div>
    </div>
  );
}
