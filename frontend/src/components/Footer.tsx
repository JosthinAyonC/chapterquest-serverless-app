import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p className="footer-brand">
          LitCircle — <em>Every chapter is the beginning of a new adventure.</em>
        </p>
        <p className="footer-meta">
          <Link to="/terms" className="footer-link">
            Terms
          </Link>{' '}
          · Done for Danna Bailon and Malú Copiano & Powered by{' '}
          <a
            href="https://www.josthinayon.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Josthin Ayon
          </a>{' '}
          · {year}
        </p>
      </div>
    </footer>
  );
}
