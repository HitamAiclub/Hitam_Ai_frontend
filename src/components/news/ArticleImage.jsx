import { useState, useEffect, useRef } from "react";

const FALLBACK = "/ai-news-fallback.png";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * ArticleImage
 * 1. Shows `fallback` (keyword-matched Unsplash) immediately
 * 2. Calls our backend /api/article-image which:
 *      - Follows Google News redirect → real article URL
 *      - Extracts og:image / twitter:image from the article HTML
 *      - Caches the result for 24 hours
 * 3. Cross-fades into the real article thumbnail once loaded
 */
const ArticleImage = ({ articleUrl, fallback, alt, className, style }) => {
    const [displaySrc, setDisplaySrc] = useState(fallback || FALLBACK);
    const [realSrc, setRealSrc]       = useState(null);
    const [isLoading, setIsLoading]   = useState(true);
    const cancelled = useRef(false);

    useEffect(() => {
        if (!articleUrl) {
            setIsLoading(false);
            return;
        }
        cancelled.current = false;
        setIsLoading(true);

        fetch(`${API}/api/article-image?url=${encodeURIComponent(articleUrl)}`)
            .then(r => r.json())
            .then(data => {
                if (cancelled.current) return;
                const realImg = data?.image;
                if (realImg && realImg.startsWith("http")) {
                    const img = new Image();
                    img.onload  = () => { 
                        if (!cancelled.current) {
                            setRealSrc(realImg);
                            setIsLoading(false);
                        }
                    };
                    img.onerror = () => { if (!cancelled.current) setIsLoading(false); };
                    img.src = realImg;
                } else {
                    setIsLoading(false);
                }
            })
            .catch(() => { if (!cancelled.current) setIsLoading(false); });

        return () => { cancelled.current = true; };
    }, [articleUrl]);

    return (
        <div className={`${className} overflow-hidden bg-gray-100 dark:bg-gray-800`} style={style}>
            {/* Loading Shimmer */}
            {isLoading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-200 dark:bg-gray-800 animate-pulse">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
            )}

            {/* Fallback Image */}
            <img
                src={displaySrc}
                alt={alt || ""}
                onError={() => { if (displaySrc !== FALLBACK) setDisplaySrc(FALLBACK); }}
                className={`w-full h-full object-cover transition-opacity duration-500 ${realSrc ? 'opacity-0' : 'opacity-100'}`}
            />

            {/* Real Article Image */}
            {realSrc && (
                <img
                    src={realSrc}
                    alt={alt || ""}
                    onError={() => setRealSrc(null)}
                    className="absolute inset-0 w-full h-full object-cover z-20 animate-[fadeIn_0.8s_ease-in-out_forwards]"
                />
            )}
        </div>
    );
};

export default ArticleImage;
