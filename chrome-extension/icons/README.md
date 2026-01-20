# Iconos Placeholder

Los iconos SVG/PNG serán generados automáticamente.

Por ahora, usa iconos placeholder o crea iconos personalizados con:

## Opción 1: Generar con ImageMagick (Mac)

```bash
# Instalar ImageMagick
brew install imagemagick

# Generar iconos desde SVG o crear simples
convert -size 16x16 -background "#1976d2" -fill white -gravity center \
  -font Arial-Bold -pointsize 10 label:"LP" icons/icon16.png

convert -size 32x32 -background "#1976d2" -fill white -gravity center \
  -font Arial-Bold -pointsize 20 label:"LP" icons/icon32.png

convert -size 48x48 -background "#1976d2" -fill white -gravity center \
  -font Arial-Bold -pointsize 30 label:"LP" icons/icon48.png

convert -size 128x128 -background "#1976d2" -fill white -gravity center \
  -font Arial-Bold -pointsize 80 label:"LP" icons/icon128.png
```

## Opción 2: Usar Figma/Sketch

1. Crear diseño 128x128px
2. Exportar en múltiples tamaños
3. Guardar en esta carpeta

## Opción 3: Herramientas online

- https://realfavicongenerator.net/
- https://www.favicon-generator.org/
- https://www.canva.com/

## Colores del Brand

- Primary: #1976d2
- Primary Dark: #1565c0
- Background: #ffffff
- Text: #000000

## Diseño sugerido

- Logo: "LP" en bold
- Fondo: Gradiente azul (#1976d2 → #1565c0)
- Forma: Círculo o cuadrado redondeado
- Estilo: Material Design, minimalista, profesional
