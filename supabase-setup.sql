-- Supabase Realtime setup
-- Ejecutar en el SQL Editor de Supabase: https://app.supabase.com/project/cuizzfdfdoshltgwtykc/editor

-- Habilitar Realtime para la tabla de participantes (necesario para SignaturesTab)
ALTER PUBLICATION supabase_realtime ADD TABLE participantes;

-- Opcional: habilitar también documentos si quieres Realtime en DocumentsTab
-- ALTER PUBLICATION supabase_realtime ADD TABLE documentos;

-- Verificar que está habilitado:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
