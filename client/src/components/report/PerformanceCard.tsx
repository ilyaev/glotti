import { forwardRef } from 'react';
import type { SessionReport } from '../../types';
import { PitchPerfectCard } from './cards/PitchPerfectCard';
import { EmpathyTrainerCard } from './cards/EmpathyTrainerCard';
import { VeritalkCard } from './cards/VeritalkCard';
import { ImpromptuCard } from './cards/ImpromptuCard';

interface PerformanceCardProps {
    report: SessionReport;
}

// ─── Component Router ─────────────────────────────────────────────────────────

export const PerformanceCard = forwardRef<HTMLDivElement, PerformanceCardProps>(({ report }, ref) => {
    switch (report.mode) {
        case 'pitch_perfect':
            return <PitchPerfectCard report={report} ref={ref} />;
        case 'empathy_trainer':
            return <EmpathyTrainerCard report={report} ref={ref} />;
        case 'veritalk':
            return <VeritalkCard report={report} ref={ref} />;
        case 'impromptu':
            return <ImpromptuCard report={report} ref={ref} />;
        default:
            // Fallback for unknown modes
            return <PitchPerfectCard report={report} ref={ref} />;
    }
});
