import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { Plus, Trash2, Edit, ExternalLink, Globe, MessageCircle, Github, Linkedin, Twitter, Facebook, Instagram, Youtube, Users, Network, Building2 } from "lucide-react";
import { uploadToCloudinary } from "../../utils/cloudinary";

// Helper to get icon based on platform name
const getPlatformIcon = (platform) => {
  const p = platform.toLowerCase();
  if (p.includes("github")) return <Github className="w-5 h-5" />;
  if (p.includes("linkedin")) return <Linkedin className="w-5 h-5" />;
  if (p.includes("twitter") || p.includes("x")) return <Twitter className="w-5 h-5" />;
  if (p.includes("facebook")) return <Facebook className="w-5 h-5" />;
  if (p.includes("instagram")) return <Instagram className="w-5 h-5" />;
  if (p.includes("youtube")) return <Youtube className="w-5 h-5" />;
  if (p.includes("whatsapp")) return <MessageCircle className="w-5 h-5" />;
  if (p.includes("discord")) return <MessageCircle className="w-5 h-5" />;
  if (p.includes("telegram")) return <MessageCircle className="w-5 h-5" />;
  return <Globe className="w-5 h-5" />;
};

const CommunityMembers = () => {
  const [links, setLinks] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for Social Links Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({ platform: "", url: "" });

  // States for Network/Partner Modal
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState(null);
  const [networkFormData, setNetworkFormData] = useState({
    category: "Partner", // Partner, Collaboration, Network
    entityType: "organization", // person, organization
    name: "",
    title: "", // used for person role, or short description for organization
    company: "", // used only for person
    websiteUrl: "",
    linkedinUrl: "",
    logoUrl: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const linksSnapshot = await getDocs(collection(db, "communityLinks"));
      const linksData = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLinks(linksData);

      const networksSnapshot = await getDocs(collection(db, "networkPartners"));
      const networksData = networksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNetworks(networksData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLink) {
        await updateDoc(doc(db, "communityLinks", editingLink.id), formData);
      } else {
        await addDoc(collection(db, "communityLinks"), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingLink(null);
      setFormData({ platform: "", url: "" });
      fetchData();
    } catch (error) {
      console.error("Error saving link:", error);
    }
  };

  const handleNetworkSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalLogoUrl = networkFormData.logoUrl;
      
      if (imageFile) {
        const uploadResult = await uploadToCloudinary(imageFile, 'hitam_ai/networks');
        finalLogoUrl = uploadResult.url;
      }

      const networkDataToSave = {
        ...networkFormData,
        logoUrl: finalLogoUrl,
        updatedAt: new Date().toISOString()
      };

      if (editingNetwork) {
        await updateDoc(doc(db, "networkPartners", editingNetwork.id), networkDataToSave);
      } else {
        await addDoc(collection(db, "networkPartners"), {
          ...networkDataToSave,
          createdAt: new Date().toISOString()
        });
      }
      setIsNetworkModalOpen(false);
      setEditingNetwork(null);
      setNetworkFormData({ category: "Partner", entityType: "organization", name: "", title: "", company: "", websiteUrl: "", linkedinUrl: "", logoUrl: "" });
      setImageFile(null);
      fetchData();
    } catch (error) {
      console.error("Error saving network partner:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleLinkDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this link?")) {
      try {
        await deleteDoc(doc(db, "communityLinks", id));
        fetchData();
      } catch (error) {
        console.error("Error deleting link:", error);
      }
    }
  };

  const handleNetworkDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this connection?")) {
      try {
        await deleteDoc(doc(db, "networkPartners", id));
        fetchData();
      } catch (error) {
        console.error("Error deleting network partner:", error);
      }
    }
  };

  const openLinkModal = (link = null) => {
    if (link) {
      setEditingLink(link);
      setFormData({ platform: link.platform, url: link.url });
    } else {
      setEditingLink(null);
      setFormData({ platform: "", url: "" });
    }
    setIsModalOpen(true);
  };

  const openNetworkModal = (network = null) => {
    if (network) {
      setEditingNetwork(network);
      setNetworkFormData({
        category: network.category || "Partner",
        entityType: network.entityType || "organization",
        name: network.name || "",
        title: network.title || "",
        company: network.company || "",
        websiteUrl: network.websiteUrl || "",
        linkedinUrl: network.linkedinUrl || "",
        logoUrl: network.logoUrl || ""
      });
    } else {
      setEditingNetwork(null);
      setNetworkFormData({ category: "Partner", entityType: "organization", name: "", title: "", company: "", websiteUrl: "", linkedinUrl: "", logoUrl: "" });
    }
    setImageFile(null);
    setIsNetworkModalOpen(true);
  };

  return (
    <div className="min-h-screen pt-16 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Social Media Links Section */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe className="w-8 h-8 text-blue-500" />
                Community Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage social media and community platform links
              </p>
            </div>
            <Button onClick={() => openLinkModal()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Link
            </Button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {links.map((link) => (
                <Card key={link.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        {getPlatformIcon(link.platform)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{link.platform}</h3>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 flex items-center gap-1 mt-1 truncate max-w-[150px]"
                        >
                          View Link <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openLinkModal(link)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleLinkDelete(link.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {links.length === 0 && !loading && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No community links added yet.</p>
            </div>
          )}
        </section>

        {/* Network & Partners Section */}
        <section>
          <div className="flex justify-between items-center mb-8 border-t border-gray-200 dark:border-gray-700 pt-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Network className="w-8 h-8 text-purple-500" />
                Collaborations & Network
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage partners, networks, and collaborations
              </p>
            </div>
            <Button onClick={() => openNetworkModal()} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4" /> Add Connection
            </Button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {networks.map((net) => (
                <Card key={net.id} className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 mr-4">
                        {net.logoUrl ? (
                           net.entityType === 'person' ? (
                             <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                               <img src={net.logoUrl} alt={net.name} className="w-full h-full object-cover" />
                             </div>
                           ) : (
                             <div className="w-full h-24 bg-transparent flex items-center justify-start overflow-hidden">
                               <img src={net.logoUrl} alt={net.name} className="w-auto h-full max-w-full object-contain" />
                             </div>
                           )
                        ) : (
                           net.entityType === 'person' ? (
                             <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm">
                               <Users className="w-8 h-8 text-gray-400" />
                             </div>
                           ) : (
                             <div className="w-full h-24 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-700">
                               <Building2 className="w-10 h-10 text-gray-400" />
                             </div>
                           )
                        )}
                      </div>
                      
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => openNetworkModal(net)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleNetworkDelete(net.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex gap-2 items-center mb-2">
                        <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-md">
                          {net.category}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {net.entityType === 'person' ? 'Person' : 'Organization'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">{net.name}</h3>
                      {net.entityType === 'person' && net.company && (
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-1">{net.company}</p>
                      )}
                      {net.title && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{net.title}</p>}
                    </div>

                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      {net.websiteUrl && (
                        <a href={net.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                          <Globe className="w-4 h-4" /> Website
                        </a>
                      )}
                      {net.linkedinUrl && (
                        <a href={net.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                          <Linkedin className="w-4 h-4" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {networks.length === 0 && !loading && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No network connections added yet.</p>
            </div>
          )}
        </section>

        {/* Link Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingLink ? "Edit Link" : "Add New Link"}
        >
          <form onSubmit={handleLinkSubmit} className="space-y-4">
            <Input
              label="Platform Name"
              placeholder="e.g. WhatsApp, Discord, Instagram"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              required
            />
            <Input
              label="URL"
              placeholder="https://..."
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingLink ? "Update Link" : "Add Link"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Network Modal */}
        <Modal
          isOpen={isNetworkModalOpen}
          onClose={() => setIsNetworkModalOpen(false)}
          title={editingNetwork ? "Edit Connection" : "Add New Connection"}
          size="lg"
        >
          <form onSubmit={handleNetworkSubmit} className="space-y-4">
            <div className="flex justify-center mb-6">
               <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                 {imageFile ? (
                   <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                 ) : networkFormData.logoUrl ? (
                   <img src={networkFormData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-center p-2">
                     <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                     <span className="text-[10px] text-gray-500">{networkFormData.entityType === 'person' ? 'Photo' : 'Logo'}</span>
                   </div>
                 )}
               </div>
            </div>
            
            <div className="w-full mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity Type</label>
                <div className="flex gap-4 items-center h-10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="entityType" 
                      value="organization"
                      checked={networkFormData.entityType === 'organization'}
                      onChange={(e) => setNetworkFormData({ ...networkFormData, entityType: e.target.value })}
                      className="text-blue-500"
                    />
                    <span className="text-sm dark:text-gray-300">Organization</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="entityType" 
                      value="person"
                      checked={networkFormData.entityType === 'person'}
                      onChange={(e) => setNetworkFormData({ ...networkFormData, entityType: e.target.value })}
                      className="text-blue-500"
                    />
                    <span className="text-sm dark:text-gray-300">Person</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={networkFormData.category}
                  onChange={(e) => setNetworkFormData({ ...networkFormData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Collaboration">Collaboration</option>
                  <option value="Partner">Partner</option>
                  <option value="Network">Network</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label={networkFormData.entityType === 'person' ? "Person Name" : "Organization Name"}
                placeholder={networkFormData.entityType === 'person' ? "e.g. Kiran Vadagam" : "e.g. ASCI"}
                value={networkFormData.name}
                onChange={(e) => setNetworkFormData({ ...networkFormData, name: e.target.value })}
                required
              />
              {networkFormData.entityType === 'person' ? (
                <Input
                  label="Role & Description"
                  placeholder="e.g. Founder, AI Developer"
                  value={networkFormData.title}
                  onChange={(e) => setNetworkFormData({ ...networkFormData, title: e.target.value })}
                  required
                />
              ) : (
                <Input
                  label="Short Description"
                  placeholder="e.g. Pioneering EdTech Platform"
                  value={networkFormData.title}
                  onChange={(e) => setNetworkFormData({ ...networkFormData, title: e.target.value })}
                />
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {networkFormData.entityType === 'person' && (
                <Input
                  label="Company / Organization (Optional)"
                  placeholder="e.g. ODEFTO Labs"
                  value={networkFormData.company}
                  onChange={(e) => setNetworkFormData({ ...networkFormData, company: e.target.value })}
                />
              )}
              <Input
                label="Website URL"
                placeholder="https://..."
                value={networkFormData.websiteUrl}
                onChange={(e) => setNetworkFormData({ ...networkFormData, websiteUrl: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="LinkedIn URL (Optional)"
                placeholder="https://linkedin.com/..."
                value={networkFormData.linkedinUrl}
                onChange={(e) => setNetworkFormData({ ...networkFormData, linkedinUrl: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={() => setIsNetworkModalOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" loading={uploading} className="bg-purple-600 hover:bg-purple-700">
                {editingNetwork ? "Update Connection" : "Add Connection"}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </div>
  );
};

export default CommunityMembers;