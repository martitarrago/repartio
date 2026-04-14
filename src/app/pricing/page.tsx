import Link from "next/link";

const plans = [
  {
    name: "Gratis",
    price: "€0",
    period: "para siempre",
    description: "Para descubrir la plataforma sin compromiso.",
    features: [
      "1 comunidad",
      "1 usuario",
      "Generación de ficheros .txt (RD 244/2019)",
      "Editor de coeficientes β",
      "Firma electrónica de acuerdos",
      "Gestión de documentos",
    ],
    cta: "Empezar gratis",
    ctaHref: "/register",
    ctaStyle: "border border-gray-200 text-gray-900 hover:bg-gray-50",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "€49",
    period: "/ mes",
    description: "Para gestores con varias comunidades activas.",
    features: [
      "Hasta 15 comunidades",
      "3 usuarios",
      "Todo lo del plan Gratis",
      "Chat IA con contexto de tus comunidades",
      "Emails de firma automáticos",
      "Soporte por email",
    ],
    cta: "Contactar",
    ctaHref: "mailto:hola@repartio.es?subject=Plan Pro",
    ctaStyle: "bg-gray-900 text-white hover:opacity-90",
    highlighted: true,
  },
  {
    name: "Empresa",
    price: "€99",
    period: "/ mes",
    description: "Para consultoras y gestores con gran volumen.",
    features: [
      "Comunidades ilimitadas",
      "Usuarios ilimitados",
      "Todo lo del plan Pro",
      "Soporte prioritario",
      "Onboarding personalizado",
      "Facturación anual disponible",
    ],
    cta: "Contactar",
    ctaHref: "mailto:hola@repartio.es?subject=Plan Empresa",
    ctaStyle: "border border-gray-200 text-gray-900 hover:bg-gray-50",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        {/* Beta banner */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EF9F27]/10 border border-[#EF9F27]/30 text-xs font-medium text-[#B8760A] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF9F27] animate-pulse" />
          Estamos en beta — Precios sujetos a cambios
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4 font-heading">
          Simple, transparente, sin sorpresas
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Empieza gratis. Escala cuando lo necesites.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl p-7 flex flex-col ${
                plan.highlighted
                  ? "ring-2 ring-gray-900 shadow-xl"
                  : "border border-gray-200 shadow-sm"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gray-900 text-white text-[10px] font-semibold px-3 py-1 rounded-full tracking-wide uppercase">
                    Más popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-500 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#EF9F27] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={plan.ctaHref}
                className={`w-full text-center py-2.5 rounded-xl text-sm font-medium transition-all ${plan.ctaStyle}`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* FAQ nudge */}
        <p className="text-center text-sm text-gray-400 mt-12">
          ¿Dudas?{" "}
          <a href="mailto:hola@repartio.es" className="text-gray-600 underline hover:text-gray-900">
            Escríbenos
          </a>
          {" · "}
          <Link href="/login" className="text-gray-600 underline hover:text-gray-900">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
