import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { Plus, Trash2, Edit, ExternalLink, Globe, MessageCircle, Github, Linkedin, Twitter, Facebook, Instagram, Youtube } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({ platform: "", url: "" });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "communityLinks"));
      const linksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLinks(linksData);
    } catch (error) {
      console.error("Error fetching community links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
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
      fetchLinks();
    } catch (error) {
      console.error("Error saving link:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this link?")) {
      try {
        await deleteDoc(doc(db, "communityLinks", id));
        fetchLinks();
      } catch (error) {
        console.error("Error deleting link:", error);
      }
    }
  };

  const openModal = (link = null) => {
    if (link) {
      setEditingLink(link);
      setFormData({ platform: link.platform, url: link.url });
    } else {
      setEditingLink(null);
      setFormData({ platform: "", url: "" });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen pt-16 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Community Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage social media and community platform links
            </p>
          </div>
          <Button onClick={() => openModal()} className="flex items-center gap-2">
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
                    <Button variant="ghost" size="sm" onClick={() => openModal(link)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(link.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
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

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingLink ? "Edit Link" : "Add New Link"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
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
      </div>
    </div>
  );
};

export default CommunityMembers;