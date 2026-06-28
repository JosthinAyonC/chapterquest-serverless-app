import { useForm } from 'react-hook-form';
import { GuestApiError } from '../lib/api';
import { useGuestUser } from '../context/useGuestUser';

interface GuestFormValues {
  username: string;
}

const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export default function ProfilePage() {
  const { guest, registerGuest, clearGuest, isLoading } = useGuestUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<GuestFormValues>({
    defaultValues: { username: '' },
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async ({ username }) => {
    try {
      await registerGuest(username);
      reset();
    } catch (err) {
      if (err instanceof GuestApiError) {
        setError('username', { type: 'server', message: err.message });
        return;
      }
      setError('root.server', {
        type: 'server',
        message: 'No se pudo registrar el nombre. Intenta de nuevo.',
      });
    }
  });

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
          Nombre opcional para navegar el sitio (cookie). No es inicio de sesión
          ni tu identidad en Juguemos — allí el docente ingresa los 6 nombres de
          la actividad y el sistema asigna roles.
        </p>
      </header>

      {guest ? (
        <div className="profile-card">
          <p>
            Actualmente navegas como <strong>@{guest.username}</strong>
          </p>
          <button type="button" className="btn btn--ghost" onClick={clearGuest}>
            Cambiar nombre
          </button>
        </div>
      ) : (
        <form className="profile-form" onSubmit={onSubmit} noValidate>
          <label htmlFor="username">Nombre de invitado</label>
          <input
            id="username"
            type="text"
            placeholder="ej. lector_aventurero"
            autoComplete="nickname"
            aria-invalid={errors.username ? 'true' : 'false'}
            aria-describedby={errors.username ? 'username-error' : undefined}
            disabled={isSubmitting}
            {...register('username', {
              required: 'El nombre es obligatorio.',
              minLength: {
                value: 2,
                message: 'Mínimo 2 caracteres.',
              },
              maxLength: {
                value: 32,
                message: 'Máximo 32 caracteres.',
              },
              pattern: {
                value: USERNAME_PATTERN,
                message: 'Solo letras minúsculas, números y guión bajo.',
              },
              setValueAs: (value: string) => value.trim().toLowerCase(),
            })}
          />
          {errors.username && (
            <p className="form-error" id="username-error" role="alert">
              {errors.username.message}
            </p>
          )}
          {errors.root?.server && (
            <p className="form-error" role="alert">
              {errors.root.server.message}
            </p>
          )}
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registrando…' : 'Guardar nombre'}
          </button>
        </form>
      )}
    </section>
  );
}
