import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Interview from './pages/Interview';

function App() {
  return (
    <div>
      <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <span>AI 面试模拟平台</span>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview/:id" element={<Interview />} />
      </Routes>
    </div>
  );
}

export default App;
