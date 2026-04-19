import { motion } from 'framer-motion';

/**
 * A reusable wrapper for adding consistent entrance animations to UI elements.
 */
export default function MotionContainer({ 
  children, 
  delay = 0, 
  duration = 0.75, 
  direction = 'up', 
  distance = 30,
  className = '' 
}) {
  const variants = {
    hidden: { 
      opacity: 0, 
      y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
      x: direction === 'left' ? distance : direction === 'right' ? -distance : 0,
      filter: 'blur(10px)',
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      x: 0,
      filter: 'blur(0px)',
      scale: 1,
      transition: {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // Custom spring-like curve
      }
    }
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
