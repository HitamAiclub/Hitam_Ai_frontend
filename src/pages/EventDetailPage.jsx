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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!event) return null;

  const { meta } = event;

  return (
    <div className="min-h-screen pt-16 bg-white dark:bg-gray-950 selection:bg-blue-500 selection:text-white pb-32 relative overflow-hidden">
      {/* Premium Background Glows */}
      <div className="absolute top-[10%] -right-32 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[40%] -left-32 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-600/5 blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[10%] -right-32 w-[500px] h-[500px] bg-pink-500/5 dark:bg-pink-600/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Clean Banner Section - Large Full-Width Visual */}
      <section className="relative h-[85vh] w-full overflow-hidden bg-gray-950 border-b border-gray-100 dark:border-gray-900 z-10">
        <div className="absolute inset-0 z-0">
           <img 
             src={meta?.imageUrl} 
             alt="" 
             className="w-full h-full object-cover opacity-70"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-950 via-transparent to-transparent" />
        </div>
      </section>

      {/* Main Content Area - Starts AFTER the full banner */}
      <div className="max-w-6xl mx-auto px-6 py-24 relative z-10 bg-white dark:bg-gray-950">
         <div className="flex flex-col items-center text-center space-y-10" id="event-title-section">
            
            {/* Branding & Type Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
               <div className="px-5 py-1.5 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg">
                  <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.4em]">HITAM AI Club</span>
               </div>
               <div className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-lg shadow-lg">
                  {meta?.type || "Event"}
               </div>
            </motion.div>

            {/* Main Title Section */}
            <div className="space-y-6 max-w-5xl relative">
               {/* Admin Control - Contextual to title */}
               {user && (
                 <motion.button
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   onClick={() => setShowEditModal(true)}
                   className="absolute -top-12 right-0 md:-right-16 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full text-gray-400 hover:text-blue-600 hover:shadow-2xl transition-all"
                   title="Edit Layout"
                 >
                   <FiEdit className="w-5 h-5" />
                 </motion.button>
               )}

               <motion.h1 
                 initial={{ opacity: 0, y: 30 }} 
                 animate={{ opacity: 1, y: 0 }}
                 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-950 dark:text-white uppercase tracking-tighter leading-[0.95]"
               >
                 {meta?.title}
               </motion.h1>
               
               {meta?.sessionBy && (
                 <motion.p 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 0.2 }}
                   className="text-sm md:text-base font-black text-blue-600 uppercase tracking-[0.5em]"
                 >
                   A Session By {meta.sessionBy}
                 </motion.p>
               )}
            </div>

            {/* Event Details Bar (Quick Info) - Strictly Dynamic & Glowing */}
            <motion.div 
               initial={{ opacity: 0, y: 40 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="group relative w-full flex flex-wrap justify-center gap-8 p-12 bg-white/95 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[4rem] shadow-[0_48px_80px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_48px_80px_-20px_rgba(59,130,246,0.15)] hover:shadow-[0_64px_100px_-30px_rgba(59,130,246,0.25)] backdrop-blur-3xl overflow-hidden transition-all duration-700"
            >
               {/* Shining Overlay */}
               <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />

               {[
                 { label: 'Calendar Date', value: meta?.startDate ? new Date(meta.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' }) : null, icon: FiCalendar, color: 'text-blue-600' },
                 { label: 'Execution Type', value: meta?.type, icon: FiClock, color: 'text-purple-600' },
                 { label: 'Official Venue', value: meta?.venue, icon: FiMapPin, color: 'text-pink-600' },
                 { label: 'Growth Factor', value: meta?.impactStat || meta?.growthFactor, icon: FiTarget, color: 'text-emerald-600' }
               ]
               .filter(item => item.value)
               .map((item, idx, filtered) => (
                 <div key={idx} className={`relative z-10 flex flex-col items-center text-center space-y-2 px-8 ${idx !== filtered.length - 1 ? 'border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/10 pb-6 md:pb-0' : ''}`}>
                    <item.icon className={`w-6 h-6 ${item.color} mb-2`} />
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</div>
                    <div className="text-xl font-black text-gray-900 dark:text-white leading-none uppercase">{item.value}</div>
                 </div>
               ))}
            </motion.div>
         </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-6xl mx-auto px-6 mt-32 space-y-40">

        {/* Section: About the Event - Premium Shining Card */}
        {meta?.aboutEvent && (
          <AnimatedSection className="space-y-10 group relative">
            <div className="flex items-center gap-4">
               <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 flex items-center gap-4">
                  <FiLayout className="w-5 h-5" /> About the Event
               </h2>
               <div className="h-[1px] flex-grow bg-gray-100 dark:bg-white/5" />
            </div>
            
            <div className="relative p-12 md:p-20 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[4rem] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.05)] dark:shadow-[0_40px_80px_-24px_rgba(59,130,246,0.1)] hover:shadow-[0_64px_100px_-30px_rgba(59,130,246,0.2)] transition-all duration-700 overflow-hidden">
               {/* Shining Overlay */}
               <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 pointer-events-none" />
               
               <p className="relative z-10 text-3xl md:text-5xl font-medium leading-[1.1] text-gray-950 dark:text-gray-100 tracking-tighter max-w-4xl whitespace-pre-line">
                  {meta.aboutEvent}
               </p>
            </div>
          </AnimatedSection>
        )}

        {/* Section: Speakers (Clean Format) */}
        {meta?.speakers?.length > 0 && (
          <AnimatedSection className="space-y-12">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-600 flex items-center gap-3">
              <FiUsers className="w-5 h-5" /> Executive Panel
            </h4>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {meta.speakers.map((speaker, i) => (
                <div key={i} className="group relative p-8 bg-gray-50/50 dark:bg-gray-900/40 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-[0_20px_40px_-15px_rgba(139,92,246,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.2)] hover:shadow-[0_32px_64px_-16px_rgba(139,92,246,0.3)] transition-all duration-700 overflow-hidden">
                   {/* Shining Overlay */}
                   <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                   
                   <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                         <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">{speaker.name}</h3>
                         <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${speaker.type === 'guest' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                           {speaker.type || 'Internal'}
                         </span>
                      </div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{speaker.role}</p>
                      
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                         {speaker.linkedin && (
                           <a href={speaker.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                             <FiLinkedin className="w-4 h-4" />
                           </a>
                         )}
                         {speaker.instagram && (
                           <a href={speaker.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-gray-800 rounded-lg text-gray-400 hover:text-pink-600 transition-colors">
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

        {/* Section: Key Highlights & Learning Outcomes */}
        <div className="grid lg:grid-cols-2 gap-20">
           {meta?.highlights?.length > 0 && (
             <AnimatedSection className="space-y-12">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-600 flex items-center gap-3">
                      <FiAward className="w-5 h-5" /> Elite Value
                   </h4>
                   <h3 className="text-4xl md:text-5xl font-black text-gray-950 dark:text-white tracking-tighter uppercase">Key Highlights</h3>
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
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-600 flex items-center gap-3">
                      <FiTrendingUp className="w-5 h-5" /> Knowledge Gain
                   </h4>
                   <h3 className="text-4xl md:text-5xl font-black text-gray-950 dark:text-white tracking-tighter uppercase">What You'll Learn</h3>
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

        {/* Section: Activities / Engagement Flow */}
        {meta?.activities?.length > 0 && (
          <AnimatedSection className="space-y-16">
            <div className="text-center space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600">Event Timeline</h4>
               <h3 className="text-5xl md:text-6xl font-black text-gray-950 dark:text-white tracking-tighter uppercase">Activities</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {meta.activities.map((a, i) => (
                 <div key={i} className="group relative p-10 bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-white/5 rounded-[3rem] shadow-[0_20px_40px_-15px_rgba(37,99,235,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.2)] hover:bg-blue-600 dark:hover:bg-blue-600 hover:shadow-[0_32px_64px_-16px_rgba(37,99,235,0.4)] transition-all duration-700 overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 pointer-events-none" />
                    <span className="relative z-10 block text-[10px] font-black text-gray-400 group-hover:text-blue-100 uppercase tracking-widest mb-6">Phase 0{i + 1}</span>
                    <h3 className="relative z-10 text-2xl font-black text-gray-950 dark:text-white group-hover:text-white tracking-tight uppercase leading-none">{a}</h3>
                 </div>
               ))}
            </div>
          </AnimatedSection>
        )}

        {/* Section: Support Network (Sponsors) */}
        {meta?.sponsors?.length > 0 && (
           <AnimatedSection className="space-y-12">
              <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-center text-gray-400 border-t border-gray-100 dark:border-gray-900 pt-16">{meta?.sponsorLabel || "Sponsors (or Supported By / Partners)"}</h4>
              <div className="flex flex-wrap justify-center items-center gap-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                 {meta.sponsors.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-4">
                       <img src={s.logoUrl} alt={s.name} className="h-10 object-contain" />
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{s.name}</span>
                    </div>
                 ))}
              </div>
           </AnimatedSection>
        )}

        {/* Section: Visual Highlights (Gallery) - Horizontal Scroll */}
        {meta?.gallery?.length > 0 && (
          <AnimatedSection className="space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-6">
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Visual Evidence</h4>
                  <h3 className="text-5xl md:text-7xl font-black text-gray-950 dark:text-white tracking-tighter uppercase leading-none">Gallery</h3>
               </div>
               <div className="hidden md:flex items-center gap-4 text-gray-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">Scroll to Explore</span>
                  <div className="w-12 h-[1px] bg-gray-200 dark:bg-gray-800" />
               </div>
            </div>
            
            <div className="flex overflow-x-auto gap-8 px-6 pb-12 snap-x snap-mandatory scrollbar-hide no-scrollbar transition-all duration-700">
              {meta.gallery.map((img, i) => (
                <div key={i} className="flex-none w-[320px] md:w-[600px] aspect-[16/10] rounded-[2.5rem] overflow-hidden shadow-2xl hover:shadow-blue-500/20 snap-center transition-all duration-700 group">
                  <img 
                    src={img} 
                    alt={`Gallery ${i}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                  />
                </div>
              ))}
              {/* End Spacer for horizontal scroll */}
              <div className="flex-none w-px h-full" />
            </div>
          </AnimatedSection>
        )}

        {/* Section: Connect & Share (Social Media) */}
        {(meta?.instagram || meta?.linkedin || meta?.youtube || meta?.whatsapp) && (
          <AnimatedSection className="space-y-16 pt-16 border-t border-gray-100 dark:border-gray-800">
             <div className="text-center space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600">Event Highlights Online</h4>
                <h3 className="text-5xl md:text-6xl font-black text-gray-950 dark:text-white tracking-tighter uppercase">Social Media</h3>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { name: 'Instagram', icon: FiInstagram, color: 'hover:bg-gradient-to-tr hover:from-orange-500 hover:to-pink-500', link: meta?.instagram, label: 'Post / Reel' },
                  { name: 'LinkedIn', icon: FiLinkedin, color: 'hover:bg-[#0077b5]', link: meta?.linkedin, label: 'Official Update' },
                  { name: 'YouTube', icon: FiYoutube, color: 'hover:bg-[#ff0000]', link: meta?.youtube, label: 'Event Recording' },
                  { name: 'WhatsApp', icon: FiMessageCircle, color: 'hover:bg-[#25d366]', link: meta?.whatsapp, label: 'Join Group' }
                ]
                .filter(platform => platform.link)
                .map((platform, idx) => (
                  <motion.a
                    key={idx}
                    href={platform.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -10 }}
                    className={`group relative p-10 bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 rounded-[3rem] flex flex-col items-center text-center transition-all duration-500 ${platform.color} hover:text-white hover:shadow-[0_40px_80px_-20px_rgba(59,130,246,0.25)]`}
                  >
                     <platform.icon className="w-12 h-12 mb-6 transition-transform group-hover:scale-110" />
                     <h4 className="text-xl font-black uppercase tracking-tight leading-none mb-2">{platform.name}</h4>
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-6">{platform.label}</span>
                     <div className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        View Now <FiLink className="w-3 h-3" />
                     </div>
                  </motion.a>
                ))}
             </div>
          </AnimatedSection>
        )}

        {/* Section: Growth & Impact */}
        {meta?.impact && (
          <AnimatedSection className="relative bg-gray-950 p-20 rounded-[5rem] overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-40 blur-3xl" />
             <div className="relative text-center space-y-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Outcome / Impact</h4>
                <p className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tighter uppercase">
                   {meta.impact}
                </p>
                <div className="pt-8">
                   <button className="px-12 py-5 bg-white text-gray-950 text-xs font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-2xl">
                     Join the Impact
                   </button>
                </div>
             </div>
          </AnimatedSection>
        )}

        {/* Footer Navigation */}
        <div className="pt-20 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row justify-between items-center gap-8">
           <Link to="/events" className="group flex items-center gap-4 bg-gray-50 dark:bg-gray-900 px-8 py-4 rounded-3xl hover:bg-blue-600 transition-all transition-duration-500">
              <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform group-hover:text-white" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 dark:text-white group-hover:text-white">Return to Ecosystem</span>
           </Link>
           <div className="flex flex-col items-center md:items-end gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">HITAM AI Club © 2026</span>
              <span className="text-[8px] font-bold text-gray-300 dark:text-gray-800 uppercase tracking-widest italic">Experience Innovation with Cognitive Intelligence</span>
           </div>
        </div>
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

export default EventDetailPage;;