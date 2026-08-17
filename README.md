# Emprende

Aplicación de escritorio para apoyar la creación y gestión documental del expediente del **Instituto Emprende**.

## Estado actual

Primera versión funcional con arquitectura local:

- Electron + React + TypeScript.
- Base de datos local SQLite mediante `better-sqlite3`.
- Catálogo inicial de 39 documentos.
- Datos institucionales reutilizables.
- Editor documental por secciones.
- Generación de archivos Word `.docx`.
- Gestión del expediente separada del generador.
- Estados, progreso, versiones y anexos.
- Apertura de archivos y carpeta de trabajo desde la app.
- Respaldos locales del expediente.
- Estructura preparada para integrar IA y sincronización en nube en fases posteriores.

## Ejecutar en desarrollo

Requisitos: Node.js y npm instalados.

```powershell
npm install
npm start
```

`npm start` levanta Vite y abre la aplicación Electron.

## Almacenamiento

La aplicación no guarda los documentos dentro del repositorio. En Windows crea automáticamente un espacio de trabajo dentro de la carpeta **Documentos** del usuario:

```text
Documentos/Emprende/
├── data/
│   └── emprende.db
├── borradores/
├── expediente/
└── backups/
```

Esto permite actualizar el código sin mezclarlo con el expediente real.

## Flujo

### Crear documentos

1. Seleccionar un documento del catálogo.
2. Trabajar su contenido por secciones.
3. Guardar automáticamente el borrador en SQLite al salir de cada sección.
4. Generar una nueva versión Word.
5. Abrir el Word para revisión humana.

### Expediente y progreso

1. Cambiar el estado real de cada documento.
2. Adjuntar Word, PDF, Excel, imágenes y demás evidencias.
3. Revisar porcentaje de avance.
4. Mantener versiones y archivos separados por documento.

## Seguridad de Electron

La ventana usa `contextIsolation: true` y `nodeIntegration: false`. Las operaciones locales se exponen mediante un `preload` limitado e IPC.

## Próximas fases

- Conexión del proveedor de IA para el flujo híbrido de redacción.
- Validaciones normativas y de coherencia entre documentos.
- Matrices y reportes más detallados.
- Exportación completa del expediente.
- Sincronización opcional con Supabase o Firebase.

## Importante

Los documentos generados son borradores de trabajo y requieren revisión humana, académica, técnica y normativa antes de su presentación oficial.
