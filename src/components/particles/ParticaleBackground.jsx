import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useTheme } from "../../contexts/ThemeContext";

const ParticleBackground = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fpsLimit: isMobile ? 30 : 60,
        interactivity: {
          events: {
            onClick: {
              enable: !isMobile,
              mode: "push",
            },
            onHover: {
              enable: !isMobile,
              mode: "repulse",
            },
            resize: true,
          },
          modes: {
            push: { quantity: 4 },
            repulse: { distance: 100, duration: 0.4 },
          },
        },
        particles: {
          color: {
            value: isDark ? "#4CC9F0" : "#3A0CA3",
          },
          links: {
            color: isDark ? "#7209B7" : "#4361EE",
            distance: 150,
            enable: !isMobile, // Disable links on mobile for performance
            opacity: 0.5,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: { default: "bounce" },
            random: false,
            speed: isMobile ? 0.5 : 1,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: isMobile ? 20 : 40,
          },
          opacity: {
            value: isDark ? 0.3 : 0.5,
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 2 },
          },
        },
        detectRetina: !isMobile,
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 10,
        pointerEvents: "none",
        opacity: isMobile ? 0.4 : 0.6,
      }}
    />
  );
};

export default ParticleBackground;