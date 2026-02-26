export const LIVE_DEBUG = false; // Toggle this to true for UI debugging without backend tokens

import { VisualizationType } from './types';

export const MODE_VISUALIZATION: Record<string, VisualizationType> = {
    pitch_perfect: 'tides_clash',
    veritalk: 'tides_clash',
    empathy_trainer: 'tides_overlay',
    impromptu: 'classic',
};

