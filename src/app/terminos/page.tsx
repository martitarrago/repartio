import { PublicHeader } from "@/components/PublicHeader";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
    <div className="max-w-3xl mx-auto px-6 py-16 text-sm text-gray-700 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Términos y Condiciones de Uso</h1>
        <p className="text-gray-500 text-xs">Última actualización: abril 2025</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">1. Aceptación de los términos</h2>
        <p className="text-gray-600">
          El acceso y uso de Repartio implica la aceptación plena de los presentes términos y condiciones.
          Si no está de acuerdo, le rogamos que no utilice el servicio.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">2. Descripción del servicio</h2>
        <p className="text-gray-600">
          Repartio es una plataforma SaaS para la gestión de comunidades de autoconsumo colectivo en España.
          Permite generar ficheros de coeficientes de reparto conformes al Real Decreto 244/2019, gestionar
          participantes y tramitar firmas electrónicas de acuerdos de reparto.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">3. Registro y cuenta de usuario</h2>
        <p className="text-gray-600">
          Para usar el servicio debe crear una cuenta con datos verídicos. Es responsable de mantener
          la confidencialidad de sus credenciales y de toda la actividad realizada desde su cuenta.
          Repartio no se hace responsable por el acceso no autorizado derivado de negligencia del usuario.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">4. Uso aceptable</h2>
        <p className="text-gray-600">Queda prohibido:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Introducir datos falsos o que no correspondan a instalaciones reales</li>
          <li>Intentar acceder a cuentas o datos de otros usuarios</li>
          <li>Usar el servicio para fines distintos a la gestión de autoconsumo colectivo</li>
          <li>Realizar ingeniería inversa o intentar extraer el código fuente</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">5. Planes y facturación</h2>
        <p className="text-gray-600">
          Repartio ofrece un plan gratuito y planes de pago. Los precios y condiciones de cada plan
          están disponibles en la <a href="/pricing" className="text-gray-900 underline">página de precios</a>.
          El plan gratuito puede tener limitaciones de funcionalidades o número de comunidades.
          Los planes de pago se renuevan automáticamente salvo cancelación previa.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">6. Responsabilidad</h2>
        <p className="text-gray-600">
          Repartio no garantiza que los ficheros generados sean validados automáticamente por todas las
          distribuidoras. La responsabilidad de verificar la conformidad con los requisitos específicos
          de cada distribuidora recae en el usuario. En ningún caso Repartio será responsable de
          pérdidas económicas derivadas del uso del servicio.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">7. Modificación y cancelación</h2>
        <p className="text-gray-600">
          Repartio se reserva el derecho de modificar el servicio o estos términos con previo aviso.
          El usuario puede cancelar su cuenta en cualquier momento desde la configuración de su perfil.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">8. Legislación aplicable</h2>
        <p className="text-gray-600">
          Estos términos se rigen por la legislación española. Cualquier controversia se someterá
          a los tribunales competentes según la normativa aplicable.
        </p>
      </section>
    </div>
    </div>
  );
}
