# CUBE Browser 🌐

**Enterprise Browser for Business Automation**

CUBE Browser es un navegador empresarial de alto rendimiento construido con Tauri 2.9 y Chromium Embedded Framework (CEF), diseñado para automatización empresarial, productividad y seguridad.

## ✨ Características

### 🚀 Motor de Navegación
- **CEF (Chromium Embedded Framework)** - Motor Chromium completo para máxima compatibilidad
- **Soporte DRM** - Netflix, YouTube, Spotify y más sin limitaciones
- **Sin restricciones CORS** - Acceso completo a cualquier sitio web
- **Proxy integrado** - Fallback inteligente cuando CEF no está disponible

### 🔒 Seguridad Empresarial
- **VPN integrada** - Conexión segura sin extensiones
- **Gestor de contraseñas** - Almacenamiento cifrado local
- **Security Lab** - Análisis de vulnerabilidades en tiempo real
- **Navegación privada** - Modo incógnito mejorado

### ⚡ Productividad
- **Spaces** - Organiza pestañas por proyectos/contextos
- **Split View** - Vista dividida para multitarea
- **Command Palette** - Acceso rápido a todas las funciones
- **Keyboard shortcuts** - Atajos personalizables

### 🤖 AI Integrada
- **CUBE AI Assistant** - Chat inteligente integrado
- **Smart Fill** - Autocompletado con IA
- **Web Scraping** - Extracción de datos automatizada
- **Automation Studio** - Creación de flujos de trabajo

### 📧 Comunicaciones
- **CUBE Mail** - Cliente de correo integrado
- **VoIP** - Llamadas de voz
- **Video conferencia** - Reuniones P2P
- **Chat** - Mensajería instantánea

### 💼 Herramientas Empresariales
- **CRM integrado** - Gestión de clientes
- **Automatización** - Workflows visuales
- **Terminal SSH** - Acceso a servidores
- **FTP/SFTP** - Transferencia de archivos

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Next.js 14
- **Backend**: Rust + Tauri 2.9
- **Motor**: CEF 143.7 (Chromium Embedded Framework)
- **UI**: Tailwind CSS + Radix UI + Lucide Icons
- **State**: Zustand + React Query

## 📦 Instalación

### Descargar

| Plataforma | Descarga |
|-----------|----------|
| macOS (Apple Silicon) | [CUBE-Browser-1.0.0-arm64.dmg](https://github.com/cube-collective/cube-browser/releases) |
| macOS (Intel) | [CUBE-Browser-1.0.0-x64.dmg](https://github.com/cube-collective/cube-browser/releases) |
| Windows | [CUBE-Browser-1.0.0-x64.exe](https://github.com/cube-collective/cube-browser/releases) |
| Linux | [CUBE-Browser-1.0.0-x64.AppImage](https://github.com/cube-collective/cube-browser/releases) |

### Desde código fuente

```bash
# Clonar repositorio
git clone https://github.com/cube-collective/cube-browser.git
cd cube-browser

# Instalar dependencias
npm install

# Desarrollo
npm run dev:tauri

# Build producción
npm run build:tauri:release
```

## 📋 Requisitos

### macOS
- macOS 11.0 (Big Sur) o superior
- Apple Silicon (M1/M2/M3) o Intel x64
- 4GB RAM mínimo, 8GB recomendado

### Windows
- Windows 10 versión 1803 o superior
- 64-bit
- 4GB RAM mínimo

### Linux
- Ubuntu 20.04+ / Fedora 36+ / Debian 11+
- X11 o Wayland
- 4GB RAM mínimo

## 🔧 Desarrollo

### Estructura del proyecto

```
cube-browser/
├── app/                    # Páginas Next.js
├── components/             # Componentes React
│   ├── browser/           # Componentes del navegador
│   ├── ui/                # Componentes UI base
│   └── ...                # Otros módulos
├── lib/                    # Servicios y utilidades
│   ├── services/          # Servicios de negocio
│   └── tauri/             # Integración Tauri
├── src-tauri/             # Código Rust
│   ├── src/
│   │   ├── commands/      # Comandos Tauri
│   │   ├── services/      # Servicios Rust
│   │   └── cef/           # Integración CEF
│   └── Cargo.toml
└── public/                # Assets estáticos
```

### Comandos útiles

```bash
# Desarrollo con hot-reload
npm run dev:tauri

# Build para macOS
npm run build:dmg

# Build para Windows
npm run build:exe

# Build para Linux
npm run build:linux

# Tests
npm test
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea tu feature branch (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la branch (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🏢 CUBE Collective LLC

Desarrollado con ❤️ por [CUBE Collective](https://cubeai.tools)

---

**CUBE Browser** - El navegador que tu empresa necesita.
