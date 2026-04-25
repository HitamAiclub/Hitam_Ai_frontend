import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  Palette, 
  Wand2, 
  Type, 
  Layout, 
  Download, 
  Save, 
  Trash2, 
  RefreshCw, 
  Plus,
  Image as ImageIcon,
  Layers,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Copy,
  PlusCircle,
  GripHorizontal,
  Calendar,
  MapPin,
  MessageSquare,
  Zap,
  Cpu,
  ShieldCheck,
  Globe,
  Database,
  AlertCircle,
  Share2,
  Instagram,
  Facebook,
  Linkedin,
  Monitor,
  Smartphone,
  Youtube,
  Twitter,
  Mail,
  CopyPlus,
  ListFilter,
  Camera,
  Loader2,
  Move,
  MousePointer2,
  Box,
  Shapes,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Layers3,
  ArrowUp,
  ArrowDown,
  Circle,
  Square,
  RectangleHorizontal,
  Triangle,
  Sun,
  Moon
} from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import Button from "../../components/ui/Button";

const DesignerPage = () => {
  const [sidebarTool, setSidebarTool] = useState("ai"); 
  
  // AI Generator State
  const [aiForm, setAiForm] = useState({
    name: "",
    theme: "",
    fullContent: "", 
    slideCount: 1,   
    type: "poster",
    refImage: null,
    textStyle: "bold",      // bold | modern | minimal | elegant | playful
    bgMood: "dark",         // dark | neon | light | gradient | vibrant
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState(""); 
  const [aspectRatio, setAspectRatio] = useState("3/4");
  
  // --- CHATBOT STATE ---
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: "Hi! I'm your Hitam AI Strategist. What topic are we designing for today?" }
  ]);
  const [userPrompt, setUserPrompt] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // Floating chat state

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    const newMessages = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(newMessages);
    setUserPrompt("");
    setIsAiThinking(true);

    try {
      const res = await axios.post("/api/ai-chat", { messages: newMessages });
      let aiReply = res.data.reply || "Sorry, I didn't get that.";
      
      // Check for the magical trigger tag (support multi-line JSON from AI)
      const triggerMatch = aiReply.match(/\[TRIGGER_DESIGN:\s*(\{[\s\S]*?\})\s*\]/);
      let shouldTrigger = false;
      let designParams = null;

      if (triggerMatch) {
        try {
          let jsonString = triggerMatch[1];
          // Strip out any markdown code blocks the AI might have injected
          jsonString = jsonString.replace(/```json/gi, "").replace(/```/g, "").trim();
          
          designParams = JSON.parse(jsonString);
          aiReply = aiReply.replace(triggerMatch[0], "").trim();
          shouldTrigger = true;
        } catch(e) { 
          console.error("Failed to parse trigger JSON:", e, "Raw String:", triggerMatch[1]); 
        }
      }

      setChatMessages([...newMessages, { role: 'ai', content: aiReply }]);

      if (shouldTrigger && designParams) {
        // Prepare the form data before triggering
        const newFormState = {
          name: designParams.topic || "Design Project",
          fullContent: designParams.description || ((designParams.topic || "") + " " + (designParams.style || "")),
          slideCount: designParams.slides || 1,
          bgMood: designParams.bgStyle || "dark"
        };

        setAiForm(prev => {
          const updated = { ...prev, ...newFormState };
          // Pass the freshly updated state directly to avoid React state closure staleness
          setTimeout(() => handleFullAIGenerate(updated), 100);
          return updated;
        });
      }
    } catch (e) { 
      setChatMessages([...newMessages, { role: 'ai', content: "Error connecting to AI." }]);
    } finally { setIsAiThinking(false); }
  };

  
  // Slides State
  const [slides, setSlides] = useState([
    { id: Date.now(), elements: [], bg: null, bgColor: "#ffffff", bgType: "solid" }
  ]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const canvasRef = useRef(null);
  
  const updateElement = (elementId, newData) => {
    setSlides(prev => prev.map((s, idx) => {
      if (idx !== currentSlideIndex) return s;
      return {
        ...s,
        elements: s.elements.map(el => el.id === elementId ? { ...el, ...newData } : el)
      };
    }));
  };

  const handleDragEnd = (e, info, el) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const newX = ((info.point.x - rect.left) / rect.width) * 100;
    const newY = ((info.point.y - rect.top) / rect.height) * 100;
    updateElement(el.id, { x: newX, y: newY });
  };
  const aiRefImageRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isAiThinking, isGenerating]);

  const currentSlide = slides[currentSlideIndex];

  const sidebarIcons = [
    { id: "ai", icon: Wand2, label: "AI Magic", color: "text-purple-500" },
    { id: "text", icon: Type, label: "Text", color: "text-blue-500" },
    { id: "elements", icon: ImageIcon, label: "Assets", color: "text-pink-500" },
    { id: "shapes", icon: Shapes, label: "Shapes", color: "text-orange-500" },
    { id: "properties", icon: Settings, label: "Edit", color: "text-indigo-500" },
    { id: "settings", icon: Palette, label: "Design", color: "text-emerald-500" },
  ];

  const postTypes = [
    { id: "poster", label: "Poster", ratio: "3/4" },
    { id: "instagram_post", label: "IG Post", ratio: "1:1" },
    { id: "instagram_story", label: "IG Story", ratio: "9/16" },
    { id: "facebook_post", label: "FB Post", ratio: "1.91/1" },
    { id: "linkedin_post", label: "LinkedIn", ratio: "16/9" },
  ];

  const ratios = [
    { id: "1:1",    label: "Square (1:1)",   w: 540, h: 540  },
    { id: "9/16",  label: "Story (9:16)",   w: 405, h: 720  },
    { id: "3/4",   label: "Poster (3:4)",   w: 480, h: 640  },
    { id: "16/9",  label: "Wide (16:9)",    w: 720, h: 405  },
    { id: "1.91/1",label: "FB Post",        w: 720, h: 377  },
  ];

  const currentRatio = ratios.find(r => r.id === aspectRatio) || ratios[2];

  // --- AI TEXT GENERATION ---
  // Calls backend server which proxies to OpenRouter/HuggingFace (no CORS issues)
  const generateDesignMap = async (topic, content, ratioLabel, w, h, statusSetter, pageIndex = 0, pageRole = "hero", textStyle = "bold", bgMood = "dark", previousConfig = null, chatHistory = []) => {
    try {
      statusSetter && statusSetter(`🧠 AI Designing ${pageRole} page...`);
      const res = await axios.post(
        "/api/ai-design-map",
        { topic, content, ratioLabel, w, h, pageIndex, textStyle, bgMood, pageRole, previousConfig, chatHistory },
        { timeout: 90000 }
      );
      return res.data;
    } catch (err) {
      console.warn("Backend AI failed:", err?.response?.status);
      return null;
    }
  };



  const callHuggingFace = async (prompt) => {
    try {
      const res = await axios.post(
        "/api/ai-generate-image",
        { prompt },
        { timeout: 100000 }
      );
      // Backend returns base64 data URL directly
      return res.data?.image || null;
    } catch (err) {
      console.warn("Image generation failed:", err?.response?.status);
      return null;
    }
  };


  // Fallback design map if ALL AI fails
  const getFallbackDesignMap = (topic, previousConfig = null) => {
    const bgColor = previousConfig?.decision?.bgStyle === 'light' ? "#f8fafc" : (previousConfig?.decision?.bgColor || "#0f172a");
    const accent = previousConfig?.decision?.accentColor || "#3b82f6";
    const text = previousConfig?.decision?.bgStyle === 'light' ? "#1e293b" : "#ffffff";

    return {
      bgType: "solid",
      bgColor: bgColor,
      bgVisualPrompt: previousConfig?.bgVisualPrompt || "",
      elements: [
        { type: "text", content: topic.toUpperCase(), x: 50, y: 30, fontSize: "text-5xl", color: text, fontWeight: "font-black" },
        { type: "shape", shapeType: "square", x: 50, y: 52, width: 280, height: 4, color: accent, opacity: 1 },
        { type: "text", content: "Premium Design Studio", x: 50, y: 65, fontSize: "text-lg", color: text, fontWeight: "font-bold" },
        { type: "shape", shapeType: "circle", x: 15, y: 85, width: 80, height: 80, color: accent, opacity: 0.2 },
        { type: "shape", shapeType: "circle", x: 85, y: 15, width: 120, height: 120, color: accent, opacity: 0.15 },
      ]
    };
  };

  const PAGE_ROLES = ["hero", "story", "details", "points", "spotlight", "cta"];

  const handleFullAIGenerate = async (overrideForm = null) => {
    const currentForm = overrideForm || aiForm;
    if (!currentForm.fullContent) { alert("Please describe your vision in the prompt"); return; }
    setIsGenerating(true);

    // Snapshot current slide count so we can navigate to first new slide
    const startIndex = slides.length;
    
    try {
      const selectedType = postTypes.find(t => t.id === currentForm.type);
      if (selectedType) setAspectRatio(selectedType.ratio);

      let currentBrief = currentForm.fullContent;
      let totalToGen = currentForm.slideCount;
      let previousConfig = null;

      for (let i = 0; i < totalToGen; i++) {
        const pageRole = PAGE_ROLES[i % PAGE_ROLES.length];
        const roleLabel = { hero: "Hero Cover", story: "Story", details: "Details", points: "Key Points", spotlight: "Spotlight", cta: "Call to Action" }[pageRole];

        // --- Step 1: Get AI Design Map ---
        setGenStatus(`🧠 AI Reasoning: Page ${i + 1}...`);
        const designMap = (await generateDesignMap(
          currentForm.name, currentBrief, currentRatio.label,
          currentRatio.w, currentRatio.h, setGenStatus, i, pageRole, currentForm.textStyle, currentForm.bgMood, previousConfig, chatMessages
        )) || getFallbackDesignMap(currentForm.name, previousConfig);

        // Update loop variables from AI decision (only on first page)
        if (i === 0) {
           if (designMap.recommendedSlides > 1 && currentForm.slideCount === 1) {
              totalToGen = Math.min(6, designMap.recommendedSlides);
              setAiForm(prev => ({ ...prev, slideCount: totalToGen }));
           }
           if (designMap.expandedContent) {
              currentBrief = designMap.expandedContent;
              setAiForm(prev => ({ ...prev, fullContent: currentBrief }));
           }
           previousConfig = {
             decision: designMap.decision,
             aiContent: designMap.aiContent,
             bgVisualPrompt: designMap.bgVisualPrompt,
             resolvedTopic: designMap.resolvedTopic,
             expandedContent: currentBrief
           };
        }

        // --- Step 2: Add placeholder slide IMMEDIATELY so user sees it ---
        const slideId = Date.now() + i * 999;
        const slideElements = (designMap.elements || []).map((el, idx) => ({
          ...el, id: slideId + idx + 1
        }));
        if (aiForm.refImage) {
          slideElements.push({ id: slideId + 1000, type: "image", x: 15, y: 12, content: aiForm.refImage, width: 90 });
        }

        const newSlide = {
          id: slideId,
          bg: null,   // placeholder — image loads next
          bgColor: designMap.bgColor || "#0f172a",
          bgType: "solid",
          elements: slideElements,
          _generating: true  // flag: background loading
        };

        // Push slide immediately so it shows on canvas
        setSlides(prev => {
          const updated = [...prev, newSlide];
          return updated;
        });
        setCurrentSlideIndex(startIndex + i);

        // --- Step 3: Generate background image in background ---
        if (i === 0 && designMap.bgVisualPrompt) {
          setGenStatus(`🎨 Rendering AI Background — Page ${i + 1}...`);
          const bgImage = await callHuggingFace(designMap.bgVisualPrompt);
          if (bgImage) previousConfig.bgImage = bgImage;
        }

        const currentBgImage = previousConfig?.bgImage;

        if (currentBgImage) {
          // Update just the bg of this specific slide
          setSlides(prev => prev.map(s =>
            s.id === slideId
              ? { ...s, bg: currentBgImage, bgType: "image", _generating: false }
              : s
          ));
        } else {
          setSlides(prev => prev.map(s =>
            s.id === slideId ? { ...s, _generating: false } : s
          ));
        }

        setGenStatus(`✅ Page ${i + 1} of ${currentForm.slideCount} ready!`);
      }

      setCurrentSlideIndex(startIndex);
      setGenStatus("✨ All Pages Generated!");

    } catch (error) {
      console.error("Generation error:", error);
      setGenStatus("Generation failed — see console");
    } finally {
      setTimeout(() => setIsGenerating(false), 1500);
    }
  };


  const updateCurrentSlide = (updates) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], ...updates };
    setSlides(newSlides);
  };

  const moveLayer = (direction) => {
    if (!selectedElementId) return;
    const elements = [...currentSlide.elements];
    const idx = elements.findIndex(el => el.id === selectedElementId);
    if (idx === -1) return;
    if (direction === "up" && idx < elements.length - 1) [elements[idx], elements[idx+1]] = [elements[idx+1], elements[idx]];
    else if (direction === "down" && idx > 0) [elements[idx], elements[idx-1]] = [elements[idx-1], elements[idx]];
    updateCurrentSlide({ elements });
  };

  const handleAiRefImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAiForm({...aiForm, refImage: ev.target.result});
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
          const newEl = { id: Date.now(), type: "image", x: 50, y: 50, content: ev.target.result, width: 200 };
          updateCurrentSlide({ elements: [...currentSlide.elements, newEl] });
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedElement = currentSlide.elements.find(el => el.id === selectedElementId);

  return (
    <div className="min-h-screen pt-16 bg-white text-slate-900 transition-all flex flex-col font-sans">
      {/* Premium Header */}
      <div className="px-8 py-5 border-b border-slate-100 bg-white/95 backdrop-blur-xl z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
             <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase leading-none">Hitam AI Studio</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Professional Content Engine</p>
          </div>
        </div>

        {/* Selected Element Toolbar */}
        {selectedElement && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-2xl">
               {/* Global Color */}
               <input type="color" className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer" value={selectedElement.color} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} />
               
               {selectedElement.type === 'text' && (
                  <>
                     {/* Text Style Presets */}
                     <select 
                       value={selectedElement.styleId || "default"} 
                       onChange={(e) => {
                          const styles = {
                             bold:    { fontWeight: "font-black", textCase: "uppercase", tracking: "tracking-normal" },
                             modern:  { fontWeight: "font-semibold", textCase: "uppercase", tracking: "tracking-[0.3em]" },
                             minimal: { fontWeight: "font-light", textCase: "normal-case", tracking: "tracking-tight" },
                             elegant: { fontWeight: "font-semibold", textCase: "italic", tracking: "tracking-wide" },
                             sharp:   { fontWeight: "font-black", textCase: "uppercase", tracking: "tracking-tighter" }
                          };
                          const s = styles[e.target.value] || {};
                          updateElement(selectedElement.id, { 
                            styleId: e.target.value,
                            fontWeight: s.fontWeight || selectedElement.fontWeight,
                            textCase: s.textCase || selectedElement.textCase,
                            tracking: s.tracking || selectedElement.tracking
                          });
                       }}
                       className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-black outline-none w-24"
                     >
                       <option value="default">Style</option>
                       <option value="bold">Bold</option>
                       <option value="modern">Modern</option>
                       <option value="minimal">Minimal</option>
                       <option value="elegant">Elegant</option>
                       <option value="sharp">Sharp</option>
                     </select>

                    {/* Font Size */}
                    <select 
                      value={selectedElement.fontSize} 
                      onChange={(e) => updateElement(selectedElement.id, { fontSize: e.target.value })}
                      className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-black outline-none w-16"
                    >
                      {["text-xs", "text-sm", "text-lg", "text-xl", "text-2xl", "text-4xl", "text-6xl"].map(size => (
                        <option key={size} value={size}>{size.replace("text-", "")}</option>
                      ))}
                    </select>

                    <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                        {/* Bold Toggle */}
                        <button onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'font-black' ? 'font-light' : 'font-black' })} className={`p-1.5 rounded-lg transition-all ${selectedElement.fontWeight === 'font-black' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}><Bold className="w-4 h-4" /></button>
                        
                        {/* Alignment */}
                        <button onClick={() => updateElement(selectedElement.id, { align: 'left' })} className={`p-1.5 rounded-lg transition-all ${selectedElement.align === 'left' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}><AlignLeft className="w-4 h-4" /></button>
                        <button onClick={() => updateElement(selectedElement.id, { align: 'center' })} className={`p-1.5 rounded-lg transition-all ${selectedElement.align === 'center' || !selectedElement.align ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}><AlignCenter className="w-4 h-4" /></button>
                        <button onClick={() => updateElement(selectedElement.id, { align: 'right' })} className={`p-1.5 rounded-lg transition-all ${selectedElement.align === 'right' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}><AlignRight className="w-4 h-4" /></button>
                    </div>
                  </>
               )}

               <div className="w-px h-5 bg-slate-100 mx-1" />
               <button onClick={() => {
                  const newText = prompt("Edit Content:", selectedElement.content);
                  if (newText !== null) updateElement(selectedElement.id, { content: newText });
               }} title="Edit Content" className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Type className="w-5 h-5" /></button>
               <button onClick={() => moveLayer("up")} title="Move Forward" className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><ArrowUp className="w-5 h-5" /></button>
               <button onClick={() => moveLayer("down")} title="Move Backward" className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><ArrowDown className="w-5 h-5" /></button>
               <div className="w-px h-5 bg-slate-100 mx-1" />
               <button onClick={() => {
                  setSlides(prev => prev.map((s, idx) => idx === currentSlideIndex ? { ...s, elements: s.elements.filter(el => el.id !== selectedElementId) } : s));
                  setSelectedElementId(null);
               }} title="Delete" className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
            </motion.div>
        )}

        <div className="flex gap-4">
          <button className="px-10 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95">Export Design</button>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-24 bg-white border-r border-slate-100 flex flex-col items-center py-12 space-y-12 z-40">
          {sidebarIcons.map((tool) => (
            <button key={tool.id} onClick={() => { setSidebarTool(tool.id); setSelectedElementId(null); }} className={`group relative p-4 rounded-2xl transition-all ${sidebarTool === tool.id ? "bg-blue-600 text-white shadow-2xl scale-110" : "text-slate-300 hover:text-slate-900 hover:bg-slate-50"}`}>
              <tool.icon className="w-7 h-7" />
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">{tool.label}</span>
            </button>
          ))}
        </div>

        {/* Intelligence Panel */}
        <div className="w-96 bg-white border-r border-slate-100 overflow-y-auto no-scrollbar z-30 p-10 shadow-sm">
           <AnimatePresence mode="wait">
             {sidebarTool === "ai" && (
                <motion.div key="ai" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300 mb-2">Design Intelligence</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">AI will design for your chosen canvas ratio.</p>
                    </div>
                    
                    <div className="space-y-8">
                        {/* Format Selector in AI Panel */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Canvas Format</label>
                            <div className="grid grid-cols-2 gap-2">
                                {ratios.map(r => (
                                    <button key={r.id} onClick={() => setAspectRatio(r.id)}
                                        className={`py-4 text-[10px] font-black rounded-2xl border transition-all leading-tight ${
                                            aspectRatio === r.id
                                            ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                                            : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                                        }`}>
                                        {r.label}
                                        <span className={`block text-[8px] mt-0.5 ${aspectRatio === r.id ? "text-blue-200" : "text-slate-300"}`}>{r.w}×{r.h}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Intelligence Command</label>
                            <textarea 
                              className="w-full px-6 py-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm min-h-[260px] focus:bg-white focus:border-blue-600 outline-none transition-all leading-relaxed font-semibold shadow-inner" 
                              value={aiForm.fullContent} 
                              onChange={(e) => setAiForm({...aiForm, fullContent: e.target.value, name: e.target.value.slice(0, 50)})} 
                              placeholder="Describe your vision... e.g. 'A futuristic AI workshop poster for 20th April at Hitam campus with a dark neon vibe'" 
                            />
                        </div>


                        {/* Pages Count */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Number of Pages</label>
                            <div className="flex items-center gap-0 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setAiForm(f => ({ ...f, slideCount: Math.max(1, f.slideCount - 1) }))}
                                    className="w-14 h-14 flex items-center justify-center text-xl font-black text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-90"
                                >−</button>
                                <div className="flex-1 text-center">
                                    <span className="text-3xl font-black text-slate-800">{aiForm.slideCount}</span>
                                    <span className="text-[9px] block text-slate-400 font-bold uppercase tracking-widest -mt-1">
                                        {aiForm.slideCount === 1 ? "Page" : "Pages"}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setAiForm(f => ({ ...f, slideCount: Math.min(6, f.slideCount + 1) }))}
                                    className="w-14 h-14 flex items-center justify-center text-xl font-black text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-all active:scale-90"
                                >+</button>
                            </div>
                            {/* Visual page indicators */}
                            <div className="flex gap-1.5 justify-center pt-1">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <button key={i}
                                        onClick={() => setAiForm(f => ({ ...f, slideCount: i + 1 }))}
                                        className={`h-1.5 rounded-full transition-all ${i < aiForm.slideCount ? "bg-blue-500" : "bg-slate-200"}`}
                                        style={{ width: i < aiForm.slideCount ? "24px" : "10px" }}
                                    />
                                ))}
                            </div>
                            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">
                                Each page gets a unique design variation
                            </p>
                        </div>

                        <button className="w-full py-6 bg-blue-600 hover:bg-blue-700 rounded-[3rem] shadow-2xl shadow-blue-500/30 border-0 transition-all active:scale-95 flex items-center justify-center gap-4" onClick={handleFullAIGenerate} disabled={isGenerating}>
                             {isGenerating
                                 ? <><svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><span className="text-white font-black text-sm uppercase tracking-wider">Generating...</span></>
                                 : <><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z"/></svg><div className="text-left leading-none"><p className="text-sm font-black uppercase tracking-tighter text-white">Generate {aiForm.slideCount} {aiForm.slideCount === 1 ? "Page" : "Pages"}</p><p className="text-[9px] text-white/60 uppercase font-bold mt-0.5 tracking-widest">AI Layout + Background</p></div></>
                             }
                        </button>
                        {isGenerating && (
                            <div className="text-center space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 animate-pulse">{genStatus}</p>
                                <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
             )}

              {sidebarTool === "text" && (
                <motion.div key="text" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300">Typography</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <button onClick={() => {
                            const newEl = { id: Date.now(), type: "text", x: 50, y: 50, content: "HEADING", color: "#0f172a", fontSize: "text-6xl", fontWeight: "font-black", align: "center", width: 90 };
                            updateCurrentSlide({ elements: [...currentSlide.elements, newEl] });
                            setSelectedElementId(newEl.id);
                        }} className="w-full py-12 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-500 font-black text-4xl transition-all shadow-sm">Heading</button>
                        
                        <button onClick={() => {
                            const newEl = { id: Date.now(), type: "text", x: 50, y: 60, content: "Start typing your sub-heading here...", color: "#64748b", fontSize: "text-lg", fontWeight: "font-bold", align: "center", maxWidth: 70 };
                            updateCurrentSlide({ elements: [...currentSlide.elements, newEl] });
                            setSelectedElementId(newEl.id);
                        }} className="w-full py-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-500 font-bold text-lg transition-all shadow-sm text-slate-400">Sub-heading</button>
                    </div>

                    <div className="space-y-4 pt-8 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AI Generator Text Style</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: "bold",    label: "Bold",    preview: "B", cls: "font-black" },
                                { id: "modern",  label: "Modern",  preview: "M", cls: "font-semibold tracking-widest" },
                                { id: "minimal", label: "Minimal", preview: "m", cls: "font-light" },
                                { id: "elegant", label: "Elegant", preview: "E", cls: "italic font-semibold" },
                                { id: "playful", label: "Playful", preview: "P", cls: "font-extrabold" },
                                { id: "sharp",   label: "Sharp",   preview: "S", cls: "font-black tracking-tighter" },
                            ].map(s => (
                                <button key={s.id}
                                    onClick={() => setAiForm(f => ({ ...f, textStyle: s.id }))}
                                    className={`py-3 flex flex-col items-center gap-1 rounded-2xl border text-[10px] font-black transition-all ${
                                        aiForm.textStyle === s.id
                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-105"
                                        : "bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-300"
                                    }`}>
                                    <span className={`text-xl ${s.cls}`}>{s.preview}</span>
                                    <span>{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
             )}

             {sidebarTool === "elements" && (
                <motion.div key="elements" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 text-center">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300">Assets</h3>
                    <div className="py-16 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50 flex flex-col items-center gap-4 group hover:border-blue-300 transition-all cursor-pointer" onClick={() => fileInputRef.current.click()}>
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                            <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600">Upload Image</p>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>
                </motion.div>
             )}

             {sidebarTool === "shapes" && (
                <motion.div key="shapes" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300">Shapes Library</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: "circle", label: "Circle", type: "circle", w: 30, h: 30, color: "#3b82f6", op: 0.2 },
                            { id: "square", label: "Square", type: "square", w: 40, h: 40, color: "#3b82f6", op: 0.2, br: "1rem" },
                            { id: "pill", label: "Pill", type: "pill", w: 50, h: 15, color: "#3b82f6", op: 0.2, br: "10rem" },
                            { id: "triangle", label: "Triangle", type: "triangle", w: 35, h: 35, color: "#3b82f6", op: 0.2 },
                            { id: "line-h", label: "H-Line", type: "line-h", w: 80, h: 0.5, color: "#3b82f6", op: 1 },
                            { id: "line-v", label: "V-Line", type: "line-v", w: 0.5, h: 80, color: "#3b82f6", op: 1 },
                        ].map(s => (
                            <button key={s.id} onClick={() => {
                                const newEl = { id: Date.now(), type: "shape", shapeType: s.type, x: 50, y: 50, width: s.w, height: s.h, color: s.color, opacity: s.op, borderRadius: s.br };
                                updateCurrentSlide({ elements: [...currentSlide.elements, newEl] });
                                setSelectedElementId(newEl.id);
                            }} className="group relative aspect-square bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-center hover:border-blue-500 transition-all overflow-hidden">
                                <div className={`w-10 h-10 bg-slate-200 transition-all group-hover:scale-110 ${s.type === 'circle' ? 'rounded-full' : s.type === 'pill' ? 'rounded-full w-12 h-6' : s.type === 'triangle' ? 'triangle-preview' : s.type === 'line-h' ? 'h-1 w-12' : s.type === 'line-v' ? 'w-1 h-12' : 'rounded-lg'}`} style={s.type === 'triangle' ? { clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" } : {}} />
                                <span className="absolute bottom-3 text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600">{s.label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
             )}

             {sidebarTool === "properties" && (
                <motion.div key="properties" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300">Properties</h3>
                    
                    {!selectedElement ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <Settings className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Select an element to edit</p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Selected: {selectedElement.type}</span>
                                    <button onClick={() => {
                                        updateCurrentSlide({ elements: currentSlide.elements.filter(el => el.id !== selectedElementId) });
                                        setSelectedElementId(null);
                                    }} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Color Overlay</label>
                                    <div className="flex items-center gap-4">
                                        <input type="color" value={selectedElement.color} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent" />
                                        <span className="text-xs font-mono font-bold text-slate-400 uppercase">{selectedElement.color}</span>
                                    </div>
                                </div>

                                {selectedElement.type === 'text' && (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Font Weight</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { id: "font-black", label: "Heavy" },
                                                    { id: "font-bold", label: "Bold" },
                                                    { id: "font-medium", label: "Medium" },
                                                    { id: "font-light", label: "Light" },
                                                ].map(w => (
                                                    <button key={w.id} onClick={() => updateElement(selectedElement.id, { fontWeight: w.id })} className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${selectedElement.fontWeight === w.id || (!selectedElement.fontWeight && w.id === 'font-black') ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-100 text-slate-400"}`}>
                                                        {w.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Formatting</label>
                                            <div className="flex gap-2">
                                                <button onClick={() => updateElement(selectedElement.id, { align: "left" })} className={`flex-1 py-2 rounded-lg border text-[10px] font-black ${selectedElement.align === 'left' ? "bg-slate-200 border-slate-300" : "bg-white border-slate-100 text-slate-400"}`}>LEFT</button>
                                                <button onClick={() => updateElement(selectedElement.id, { align: "center" })} className={`flex-1 py-2 rounded-lg border text-[10px] font-black ${selectedElement.align === 'center' || !selectedElement.align ? "bg-slate-200 border-slate-300" : "bg-white border-slate-100 text-slate-400"}`}>CENTER</button>
                                                <button onClick={() => updateElement(selectedElement.id, { align: "right" })} className={`flex-1 py-2 rounded-lg border text-[10px] font-black ${selectedElement.align === 'right' ? "bg-slate-200 border-slate-300" : "bg-white border-slate-100 text-slate-400"}`}>RIGHT</button>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => updateElement(selectedElement.id, { textCase: "uppercase" })} className={`flex-1 py-2 rounded-lg border text-[10px] font-black ${selectedElement.textCase === 'uppercase' || !selectedElement.textCase ? "bg-slate-200 border-slate-300" : "bg-white border-slate-100 text-slate-400"}`}>ALL CAPS</button>
                                                <button onClick={() => updateElement(selectedElement.id, { textCase: "normal-case" })} className={`flex-1 py-2 rounded-lg border text-[10px] font-black ${selectedElement.textCase === 'normal-case' ? "bg-slate-200 border-slate-300" : "bg-white border-slate-100 text-slate-400"}`}>NORMAL</button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Font Size</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["text-xs", "text-sm", "text-lg", "text-2xl", "text-4xl", "text-6xl"].map(s => (
                                                    <button key={s} onClick={() => updateElement(selectedElement.id, { fontSize: s })} className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${selectedElement.fontSize === s ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-100 text-slate-400"}`}>
                                                        {s.replace("text-", "")}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-6 pt-4 border-t border-slate-100">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dimensions</label>
                                            <span className="text-[10px] font-mono text-blue-500 font-bold">{Math.round(selectedElement.width)}% × {Math.round(selectedElement.height || 0)}%</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-bold text-slate-400 w-4">W</span>
                                                <input type="range" min="1" max="100" value={selectedElement.width || 50} onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) })} className="flex-grow accent-blue-600 h-1" />
                                            </div>
                                            {selectedElement.type !== 'text' && (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-bold text-slate-400 w-4">H</span>
                                                    <input type="range" min="1" max="100" value={selectedElement.height || 50} onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) })} className="flex-grow accent-blue-600 h-1" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opacity</label>
                                            <span className="text-[10px] font-mono text-blue-500 font-bold">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
                                        </div>
                                        <input type="range" min="0" max="1" step="0.01" value={selectedElement.opacity || 1} onChange={(e) => updateElement(selectedElement.id, { opacity: parseFloat(e.target.value) })} className="w-full accent-blue-600 h-1" />
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Side Padding</label>
                                            <span className="text-[10px] font-mono text-blue-500 font-bold">{selectedElement.padding || 0}px</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={selectedElement.padding || 0} onChange={(e) => updateElement(selectedElement.id, { padding: parseInt(e.target.value) })} className="w-full accent-blue-600 h-1" />
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => updateCurrentSlide({ elements: [] })} className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-600 transition-all">Clear All Elements</button>
                        </div>
                    )}
                </motion.div>
             )}

             {sidebarTool === "settings" && (
                <motion.div key="settings" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300">Design Settings</h3>
                    <div className="space-y-5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Output Format</label>
                        <div className="grid grid-cols-2 gap-4">
                            {postTypes.map(t => (
                                <button key={t.id} onClick={() => setAspectRatio(t.ratio)} className={`px-4 py-8 text-[11px] font-black rounded-[1.5rem] border transition-all ${aspectRatio === t.ratio ? "bg-blue-600 text-white border-blue-600 shadow-xl" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"}`}>{t.label}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Base Palette</label>
                        <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                             <input type="color" className="w-14 h-14 rounded-2xl cursor-pointer bg-transparent border-0" value={currentSlide.bgColor} onChange={(e) => updateCurrentSlide({ bgColor: e.target.value })} />
                             <span className="text-xs font-black uppercase tracking-widest opacity-30">{currentSlide.bgColor}</span>
                        </div>
                    </div>
                </motion.div>
             )}

           </AnimatePresence>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-grow bg-[#f8fafc] flex flex-col items-center justify-start overflow-auto p-10" onClick={() => setSelectedElementId(null)}>
           <div
             className="relative shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] border border-slate-200 overflow-hidden mb-10 flex-shrink-0"
             style={{ width: currentRatio.w, height: currentRatio.h }}
           >
              <motion.div
                layout key={currentSlide.id + aspectRatio}
                style={{ backgroundColor: currentSlide.bgColor, width: currentRatio.w, height: currentRatio.h }}
                className="relative overflow-hidden"
              >
                 {currentSlide.bg && currentSlide.bgType === "image" && (
                     <>
                        <img src={currentSlide.bg} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
                     </>
                 )}

                 {/* Layered Content */}
                 {currentSlide.elements.map(el => (
                    <motion.div
                        key={el.id} drag dragConstraints={canvasRef} dragElastic={0} dragMomentum={false}
                        onDragStart={() => setSelectedElementId(el.id)}
                        onDragEnd={(e, info) => {
                            const container = canvasRef.current?.getBoundingClientRect();
                            if (!container) return;
                            const x = ((el.x + (info.offset.x / container.width) * 100));
                            const y = ((el.y + (info.offset.y / container.height) * 100));
                            updateElement(el.id, { x, y });
                        }}
                        onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                        onDoubleClick={() => {
                            if (el.type === 'text') {
                                const newText = prompt("Edit Text:", el.content);
                                if (newText !== null) updateElement(el.id, { content: newText });
                            }
                        }}
                        style={{
                          position: "absolute",
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          width: typeof el.width === 'number' ? `${el.width}%` : (el.width || "auto"),
                          height: (el.type === 'shape' || el.type === 'image') ? (typeof el.height === 'number' ? `${el.height}%` : el.height) : "auto",
                          color: el.color,
                          transform: "translate(-50%, -50%)",
                          zIndex: selectedElementId === el.id ? 50 : 10,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center",
                        }}
                        className={`cursor-move group/el ${selectedElementId === el.id ? 'ring-2 ring-blue-500/60 bg-blue-500/5 backdrop-blur-sm rounded-xl shadow-xl' : ''}`}
                    >
                        {/* Standard Text */}
                        {el.type === "text" && (
                          <div
                            style={{ 
                              width: "100%",
                              textAlign: el.align || "center",
                              padding: el.padding ? `${el.padding}px` : "10px"
                            }}
                            className={`${el.fontWeight || 'font-black'} ${el.fontSize} ${el.textCase || 'uppercase'} ${el.tracking || 'tracking-tighter'} break-words drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] px-2`}
                          >{el.content}</div>
                        )}
                        {/* Shape */}
                        {el.type === "shape" && (
                          <div 
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              backgroundColor: el.color, 
                              opacity: el.opacity, 
                              padding: el.padding ? `${el.padding}px` : "0px",
                              borderRadius: (el.shapeType === "circle" || el.shapeType === "pill") ? "100rem" : (el.borderRadius || "0.5rem"),
                              border: el.border || "none",
                              clipPath: el.shapeType === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : "none",
                              backdropFilter: el.opacity < 1 ? "blur(12px)" : "none",
                              WebkitBackdropFilter: el.opacity < 1 ? "blur(12px)" : "none",
                            }} 
                            className="shadow-2xl transition-all duration-300" 
                          />
                        )}
                        {/* Image */}
                        {el.type === "image" && (
                          <img src={el.content} style={{ width: "100%", height: "100%", objectFit: "cover" }} className="rounded-2xl shadow-2xl pointer-events-none border-2 border-white/20" />
                        )}

                        {/* Resize Handles (8-Point Pro Suite) */}
                        {selectedElementId === el.id && (
                          <>
                            {/* Right Side */}
                            <motion.div 
                                drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                dragElastic={0} dragMomentum={false}
                                onDragStart={(e) => {
                                    window.currentCanvasBounds = canvasRef.current?.getBoundingClientRect();
                                }}
                                onDrag={(e, info) => {
                                    const container = window.currentCanvasBounds;
                                    if (!container) return;
                                    const deltaW = (info.delta.x / container.width) * 100;
                                    updateElement(el.id, { 
                                        width: Math.max(5, (el.width || 50) + deltaW),
                                        x: el.x + (deltaW / 2)
                                    });
                                }}
                                className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 -mr-3 z-[60] flex items-center justify-center cursor-ew-resize group/h"
                            >
                                <div className="w-2.5 h-8 bg-blue-600 rounded-full shadow-lg border-2 border-white group-hover/h:scale-110 transition-transform" />
                            </motion.div>

                            {/* Left Side */}
                            <motion.div 
                                drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                dragElastic={0} dragMomentum={false}
                                onDragStart={(e) => {
                                    window.currentCanvasBounds = canvasRef.current?.getBoundingClientRect();
                                }}
                                onDrag={(e, info) => {
                                    const container = window.currentCanvasBounds;
                                    if (!container) return;
                                    const deltaW = (-info.delta.x / container.width) * 100;
                                    updateElement(el.id, { 
                                        width: Math.max(5, (el.width || 50) + deltaW),
                                        x: el.x - (deltaW / 2)
                                    });
                                }}
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 -ml-3 z-[60] flex items-center justify-center cursor-ew-resize group/h"
                            >
                                <div className="w-2.5 h-8 bg-blue-600 rounded-full shadow-lg border-2 border-white group-hover/h:scale-110 transition-transform" />
                            </motion.div>

                            {/* Bottom Side */}
                            {el.type !== 'text' && (
                                <motion.div 
                                    drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                    dragElastic={0} dragMomentum={false}
                                    onDragStart={(e) => {
                                        window.currentCanvasBounds = canvasRef.current?.getBoundingClientRect();
                                    }}
                                    onDrag={(e, info) => {
                                        const container = window.currentCanvasBounds;
                                        if (!container) return;
                                        const deltaH = (info.delta.y / container.height) * 100;
                                        updateElement(el.id, { 
                                            height: Math.max(5, (el.height || 50) + deltaH),
                                            y: el.y + (deltaH / 2)
                                        });
                                    }}
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-6 -mb-3 z-[60] flex items-center justify-center cursor-ns-resize group/h"
                                >
                                    <div className="w-8 h-2.5 bg-blue-600 rounded-full shadow-lg border-2 border-white group-hover/h:scale-110 transition-transform" />
                                </motion.div>
                            )}

                            {/* Top Side */}
                            {el.type !== 'text' && (
                                <motion.div 
                                    drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                    dragElastic={0} dragMomentum={false}
                                    onDragStart={(e) => {
                                        window.currentCanvasBounds = canvasRef.current?.getBoundingClientRect();
                                    }}
                                    onDrag={(e, info) => {
                                        const container = window.currentCanvasBounds;
                                        if (!container) return;
                                        const deltaH = (-info.delta.y / container.height) * 100;
                                        updateElement(el.id, { 
                                            height: Math.max(5, (el.height || 50) + deltaH),
                                            y: el.y - (deltaH / 2)
                                        });
                                    }}
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-6 -mt-3 z-[60] flex items-center justify-center cursor-ns-resize group/h"
                                >
                                    <div className="w-8 h-2.5 bg-blue-600 rounded-full shadow-lg border-2 border-white group-hover/h:scale-110 transition-transform" />
                                </motion.div>
                            )}

                            {/* Bottom-Right Corner */}
                            <motion.div 
                                drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                dragElastic={0} dragMomentum={false}
                                onDragStart={(e) => {
                                    window.currentCanvasBounds = canvasRef.current?.getBoundingClientRect();
                                }}
                                onDrag={(e, info) => {
                                    const container = window.currentCanvasBounds;
                                    if (!container) return;
                                    const deltaW = (info.delta.x / container.width) * 100;
                                    const deltaH = (info.delta.y / container.height) * 100;
                                    updateElement(el.id, { 
                                        width: Math.max(5, (el.width || 50) + deltaW), 
                                        height: el.type === 'text' ? el.height : Math.max(5, (el.height || 50) + deltaH),
                                        x: el.x + (deltaW / 2),
                                        y: el.type === 'text' ? el.y : el.y + (deltaH / 2)
                                    });
                                }}
                                className="absolute bottom-0 right-0 w-8 h-8 -mr-4 -mb-4 z-[60] flex items-center justify-center cursor-nwse-resize group/h"
                            >
                                <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg group-hover/h:scale-110 transition-transform" />
                            </motion.div>
                          </>
                        )}
                        {/* Event Date Row */}
                        {el.type === "eventDate" && (
                          <div style={{ maxWidth: `${currentRatio.w * 0.85}px` }} className="flex items-center gap-2 px-2 py-0.5">
                            <span style={{ color: el.accentColor }} className="text-sm shrink-0">📅</span>
                            <span style={{ color: el.color }} className="text-xs font-semibold drop-shadow-md leading-tight">{el.content}</span>
                          </div>
                        )}
                        {/* Venue Row */}
                        {el.type === "venue" && (
                          <div style={{ maxWidth: `${currentRatio.w * 0.85}px` }} className="flex items-center gap-2 px-2 py-0.5">
                            <span style={{ color: el.accentColor }} className="text-sm shrink-0">📍</span>
                            <span style={{ color: el.color }} className="text-xs font-semibold drop-shadow-md leading-tight">{el.content}</span>
                          </div>
                        )}
                        {/* Check Item / Bullet */}
                        {el.type === "checkItem" && (
                          <div style={{ maxWidth: `${currentRatio.w * 0.85}px` }} className="flex items-start gap-2 px-2 py-0.5">
                            <span style={{ color: el.accentColor }} className="text-sm shrink-0 mt-0.5">✓</span>
                            <span style={{ color: el.color }} className="text-xs font-medium drop-shadow-md leading-tight">{el.content}</span>
                          </div>
                        )}
                        {/* Stats Row */}
                        {el.type === "statsRow" && (
                          <div style={{ maxWidth: `${currentRatio.w * 0.85}px` }} className="flex items-center gap-3 px-2 py-1">
                            <span className="text-sm">⭐</span>
                            <span style={{ color: el.color }} className="text-xs font-bold drop-shadow-md tracking-wide">{el.content}</span>
                          </div>
                        )}
                        {/* Note Box */}
                        {el.type === "noteBox" && (
                          <div
                            style={{ maxWidth: `${currentRatio.w * 0.82}px`, border: `1.5px solid ${el.accentColor}`, borderRadius: "0.5rem" }}
                            className="px-3 py-2"
                          >
                            <span style={{ color: el.color }} className="text-xs font-bold drop-shadow-md">{el.content}</span>
                          </div>
                        )}
                        {/* Info Card — educational grid card */}
                        {el.type === "infoCard" && (
                          <div
                            style={{
                              width: `${el.width}px`,
                              background: `color-mix(in srgb, ${el.accentColor} 8%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${el.accentColor} 25%, transparent)`,
                              borderRadius: "0.75rem",
                              borderLeft: `3px solid ${el.accentColor}`,
                            }}
                            className="px-3 py-2.5 shadow-sm"
                          >
                            <div className="flex items-start gap-2">
                              <span style={{ color: el.accentColor, lineHeight: 1 }} className="text-lg font-black shrink-0 leading-none mt-0.5">{el.num}</span>
                              <div className="min-w-0">
                                <p style={{ color: el.color }} className="text-xs font-black leading-tight truncate">{el.term}</p>
                                <p style={{ color: el.subColor || el.color, opacity: 0.75 }} className="text-[10px] font-medium leading-snug mt-0.5 line-clamp-2">{el.desc}</p>
                              </div>
                            </div>
                          </div>
                        )}
                    </motion.div>
                 ))}
                 <div ref={canvasRef} className="absolute inset-0 pointer-events-none border-[30px] border-transparent" />
              </motion.div>
           </div>

           {/* Production Slide Navigator */}
           <div className="flex items-center gap-6 bg-white px-10 py-6 rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-slate-100">
              {slides.map((s, idx) => (
                  <div key={s.id} className="relative group">
                    <button onClick={() => setCurrentSlideIndex(idx)} className={`w-16 h-24 rounded-2xl overflow-hidden border-4 transition-all ${currentSlideIndex === idx ? "border-blue-600 scale-110 shadow-2xl" : "border-slate-50 opacity-40 hover:opacity-100"}`}>
                        <div style={{ background: s.bgColor }} className="w-full h-full flex items-center justify-center text-[11px] font-black opacity-20">{idx + 1}</div>
                        {s.bg && <img src={s.bg} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                    </button>
                    {slides.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); setSlides(slides.filter((_, i) => i !== idx)); setCurrentSlideIndex(Math.max(0, idx - 1)); }} className="absolute -top-3 -right-3 bg-red-500 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                  </div>
              ))}
              <button onClick={() => setSlides([...slides, { id: Date.now(), elements: [], bg: null, bgColor: "#ffffff", bgType: "solid" }])} className="w-16 h-24 border-4 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-slate-200 hover:border-blue-600 hover:text-blue-600 transition-all hover:bg-slate-50">
                  <Plus className="w-8 h-8" />
              </button>
           </div>
        </div>
      </div>
      
      {/* ────────────────────────────────────────────────────────── */}
      {/* FLOATING DESIGN STRATEGIST CHATBOT                         */}
      {/* ────────────────────────────────────────────────────────── */}
      
      {/* Toggle Button */}
      <motion.button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_10px_40px_-10px_rgba(37,99,235,0.8)] z-[100] border-4 border-white"
      >
        {isChatOpen ? <Shapes className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
        {!isChatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
            <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.9 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                className="fixed bottom-28 right-8 w-[400px] h-[600px] bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-[2.5rem] flex flex-col z-[90] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-800 mb-1">Design Strategist</h3>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Llama 3.1 Intelligence</p>
                        </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4 opacity-0" /> {/* Spacer */}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-slate-50/50">
                    {chatMessages.map((m, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-5 py-4 rounded-[1.8rem] text-sm font-semibold shadow-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-none'}`}>
                                {m.content}
                            </div>
                        </motion.div>
                    ))}
                    {isAiThinking && (
                        <div className="flex justify-start">
                            <div className="bg-white px-5 py-4 rounded-[1.8rem] border border-slate-200/60 rounded-tl-none shadow-sm flex gap-1">
                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    {isGenerating && (
                        <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3 animate-pulse text-center">{genStatus}</p>
                            <div className="w-full bg-white rounded-full h-2 overflow-hidden shadow-inner">
                                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 15, ease: "linear" }} className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-5 bg-white border-t border-slate-100 shrink-0">
                    <div className="relative">
                        <textarea 
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm focus:bg-white focus:border-blue-600 outline-none transition-all pr-16 resize-none no-scrollbar font-semibold"
                            rows={1}
                            placeholder="Ask me to design..."
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(userPrompt); }}}
                        />
                        <button 
                            onClick={() => handleSendMessage(userPrompt)}
                            className="absolute right-2.5 bottom-2.5 w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DesignerPage;

