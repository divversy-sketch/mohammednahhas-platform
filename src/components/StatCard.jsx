import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, helper, tone = 'default' }) {
  return (
    <motion.div
      className={`stat-card glow-card tone-${tone}`}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
    >
      <div className="stat-icon-wrap">
        <Icon size={18} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{helper}</span>
      </div>
    </motion.div>
  );
}
