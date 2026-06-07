import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';
import SplashScreen from './components/SplashScreen';
import { Product } from './types';

export default function App() {
  const [isInitializing, setIsInitializing] = React.useState(true);

  const [preloadedProducts, setPreloadedProducts] = React.useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('ansi_cached_products');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  // Deep SPA routing path translation helper for live cloud deployment environments
  // and absolute hard-fallback timeout to rescue layout from frozen loading screen
  React.useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/admin' || currentPath === '/admin/') {
      window.location.replace('/#/admin');
    } else if (currentPath.startsWith('/admin/dashboard')) {
      window.location.replace('/#/admin/dashboard');
    }

    // Absolute 2.5-second safety timer to ensure loader is bypassed if any asset or api fails/hangs
    const safetyTimer = setTimeout(() => {
      setIsInitializing(false);
    }, 2500);

    return () => clearTimeout(safetyTimer);
  }, []);

  const handleInitializationComplete = (products: Product[], adminStatus: boolean, uid: string | null) => {
    if (products && products.length > 0) {
      setPreloadedProducts(products);
    }
    setIsAdmin(adminStatus);
    setUserId(uid);
    setIsInitializing(false);
  };

  if (isInitializing) {
    return <SplashScreen onComplete={handleInitializationComplete} />;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <Home 
              initialProducts={preloadedProducts} 
              initialIsAdmin={isAdmin} 
              initialUserId={userId} 
            />
          } 
        />
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

