"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "zoom" | "none";
  className?: string;
  duration?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  direction = "up",
  className = "",
}) => {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 800,
      easing: "ease-out-cubic",
    });
  }, []);

  const getVariants = () => {
    switch (direction) {
      case "up":
        return {
          hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
          visible: { opacity: 1, y: 0, filter: "blur(0px)" },
        };
      case "down":
        return {
          hidden: { opacity: 0, y: -40, filter: "blur(4px)" },
          visible: { opacity: 1, y: 0, filter: "blur(0px)" },
        };
      case "left":
        return {
          hidden: { opacity: 0, x: -40, filter: "blur(4px)" },
          visible: { opacity: 1, x: 0, filter: "blur(0px)" },
        };
      case "right":
        return {
          hidden: { opacity: 0, x: 40, filter: "blur(4px)" },
          visible: { opacity: 1, x: 0, filter: "blur(0px)" },
        };
      case "zoom":
        return {
          hidden: { opacity: 0, scale: 0.92, filter: "blur(6px)" },
          visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
        };
      default:
        return {
          hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
          visible: { opacity: 1, y: 0, filter: "blur(0px)" },
        };
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-70px" }}
      transition={{
        type: "spring",
        stiffness: 85,
        damping: 16,
        mass: 0.8,
        delay,
      }}
      variants={getVariants()}
      className={className}
    >
      {children}
    </motion.div>
  );
};
