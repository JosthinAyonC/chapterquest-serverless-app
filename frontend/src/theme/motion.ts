import type { Transition, Variants } from 'framer-motion';

export const spring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 22,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: spring },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const scaleHover = {
  rest: { scale: 1 },
  hover: { scale: 1.03, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};

export const floatY = (delay = 0): Variants => ({
  animate: {
    y: [0, -12, 0],
    transition: {
      duration: 4 + delay,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
});
