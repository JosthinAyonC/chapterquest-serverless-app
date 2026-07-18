import { motion } from 'framer-motion';
import type { Role } from '../types/role';
import { scaleHover } from '../theme/motion';

interface RoleCardProps {
  role: Role;
  index?: number;
}

export default function RoleCard({ role, index = 0 }: RoleCardProps) {
  return (
    <motion.article
      className="role-card"
      variants={scaleHover}
      initial={{ opacity: 0, y: 16 }}
      whileHover="hover"
      whileTap="tap"
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      style={{ borderTop: `4px solid ${role.color}` }}
      aria-labelledby={`role-${role.id}`}
    >
      <div
        className="role-card-icon"
        style={{ background: `${role.color}22`, color: role.color }}
        aria-hidden="true"
      >
        {role.icon}
      </div>
      <h3 id={`role-${role.id}`}>{role.nameEs}</h3>
      <p className="role-name-en">{role.nameEn}</p>
      <p>{role.description}</p>
    </motion.article>
  );
}
