import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivacyIndicator from './components/PrivacyIndicator';
import HomePage from './pages/HomePage';
import ConvertPage from './pages/ConvertPage';
import OrganizePage from './pages/OrganizePage';
import EditPage from './pages/EditPage';
import SecurityPage from './pages/SecurityPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-blueprint-900 text-blueprint-100">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/convert/:toolType" element={<ConvertPage />} />
            <Route path="/organize/:toolType" element={<OrganizePage />} />
            <Route path="/edit/:toolType" element={<EditPage />} />
            <Route path="/security/:toolType" element={<SecurityPage />} />
          </Routes>
        </main>
        <Footer />
        <PrivacyIndicator />
      </div>
    </Router>
  );
}

export default App;