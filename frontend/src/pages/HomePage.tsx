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
          <h3>Role play en aula</h3>
          <p>
            Seis estudiantes, seis roles, un libro. Sin login: la actividad
            persiste; cada uno se ve claramente con su rol asignado.
          </p>
        </article>
        <article className="feature-card">
          <h3>Biblioteca curada</h3>
          <p>
            PDFs seleccionados por el equipo, listos para elegir en cada
            actividad de círculo literario.
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
