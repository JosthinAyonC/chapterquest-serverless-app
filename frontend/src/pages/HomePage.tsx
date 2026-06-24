import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <section className="page hero">
      <div className="hero-content">
        <p className="eyebrow">Plataforma de lectura social</p>
        <h1>Transforma la lectura en una aventura compartida</h1>
        <p className="lead">
          LitCircle conecta lectores para descubrir libros, compartir reseñas,
          comentar capítulos y vivir experiencias de rol — todo sin fricción
          para empezar.
        </p>
        <div className="hero-actions">
          <Link to="/library" className="btn btn--primary">
            Explorar biblioteca
          </Link>
          <Link to="/community" className="btn btn--secondary">
            Unirme a la comunidad
          </Link>
        </div>
      </div>

      <div className="hero-grid">
        <article className="feature-card">
          <h3>Lectura sin barreras</h3>
          <p>
            Entra como invitado con un nombre. Sin contraseña, sin abandonar la
            página antes de explorar.
          </p>
        </article>
        <article className="feature-card">
          <h3>PDFs en la nube</h3>
          <p>
            Sube y lee documentos con acceso seguro mediante URLs firmadas —
            solo desde LitCircle.
          </p>
        </article>
        <article className="feature-card">
          <h3>Comunidad viva</h3>
          <p>
            Reseñas, comentarios y roleplay para convertir cada capítulo en una
            conversación.
          </p>
        </article>
      </div>
    </section>
  );
}
