import { Link } from 'react-router-dom';
import { useGuestUser } from '../context/useGuestUser';

export default function GuestBanner() {
  const { guest, isLoading } = useGuestUser();

  if (isLoading || guest) return null;

  return (
    <div className="guest-banner" role="status">
      <div className="container guest-banner-inner">
        <p>
          Navegas como invitado. Tu nombre se guardará en una cookie del
          navegador para personalizar tu experiencia — sin contraseña ni
          registro obligatorio.
        </p>
        <Link to="/profile" className="btn btn--ghost btn--sm">
          Elegir nombre
        </Link>
      </div>
    </div>
  );
}
