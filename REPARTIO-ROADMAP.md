# Repartio — Roadmap completo al MVP

## Estado actual
- ✅ Proyecto generado y compilando
- ✅ Deploy en Vercel funcionando
- ✅ Demo login (demo@repartio.es / demo1234)
- ⏳ Sin base de datos real
- ⏳ Sin auth real
- ⏳ Datos mock hardcodeados

---

## FASE 0 — Que arranque ✅ COMPLETADA

- [x] npm install + npm run dev sin errores
- [x] Git push a github.com/martitarrago/repartio
- [x] Deploy en Vercel
- [x] Demo login funcional

---

## FASE 1 — Base de datos real (1 día)

- [ ] Crear cuenta en neon.tech (gratis)
- [ ] Configurar DATABASE_URL en .env.local y Vercel
- [ ] Ejecutar npm run db:push
- [ ] Crear src/lib/prisma.ts

**Prompt:**
> Configura Prisma para conectar a la base de datos. Crea src/lib/prisma.ts con el singleton del cliente. Ejecuta npm run db:push. Confirma que las tablas se crean correctamente.

---

## FASE 2 — Auth real (1-2 días)

- [ ] NextAuth.js v5 con credenciales (email + password + bcrypt)
- [ ] Página de registro
- [ ] Middleware protección de rutas
- [ ] Eliminar demo login

**Prompt:**
> Implementa auth real con NextAuth.js v5. Usa el provider de credenciales con email y password. Hashea passwords con bcrypt. Crea la página de registro. Protege todas las rutas bajo (dashboard) con middleware. Muestra el nombre del usuario logueado en el Header. Elimina el demo login hardcodeado.

---

## FASE 3 — CRUD conectado a DB (2-3 días)

- [ ] CRUD instalaciones
- [ ] CRUD participantes (con validación CUPS)
- [ ] CRUD coeficientes (guardar, cargar, versionar)
- [ ] Dashboard lee de DB
- [ ] Eliminar todos los datos mock

**Prompt:**
> Conecta todo a la base de datos real. Crea Server Actions o API routes para CRUD de instalaciones, participantes y coeficientes. El dashboard debe leer instalaciones del usuario logueado desde PostgreSQL. El formulario de nueva instalación debe guardar en DB. La tab de participantes debe leer y escribir en DB. El editor de coeficientes debe guardar y cargar desde DB. Elimina todos los datos mock. Todo end-to-end con el usuario autenticado.

---

## FASE 4 — Generación .txt con datos reales (1 día)

- [ ] Botón "Generar .txt" lee de DB
- [ ] Validación completa antes de generar
- [ ] Preview del contenido
- [ ] Descarga con nombre CAU_AÑO.txt
- [ ] Guardar en FileHistory

**Prompt:**
> Conecta el generador de .txt a datos reales. Cuando el usuario pulsa "Generar fichero", lee los participantes y coeficientes de la DB, valida todo, muestra preview, y permite descargar. Guarda cada generación en la tabla FileHistory con hash SHA-256 del contenido.

---

## FASE 5 — Historial de versiones (1 día)

- [ ] Tab Historial con todas las versiones
- [ ] Descargar .txt de cualquier versión
- [ ] Restaurar versión anterior
- [ ] Tab Descargas con ficheros generados

**Prompt:**
> Implementa el historial de versiones completo. La tab Historial debe mostrar todas las versiones de coeficientes ordenadas por fecha. Cada versión debe poder verse en detalle, descargarse como .txt, o restaurarse como versión activa. La tab Descargas debe listar todos los ficheros generados con fecha, hash y botón de descarga.

---

## FASE 6A — Extras de usabilidad (2 días)

- [ ] Importar participantes desde Excel/CSV
- [ ] Duplicar instalación para nuevo año
- [ ] PDF resumen para junta de propietarios
- [ ] Empty states y toasts
- [ ] Responsive para tablet

**Prompt:**
> Añade estas funcionalidades: 1) Botón para importar participantes desde un archivo CSV o Excel (.xlsx) con columnas CUPS y nombre, 2) Botón "Duplicar para año siguiente" que copie instalación con participantes y coeficientes, 3) Generar PDF resumen del acuerdo de reparto con tabla de participantes y coeficientes para presentar en junta, 4) Asegurar que cada usuario solo ve sus propias instalaciones.

---

## FASE 6B — Importación inteligente de PDFs con IA (2-3 días)
**Subir un contrato → extraer datos automáticamente**

### Flujo:
1. Gestor pulsa "Importar desde PDF"
2. Sube un PDF (contrato, acta, acuerdo de reparto)
3. La app extrae el texto del PDF
4. IA analiza y extrae: CAU, año, CUPS, nombres, coeficientes
5. Muestra datos en formulario editable de revisión
6. Gestor confirma y guarda

### Documentos soportados:
- Acuerdos de reparto de autoconsumo
- Actas de juntas con coeficientes aprobados
- Contratos con instaladora o ESE
- Certificados con CAU
- Listados de vecinos con CUPS

### Coste: ~0,01-0,05€ por PDF

**Prompt:**
> Implementa la funcionalidad de importar datos desde PDF. Crea: 1) Un componente UploadPDF.tsx con drag and drop que acepte archivos .pdf, 2) Una API route POST /api/extract-pdf que reciba el PDF, extraiga el texto con pdf-parse, envíe el texto a la API de Anthropic (modelo claude-sonnet-4-20250514) con un prompt de extracción de datos de autoconsumo colectivo (CAU, CUPS, nombres, coeficientes), y devuelva JSON estructurado, 3) Una pantalla de revisión que muestre los datos extraídos en una tabla editable donde el gestor puede corregir antes de guardar, 4) Botón "Confirmar y crear instalación" que guarde todo en la DB. Usa la variable de entorno ANTHROPIC_API_KEY. Maneja errores cuando el PDF no tenga texto o los datos no se encuentren.

---

## FASE 6C — Optimización de coeficientes con datos reales de Datadis (3-4 días)
**La función que ningún competidor tiene: reparto óptimo basado en consumo real**

### El problema que resuelve:
Los administradores reparten coeficientes "a ojo" — por cuota de participación o a partes iguales. Esto hace que unos vecinos aprovechen la energía solar y otros la desperdicien. La diferencia entre un reparto malo y uno bueno puede ser un 30-60% más de ahorro.

### Flujo:
1. El gestor tiene los CUPS cargados en la instalación
2. Pulsa "Optimizar coeficientes"
3. La app conecta con datadis.es (API pública) y descarga las curvas de consumo horarias del último año de cada CUPS
4. Un algoritmo calcula los coeficientes que maximizan el autoconsumo colectivo — asigna más producción solar a quien consume más en horas de sol
5. Muestra simulación comparativa:
   - "Reparto igual: ahorro comunidad 4.200€/año"
   - "Reparto optimizado: ahorro comunidad 6.800€/año"
   - "Mejora: +62%"
6. Detalle por vecino: "Piso 3ºA: de 180€ a 310€/año"
7. El gestor acepta y los coeficientes se aplican

### Tareas técnicas:
- [ ] Integración con API de datadis.es (requiere autorización NIF del titular)
- [ ] Descarga de curvas horarias de consumo (últimos 12 meses)
- [ ] Algoritmo de optimización: maximizar ratio autoconsumo/producción por hora
- [ ] Para modo constante: promedio ponderado por horas solares
- [ ] Para modo variable: coeficiente óptimo hora a hora
- [ ] Simulación económica: precio pool + peaje + impuestos vs autoconsumo
- [ ] Dashboard de resultados: gráficos comparativos, ahorro por participante
- [ ] Exportar informe de optimización en PDF (para presentar en junta)

### Datos de datadis.es:
- API REST pública: https://datadis.es/nikola-api
- Requiere: NIF del titular autorizado + CUPS
- Devuelve: consumo horario en kWh por punto de suministro
- Gratuito, sin límite práctico para uso razonable

### Valor de negocio:
- Da al administrador un argumento de venta: "No solo gestiono el papeleo, optimizo tu ahorro"
- Diferenciación total del competidor (nadie hace esto fácil en España)
- Puede justificar un plan de pago premium

**Prompt:**
> Implementa la optimización de coeficientes con datos reales de consumo. Crea: 1) Un servicio src/lib/datadis/client.ts que conecte con la API de datadis.es (https://datadis.es/nikola-api), se autentique con NIF y descargue las curvas de consumo horarias de los últimos 12 meses para cada CUPS de la instalación, 2) Un algoritmo src/lib/optimization/optimizer.ts que reciba las curvas de consumo de todos los participantes y calcule los coeficientes β óptimos que maximicen el autoconsumo colectivo — para modo constante calcula el promedio ponderado por horas solares, para modo variable calcula coeficiente óptimo hora a hora, 3) Una simulación económica que compare ahorro con reparto actual vs reparto optimizado usando precios de mercado, 4) Una pantalla de resultados con gráficos (recharts): barras comparativas de ahorro por participante, línea temporal de producción vs consumo, porcentaje de mejora, 5) Botón "Aplicar coeficientes optimizados" que actualice los coeficientes en la DB. Usa variables de entorno DATADIS_NIF y DATADIS_PASSWORD.

---

## FASE 6D — Asistente IA contextual (2 días)
**No un chatbot genérico — un experto en autoconsumo que conoce TU instalación**

### Qué lo hace diferente de un chat IA normal:
El asistente tiene acceso a los datos de la instalación del gestor. No responde en abstracto — responde con contexto. Si pregunta "¿están bien mis coeficientes?", la IA mira los coeficientes reales, los CUPS, la curva de consumo si la tiene, y da una respuesta concreta.

### Ejemplos de preguntas que responde:
- "¿Puedo añadir un participante que está a 400 metros de la instalación?" → Consulta la normativa y responde con el límite de distancia según RD 244/2019
- "¿Mis coeficientes están bien repartidos?" → Analiza los datos reales y sugiere mejoras
- "¿Qué pasa si un vecino se da de baja?" → Explica el procedimiento y recalcula
- "¿Cuánto ahorraría cada vecino si cambio a coeficientes horarios?" → Simula con datos
- "¿Qué documentación necesito para registrar esta instalación?" → Lista según comunidad autónoma
- "Traduce este acuerdo a lenguaje para la junta de vecinos" → Genera texto comprensible

### Implementación:
- Widget de chat flotante en la esquina inferior derecha
- Disponible en todas las páginas
- Context window incluye: datos de la instalación actual, participantes, coeficientes, normativa
- Historial de conversación por sesión
- Usa API de Anthropic (Claude)

### Coste: ~0,02-0,10€ por conversación

**Prompt:**
> Implementa un asistente IA contextual. Crea: 1) Un componente ChatWidget.tsx — botón flotante en esquina inferior derecha que abre un panel de chat, 2) Una API route POST /api/chat que reciba el mensaje del usuario más el contexto de la instalación actual (CAU, participantes, coeficientes, modo), construya un system prompt que incluya: la normativa relevante del RD 244/2019, los datos concretos de la instalación del usuario, y el rol de "experto en autoconsumo colectivo en España", y envíe todo a la API de Anthropic (claude-sonnet-4-20250514) con streaming, 3) Respuestas en streaming para que se vean en tiempo real, 4) Historial de mensajes en la sesión (no persistido en DB por ahora), 5) Sugerencias predefinidas al abrir el chat: "¿Están bien mis coeficientes?", "¿Qué normativa aplica?", "¿Cómo añado un participante?". Usa ANTHROPIC_API_KEY. El chat debe estar disponible en todas las páginas bajo (dashboard).

---

## FASE 7 — Pulido pre-lanzamiento (1-2 días)

- [ ] Dominio propio (repartio.es)
- [ ] Términos de uso y política de privacidad (RGPD)
- [ ] Recuperación de contraseña por email
- [ ] Email de bienvenida
- [ ] Favicon e iconos
- [ ] Test manual end-to-end
- [ ] Probar con 2-3 gestores reales

---

## Resumen

| Fase | Tiempo | Resultado |
|------|--------|-----------|
| Fase 0 — Arranque | ✅ Hecho | Demo online |
| Fase 1 — Base de datos | 1 día | Datos persisten |
| Fase 2 — Auth real | 1-2 días | Login real |
| Fase 3 — CRUD | 2-3 días | App funcional |
| Fase 4 — .txt real | 1 día | Flujo completo |
| Fase 5 — Historial | 1 día | Versiones |
| Fase 6A — Extras | 2 días | Usabilidad |
| Fase 6B — PDF con IA | 2-3 días | Importación inteligente |
| Fase 6C — Datadis | 3-4 días | Optimización con datos reales |
| Fase 6D — Chat IA | 2 días | Asistente contextual |
| Fase 7 — Pulido | 1-2 días | Listo para usuarios |
| **TOTAL** | **~17-22 días** | **MVP completo** |

---

## Orden de prioridad si hay que recortar

**Imprescindible (sin esto no es MVP):**
Fases 0-4 → app funcional end-to-end

**Importante (gestores lo esperan):**
Fases 5 + 6A → historial + usabilidad

**Diferenciador (ventaja competitiva):**
Fase 6C (Datadis) → esto es lo que vende

**Nice to have (mejora la experiencia):**
Fases 6B (PDF) + 6D (Chat IA) → ahorra tiempo
