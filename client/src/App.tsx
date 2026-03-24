import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Interview from './pages/Interview';
import ProfileCreate from './pages/ProfileCreate';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview/:id" element={<Interview />} />
        <Route path="/profile/create" element={<ProfileCreate />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
