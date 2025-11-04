import React from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const featureVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      className="landing-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="hero-section">
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          👋 Welcome to Palaver!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          The friendly place where conversations flow in real time — connect, laugh, and chat instantly with friends!
        </motion.p>
        <motion.div
          className="features"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.2, delayChildren: 0.4 },
            },
          }}
        >
          {["💬 Real-time Messaging with Reactions", "🔒 Private & Group Chats", "🟢 See who’s typing or online"].map((feature, index) => (
            <motion.p key={index} variants={featureVariants}>
              {feature}
            </motion.p>
          ))}
        </motion.div>
        <SignInButton mode="modal">
          <motion.button
            className="get-started-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            🚀 Jump In & Start Chatting
          </motion.button>
        </SignInButton>
      </div>
    </motion.div>
  );
};

export default LandingPage;