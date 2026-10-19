# Atelier français

Una web para aprender francés viendo imágenes, escuchando frases y jugando. Reutiliza los textos, las formas verbales y los audios de la biblioteca personal `Frances_Anki_A0_C2`.

## Abrir la copia

Abre `dist/index.html` con un navegador y mantén juntas todas las carpetas de `dist`. La web no necesita instalación ni servicios externos para consultar los materiales o reproducir los audios incluidos.

Si el navegador restringe la apertura directa, puedes servir la carpeta `dist` con un servidor estático. Por ejemplo, desde la raíz del repositorio, con Python 3:

```sh
python3 -m http.server 8000 --directory dist
```

Después abre `http://localhost:8000`. La grabación de voz requiere permiso del micrófono y un contexto admitido por el navegador, como `localhost` o HTTPS.

## Qué incluye

- 3.000 entradas de vocabulario y 86 categorías originales.
- 1.482 fichas de gramática y práctica verbal, incluidos 642 ejercicios de conjugación.
- 519 entradas de conversación y pronunciación.
- 566 tablas de verbos y 7 locuciones adicionales.
- 5.901 audios originales de la biblioteca: síntesis francesa con la voz DeniseNeural mediante Microsoft Edge Read Aloud / edge-tts. El audio del vocabulario suele decir una frase completa.
- 144 palabras con imágenes de aspecto fotográfico, repartidas en 16 temas. Las imágenes se crearon con IA para esta web.
- 18 acciones ilustradas para **Misión verbos**, con frases y audios del material original.

Las láminas permiten explorar, escuchar, elegir una imagen y practicar en voz alta. El catálogo ofrece búsqueda, filtros, fichas guardadas y dictados. Gramática oculta el modelo hasta que decidas consultarlo; Verbos conserva las tablas completas. Los niveles pedagógicos proceden del material original. El vocabulario conserva sus categorías y su rango de frecuencia, sin una nueva clasificación MCER.

## Nueve juegos

1. **Escuchar y elegir el significado:** reconoce las expresiones de la biblioteca por su audio.
2. **Construir frases:** ordena fichas de palabras.
3. **Completar huecos:** recupera la palabra que falta.
4. **Memoria francés–español:** une expresiones con sus significados.
5. **Mercado de imágenes:** escucha y elige entre 144 imágenes de 16 temas.
6. **Jardín de parejas:** une la imagen con su palabra francesa y escucha el modelo.
7. **Una escena, una expresión:** aplica frases hechas en 18 situaciones ilustradas.
8. **Tren de los verbos:** escribe conjugaciones de las tablas en presente, imperfecto, futuro simple y pasado compuesto.
9. **Misión verbos:** recorre seis paradas de una ciudad con 18 acciones; combina reconocimiento de audio e imagen, conjugación, construcción de frases y escritura.

Las rondas ofrecen pistas y una segunda vuelta para las respuestas pendientes. El pasaporte incorpora puntos de experiencia, estrellas, rachas, insignias y misiones diarias. Los niveles del juego indican progreso en la web y no certifican un nivel MCER.

## Trucos de verbos y conjugaciones

**Trucos de conjugación** ofrece ocho patrones visuales para el presente (-er, el modelo finir, el modelo vendre e irregulares), imparfait, futur simple, conditionnel présent y passé composé. Incluye excepciones y concordancia de género y número. Las 18 fichas de verbos frecuentes reutilizan ejemplos y audios del material.

El laboratorio permite elegir entre las 566 tablas y cinco tiempos; las seis personas permanecen ocultas hasta pedir el modelo. Las raíces y las terminaciones se distinguen por colores cuando la segmentación es fiable. La guía enlaza con la práctica del tren, que conserva sus cuatro tiempos. Las fuentes primarias de OQLF y Académie française se enlazan por regla.

En **Misión verbos** y **Tren de los verbos**, «Ver un truco» ofrece una orientación antes de «Ver modelo». Pedir cualquiera de las ayudas marca la respuesta para repasar y evita contarla como recuerdo sin ayuda. Los retos de escucha mantienen ocultos el verbo y la frase hasta pedir el modelo o responder.

## Tu progreso y tu voz

El progreso se guarda en el almacenamiento local del navegador. No se sincroniza con una cuenta ni con GitHub, y cambia según el navegador y la dirección desde la que abras la web. En **Mi progreso → Exportar / Importar** puedes guardar una copia o trasladarlo entre la versión local y la alojada. No subas esos archivos personales al repositorio.

Las grabaciones de tu voz permanecen en el dispositivo y se usan para comparar con el modelo. La web no proporciona una puntuación fonética automática.

## Fuentes, imágenes y licencias

Se conservan las referencias de cada ficha y las fuentes de las tablas en los datos incluidos. Las referencias generales son [OQLF](https://vitrinelinguistique.oqlf.gouv.qc.ca/), el [MCER del Consejo de Europa](https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions) y los [datos de Verbiste / verbecc utilizados](https://github.com/bretttolbert/verbecc/tree/a5cab52168cda317a358222448a8a7c5fe58657a/verbecc/data/xml).

Los avisos de licencia de los materiales verbales se conservan sin cambios en [`dist/data/verbiste-license/`](dist/data/verbiste-license/): [`LICENSE.txt`](dist/data/verbiste-license/LICENSE.txt) y [`GPL-2.0.txt`](dist/data/verbiste-license/GPL-2.0.txt). Este repositorio no añade una licencia global ni cambia los derechos de sus materiales de origen.

Las 144 imágenes de vocabulario y las 18 escenas de acciones son creaciones con IA para esta experiencia; los mapas de imagen se encuentran en `dist/data/pictures.json` y `dist/data/verb-missions.json`. Se conservan también las ilustraciones vectoriales del proyecto. La interacción visual se inspira en [LanguageGuide](https://www.languageguide.org/french/vocabulary/); no incorpora imágenes ni audios de ese sitio.

## Estructura y edición

`dist` contiene toda la web, sin dependencias externas de ejecución ni un paso de compilación. `dist/index.html` carga la interfaz y los módulos de juegos. `dist/data/` guarda los datos, `dist/audio/` los audios, `dist/images/` las escenas realistas y `dist/illustrations/` los dibujos vectoriales. Las rutas de los recursos son relativas para permitir alojamiento bajo una subcarpeta.

Esta exportación contiene la web y sus avisos de licencia. Omite credenciales de Sites, historial del despliegue, capturas, auditorías con rutas locales y archivos personales de progreso.

## Flujo opcional de GitHub Pages

El archivo [`.github/workflows/pages.yml`](.github/workflows/pages.yml) permite desplegar `dist` mediante una ejecución manual. No se ejecuta automáticamente al subir cambios y su presencia no significa que GitHub Pages esté configurado o publicado.

Para usarlo, el propietario debe seleccionar **GitHub Actions** como fuente de publicación en los ajustes de **Pages** del repositorio y después ejecutar **Publicar Atelier en GitHub Pages** desde **Actions → Run workflow**. La disponibilidad de Pages y la visibilidad de la web dependen de la cuenta y de la configuración del repositorio. La dirección definitiva aparece en el despliegue completado.


## Tren ampliado y subjuntivo · 19 de octubre de 2026

El tren incluye 11 tiempos cotidianos, mezclas por familia y un recorrido opcional de passé simple para lectura. Los 11 patrones de formación incluyen tres nuevos de subjuntivo. Hay ocho irregulares, seis usos, cuatro contrastes y 16 situaciones: intento escrito, solución explícita y práctica de refuerzo. Formas exactas del corpus; fuentes OQLF y Académie française.

La ampliación general de imágenes y audio sigue en producción; esta actualización conserva los medios ya publicados.
