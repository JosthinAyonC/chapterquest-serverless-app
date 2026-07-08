import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../theme/motion';

const flowSteps = [
  {
    num: 1,
    title: 'Enter names',
    text: 'Add six participant names for your literary circle.',
  },
  {
    num: 2,
    title: 'Spin the roulette',
    text: 'Each student gets a unique role — Facilitator, Connector, and more.',
  },
  {
    num: 3,
    title: 'Pick a book',
    text: 'Choose from the curated library and set your reading time.',
  },
  {
    num: 4,
    title: 'Read & discuss',
    text: 'Use the circular timer while the roster stays visible for everyone.',
  },
  {
    num: 5,
    title: 'Share reviews',
    text: 'Post reflections on the Padlet-style review wall — name and role included.',
  },
];

export default function LandingPage() {
  return (
    <div className="page">
      <section className="landing-hero" aria-labelledby="hero-title">
        <motion.div
          className="landing-hero-content"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.p className="eyebrow" variants={fadeUp}>
            LitCircle
          </motion.p>
          <motion.h1 id="hero-title" variants={fadeUp}>
            Read, Share, Learn Together
          </motion.h1>
          <motion.p className="tagline" variants={fadeUp}>
            Every chapter is the beginning of a new adventure.
          </motion.p>
          <motion.p className="lead" variants={fadeUp}>
            Welcome to LitCircles — a platform designed to strengthen reading
            habits, collaborative work, and English skills through interactive
            book clubs.
          </motion.p>
          <motion.div className="hero-actions" variants={fadeUp}>
            <Link to="/guide" className="btn btn--primary btn--lg">
              Start your circle
            </Link>
            <Link to="/library" className="btn btn--secondary btn--lg">
              Browse library
            </Link>
          </motion.div>
        </motion.div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orb hero-orb--1" />
          <div className="hero-orb hero-orb--2" />
          <motion.div
            className="hero-card-stack"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="hero-float-card"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <strong>6 roles</strong>
              Facilitator · Connector · Illustrator…
            </motion.div>
            <motion.div
              className="hero-float-card"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <strong>40 min timer</strong>
              Roster always visible during play
            </motion.div>
            <motion.div
              className="hero-float-card"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <strong>Review wall</strong>
              Share ideas like Padlet — name · role on every card
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="section-block" aria-labelledby="what-is-title">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 id="what-is-title">What is a literary circle?</h2>
          <p>
            Literary Circles are collaborative reading groups where students
            discuss a text, share ideas, and learn together through assigned
            roles. Each participant brings a unique perspective — from guiding
            discussion to connecting the story to real life.
          </p>
        </motion.div>

        <div className="malu-placeholder" style={{ marginTop: '2rem' }}>
          Malu &amp; Danna — animated characters coming soon
        </div>
      </section>

      <section className="section-block" aria-labelledby="flow-title">
        <h2 id="flow-title">How it works</h2>
        <motion.div
          className="bento-grid"
          style={{ marginTop: '1.5rem' }}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {flowSteps.map((step) => (
            <motion.div
              key={step.num}
              className="bento-item bento-item--span-4"
              variants={fadeUp}
            >
              <div className="flow-step">
                <span className="flow-step-num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
