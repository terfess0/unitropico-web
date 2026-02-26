<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Unitrópico Web - Guía de Dockerización

Este proyecto está configurado para ejecutarse en un entorno multiplataforma utilizando Docker. A continuación, se detallan los pasos para poner en marcha el sistema desde cero.

---

## 🚀 Instalación desde Cero (Docker)

### 1. Requisitos Previos
- Tener instalado [Docker Desktop](https://www.docker.com/products/docker-desktop).
- Tener instalado [Git](https://git-scm.com/).

### 2. Configuración de Variables de Entorno
Crea un archivo llamado `.env` en la raíz del proyecto basándote en el archivo de ejemplo:

```powershell
cp .env.example .env
```

Asegúrate de que las credenciales coincidan con las que deseas para tu base de datos MySQL local.

### 3. Levantar el Proyecto
Ejecuta el siguiente comando en tu terminal (PowerShell o CMD en la raíz):

```powershell
docker-compose up -d --build
```

**¿Qué hace esto automáticamente?**
1. **DB**: Crea un contenedor MySQL 8 y configura el charset a `utf8mb4`.
2. **Esquema e Info**: Al encenderse por primera vez, importa los scripts en `mysql-init/`.
3. **Backend**: Instala dependencias de Node.js y expone el puerto 3001.
4. **Frontend**: Compila la aplicación y la sirve a través de Nginx en el puerto 8080.

---

## 📂 Acceso a la Aplicación
Una vez que los contenedores estén corriendo (`Started`), puedes acceder en:
- **Web App**: [http://localhost:8080](http://localhost:8080)
- **Editor**: [http://localhost:8080/#/editor](http://localhost:8080/#/editor)

---

## 🛠️ Comandos de Mantenimiento

### Usar el Script de Migración (JSON a MySQL + Extracción HTML)
Si realizaste cambios en el archivo gigante (`data/project-config.json.bak`) y quieres sincronizar la base de datos MySQL y extraer automáticamente los archivos `.html` físicos:
```powershell
docker-compose exec backend npm run migrate
```
*Este comando leerá el JSON, creará los archivos HTML faltantes en `public/media/html/` y actualizará las tablas en MySQL.*

### 🧹 Empezar desde cero (Limpieza Total)
Si quieres borrar todo para probar el despliegue como si fuera la primera vez:
```powershell
docker-compose down -v --rmi all
docker-compose up -d --build
docker-compose exec backend npm run migrate
```

### 🔄 Reconstruir un solo servicio (Frontend o Backend)
Si hiciste cambios exclusivamente en el código de React/Frontend y no quieres apagar ni reconstruir toda la base de datos o el backend, puedes reconstruir únicamente este contenedor:
```powershell
docker-compose up -d --build frontend
```
*(Puedes hacer lo mismo con el backend usando `backend` en lugar de `frontend`).*

### Ver Logs del Servidor
```powershell
docker-compose logs -f backend
```

---

## 📂 Estructura de Datos
- **Base de Datos**: MySQL 8 (Persistente en volumen `db_data`).
- **Configuración**: El archivo maestro es `data/project-config.json.bak`.
- **Media y Contenidos**:
    - Imágenes: `public/media/img/`
    - HTML extraídos: `public/media/html/` (Generados automáticamente por el script de migración).

---

## 📝 Notas de Arquitectura
- **Persistencia**: La base de datos se guarda en un volumen llamado `db_data`. Si borras los contenedores (sin `-v`), los datos NO se pierden.
- **Media**: La carpeta `public/media` está vinculada (Bind Mount), lo que significa que cualquier imagen o HTML generado se verá reflejado instantáneamente tanto en Windows como en los contenedores.
- **Codificación**: Todo el sistema está forzado a `utf8mb4` para garantizar que las tildes y caracteres especiales se vean correctamente.

---

## 🔎 Escalado Automático de Presentaciones HTML (Zoom)
Si necesitas hacer un "zoom global" a la fuente y a los gráficos de los archivos HTML extraídos para que se vean mejor en pantallas grandes (como proyectores o televisores), el proyecto incluye un script inteligente (`scripts/batch_scale.cjs`).

**Características del script:**
- **Idempotente**: No daña los archivos si se ejecuta múltiples veces accidentalmente (usa una etiqueta de seguridad `<!-- UNITROPICO-SCALED-V1 -->`).
- **Recursivo**: Recorre automáticamente todas las subcarpetas dentro de `public/media/html/`.

### ¿Cómo usarlo? (Recomendado)

La forma más sencilla y moderna de escalar todos los contenidos HTML es **directamente desde la interfaz gráfica** sin tocar la consola:

1. Ingresa a la ruta del Editor en tu navegador (`/#/editor`).
2. Entra a cualquier sección o plan de estudios para abrir la vista del editor.
3. En la barra superior (junto a Guardar Cambios), haz clic en el botón amarillo **"Escalar (Batch)"**.
4. ¡Listo! El botón se deshabilitará unos segundos mientras el servidor hace el trabajo pesado en segundo plano y te mostrará una alerta de éxito cuando termine.

> [!TIP]
> **Configuración avanzada:** Si en el futuro necesitas cambiar *qué tanto* crecen las letras, puedes abrir el archivo `scripts/batch_scale.cjs` y modificar los valores numéricos dentro del objeto estructurado `CONFIG` (por ejemplo: `fontScale: 1.4`). 

*(El uso manual vía comandos de `docker exec` sigue siendo posible internamente para depuración técnica, pero ya no es necesario para el flujo de trabajo normal del administrador).*

