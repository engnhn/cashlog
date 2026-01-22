import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="content-container animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default App;
