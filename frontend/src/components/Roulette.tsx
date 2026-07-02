import { motion } from 'framer-motion';
import { usePlaySession } from '../context/PlaySessionContext';

export default function Roulette() {
  const { rouletteSpinning } = usePlaySession();

  return (
    <div className="roulette-wrap" aria-live="polite">
      <motion.div
        className="roulette-wheel"
        animate={{ rotate: rouletteSpinning ? 720 : 0 }}
        transition={{
          duration: rouletteSpinning ? 2.2 : 0,
          ease: rouletteSpinning ? [0.2, 0.8, 0.2, 1] : 'linear',
        }}
        aria-hidden="true"
      />
      <p className="roulette-result">
        {rouletteSpinning ? 'Spinning roles…' : 'Roles assigned!'}
      </p>
    </div>
  );
}
