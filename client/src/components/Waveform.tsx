import { ClassicWaveform } from './visualizers/ClassicWaveform';
import { TidesVisualizer } from './visualizers/TidesVisualizer';
import { MODE_VISUALIZATION } from '../config';
import { VisualizerProps } from '../types';

interface Props extends VisualizerProps {
    mode?: string;
}

export function Waveform(props: Props) {
    const { mode, ...visualizerProps } = props;
    
    // Default to classic if mode not found or config missing
    const vizType = mode ? (MODE_VISUALIZATION[mode] || 'classic') : 'classic';

    if (vizType === 'tides_clash' || vizType === 'tides_overlay') {
        return <TidesVisualizer {...visualizerProps} variant={vizType} />;
    }

    return <ClassicWaveform {...visualizerProps} />;
}
