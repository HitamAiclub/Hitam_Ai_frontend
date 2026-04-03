import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Calendar, Users, Trophy, ArrowRight, Github, Linkedin, Globe, ExternalLink, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { organizeMembersByRole, groupCoreTeamByLevel, CORE_TEAM_ROLES, shouldUseLevelWiseDisplay } from "../utils/committeeRoles";
import HighlightsSection from "../components/home/HighlightsSection";
import LocalEnergyBackground from "../components/home/LocalEnergyBackground";

// Lightning Container Effect (Section-Level Divine Stage Reflection)
const LightningContainerEffect = ({ isActive }) => {
  return null;
};

// Realistic Fractal Lightning Arc Component
const FractalLightning = ({ color = "#00f2ff", intensity = 1 }) => {
  const [path, setPath] = useState("");

  useEffect(() => {
    const generateBolt = () => {
      let currentX = 50 + (Math.random() - 0.5) * 40;
      let currentY = 50 + (Math.random() - 0.5) * 40;
      let newPath = `M ${currentX} ${currentY}`;

      for (let i = 0; i < 5; i++) {
        currentX += (Math.random() - 0.5) * 120;
        currentY += (Math.random() - 0.5) * 120;
        newPath += ` L ${currentX} ${currentY}`;
      }
      setPath(newPath);
    };

    const interval = setInterval(generateBolt, 60);
    return () => clearInterval(interval);
  }, []);

  if (!path) return null;

  return (
    <motion.path
      d={path}
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.5, 1, 0] }}
      transition={{ duration: 0.15 }}
      style={{
        filter: `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 25px ${color})`,
        strokeOpacity: intensity
      }}
    />
  );
};

// Lightning Charge Effect Component (Individual Card - Refined Containment)
const LightningChargeEffect = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
      {/* Intense Glowing Border Aura (Tighter Scale) */}
      <motion.div
        animate={{
          scale: [1, 1.1, 0.98],
          boxShadow: [
            "0 0 30px rgba(255, 77, 77, 0.5), inset 0 0 15px rgba(0, 102, 255, 0.3)",
            "0 0 80px #fff, 0 0 120px rgba(0, 102, 255, 0.8), inset 0 0 40px #fff",
            "0 0 20px rgba(255, 77, 77, 0.8), 0 0 40px rgba(0, 102, 255, 0.7)"
          ],
          filter: ["brightness(1) contrast(1.2)", "brightness(2.5) contrast(1.5)", "brightness(4) contrast(1.8)"]
        }}
        transition={{ duration: 0.1, repeat: Infinity }}
        className="absolute inset-[-5px] rounded-2xl border-2 border-white ring-4 ring-blue-500/10"
      />

      {/* SVG Container for Fractal Bolts - Hugging the card border */}
      <svg className="absolute inset-[-50px] w-[calc(100%+100px)] h-[calc(100%+100px)] overflow-visible z-30">
        <FractalLightning color="#ff4d4d" intensity={1} />
        <FractalLightning color="#0066ff" intensity={1} />
        <FractalLightning color="#fff" intensity={1} />

        {/* Continuous Short-Circuit Friction */}
        {[...Array(4)].map((_, i) => (
          <FractalLightning
            key={i}
            color={i % 2 === 0 ? "#ff4d4d" : "#0066ff"}
            intensity={0.7}
          />
        ))}
      </svg>

      {/* Atmospheric Energy Dust (Contained) */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            x: [(Math.random() - 0.5) * 200],
            y: [(Math.random() - 0.5) * 200],
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0]
          }}
          transition={{ duration: 0.2, repeat: Infinity, delay: Math.random() * 0.2 }}
          className="absolute left-1/2 top-1/2 w-1 h-1 bg-white rounded-full blur-[1px]"
        />
      ))}
    </div>
  );
};

const HomePage = () => {
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [chargingId, setChargingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Member Interaction with Energy Condensation
  const handleMemberClick = (member) => {
    setChargingId(member.id);
    // Increased duration (1.2s) for realistic electrical tension build-up
    setTimeout(() => {
      setSelectedMember(member);
      setChargingId(null);
    }, 1200);
  };

  const fetchData = async () => {
    try {
      try {
        // Fetch committee members
        const committeeSnapshot = await getDocs(collection(db, "committeeMembers"));
        const members = committeeSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCommitteeMembers(members);
      } catch (error) {
        console.warn("Could not fetch committee members:", error.message);
        setCommitteeMembers([]);
      }

      try {
        // Fetch featured event (latest event)
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const events = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (events.length > 0) {
          const sortedEvents = events.sort((a, b) =>
            new Date(b.meta?.startDate || 0) - new Date(a.meta?.startDate || 0)
          );
          setFeaturedEvent(sortedEvents[0]);
        }
      } catch (error) {
        console.warn("Could not fetch events:", error.message);
        setFeaturedEvent(null);
      }
    } catch (error) {
      console.warn("General data fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <LocalEnergyBackground />
      {/* Hero Section - Direct Layout (No Card, No Container) */}
      <section className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden">

        {/* Content Wrapper - No Container, No Card */}
        <div className="w-full px-4 md:px-12 relative z-10 pt-16">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-32 justify-center">

            {/* Left Side: Image + Title (Floating) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center text-center lg:w-5/12 flex-shrink-0"
            >
              <div className="relative group mb-8">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                <img
                  src="/logo.jpg"
                  alt="Hitam AI Logo"
                  className="relative w-72 h-72 md:w-96 md:h-96 object-cover object-center rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
              </div>

              <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent leading-tight pb-2 drop-shadow-sm">
                HITAM AI
              </h1>
            </motion.div>

            {/* Right Side: Content & Buttons (Floating) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:w-6/12 text-center lg:text-left space-y-10"
            >
              <div>
                <h2 className="text-3xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8 leading-tight tracking-tight">
                  Empowering the <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Future of AI</span>
                </h2>
                <p className="text-xl md:text-3xl text-gray-700 dark:text-gray-200 leading-relaxed font-light max-w-3xl mx-auto lg:mx-0">
                  Empowering the next generation of innovators at HITAM through collaboration, learning, and real-world projects.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold shadow-xl shadow-blue-500/20 flex items-center justify-center px-10 py-5 rounded-2xl transition-all hover:scale-105"
                  onClick={() => navigate("/events")}
                >
                  Explore Events
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-purple-600 text-purple-700 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-300 dark:hover:bg-purple-900/20 text-lg font-semibold flex items-center justify-center px-10 py-5 rounded-2xl transition-all hover:scale-105"
                  onClick={() => navigate("/join")}
                >
                  <Users className="mr-3 w-6 h-6" />
                  Join the Club
                </Button>
              </div>

              <div className="flex justify-center lg:justify-start">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-lg flex items-center justify-center transition"
                  onClick={() => navigate("/upcoming")}
                >
                  <Calendar className="mr-3 w-5 h-5" />
                  View Upcoming Activities
                </Button>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Weekly Highlights Section */}
      <HighlightsSection />

      {/* About HITAM Section - Feature Layout (Image + Details) */}
      <section className="py-24 px-4 bg-transparent">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Image Side */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-transparent transition duration-500 z-10"></div>
                {/* College Image */}
                <img
                  src="/MAIN-BLOCK.jpg"
                  alt="HITAM Campus - Main Block"
                  className="w-full h-auto object-cover transform group-hover:scale-110 transition duration-700 min-h-[400px]"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                  <p className="text-white font-medium text-lg">A Green Campus for Sustainable Learning</p>
                </div>
              </div>
            </motion.div>

            {/* Text Side */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 space-y-8"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                  About <span className="text-blue-600 dark:text-blue-400">HITAM</span>
                </h2>
                <div className="w-20 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mb-6 relative"></div>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light">
                  Hyderabad Institute of Technology and Management (HITAM) is the first <strong className="font-semibold text-green-600 dark:text-green-400">Green Campus</strong> in India, dedicated to nurturing professionals who contribute to technological advancement and societal development.
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light mt-4">
                  We emphasize <strong>"Doing Engineering"</strong> through our unique Project-Based Learning (PBL) approach, ensuring students gain hands-on experience and real-world skills.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { title: "Green Campus", desc: "Award-winning sustainable infrastructure" },
                  { title: "Project Based Learning", desc: "Hands-on practical engineering education" },
                  { title: "Autonomous Status", desc: "Academic freedom and updated curriculum" },
                  { title: "Industry Connect", desc: "Strong partnerships with top tech firms" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-4 p-4 rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm shadow-md border border-gray-100/20 dark:border-gray-700/20 hover:-translate-y-1 transition duration-300">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => window.open("https://hitam.org", "_blank")}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold shadow-lg transition"
                >
                  Visit Main Website
                </Button>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* About HITAM AI Club Section - Feature Layout (Details + Image) */}
      <section className="py-24 px-4 bg-transparent">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">

            {/* Image Side (Right) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-purple-900/20 group-hover:bg-transparent transition duration-500 z-10"></div>
                {/* AI / Tech Placeholder Image */}
                <img
                  src="https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=1000&auto=format&fit=crop"
                  alt="AI Club Innovation"
                  className="w-full h-auto object-cover transform group-hover:scale-110 transition duration-700 min-h-[400px]"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                  <p className="text-white font-medium text-lg">Leading the Way in Artificial Intelligence</p>
                </div>
              </div>
            </motion.div>

            {/* Text Side (Left) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 space-y-8"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                  About <span className="text-purple-600 dark:text-purple-400">HITAM AI Club</span>
                </h2>
                <div className="w-20 h-1.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full mb-6 relative"></div>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light">
                  The HITAM AI Club is a vibrant ecosystem where passion meets technology. We are a community of student innovators dedicated to exploring the limitless possibilities of <strong className="font-semibold text-purple-600 dark:text-purple-400">Artificial Intelligence</strong>.
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light mt-4">
                  Our mission is to foster a culture of research, collaboration, and continuous learning, preparing students to become leaders in the AI revolution.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  "Hands-on workshops on ML, DL, and NLP",
                  "Weekly interactive learning sessions",
                  "Expert sessions with industry leaders",
                  "Real-world AI application projects",
                  "Research and publication support"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <span className="text-lg">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => navigate("/join")}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg shadow-purple-500/30 transition flex items-center"
                >
                  Join the Club
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Committee Members Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Our Committee
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Meet the dedicated team behind HITAM AI Club
            </p>
          </motion.div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-12 max-w-6xl mx-auto">
              {(() => {
                const facultyMembers = committeeMembers.filter(m => m.category === 'faculty').sort((a, b) => (a.priority || 99) - (b.priority || 99));
                const students = committeeMembers.filter(m => (m.category || 'student') === 'student');
                const { coreTeam, committeeMembers: nonCoreMembers } = organizeMembersByRole(students);
                const coreTeamByLevel = groupCoreTeamByLevel(coreTeam);
                const useLevelWise = shouldUseLevelWiseDisplay(coreTeam);

                return (
                  <>
                    {/* Faculty Section - NEW */}
                    {facultyMembers.length > 0 && (
                      <div className="mb-24 relative">
                        <LightningContainerEffect isActive={chargingId && facultyMembers.find(m => m.id === chargingId)} />
                        <motion.div
                          animate={chargingId && facultyMembers.find(m => m.id === chargingId) ? {
                            x: [0, -5, 5, -5, 5, 0],
                            y: [0, 3, -3, 3, -3, 0],
                            transition: { duration: 0.08, repeat: Infinity }
                          } : {}}
                          className="relative z-10"
                        >
                          <div className="flex flex-wrap justify-center gap-10">
                            {facultyMembers.map((member, index) => (
                              <div key={member.id} className="w-64 cursor-pointer relative" onClick={() => handleMemberClick(member)}>
                                {chargingId === member.id && <LightningChargeEffect />}
                                <motion.div
                                  animate={chargingId === member.id ? {
                                    scale: 0.95,
                                    x: [0, -2, 2, -2, 2, 0],
                                    transition: { duration: 0.1, repeat: 6 }
                                  } : {}}
                                >
                                  <Card delay={index * 0.1}>
                                    <div className="p-6 text-center">
                                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                        {member.photoUrl ? (
                                          <img
                                            src={member.photoUrl}
                                            alt={member.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-white text-2xl font-bold">
                                            {member.name?.charAt(0)}
                                          </span>
                                        )}
                                      </div>
                                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {member.name}
                                      </h3>
                                      <p className="text-purple-600 dark:text-purple-400 font-medium whitespace-pre-wrap">
                                        {member.role}
                                      </p>
                                      {member.bio && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 line-clamp-2 leading-relaxed italic">
                                          "{member.bio}"
                                        </p>
                                      )}
                                      <div className="flex justify-center gap-4 mt-6">
                                        {member.linkedin && (
                                          <a href={member.linkedin.startsWith('http') ? member.linkedin : `https://${member.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600/10 hover:bg-blue-600/20 rounded-lg text-blue-600 transition-all hover:-translate-y-1">
                                            <Linkedin className="w-5 h-5" />
                                          </a>
                                        )}
                                        {member.github && (
                                          <a href={member.github.startsWith('http') ? member.github : `https://${member.github}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-600/10 hover:bg-gray-600/20 rounded-lg text-gray-900 dark:text-white transition-all hover:-translate-y-1">
                                            <Github className="w-4 h-4" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </Card>
                                </motion.div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* Core Team Section */}
                    {coreTeam.length > 0 && (
                      <div className="mb-24 relative">
                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-8 relative z-10">
                          Core Team
                        </h3>
                        <LightningContainerEffect isActive={chargingId && coreTeam.find(m => m.id === chargingId)} />
                        <motion.div
                          animate={chargingId && coreTeam.find(m => m.id === chargingId) ? {
                            x: [0, -4, 4, -4, 4, 0],
                            y: [0, 2, -2, 2, -2, 0],
                            transition: { duration: 0.1, repeat: Infinity }
                          } : {}}
                          className="relative z-10"
                        >
                          {useLevelWise ? (
                            <div className="space-y-12">
                              {CORE_TEAM_ROLES.map((role) => {
                                const members = coreTeamByLevel[role] || [];
                                return members.length > 0 ? (
                                  <div key={role}>
                                    <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-6 text-center">
                                      {role}
                                    </h4>
                                    <div className="flex flex-wrap justify-center gap-10">
                                      {members.map((member, index) => (
                                        <div key={member.id} className="w-64 cursor-pointer relative" onClick={() => handleMemberClick(member)}>
                                          {chargingId === member.id && <LightningChargeEffect />}
                                          <motion.div
                                            animate={chargingId === member.id ? {
                                              scale: 0.95,
                                              x: [0, -2, 2, -2, 2, 0],
                                              transition: { duration: 0.1, repeat: 6 }
                                            } : {}}
                                          >
                                            <Card delay={index * 0.05}>
                                              <div className="p-6 text-center">
                                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                                  {member.photoUrl ? (
                                                    <img
                                                      src={member.photoUrl}
                                                      alt={member.name}
                                                      className="w-full h-full object-cover"
                                                    />
                                                  ) : (
                                                    <span className="text-white text-2xl font-bold">
                                                      {member.name?.charAt(0)}
                                                    </span>
                                                  )}
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                  {member.name}
                                                </h3>
                                                <p className="text-blue-600 dark:text-blue-400 font-medium">
                                                  {member.role}
                                                </p>
                                              </div>
                                            </Card>
                                          </motion.div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <div className="space-y-16">
                              {/* Top row: Roles with 1 or 2 members */}
                              <div className="flex flex-wrap justify-center gap-10">
                                {CORE_TEAM_ROLES.map((role) => {
                                  const members = coreTeamByLevel[role] || [];
                                  if (members.length === 0 || members.length > 2) return null;
                                  return (
                                    <div key={role} className="flex flex-col">
                                      <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-6 text-center">
                                        {role}
                                      </h4>
                                      <div className="flex flex-wrap justify-center gap-8">
                                        {members.map((member, index) => (
                                          <div key={member.id} className="w-64 cursor-pointer relative" onClick={() => handleMemberClick(member)}>
                                            {chargingId === member.id && <LightningChargeEffect />}
                                            <motion.div
                                              animate={chargingId === member.id ? {
                                                scale: 0.95,
                                                x: [0, -2, 2, -2, 2, 0],
                                                transition: { duration: 0.1, repeat: 6 }
                                              } : {}}
                                            >
                                              <Card delay={index * 0.05}>
                                                <div className="p-6 text-center">
                                                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                                    {member.photoUrl ? (
                                                      <img
                                                        src={member.photoUrl}
                                                        alt={member.name}
                                                        className="w-full h-full object-cover"
                                                      />
                                                    ) : (
                                                      <span className="text-white text-2xl font-bold">
                                                        {member.name?.charAt(0)}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                    {member.name}
                                                  </h3>
                                                  <p className="text-blue-600 dark:text-blue-400 font-medium">
                                                    {member.role}
                                                  </p>
                                                  <div className="flex justify-center gap-4 mt-6">
                                                    {member.linkedin && (
                                                      <a href={member.linkedin.startsWith('http') ? member.linkedin : `https://${member.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600/5 hover:bg-blue-600/10 rounded-lg text-blue-500 transition-all hover:scale-110">
                                                        <Linkedin className="w-4 h-4" />
                                                      </a>
                                                    )}
                                                    {member.github && (
                                                      <a href={member.github.startsWith('http') ? member.github : `https://${member.github}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-600/5 hover:bg-gray-600/10 rounded-lg text-gray-400 transition-all hover:scale-110">
                                                        <Github className="w-4 h-4" />
                                                      </a>
                                                    )}
                                                  </div>
                                                </div>
                                              </Card>
                                            </motion.div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Bottom sections: Roles with more than 2 members */}
                              {CORE_TEAM_ROLES.map((role) => {
                                const members = coreTeamByLevel[role] || [];
                                if (members.length <= 2) return null;
                                return (
                                  <div key={`multi-${role}`} className="flex flex-col w-full clear-both">
                                    <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-8 text-center">
                                      {role}s
                                    </h4>
                                    <div className="flex flex-wrap justify-center gap-10">
                                      {members.map((member, index) => (
                                        <div key={member.id} className="w-64 cursor-pointer relative" onClick={() => handleMemberClick(member)}>
                                          {chargingId === member.id && <LightningChargeEffect />}
                                          <motion.div
                                            animate={chargingId === member.id ? {
                                              scale: 0.95,
                                              x: [0, -2, 2, -2, 2, 0],
                                              transition: { duration: 0.1, repeat: 6 }
                                            } : {}}
                                          >
                                            <Card delay={index * 0.05}>
                                              <div className="p-6 text-center">
                                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                                  {member.photoUrl ? (
                                                    <img
                                                      src={member.photoUrl}
                                                      alt={member.name}
                                                      className="w-full h-full object-cover"
                                                    />
                                                  ) : (
                                                    <span className="text-white text-2xl font-bold">
                                                      {member.name?.charAt(0)}
                                                    </span>
                                                  )}
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                  {member.name}
                                                </h3>
                                                <div className="flex justify-center mb-4">
                                                  <span className="text-[10px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-[0.3em] bg-blue-500/5 px-3 py-0.5 rounded-full border border-blue-500/10">
                                                    {member.role}
                                                  </span>
                                                </div>
                                                {member.bio && (
                                                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-4 line-clamp-2 leading-snug font-medium italic">
                                                    {member.bio}
                                                  </p>
                                                )}
                                                <div className="flex justify-center gap-4 mt-6">
                                                  {member.linkedin && (
                                                    <a href={member.linkedin.startsWith('http') ? member.linkedin : `https://${member.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600/5 hover:bg-blue-600/10 rounded-lg text-blue-500 transition-all hover:scale-110">
                                                      <Linkedin className="w-4 h-4" />
                                                    </a>
                                                  )}
                                                  {member.github && (
                                                    <a href={member.github.startsWith('http') ? member.github : `https://${member.github}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-600/5 hover:bg-gray-600/10 rounded-lg text-gray-400 transition-all hover:scale-110">
                                                      <Github className="w-4 h-4" />
                                                    </a>
                                                  )}
                                                </div>
                                              </div>
                                            </Card>
                                          </motion.div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      </div>
                    )}

                    {/* Committee Members Section (always full-width below Core Team) */}
                    {nonCoreMembers.length > 0 && (
                      <div className="w-full mt-24 clear-both relative">
                        <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-8 relative z-10">
                          Committee Members
                        </h3>
                        <LightningContainerEffect isActive={chargingId && nonCoreMembers.find(m => m.id === chargingId)} />
                        <motion.div
                          animate={chargingId && nonCoreMembers.find(m => m.id === chargingId) ? {
                            x: [0, -5, 5, -5, 5, 0],
                            y: [0, 2, -2, 2, -2, 0],
                            transition: { duration: 0.1, repeat: Infinity }
                          } : {}}
                          className="relative z-10"
                        >
                          <div className="flex flex-wrap justify-center gap-10">
                            {nonCoreMembers.map((member, index) => (
                              <div key={member.id} className="w-64 cursor-pointer relative" onClick={() => handleMemberClick(member)}>
                                {chargingId === member.id && <LightningChargeEffect />}
                                <motion.div
                                  animate={chargingId === member.id ? {
                                    scale: 0.95,
                                    x: [0, -2, 2, -2, 2, 0],
                                    transition: { duration: 0.1, repeat: 6 }
                                  } : {}}
                                >
                                  <Card delay={index * 0.1}>
                                    <div className="p-6 text-center">
                                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                        {member.photoUrl ? (
                                          <img
                                            src={member.photoUrl}
                                            alt={member.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-white text-2xl font-bold">
                                            {member.name?.charAt(0)}
                                          </span>
                                        )}
                                      </div>
                                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {member.name}
                                      </h3>
                                      <p className="text-blue-600 dark:text-blue-400 font-medium">
                                        {member.role}
                                      </p>
                                      <div className="flex justify-center gap-4 mt-6">
                                        {member.linkedin && (
                                          <a href={member.linkedin.startsWith('http') ? member.linkedin : `https://${member.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600/5 hover:bg-blue-600/10 rounded-lg text-blue-500 transition-all hover:scale-110">
                                            <Linkedin className="w-4 h-4" />
                                          </a>
                                        )}
                                        {member.github && (
                                          <a href={member.github.startsWith('http') ? member.github : `https://${member.github}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-600/5 hover:bg-gray-600/10 rounded-lg text-gray-400 transition-all hover:scale-110">
                                            <Github className="w-4 h-4" />
                                          </a>
                                        )}
                                      </div>
                                        </div>
                                      </Card>
                                    </motion.div>
                                  </div>
                                ))}
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {coreTeam.length === 0 && nonCoreMembers.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No committee members found yet.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {/* Member Selection Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Full-Screen Lightning Crack (White Flash) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0 bg-white z-[110] pointer-events-none"
            />

            {/* Master Branching Bolts (Red & Blue Staggered strike) */}
            <svg className="absolute inset-0 w-full h-full z-[105] pointer-events-none overflow-visible">
              {[...Array(6)].map((_, i) => (
                <motion.path
                  key={i}
                  d={`M ${window.innerWidth / 2} ${window.innerHeight / 2} L ${Math.random() * window.innerWidth} ${Math.random() * window.innerHeight}`}
                  stroke={i % 2 === 0 ? "#ff4d4d" : "#0066ff"}
                  strokeWidth="12"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: [0, 1], opacity: [0, 1, 0] }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  filter="url(#megaEnergyGlow)"
                />
              ))}
            </svg>

            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
              onClick={() => setSelectedMember(null)}
            />

            {/* Modal Content - Dynamic Energy Stage (Fully Responsive & Scrollable) */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 100, rotateX: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 100, filter: "brightness(0) blur(20px)" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="relative w-[95%] sm:w-[90%] md:max-w-5xl max-h-[85vh] md:max-h-[90vh] flex flex-col bg-white/95 dark:bg-[#080808]/95 backdrop-blur-2xl md:backdrop-blur-[50px] rounded-[2rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1),_0_0_100px_rgba(0,102,255,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5),_0_0_100px_rgba(0,102,255,0.15)] border-2 border-blue-500/20 z-[120]"
            >
              {/* Orbiting Energy Orbs Behind Container Content - Disabled on Mobile for Perf */}
              <div className="hidden md:block absolute inset-0 z-0 opacity-20 pointer-events-none">
                <motion.div
                  animate={{ x: [-200, 200, -200], y: [-150, 150, -150] }}
                  transition={{ duration: 45, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,_rgba(220,38,38,0.2)_0%,_transparent_70%)] blur-[100px] rounded-full"
                />
                <motion.div
                  animate={{ x: [200, -200, 200], y: [150, -150, 200] }}
                  transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.2)_0%,_transparent_70%)] blur-[100px] rounded-full"
                />
              </div>

              {/* After-Shock Glow */}
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(0,102,255,0.3)",
                    "0 0 80px rgba(255,77,77,0.5)",
                    "0 0 20px rgba(0,102,255,0.3)"
                  ]
                }}
                transition={{ duration: 0.1, repeat: Infinity }}
                className="absolute inset-0 rounded-[2rem] md:rounded-[3.5rem] pointer-events-none z-50 ring-2 ring-blue-500/10 dark:ring-white/10"
              />

              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-red-500 hover:text-white transition-all z-50 group hover:rotate-90 backdrop-blur-md shadow-md"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-gray-800 dark:text-white/80 group-hover:text-white" />
              </button>

              {/* The Inner Scrollable Wrapper */}
              <div className="flex flex-col md:flex-row w-full h-full overflow-y-auto overflow-x-hidden z-10 relative custom-scrollbar">
                
                {/* Image Section - The "Hero" Stage */}
                <div className="w-full md:w-5/12 relative bg-[#f8fafc]/80 dark:bg-[#010101]/80 flex items-center justify-center p-6 md:p-12 overflow-hidden min-h-[200px] sm:min-h-[300px] md:min-h-auto flex-shrink-0">
                  {/* Position-Shifting Energy Plasma - Blur reduced for performance */}
                  <motion.div
                    animate={{ x: [0, 30, -30, 0], y: [0, -20, 20, 0], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-50%] bg-[radial-gradient(circle_at_center,_rgba(255,77,77,0.2)_0%,_transparent_70%)] blur-xl md:blur-[80px] will-change-transform"
                  />
                  <motion.div
                    animate={{ x: [0, -30, 30, 0], y: [0, 20, -20, 0], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear", delay: 1 }}
                    className="absolute inset-[-50%] bg-[radial-gradient(circle_at_center,_rgba(0,102,255,0.2)_0%,_transparent_70%)] blur-xl md:blur-[80px] will-change-transform"
                  />

                  {/* Persistent Photo-Source Aura */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3)_0%,_transparent_80%)] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_80%)]" />

                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[180px] sm:w-[240px] md:w-[310px] h-[180px] sm:h-[240px] md:h-[310px] border-2 border-blue-500/20 rounded-full hidden sm:block will-change-transform"
                  />

                  {/* Profile Photo Stage */}
                  <motion.div
                    animate={{ y: [0, -5, 0], scale: [1, 1.02, 1] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 z-10 group mt-2 md:mt-0 will-change-transform"
                  >
                    <div className="absolute -inset-4 md:-inset-6 bg-white/40 dark:bg-white/20 blur-xl md:blur-3xl opacity-30 group-hover:opacity-100 transition-opacity" />
                    <div className="w-full h-full rounded-2xl md:rounded-3xl overflow-hidden border-2 border-gray-300 dark:border-white/30 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                      {selectedMember.photoUrl ? (
                        <img
                          src={selectedMember.photoUrl}
                          alt={selectedMember.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-gray-500 dark:text-white text-4xl md:text-6xl font-black">
                          {selectedMember.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Details Section - Content Stage */}
                <div className="w-full md:w-7/12 p-6 sm:p-8 md:p-12 bg-gradient-to-b md:bg-gradient-to-r from-transparent to-gray-100/50 dark:to-white/5 flex flex-col justify-center">
                  <motion.div initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    
                    <div className="mb-8 md:mb-10 text-center md:text-left pt-2 md:pt-0">
                      <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-3 md:mb-4 drop-shadow-sm">
                        {selectedMember.name}
                      </h2>
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className="px-4 md:px-5 py-2 bg-blue-100 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-500/20 rounded-full backdrop-blur-md shadow-sm">
                          <p className="font-black text-[9px] md:text-xs uppercase tracking-[0.4em] md:tracking-[0.5em] text-blue-700 dark:text-blue-400 leading-none">
                            {selectedMember.role}
                          </p>
                        </motion.div>
                      </div>
                    </div>

                    {/* High-End Detail Chips */}
                    {selectedMember.category !== 'faculty' && (
                      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 gap-3 md:gap-6 md:grid-cols-2 mb-8 md:mb-10">
                        <div className="group relative px-5 py-4 md:px-6 md:py-6 bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl transition-all hover:border-blue-500/50 flex flex-col justify-center shadow-sm dark:shadow-none">
                          <span className="block text-[8px] md:text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.3em] mb-1.5 md:mb-2 opacity-80">Academic Year</span>
                          <span className="text-lg md:text-2xl font-black text-gray-900 dark:text-white leading-tight">{selectedMember.year || 'N/A'}</span>
                        </div>
                        <div className="group relative px-5 py-4 md:px-6 md:py-6 bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl transition-all hover:border-purple-500/50 flex flex-col justify-center shadow-sm dark:shadow-none">
                          <span className="block text-[8px] md:text-[10px] font-black text-purple-600 dark:text-purple-500 uppercase tracking-[0.3em] mb-1.5 md:mb-2 opacity-80">Branch</span>
                          <span className="text-lg md:text-2xl font-black text-gray-900 dark:text-white leading-tight whitespace-pre-wrap">{selectedMember.branch || 'N/A'}</span>
                        </div>
                      </motion.div>
                    )}

                    {selectedMember.bio && (
                      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8 md:mb-12 max-w-2xl">
                        <h4 className="text-[9px] md:text-xs font-black text-gray-500 dark:text-white/40 uppercase tracking-[0.5em] md:tracking-[0.6em] mb-4 md:mb-6 text-center md:text-left">The Narrative</h4>
                        <p className="text-gray-800 dark:text-gray-300 leading-relaxed font-medium text-base md:text-xl text-center md:text-left">
                          <span className="text-4xl md:text-6xl font-black mr-2 text-blue-600 dark:text-blue-400 float-left leading-[0.7] mt-1 pr-1">{selectedMember.bio.charAt(0)}</span>
                          {selectedMember.bio.slice(1)}
                        </p>
                      </motion.div>
                    )}

                    {/* Social Hub */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="pb-6 md:pb-0">
                      <h4 className="text-[10px] md:text-[11px] font-black text-gray-500 dark:text-white/40 uppercase tracking-[0.4em] md:tracking-[0.5em] mb-6 text-center md:text-left">Connect in Orbit</h4>
                      <div className="flex flex-wrap gap-4 md:gap-5 justify-center md:justify-start">
                        {selectedMember.linkedin && (
                          <a href={selectedMember.linkedin.startsWith('http') ? selectedMember.linkedin : `https://${selectedMember.linkedin}`} target="_blank" rel="noopener noreferrer" className="group relative p-4 md:p-5 bg-white border border-gray-200 dark:bg-white/5 dark:backdrop-blur-md rounded-2xl dark:border-white/10 hover:border-blue-500/50 transition-all shadow-sm dark:shadow-none">
                            <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity" />
                            <Linkedin className="relative z-10 w-5 h-5 md:w-6 md:h-6 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                          </a>
                        )}
                        {selectedMember.github && (
                          <a href={selectedMember.github.startsWith('http') ? selectedMember.github : `https://${selectedMember.github}`} target="_blank" rel="noopener noreferrer" className="group relative p-4 md:p-5 bg-white border border-gray-200 dark:bg-white/5 dark:backdrop-blur-md rounded-2xl dark:border-white/10 hover:border-gray-900 transition-all shadow-sm dark:shadow-none">
                            <div className="absolute inset-0 bg-gray-900/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity" />
                            <Github className="relative z-10 w-5 h-5 md:w-6 md:h-6 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                          </a>
                        )}
                        {selectedMember.portfolio && (
                          <a href={selectedMember.portfolio.startsWith('http') ? selectedMember.portfolio : `https://${selectedMember.portfolio}`} target="_blank" rel="noopener noreferrer" className="group relative p-4 md:p-5 bg-white border border-gray-200 dark:bg-white/5 dark:backdrop-blur-md rounded-2xl dark:border-white/10 hover:border-teal-500/50 transition-all shadow-sm dark:shadow-none">
                            <div className="absolute inset-0 bg-teal-600/10 opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity" />
                            <Globe className="relative z-10 w-5 h-5 md:w-6 md:h-6 text-gray-500 dark:text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                          </a>
                        )}
                        {selectedMember.otherLink && (
                          <a href={selectedMember.otherLink.startsWith('http') ? selectedMember.otherLink : `https://${selectedMember.otherLink}`} target="_blank" rel="noopener noreferrer" className="group relative p-4 md:p-5 bg-white border border-gray-200 dark:bg-white/5 dark:backdrop-blur-md rounded-2xl dark:border-white/10 hover:border-purple-500/50 transition-all shadow-sm dark:shadow-none">
                            <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity" />
                            <ExternalLink className="relative z-10 w-5 h-5 md:w-6 md:h-6 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div >
  );
};

export default HomePage;