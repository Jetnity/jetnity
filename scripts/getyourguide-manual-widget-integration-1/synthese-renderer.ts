// Ersetzt im synthetischen Bündel nur den Anwendungs-Renderer.
// Die Produktionsdatei bleibt die Quelle für die echte Einbettung.

import { bruecke } from './synthese-bruecke'

export const anwendungsRenderer = bruecke().renderer
