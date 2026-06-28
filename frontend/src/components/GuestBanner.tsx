import { Link } from 'react-router-dom';
import { useGuestUser } from '../context/useGuestUser';

export default function GuestBanner() {
  const { guest, isLoading } = useGuestUser();

  if (isLoading || guest) return null;

  return (
    <div className="guest-banner" role="status">
      <div className="container guest-banner-inner">
        <p>
          Navegas sin perfil. Puedes elegir un nombre opcional para el sitio
          (no es login). En el role play de aula, tu identidad es el nombre que
          ingresa el docente y el rol que asigna la ruleta.
        </p>
        <Link to="/profile" className="btn btn--ghost btn--sm">
          Elegir nombre
        </Link>
      </div>
    </div>
  );
}
