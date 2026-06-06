import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import TodayPage      from './pages/Today';
import PipelinePage   from './pages/Pipeline';
import ClientsPage    from './pages/Clients';
import ClientDetail   from './pages/ClientDetail';
import PaymentsPage   from './pages/Payments';
import FilesPage      from './pages/Files';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/"               element={<TodayPage    />} />
              <Route path="/pipeline"       element={<PipelinePage />} />
              <Route path="/clients"        element={<ClientsPage  />} />
              <Route path="/clients/:id"    element={<ClientDetail />} />
              <Route path="/payments"       element={<PaymentsPage />} />
              <Route path="/files"          element={<FilesPage    />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
