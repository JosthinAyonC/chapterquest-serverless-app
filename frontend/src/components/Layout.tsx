import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import GuestBanner from './GuestBanner';

export default function Layout() {
  return (
    <div className="app-shell">
      <Header />
      <GuestBanner />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
