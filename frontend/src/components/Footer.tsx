export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p className="footer-brand">
          LitCircle — <em>Every chapter is the beginning of a new adventure.</em>
        </p>
        <p className="footer-meta">
          Powered by ChapterQuest · {year}
        </p>
      </div>
    </footer>
  );
}
