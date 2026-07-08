import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROLES } from '../data/roles';
import RoleCard from '../components/RoleCard';
import { fadeUp, staggerContainer } from '../theme/motion';

export default function GuidePage() {
  return (
    <section className="page">
      <motion.header
        className="page-header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="eyebrow">Share</p>
        <h1>Guide</h1>
        <p className="page-subtitle">
          Learn how role play works in a literary circle. Each student gets one
          of six roles — randomly assigned by the roulette.
        </p>
      </motion.header>

      <motion.div
        className="guide-flow"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <h2>Quick flow</h2>
        <ol>
          <li>Enter six participant names</li>
          <li>Spin the roulette to assign roles</li>
          <li>Confirm the roster (name · role for everyone)</li>
          <li>Pick a book and set the timer (default 40 minutes)</li>
          <li>Read, discuss, then share reviews on the wall</li>
        </ol>
      </motion.div>

      <motion.div
        className="roles-grid"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        {ROLES.map((role, index) => (
          <RoleCard key={role.id} role={role} index={index} />
        ))}
      </motion.div>

      <motion.div
        className="guide-cta"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <p className="page-subtitle" style={{ margin: '0 auto 1.25rem' }}>
          Ready to play? Gather your circle and let&apos;s go.
        </p>
        <Link to="/play" className="btn btn--accent btn--lg">
          Let&apos;s start
        </Link>
      </motion.div>
    </section>
  );
}
