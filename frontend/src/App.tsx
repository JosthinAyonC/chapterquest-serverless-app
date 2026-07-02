import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LibraryPage from './pages/LibraryPage';
import GuidePage from './pages/GuidePage';
import PlayPage from './pages/PlayPage';
import ReviewPage from './pages/ReviewPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="guide" element={<GuidePage />} />
        <Route path="play" element={<PlayPage />} />
        <Route path="review" element={<ReviewPage />} />
      </Route>
    </Routes>
  );
}
