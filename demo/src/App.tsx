import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { trackerStore } from './tracker';
import { Home } from './pages/Home';
import { Playground } from './pages/Playground';
import { Forms } from './pages/Forms';
import { Dynamic } from './pages/Dynamic';
import { Shop } from './pages/Shop';

export default function App() {
  // Start recording once on load; the HUD can stop/restart it.
  useEffect(() => {
    trackerStore.start();
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/dynamic" element={<Dynamic />} />
        <Route path="/shop" element={<Shop />} />
      </Route>
    </Routes>
  );
}
