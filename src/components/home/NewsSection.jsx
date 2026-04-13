import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Calendar, Newspaper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";

const NewsSection = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai-news`);
            const data = await response.json();
            if (data.items) {
                setNews(data.items.slice(0, 3)); // Only show top 3 on home page
            }
        } catch (error) {
            console.error("Error fetching news:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-8 mx-auto"></div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (news.length === 0) return null;

    return (
        <section className="py-24 px-4 relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20 dark:opacity-30">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-sm font-bold tracking-wide uppercase mb-4"
                        >
                            <Newspaper size={16} />
                            Breaking Updates
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white"
                        >
                            Latest in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI Innovation</span>
                        </motion.h2>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <Button
                            variant="outline"
                            className="group border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all"
                            onClick={() => navigate("/news")}
                        >
                            View All News
                            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {news.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="h-full flex flex-col group hover:-translate-y-2 transition-all duration-500 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-800/50 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden rounded-[2rem]">
                                {/* Card Image Header */}
                                <div className="relative h-48 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <motion.img 
                                        src={item.imageUrl || "https://images.unsplash.com/photo-1620712943543-bcc4628c6733?q=80&w=1200"} 
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest px-2.5 py-1 bg-blue-600 rounded-lg shadow-lg">
                                            {item.category}
                                        </span>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/20">
                                            {item.region === "India" ? "India 🇮🇳" : "Global 🌍"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col h-full relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-bold">
                                            <Calendar size={12} className="text-blue-500" />
                                            {new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{item.source}</span>
                                    </div>

                                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                                            {item.title}
                                        </a>
                                    </h3>

                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 line-clamp-3 leading-relaxed flex-grow font-medium">
                                        {item.description}
                                    </p>

                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between mt-auto">
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 font-black text-sm flex items-center gap-2 group/link"
                                        >
                                            Explore Story
                                            <ExternalLink size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                        </a>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NewsSection;
