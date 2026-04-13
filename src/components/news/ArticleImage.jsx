import { useState, useEffect, useRef } from "react";

const FALLBACK = "https://images.unsplash.com/photo-1620712943543-bcc4628c6733?q=80&w=1200";
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
    const cancelled = useRef(false);

    useEffect(() => {
        if (!articleUrl) return;
        cancelled.current = false;

        fetch(`${API}/api/article-image?url=${encodeURIComponent(articleUrl)}`)
            .then(r => r.json())
            .then(data => {
                if (cancelled.current) return;
                const realImg = data?.image;
                if (realImg && realImg.startsWith("http")) {
                    // Preload to avoid flash
                    const img = new Image();
                    img.onload  = () => { if (!cancelled.current) setRealSrc(realImg); };
                    img.onerror = () => {}; // Keep fallback silently
                    img.src = realImg;
                }
            })
            .catch(() => {});

        return () => { cancelled.current = true; };
    }, [articleUrl]);

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Fallback — always visible immediately */}
            <img
                src={displaySrc}
                alt={alt}
                onError={() => setDisplaySrc(FALLBACK)}
                className={className}
                style={style}
            />
            {/* Real article og:image — fades in when ready */}
            {realSrc && (
                <img
                    src={realSrc}
                    alt={alt}
                    onError={() => setRealSrc(null)}
                    className={`${className} absolute inset-0 animate-[fadeIn_0.8s_ease-in-out_forwards]`}
                    style={style}
                />
            )}
        </div>
    );
};

export default ArticleImage;
