import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import {
   FiCalendar, FiUser, FiClock, FiArrowLeft, FiAward, FiTarget, FiZap,
   FiLayers, FiUsers, FiImage, FiTrendingUp, FiLinkedin, FiLayout,
   FiActivity, FiMapPin, FiEdit, FiInstagram, FiYoutube, FiMessageCircle, FiLink, FiShare2
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import AnimatedSection from "../components/ui/AnimatedSection";
import EventEditModal from "../components/events/EventEditModal";

const EventDetailPage = () => {
   const { id } = useParams();
   const [event, setEvent] = useState(null);
   const [loading, setLoading] = useState(true);
   const [scrolled, setScrolled] = useState(false);
   const { user } = useAuth();
   const navigate = useNavigate();
   const [showEditModal, setShowEditModal] = useState(false);

   useEffect(() => {
      const handleScroll = () => setScrolled(window.scrollY > 50);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
   }, []);

   const handleEditSuccess = (updatedData) => {
      setEvent({ ...event, meta: updatedData.meta });
   };

   useEffect(() => {
      const fetchEvent = async () => {
         try {
            const docRef = doc(db, "events", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
               setEvent({ id: docSnap.id, ...docSnap.data() });
            } else {
               navigate("/events");
            }
         } catch (error) {
            console.error("Error fetching event:", error);
         } finally {
            setLoading(false);
         }
      };
      fetchEvent();
   }, [id, navigate]);
   if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><LoadingSpinner size="lg" /></div>;
   if (!event) return null;

   const { meta } = event;

   return (
      <div className="min-h-screen bg-white dark:bg-gray-950 selection:bg-blue-500 selection:text-white pb-32 relative overflow-hidden font-sans pt-16">

          {/* Global Back Navigation (Fixed) - Adjusted for Navbar height */}
          <Link
             to="/events"
             className={`fixed top-24 left-6 md:top-28 md:left-8 z-[100] flex items-center justify-center w-12 h-12 ${scrolled ? 'bg-white/80 dark:bg-gray-900/80 text-gray-950 dark:text-white shadow-xl' : 'bg-black/20 text-white'} backdrop-blur-xl border border-white/10 rounded-full transition-all duration-500 hover:scale-110 hover:bg-blue-600 hover:text-white group`}
             title="Return to Events"
          >
             <FiArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </Link>

         {/* Premium Atmospheric Glows (From Somdesign) */}
         <div className="absolute top-[5%] -right-32 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
         <div className="absolute top-[35%] -left-32 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-600/5 blur-[100px] rounded-full pointer-events-none z-0" />

         {/* Clean Banner Section - Smart Engine */}
         <section className="relative w-full overflow-hidden bg-gray-950 border-b border-gray-100 dark:border-gray-900 z-10 flex items-center justify-center group min-h-[40vh]">
            
            {/* Event Type Badge (Top Right) - Adjusted for Navbar height */}
            <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="absolute top-8 right-6 md:top-10 md:right-8 z-50 px-5 py-2 bg-blue-600/20 backdrop-blur-md border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl flex items-center gap-2"
            >
               <FiActivity className="w-3 h-3 animate-pulse" />
               <span>{meta?.type || "Event"}</span>
            </motion.div>

            {meta?.imageUrl ? (
               <>
                  {/* Blurred backdrop image to fill empty space */}
                  <div className="absolute inset-0 z-0 opacity-40 blur-3xl scale-110">
                     <img src={meta.imageUrl} alt=" " className="w-full h-full object-cover" />
                  </div>

                  {/* Main Full-Size Image (Object Contain) */}
                  <div className="relative z-10 w-full flex justify-center">
                     <img
                        src={meta.imageUrl}
                        alt="Event Banner"
                        className="w-full h-auto max-h-[80vh] object-contain drop-shadow-2xl"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-950 via-transparent to-transparent pointer-events-none" />
                  </div>
               </>
            ) : (
               /* FALLBACK: Monumental Name Highlight */
               <div className="relative z-10 w-full max-w-7xl px-12 py-32 md:py-48 text-center space-y-12">
                  <motion.div
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="space-y-6"
                   >
                     <div className="h-[1px] w-24 bg-blue-600 mx-auto" />
                     <h1 className="text-5xl md:text-9xl font-black text-white uppercase tracking-[-0.06em] leading-none">
                        {meta?.title}
                     </h1>
                     <div className="text-[10px] font-black uppercase tracking-[0.8em] text-blue-500">
                        Highlighting Innovation
                     </div>
                  </motion.div>
               </div>
            )}
         </section>

         {/* Main Title Section - Balanced & Centered */}
         <div className="max-w-6xl mx-auto px-6 py-20 relative z-10">
            <div className="flex flex-col items-center text-center space-y-8" id="event-title-section">


               {/* Title Content */}
               <div className="space-y-6 max-w-5xl relative">
                  {/* Admin Edit Context */}
                  {user?.email && (
                     <motion.button
                        whileHover={{ scale: 1.1, rotate: 12 }}
                        onClick={() => setShowEditModal(true)}
                        className="absolute -top-16 -right-12 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full text-blue-600 shadow-2xl z-50 hover:shadow-blue-500/20 transition-all"
                     >
                        <FiEdit className="w-5 h-5" />
                     </motion.button>
                  )}

                  <motion.h1
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="text-4xl md:text-7xl font-black text-gray-950 dark:text-white uppercase tracking-tighter leading-none"
                  >
                     {meta?.title}
                  </motion.h1>

                  {meta?.sessionBy && (
                     <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xs md:text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.5em] pt-4"
                     >
                        A Session By {meta.sessionBy}
                     </motion.p>
                  )}
               </div>

               {/* "Proper Small" Quick Info Pill */}
               {(meta?.startDate || meta?.venue || meta?.impactStat || meta?.growthFactor) && (
                  <motion.div
                     initial={{ opacity: 0, y: 30 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.3 }}
                     className="group relative flex flex-wrap justify-center gap-x-12 gap-y-6 py-6 px-12 md:py-8 md:px-16 bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] backdrop-blur-3xl overflow-hidden hover:shadow-blue-500/10 transition-all duration-700"
                  >
                     {/* Gloss sweep */}
                     <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1500ms] pointer-events-none" />

                     {[
                        { label: 'Date', value: meta?.startDate ? new Date(meta.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' }) : null, icon: FiCalendar, color: 'text-blue-500' },
                        { label: 'Venue', value: meta?.venue, icon: FiMapPin, color: 'text-purple-500' },
                        { label: 'Growth', value: meta?.impactStat || meta?.growthFactor, icon: FiTarget, color: 'text-emerald-500' }
                     ]
                        .filter(item => item.value)
                        .map((item, idx, filtered) => (
                           <div key={idx} className="flex items-center gap-4 group/item">
                              <div className={`w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center ${item.color} group-hover/item:scale-110 transition-transform`}>
                                 <item.icon className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col text-left">
                                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{item.label}</span>
                                 <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight leading-none">{item.value}</span>
                              </div>
                              {idx < filtered.length - 1 && (
                                 <div className="hidden lg:block h-6 w-px bg-gray-100 dark:bg-white/10 ml-8" />
                              )}
                           </div>
                        ))}
                  </motion.div>
               )}
            </div>
         </div>



         {/* Main Content Sections */}
         <div className="max-w-6xl mx-auto px-6 mt-12 space-y-16">

            {/* About the Event */}
            {meta?.aboutEvent && (
               <AnimatedSection className="relative py-24 border-b border-black/5 dark:border-white/10">
                  <div className="space-y-12">
                     <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-gray-950 dark:text-white uppercase tracking-tighter leading-none">
                        The <br />
                        <span className="font-serif italic lowercase tracking-tight font-normal text-blue-600 dark:text-blue-400">overview</span>
                     </h2>

                     <p className="text-xl md:text-2xl lg:text-3xl font-serif text-gray-800 dark:text-gray-300 leading-[1.6] tracking-tight w-full italic opacity-90">
                        {meta.aboutEvent}
                     </p>
                  </div>
               </AnimatedSection>
            )}

            {/* Event Gallery */}
            {meta?.gallery?.length > 0 && (
               <AnimatedSection className="space-y-12 py-16 border-b border-black/5 dark:border-white/10">
                  <div className="flex flex-col items-center text-center space-y-4">
                     <h3 className="text-3xl md:text-5xl font-light text-gray-950 dark:text-white tracking-[-0.04em] uppercase leading-none">Event <span className="font-serif italic lowercase">Gallery</span></h3>
                  </div>

                  <div className="flex overflow-x-auto gap-8 px-12 pb-16 snap-x snap-mandatory scrollbar-hide no-scrollbar scroll-smooth">
                     {meta.gallery.map((img, i) => (
                        <div key={i} className="flex-none w-[300px] md:w-[600px] aspect-[16/10] bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10 overflow-hidden snap-center transition-all duration-700 group">
                           <img
                              src={img}
                              alt={`Gallery ${i}`}
                              className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110"
                           />
                        </div>
                     ))}
                     <div className="flex-none w-12" />
                  </div>

                  <div className="flex justify-center items-center gap-4 text-black/20 dark:text-white/20">
                     <span className="text-[8px] font-black uppercase tracking-widest">Scroll to Explore</span>
                     <div className="w-32 h-px bg-black/5 dark:bg-white/5" />
                  </div>
               </AnimatedSection>
            )}

            {/* Section: Honors / Masterminds */}
            {meta?.honorees?.length > 0 && (
               <AnimatedSection className="py-24 space-y-16 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-3 px-4 py-2 bg-purple-50 dark:bg-purple-600/10 rounded-2xl border border-purple-100 dark:border-purple-500/20">
                        <FiAward className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-600 dark:text-purple-400">Recognition</span>
                     </div>
                     <h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">
                        {meta.honorTitle || "Master Minds"}
                     </h2>
                     <div className="h-[1px] flex-grow bg-gradient-to-r from-gray-100 dark:from-white/10 to-transparent" />
                  </div>

                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                     {meta.honorees.map((honoree, i) => (
                        <div key={i} className="group relative p-10 bg-purple-50/50 dark:bg-purple-900/10 rounded-[2.5rem] border border-purple-100/50 dark:border-purple-500/10 shadow-[0_20px_40px_-15px_rgba(147,51,234,0.1)] hover:shadow-[0_32px_64px_-16px_rgba(147,51,234,0.2)] transition-all duration-700 overflow-hidden">
                           <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />

                           <div className="relative z-10 space-y-4">
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-purple-500 uppercase tracking-[0.4em] mb-2">Honored Participant</span>
                                 <h3 className="text-2xl md:text-3xl font-black text-gray-950 dark:text-white uppercase tracking-tighter leading-none group-hover:text-purple-600 transition-colors">
                                    {honoree.name}
                                 </h3>
                              </div>
                              <div className="pt-4 border-t border-purple-100 dark:border-purple-500/20 flex flex-wrap items-center gap-3">
                                 <div className="flex items-center gap-2">
                                    <FiLayers className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{honoree.branch}</span>
                                 </div>
                                 {honoree.addition && (
                                    <span className="px-2 py-0.5 bg-purple-100/50 dark:bg-purple-600/10 text-purple-600 dark:text-purple-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-purple-200/50 dark:border-purple-500/20">
                                       {honoree.addition}
                                    </span>
                                 )}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </AnimatedSection>
            )}


            {/* Section: Speakers (Clean Premium Format) */}
            {meta?.speakers?.length > 0 && (
               <AnimatedSection className="py-24 space-y-16">
                  {/* Premium Section Header */}
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-600/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                        <FiUsers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 dark:text-blue-400">Panel</span>
                     </div>
                     <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">
                        Executive Speakers
                     </h2>
                     <div className="h-[1px] flex-grow bg-gradient-to-r from-gray-100 dark:from-white/10 to-transparent" />
                  </div>

                  {/* Speaker Grid */}
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                     {meta.speakers.map((speaker, i) => (
                        <div key={i} className="group relative p-10 bg-gray-50/50 dark:bg-gray-900/40 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(147,51,234,0.1)] hover:shadow-[0_32px_64px_-16px_rgba(59,130,246,0.2)] transition-all duration-700 overflow-hidden">

                           {/* Shining Interaction Overlay */}
                           <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />

                           <div className="relative z-10 space-y-6">
                              <div className="flex justify-between items-start gap-4">
                                 <h3 className="text-2xl font-black text-gray-950 dark:text-white uppercase tracking-tighter leading-none">{speaker.name}</h3>
                                 <span className={`px-4 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${speaker.type === 'guest' ? 'bg-purple-100/50 text-purple-600 dark:bg-purple-600/20 dark:text-purple-400' : 'bg-blue-100/50 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400'}`}>
                                    {speaker.type || 'Internal'}
                                 </span>
                              </div>
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none">{speaker.role}</p>

                              <div className="flex items-center gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                                 {speaker.linkedin && (
                                    <a href={speaker.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-white dark:bg-gray-800 rounded-xl text-gray-400 hover:text-blue-600 hover:shadow-lg transition-all">
                                       <FiLinkedin className="w-4 h-4" />
                                    </a>
                                 )}
                                 {speaker.instagram && (
                                    <a href={speaker.instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-white dark:bg-gray-800 rounded-xl text-gray-400 hover:text-pink-600 hover:shadow-lg transition-all">
                                       <FiInstagram className="w-4 h-4" />
                                    </a>
                                 )}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </AnimatedSection>
            )}


        {/* Section: Key Highlights & Learning Outcomes (Restored as per your snippet) */}
        <div className="grid lg:grid-cols-2 gap-20">
           {meta?.highlights?.length > 0 && (
             <AnimatedSection className="space-y-12">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                       <FiAward className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 dark:text-orange-400">Value</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">
                       Key Highlights
                    </h2>
                 </div>
                <div className="space-y-6">
                  {meta.highlights.map((h, i) => (
                    <div key={i} className="group relative flex items-center gap-6 p-8 rounded-[2.5rem] bg-orange-50/30 dark:bg-orange-500/5 border border-orange-100 dark:border-white/5 shadow-[0_20px_40px_-15px_rgba(249,115,22,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.15)] hover:shadow-[0_32px_64px_-16px_rgba(249,115,22,0.3)] transition-all duration-700 overflow-hidden">
                       <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-orange-500/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 pointer-events-none" />
                       <div className="relative z-10 w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 text-xl font-black group-hover:scale-110 transition-transform">
                          {i + 1}
                       </div>
                       <span className="relative z-10 text-xl font-bold text-gray-800 dark:text-white leading-tight">{h}</span>
                    </div>
                  ))}
                </div>
             </AnimatedSection>
           )}

           {meta?.whatYouLearn?.length > 0 && (
             <AnimatedSection className="space-y-12">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                       <FiTrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 dark:text-emerald-400">Skills</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">
                       What You'll Learn
                    </h2>
                 </div>
                <div className="space-y-6">
                  {meta.whatYouLearn.map((l, i) => (
                    <div key={i} className="group relative flex items-center gap-6 p-8 rounded-[2.5rem] bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100 dark:border-white/5 shadow-[0_20px_40px_-15px_rgba(16,185,129,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:shadow-[0_32px_64px_-16px_rgba(16,185,129,0.3)] transition-all duration-700 overflow-hidden">
                       <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 pointer-events-none" />
                       <FiZap className="relative z-10 w-8 h-8 text-emerald-500 group-hover:animate-pulse" />
                       <span className="relative z-10 text-xl font-bold text-gray-800 dark:text-white leading-tight">{l}</span>
                    </div>
                  ))}
                </div>
             </AnimatedSection>
           )}
        </div>





            {/* Section: Timeline (Execution Phases) */}
            {meta?.activities?.length > 0 && (
               <AnimatedSection className="py-24 space-y-24 border-b border-black/5 dark:border-white/10">
                  {/* Premium Timeline Header */}
                  <div className="text-center space-y-6">
                     <div className="inline-flex items-center gap-4 px-6 py-2 bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10">
                        <FiActivity className="w-3 h-3 text-blue-600" />
                        <span className="text-[9px] font-black uppercase tracking-[0.6em] text-black/50 dark:text-white/40">Execution Phases</span>
                     </div>
                     <h3 className="text-4xl md:text-7xl font-black text-black dark:text-white tracking-[-0.05em] uppercase leading-none">The Timeline</h3>
                  </div>

                  <div className="max-w-4xl mx-auto space-y-12 relative">
                     {/* Refined Side-Axis Line */}
                     <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-600 via-blue-500/10 to-transparent z-0" />

                     {meta.activities.map((a, i) => (
                        <div key={i} className="group relative pl-16 md:pl-24 py-4 transition-all duration-700">
                           {/* Axis Node - The Glowing Progress Indicator */}
                           <div className="absolute left-[20px] md:left-[28px] top-10 flex items-center justify-center">
                              <div className="absolute w-8 h-8 bg-blue-500/10 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="w-3.5 h-3.5 bg-white dark:bg-gray-900 border-[2px] border-blue-600 rounded-full z-10 group-hover:bg-blue-600 transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]" />
                           </div>

                           {/* Premium Roadmap Content Card */}
                           <div className="relative p-10 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-[2.5rem] hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-700 shadow-sm hover:shadow-2xl group-hover:-translate-y-2 overflow-hidden">
                              {/* Shining Interaction Glow */}
                              <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />

                              <div className="space-y-4">
                                 <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-blue-600/40 dark:text-blue-400/40 uppercase tracking-[0.4em]">Phase {String(i + 1).padStart(2, '0')}</span>
                                    <div className="h-px w-8 bg-blue-600/20" />
                                 </div>
                                 <h4 className="text-xl md:text-3xl font-black text-gray-950 dark:text-white uppercase tracking-tighter leading-none group-hover:text-blue-600 transition-colors duration-500">
                                    {a}
                                 </h4>
                              </div>

                              {/* Corner Watermark */}
                              <div className="absolute -right-4 -bottom-4 text-9xl font-black text-black/5 dark:text-white/5 group-hover:text-blue-500/10 leading-none tracking-tight pointer-events-none transition-colors duration-700">
                                 {String(i + 1).padStart(2, '0')}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </AnimatedSection>
            )}

            {/* Sponsors */}
            {meta?.sponsors?.length > 0 && (
               <AnimatedSection className="py-16 border-b border-black/5 dark:border-white/10">
                  <div className="flex flex-col items-center text-center space-y-8 mb-16">
                     <h3 className="text-3xl md:text-5xl font-light text-gray-950 dark:text-white tracking-tighter uppercase">
                        Our <span className="font-serif italic lowercase">Sponsors</span>
                     </h3>
                  </div>
                  <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24 max-w-5xl mx-auto px-12">
                     {meta.sponsors.map((s, i) => (
                        <div key={i} className="group flex flex-col items-center gap-6">
                           <img
                              src={s.logoUrl}
                              alt={s.name}
                              className="h-16 md:h-20 object-contain brightness-0 dark:invert opacity-40 group-hover:opacity-100 transition-all duration-700"
                           />
                           <span className="text-[8px] font-black text-black/20 dark:text-white/20 uppercase tracking-[0.4em] group-hover:text-black dark:group-hover:text-white transition-colors">
                              {s.name}
                           </span>
                        </div>
                     ))}
                  </div>
               </AnimatedSection>
            )}

            {/* Social Connect (Premium Glass Pills) */}
            {(meta?.instagram || meta?.linkedin || meta?.youtube || meta?.whatsapp) && (
               <AnimatedSection className="py-24 border-t border-black/5 dark:border-white/10">
                  <div className="flex flex-col items-center text-center space-y-16">
                     <div className="flex flex-col items-center gap-4">
                        <div className="h-px w-16 bg-blue-600/30" />
                        <h3 className="text-xl md:text-2xl font-black text-gray-950 dark:text-white tracking-[0.4em] uppercase">Join the Collective</h3>
                     </div>

                     <div className="flex flex-wrap justify-center gap-6">
                        {[
                           { name: 'Instagram', icon: FiInstagram, link: meta?.instagram, color: 'hover:bg-pink-500', glow: 'shadow-pink-500/20' },
                           { name: 'LinkedIn', icon: FiLinkedin, link: meta?.linkedin, color: 'hover:bg-blue-600', glow: 'shadow-blue-600/20' },
                           { name: 'YouTube', icon: FiYoutube, link: meta?.youtube, color: 'hover:bg-red-600', glow: 'shadow-red-600/20' },
                           { name: 'WhatsApp', icon: FiMessageCircle, link: meta?.whatsapp, color: 'hover:bg-green-500', glow: 'shadow-green-500/20' }
                        ]
                           .filter(platform => platform.link)
                           .map((platform, idx) => (
                              <motion.a
                                 key={idx}
                                 href={platform.link}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 whileHover={{ scale: 1.05, y: -5 }}
                                 className={`group relative flex items-center gap-4 px-10 py-5 bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/10 rounded-full transition-all duration-500 hover:shadow-2xl ${platform.glow} overflow-hidden`}
                              >
                                 {/* Shining Sweep Effect */}
                                 <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />

                                 <platform.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors relative z-10" />
                                 <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-600 dark:text-gray-300 group-hover:text-white transition-colors relative z-10">{platform.name}</span>
                                 <div className={`absolute inset-0 ${platform.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                              </motion.a>
                           ))}
                     </div>
                  </div>
               </AnimatedSection>
            )}

            {/* Event Outcome / Impact (Cinematic Focus) */}
            {meta?.impact && (
               <AnimatedSection className="relative min-h-[60vh] flex items-center justify-center py-32 px-12 overflow-hidden mt-24 bg-gray-50/50 dark:bg-[#050505] border border-black/5 dark:border-white/5 rounded-[4rem]">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                     style={{ backgroundImage: 'radial-gradient(#3b82f6 0.5px, transparent 0.5px)', backgroundSize: '48px 48px' }} />

                  <div className="relative z-10 max-w-5xl w-full text-center space-y-20">
                     <div className="flex flex-col items-center gap-6">
                        <FiActivity className="w-8 h-8 text-blue-600/40" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.8em] text-black/40 dark:text-white/40">Event Genesis & Impact</h4>
                     </div>

                     <p className="text-2xl md:text-3xl lg:text-4xl font-serif italic text-gray-950 dark:text-white leading-[1.4] tracking-tight max-w-4xl mx-auto">
                        {meta.impact}
                     </p>

                     <div className="pt-12 flex items-center justify-center">
                        <Link
                           to="/join"
                           className="group relative px-20 py-8 bg-black dark:bg-white text-white dark:text-black rounded-full overflow-hidden transition-all duration-700 hover:scale-105 hover:shadow-[0_20px_50px_rgba(59,130,246,0.3)]"
                        >
                           {/* Internal Shining Ripple */}
                           <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />

                           <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.5em]">Connect with us</span>
                        </Link>
                     </div>
                  </div>
               </AnimatedSection>
            )}

         </div>

         <EventEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            editingEvent={event}
            onSuccess={handleEditSuccess}
         />
      </div>
   );
};

export default EventDetailPage;
