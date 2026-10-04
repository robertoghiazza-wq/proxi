import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import { HomeScreen }        from './screens/HomeScreen'
import { PersoneScreen }     from './screens/PersoneScreen'
import { PersonaDetail }     from './screens/PersonaDetail'
import { EventiScreen }      from './screens/EventiScreen'
import { EventoDetail }      from './screens/EventoDetail'
import { NuovoEventoScreen } from './screens/NuovoEventoScreen'
import { LuoghiScreen }      from './screens/LuoghiScreen'
import { LuogoDetail }       from './screens/LuogoDetail'
import { ProfiloScreen }     from './screens/ProfiloScreen'
import { LoginScreen }       from './screens/LoginScreen'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
})

const DEV_MOCK = import.meta.env.VITE_DEV_MOCK === 'true'

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!DEV_MOCK && !localStorage.getItem('proxi_token')) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function Auth({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth><HomeScreen /></Auth>} />

          {/* Persone: lista + drawer dettaglio */}
          <Route path="/persone" element={<Auth><PersoneScreen /></Auth>}>
            <Route path=":id" element={<PersonaDetail />} />
          </Route>

          {/* Eventi: lista + modal nuovo + drawer dettaglio */}
          <Route path="/eventi" element={<Auth><EventiScreen /></Auth>}>
            <Route path="nuovo" element={<NuovoEventoScreen />} />
            <Route path=":id"   element={<EventoDetail />} />
          </Route>

          {/* Luoghi: lista + drawer dettaglio */}
          <Route path="/luoghi" element={<Auth><LuoghiScreen /></Auth>}>
            <Route path=":id" element={<LuogoDetail />} />
          </Route>

          <Route path="/profilo" element={<Auth><ProfiloScreen /></Auth>} />

          <Route path="/login" element={<LoginScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
