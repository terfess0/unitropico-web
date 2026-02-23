import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
//import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Curriculum from './pages/Curriculum';
import Admissions from './pages/Admissions';
import Contact from './pages/Contact';
import Enroll from './pages/Enroll';
import QualityConditions from './pages/QualityConditions';
import QualityConditionDetail from './pages/QualityConditionDetail';
import Editor from './pages/Editor';
import InstitutionalContext from './pages/InstitutionalContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppContent: React.FC = () => {
  const { pathname } = useLocation();
  // Hide footer on specific presentation/editor routes
  const hideFooter = pathname.includes('/quality-conditions/') || pathname === '/editor' || pathname === '/institutional-context';

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {/*<Navbar />*/}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/enroll" element={<Enroll />} />
          <Route path="/quality-conditions" element={<QualityConditions />} />
          <Route path="/quality-conditions/:id" element={<QualityConditionDetail />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/institutional-context" element={<InstitutionalContext />} />
        </Routes>
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;