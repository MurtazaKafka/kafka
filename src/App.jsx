import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { useSession } from './store/session.js';

// the most-visited routes ship in the main bundle. the rest lazy-load,
// so opening kafka for the first time doesn't pay the cost of papaparse,
// the editor, the import flow, etc. unless the user actually navigates there.
import Home from './pages/Home.jsx';

const Auth           = lazy(() => import('./pages/Auth.jsx'));
const AuthCallback   = lazy(() => import('./pages/AuthCallback.jsx'));
const UsernameSetup  = lazy(() => import('./pages/UsernameSetup.jsx'));
const Search         = lazy(() => import('./pages/Search.jsx'));
const Write          = lazy(() => import('./pages/Write.jsx'));
const Work           = lazy(() => import('./pages/Work.jsx'));
const Edition        = lazy(() => import('./pages/Edition.jsx'));
const Profile        = lazy(() => import('./pages/Profile.jsx'));
const Drafts         = lazy(() => import('./pages/Drafts.jsx'));
const Import         = lazy(() => import('./pages/Import.jsx'));
const Settings       = lazy(() => import('./pages/Settings.jsx'));
const Lists          = lazy(() => import('./pages/Lists.jsx'));
const ListPage       = lazy(() => import('./pages/List.jsx'));
const Saved          = lazy(() => import('./pages/Saved.jsx'));
const Notifications  = lazy(() => import('./pages/Notifications.jsx'));
const NotFound       = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  const init = useSession((s) => s.init);
  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <a href="#main" className="skip-link">skip to content</a>
      <Chrome>
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/"                   element={<Home />} />
              <Route path="/auth"               element={<Auth />} />
              <Route path="/auth/callback"      element={<AuthCallback />} />
              <Route path="/auth/username"      element={<UsernameSetup />} />
              <Route path="/search"             element={<Search />} />
              <Route path="/write/:edition_id"  element={<Write />} />
              <Route path="/book/:work_id"      element={<Work />} />
              <Route path="/edition/:edition_id" element={<Edition />} />
              <Route path="/drafts"             element={<Drafts />} />
              <Route path="/import"             element={<Import />} />
              <Route path="/settings"           element={<Settings />} />
              <Route path="/lists"              element={<Lists />} />
              <Route path="/list/:id"           element={<ListPage />} />
              <Route path="/saved"              element={<Saved />} />
              <Route path="/notifications"      element={<Notifications />} />
              <Route path="/:username"          element={<ProfileGate Profile={Profile} />} />
              <Route path="*"                   element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Chrome>
    </BrowserRouter>
  );
}

// minimal fallback. one short word so it doesn't draw the eye when bundles
// resolve in under a frame on warm caches; centered + muted when they don't.
function RouteFallback() {
  return (
    <div
      className="col upper loading-dots"
      style={{ padding: 'var(--s-5) 0', textAlign: 'center', color: 'var(--muted)' }}
    >
      loading
    </div>
  );
}

// the editor and signed-out landing hide the global nav. otherwise show it.
function Chrome({ children }) {
  const { pathname } = useLocation();
  const { user, loading } = useSession();
  const hideNav =
    pathname.startsWith('/write/') ||
    (pathname === '/' && !loading && !user);
  return (
    <>
      {!hideNav && <Nav />}
      <main id="main">{children}</main>
    </>
  );
}

// /:username is actually /@username. gate it so other paths don't match.
// Profile is lazy-loaded; pass through so we don't double-import.
function ProfileGate({ Profile }) {
  const loc = useLocation();
  if (!loc.pathname.startsWith('/@')) {
    // a lazy-loaded NotFound would race the Profile import, so render plain text.
    return (
      <div className="col" style={{ padding: 'var(--s-5) 0', textAlign: 'center', color: 'var(--muted)' }}>
        nothing at this address.
      </div>
    );
  }
  return <Profile />;
}
