import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { MfeShellInitializer } from './components/MfeShellInitializer';
import { InsightDashboard } from './pages/InsightDashboard';
import { SignalsPage } from './pages/SignalsPage';

// Redirect component for old segment routes
const SegmentRedirect: React.FC = () => {
    const { segmentCode } = useParams<{ segmentCode: string }>();
    return <Navigate to={`/?tab=${segmentCode}`} replace />;
};

function App() {
    return (
        <MfeShellInitializer>
            <Routes>
                <Route path="/" element={<InsightDashboard />} />
                <Route path="signals" element={<SignalsPage />} />

                {/* Backwards compatibility redirects */}
                <Route path=":segmentCode" element={<SegmentRedirect />} />
            </Routes>
        </MfeShellInitializer>
    );
}

export default App;
