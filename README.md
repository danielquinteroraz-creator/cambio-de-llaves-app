# Cambio de Llaves — app Android

App Android (Capacitor 7) del sitio [Cambio de Llaves](https://cambio-de-llaves.netlify.app). No duplica el código: `scripts/sync-web.mjs` copia el sitio desde `../cambio-de-llaves` a `www/` y lo prepara para funcionar sin conexión (three.js 0.187.0 y las fuentes Archivo e IBM Plex Mono se sirven localmente en lugar de desde CDN).

## Compilar el APK

Requisitos: Node.js, JDK 21 y Android SDK (plataforma 35).

```powershell
npm install
npm run build:apk
```

El APK de desarrollo queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Licencias de terceros

- three.js — MIT (`www/vendor/three/LICENSE` tras sincronizar).
- Archivo e IBM Plex Mono — SIL Open Font License 1.1 (vía Fontsource).
