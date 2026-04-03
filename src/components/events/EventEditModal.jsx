import React, { useState, useEffect } from "react";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { uploadEventFile } from "../../utils/cloudinary";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { X, Layers, Plus } from "lucide-react";
import { FiLayout } from "react-icons/fi";

const EventEditModal = ({ isOpen, onClose, editingEvent, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    sessionBy: "",
    type: "event",
    aboutEvent: "",
    speakers: [],
    highlights: [],
    whatYouLearn: [],
    activities: [],
    sponsors: [],
    sponsorLabel: "Sponsors",
    gallery: [],
    instagram: "",
    linkedin: "",
    youtube: "",
    whatsapp: "",
    impact: "",
    venue: "",
    impactStat: ""
  });

  const [imageFile, setImageFile] = useState(null);
  const [speakerFiles, setSpeakerFiles] = useState({});
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [sponsorLogos, setSponsorLogos] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.meta?.title || "",
        startDate: editingEvent.meta?.startDate || "",
        endDate: editingEvent.meta?.endDate || "",
        sessionBy: editingEvent.meta?.sessionBy || "",
        type: editingEvent.meta?.type || "event",
        aboutEvent: editingEvent.meta?.aboutEvent || "",
        speakers: editingEvent.meta?.speakers || [],
        highlights: editingEvent.meta?.highlights || [],
        whatYouLearn: editingEvent.meta?.whatYouLearn || [],
        activities: editingEvent.meta?.activities || [],
        sponsors: editingEvent.meta?.sponsors || [],
        sponsorLabel: editingEvent.meta?.sponsorLabel || "Sponsors",
        gallery: editingEvent.meta?.gallery || [],
        instagram: editingEvent.meta?.instagram || "",
        linkedin: editingEvent.meta?.linkedin || "",
        youtube: editingEvent.meta?.youtube || "",
        whatsapp: editingEvent.meta?.whatsapp || "",
        impact: editingEvent.meta?.impact || "",
        venue: editingEvent.meta?.venue || "",
        impactStat: editingEvent.meta?.impactStat || ""
      });
    } else {
      setFormData({
        title: "",
        startDate: "",
        endDate: "",
        sessionBy: "",
        type: "event",
        aboutEvent: "",
        speakers: [],
        highlights: [],
        whatYouLearn: [],
        activities: [],
        sponsors: [],
        sponsorLabel: "Sponsors",
        gallery: [],
        instagram: "",
        linkedin: "",
        youtube: "",
        whatsapp: "",
        impact: "",
        venue: "",
        impactStat: ""
      });
    }
    // Clean up files
    setImageFile(null);
    setSpeakerFiles({});
    setGalleryFiles([]);
    setSponsorLogos([]);
  }, [editingEvent, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = editingEvent?.meta?.imageUrl || "";
      let imageStoragePath = editingEvent?.meta?.imageStoragePath || "";
      let galleryUrls = editingEvent?.meta?.gallery || [];
      let sponsorData = [...(formData.sponsors || [])];
      let speakerData = [...(formData.speakers || [])];

      // 1. Upload Banner
      if (imageFile) {
        const uploadResult = await uploadEventFile(imageFile, formData.title);
        imageUrl = uploadResult.url;
        imageStoragePath = uploadResult.publicId;
      }

      // 2. Upload Speaker Photos
      const speakerIndices = Object.keys(speakerFiles);
      if (speakerIndices.length > 0) {
        const speakerPromises = speakerIndices.map(index => 
          uploadEventFile(speakerFiles[index], `${formData.title}-speaker-${index}`)
        );
        const results = await Promise.all(speakerPromises);
        results.forEach((res, i) => {
          speakerData[speakerIndices[i]].photoUrl = res.url;
        });
      }

      // 3. Upload Gallery Images
      if (galleryFiles.length > 0) {
        const galleryPromises = galleryFiles.map(file => uploadEventFile(file, `${formData.title}-gallery`));
        const results = await Promise.all(galleryPromises);
        galleryUrls = [...galleryUrls, ...results.map(r => r.url)];
      }

      // 4. Upload Sponsor Logos
      if (sponsorLogos.length > 0) {
        const sponsorPromises = sponsorLogos.map(item => uploadEventFile(item.file, `${formData.title}-sponsor-${item.name}`));
        const results = await Promise.all(sponsorPromises);
        const newSponsors = results.map((r, i) => ({
          name: sponsorLogos[i].name,
          logoUrl: r.url
        }));
        sponsorData = [...sponsorData, ...newSponsors];
      }

      const eventData = {
        meta: {
          ...formData,
          imageUrl,
          imageStoragePath,
          gallery: galleryUrls,
          sponsors: sponsorData,
          speakers: speakerData,
          updatedAt: new Date().toISOString(),
          createdAt: editingEvent?.meta?.createdAt || new Date().toISOString()
        }
      };

      if (editingEvent) {
        await updateDoc(doc(db, "events", editingEvent.id), eventData);
      } else {
        await addDoc(collection(db, "events"), eventData);
      }
      
      if (onSuccess) onSuccess(eventData);
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingEvent ? "Edit Event" : "Create New Event"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-8 p-2">
        {/* Banner Image - Primary Field */}
        <div className="pb-6 border-b border-gray-100 dark:border-gray-800">
           <label className="block text-xs font-black mb-4 uppercase tracking-[0.3em] text-blue-600">Primary Hero Banner</label>
           <div className="relative group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setImageFile(e.target.files[0])} 
                className="w-full text-xs p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl hover:border-blue-500 transition-all bg-gray-50/50 dark:bg-gray-900/30" 
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-500">
                 {imageFile ? imageFile.name : "Select or Drop New Banner Image"}
              </div>
           </div>
        </div>

        <Input label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
        
        <div className="grid md:grid-cols-2 gap-6">
          <Input label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
          <Input label="End Date" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
        </div>

        {/* Section: Top Header Cards Mapping */}
        <div className="p-6 bg-blue-50/50 dark:bg-blue-600/5 border border-blue-100 dark:border-blue-500/10 rounded-3xl space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
             <FiLayout className="w-3 h-3" /> Header Details Bar (Interactive Cards)
           </h3>
           <div className="grid md:grid-cols-3 gap-4">
              <Input label="Official Venue" placeholder="Seminar Hall..." value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} />
              <div>
                <label className="block text-xs font-bold mb-1 uppercase tracking-tight text-gray-400">Execution Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-sm">
                  <option value="event">Event</option>
                  <option value="workshop">Workshop</option>
                </select>
              </div>
              <Input label="Impact (Growth)" placeholder="e.g. 500+..." value={formData.impactStat} onChange={(e) => setFormData({ ...formData, impactStat: e.target.value })} />
           </div>
           <Input label="Hosted By (Legacy Field)" value={formData.sessionBy} onChange={(e) => setFormData({ ...formData, sessionBy: e.target.value })} />
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-3xl space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Layers className="w-4 h-4" /> Rich Content Sections
          </h3>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <label className="block text-xs font-black mb-4 uppercase tracking-[0.2em] text-gray-400">Section 1: About the Event (Narrative)</label>
            <textarea 
              placeholder="Tell the story of this event..." 
              value={formData.aboutEvent} 
              onChange={(e) => setFormData({ ...formData, aboutEvent: e.target.value })} 
              rows={4} 
              className="w-full px-4 py-4 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/30 dark:bg-gray-900/40 text-gray-800 dark:text-gray-100 font-medium" 
            />
          </div>

          {/* Multiple Speakers */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest">Guest Speakers</label>
              <Button type="button" size="sm" variant="outline" onClick={() => setFormData({ ...formData, speakers: [...formData.speakers, { name: "", role: "", bio: "", linkedin: "", instagram: "", photoUrl: "", type: "internal" }] })}>
                + Add Speaker
              </Button>
            </div>
            {formData.speakers.map((s, i) => (
              <div key={i} className="relative p-6 border rounded-2xl bg-white dark:bg-gray-800 space-y-4 shadow-sm">
                 <X className="absolute top-4 right-4 w-4 h-4 text-red-500 cursor-pointer" onClick={() => setFormData({ ...formData, speakers: formData.speakers.filter((_, idx) => idx !== i) })} />
                 <div className="grid md:grid-cols-3 gap-4">
                    <Input label="Name" value={s.name} onChange={(e) => { const spk = [...formData.speakers]; spk[i].name = e.target.value; setFormData({ ...formData, speakers: spk }); }} />
                    <Input label="Designation (Role)" value={s.role} onChange={(e) => { const spk = [...formData.speakers]; spk[i].role = e.target.value; setFormData({ ...formData, speakers: spk }); }} />
                    <div>
                      <label className="block text-xs font-bold mb-1">Speaker Type</label>
                      <select value={s.type || "internal"} onChange={(e) => { const spk = [...formData.speakers]; spk[i].type = e.target.value; setFormData({ ...formData, speakers: spk }); }} className="w-full px-4 py-2 text-sm border rounded-xl bg-white dark:bg-gray-700">
                        <option value="internal">Internal Speaker</option>
                        <option value="guest">Guest Speaker</option>
                      </select>
                    </div>
                 </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <Input label="LinkedIn URL" value={s.linkedin} onChange={(e) => { const spk = [...formData.speakers]; spk[i].linkedin = e.target.value; setFormData({ ...formData, speakers: spk }); }} />
                    <Input label="Instagram URL" value={s.instagram} onChange={(e) => { const spk = [...formData.speakers]; spk[i].instagram = e.target.value; setFormData({ ...formData, speakers: spk }); }} />
                 </div>
                 <textarea placeholder="Small Bio (Optional)..." value={s.bio} onChange={(e) => { const spk = [...formData.speakers]; spk[i].bio = e.target.value; setFormData({ ...formData, speakers: spk }); }} className="w-full px-3 py-2 border rounded-xl text-sm" rows={2} />
                 <div className="mt-2 text-[10px] text-gray-400">Add Photo? (Optional)</div>
                 <input type="file" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setSpeakerFiles({ ...speakerFiles, [i]: file });
                 }} className="text-xs" />
              </div>
            ))}
          </div>

          {/* Other Arrays (Highlights, etc) */}
          {['highlights', 'whatYouLearn', 'activities'].map(key => (
            <div key={key} className="space-y-2">
               <label className="text-xs font-bold uppercase tracking-widest">{key === 'whatYouLearn' ? "What You'll Learn" : key}</label>
               <div className="flex gap-2">
                  <Input id={`new-${key}`} placeholder={`Add ${key}...`} />
                  <Button type="button" onClick={() => { const input = document.getElementById(`new-${key}`); if (input.value) { setFormData({ ...formData, [key]: [...formData[key], input.value] }); input.value = ''; } }}>Add</Button>
               </div>
               <div className="flex flex-wrap gap-2">
                  {formData[key].map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-2">
                      {item} <X className="w-3 h-3 cursor-pointer" onClick={() => setFormData({ ...formData, [key]: formData[key].filter((_, idx) => idx !== i) })} />
                    </span>
                  ))}
               </div>
            </div>
          ))}

          {/* Gallery Management */}
          <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
             <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Event Gallery</label>
                <div className="text-[10px] text-blue-500 font-bold uppercase animate-pulse">New! Horizontal View</div>
             </div>
             
             {/* Existing Gallery Preview */}
             {formData.gallery.length > 0 && (
               <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                 {formData.gallery.map((url, i) => (
                   <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-100 dark:border-gray-800">
                     <img src={url} alt="Gallery" className="w-full h-full object-cover" />
                     <button 
                       type="button" 
                       onClick={() => setFormData({ ...formData, gallery: formData.gallery.filter((_, idx) => idx !== i) })}
                       className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
               </div>
             )}

             <div className="relative group">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={(e) => setGalleryFiles(Array.from(e.target.files))} 
                  className="w-full text-xs p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl hover:border-blue-500 transition-colors bg-white dark:bg-gray-800/50" 
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px] font-bold uppercase tracking-widest group-hover:text-blue-500">
                  {galleryFiles.length > 0 ? `${galleryFiles.length} New Images Selected` : "Drop Multiple Gallery Images Here"}
                </div>
             </div>
          </div>

          {/* Outcome / Impact Section */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
             <label className="block text-xs font-bold mb-2 uppercase tracking-widest text-gray-400">Outcome / Impact (Large Text)</label>
             <textarea 
               placeholder="e.g. 500+ attendees empowered with AI knowledge..." 
               value={formData.impact} 
               onChange={(e) => setFormData({ ...formData, impact: e.target.value })} 
               className="w-full px-4 py-4 border border-gray-200 dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 font-medium" 
               rows={3} 
             />
          </div>

          {/* Social Media Links */}
          <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-2">
               Connect & Share Links
             </h3>
             <div className="grid md:grid-cols-2 gap-4">
                <Input label="Instagram URL" placeholder="https://instagram.com/p/..." value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} />
                <Input label="LinkedIn URL" placeholder="https://linkedin.com/posts/..." value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} />
                <Input label="YouTube URL" placeholder="https://youtube.com/watch?v=..." value={formData.youtube} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} />
                <Input label="WhatsApp Group URL" placeholder="https://chat.whatsapp.com/..." value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} />
             </div>
          </div>
        </div>

        <div className="flex gap-4">
           <Button type="submit" loading={uploading} className="flex-1 py-4 text-lg font-bold">Save Event</Button>
           <Button type="button" variant="outline" onClick={onClose} className="px-8">Cancel</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EventEditModal;
