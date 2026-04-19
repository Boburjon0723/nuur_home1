import { Routes, Route, Navigate } from 'react-router-dom';
import Shell from './Shell';
import CatalogPage from './pages/CatalogPage';
import AlbumPage from './pages/AlbumPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<AlbumPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="album" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
