import { PublicHeader } from "@/components/PublicHeader";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader showBack />
    <div className="max-w-3xl mx-auto px-6 py-16 text-sm text-gray-700 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-gray-500 text-xs">Última actualización: abril 2025</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">1. Responsable del tratamiento</h2>
        <p>
          El responsable del tratamiento de sus datos personales es <strong>Repartio</strong>,
          plataforma de gestión de autoconsumo colectivo en España. Puede contactarnos en:{" "}
          <a href="mailto:hola@repartio.es" className="text-gray-900 underline">hola@repartio.es</a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">2. Datos que recogemos</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Datos de cuenta: nombre, email, contraseña (cifrada con bcrypt)</li>
          <li>Datos de comunidades: nombre, dirección, CAU, CUPS de participantes</li>
          <li>Metadatos de uso: fecha de último acceso, actividad en la plataforma</li>
          <li>Si usa Google Sign-In: nombre y email proporcionados por Google</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">3. Finalidad del tratamiento</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Prestación del servicio de gestión de coeficientes de reparto (RD 244/2019)</li>
          <li>Generación de ficheros .txt para distribuidoras eléctricas</li>
          <li>Gestión de firmas electrónicas de acuerdos de reparto</li>
          <li>Comunicaciones relacionadas con el servicio</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">4. Base legal</h2>
        <p className="text-gray-600">
          El tratamiento se basa en la ejecución del contrato de servicio (art. 6.1.b RGPD)
          y el interés legítimo para la mejora del servicio (art. 6.1.f RGPD).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">5. Conservación de datos</h2>
        <p className="text-gray-600">
          Los datos se conservan mientras la cuenta esté activa. Al darse de baja,
          los datos se eliminan en un plazo máximo de 30 días, salvo obligación legal de conservación.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">6. Sus derechos</h2>
        <p className="text-gray-600">
          Puede ejercer sus derechos de acceso, rectificación, supresión, portabilidad,
          limitación y oposición escribiendo a{" "}
          <a href="mailto:hola@repartio.es" className="text-gray-900 underline">hola@repartio.es</a>.
          También puede presentar una reclamación ante la AEPD (aepd.es).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">7. Transferencias internacionales</h2>
        <p className="text-gray-600">
          Los datos se almacenan en servidores de Supabase (UE, región eu-west-1) y
          Vercel (con adecuadas garantías según el RGPD).
        </p>
      </section>
    </div>
    </div>
  );
}
