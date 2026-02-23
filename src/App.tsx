import { Routes, Route, useParams } from 'react-router-dom';
import { MfeShellInitializer } from './components/MfeShellInitializer';
import { InsightDashboard } from './pages/InsightDashboard';
import { SignalsPage } from './pages/SignalsPage';

// Renders InsightDashboard with the correct tab active for path-based routes
// e.g. /insight/revenue → InsightDashboard with initialTab="revenue"
// Keeps URL as-is so shell sidenav active state matches correctly
const SegmentRoute: React.FC = () => {
    const { segmentCode } = useParams<{ segmentCode: string }>();
    return <InsightDashboard initialTab={segmentCode} />;
};

function App() {
    return (
        <MfeShellInitializer>
            <Routes>
                <Route path="/" element={<InsightDashboard />} />
                <Route path="signals" element={<SignalsPage />} />

                {/* Path-based segment routes — URL stays as /insight/revenue etc. */}
                <Route path=":segmentCode" element={<SegmentRoute />} />
            </Routes>
        </MfeShellInitializer>
    );
}

export default App;
