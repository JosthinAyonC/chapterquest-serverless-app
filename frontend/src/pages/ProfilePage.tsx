import { useState, type FormEvent } from 'react';
import { useGuestUser } from '../context/GuestUserContext';

export default function ProfilePage() {
  const { guest, setGuestUsername, clearGuest, isLoading } = useGuestUser();
  const [username, setUsername] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuestUsername(username);
    setUsername('');
  }

  if (isLoading) {
    return (
      <section className="page">
        <p>Cargando perfil…</p>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Perfil</h1>
        <p className="page-subtitle">
          Elige un nombre de invitado. Se guardará en una cookie de tu
          navegador. En el MVP validaremos unicidad contra DynamoDB.
        </p>
      </header>

      {guest ? (
        <div className="profile-card">
          <p>
            Actualmente navegas como{' '}
            <strong>@{guest.username}</strong>
          </p>
          <button type="button" className="btn btn--ghost" onClick={clearGuest}>
            Cambiar nombre
          </button>
        </div>
      ) : (
        <form className="profile-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Nombre de invitado</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="ej. lector_aventurero"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={2}
            maxLength={32}
            required
            autoComplete="nickname"
          />
          <button type="submit" className="btn btn--primary">
            Guardar en cookie
          </button>
        </form>
      )}
    </section>
  );
}
