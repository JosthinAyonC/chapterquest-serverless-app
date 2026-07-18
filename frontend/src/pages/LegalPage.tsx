import { LEGAL_PAGE_SECTIONS, LEGAL_PAGE_TITLE } from '../lib/roleplay/copy';

export default function LegalPage() {
  return (
    <section className="page legal-page">
      <header className="page-header">
        <p className="eyebrow">Legal</p>
        <h1>{LEGAL_PAGE_TITLE}</h1>
        <p className="page-subtitle">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      <div className="legal-page-content play-panel">
        {LEGAL_PAGE_SECTIONS.map((section) => (
          <article key={section.title} className="legal-section">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
