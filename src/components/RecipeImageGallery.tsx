import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, ImageOff, ZoomIn } from "lucide-react";
import Image from "next/image";

interface RecipeImageGalleryProps {
  images: string[];
  title?: string;
}

export default function RecipeImageGallery({
  images,
  title,
}: RecipeImageGalleryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Global keyboard handler for modal
  useEffect(() => {
    if (!isModalOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isModalOpen, closeModal, nextImage, prevImage]);

  // Focus modal when opened for accessibility
  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isModalOpen]);

  if (!images || images.length === 0) return null;

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const remainingCount = images.length - 3;

  return (
    <>
      <div style={{ width: "100%" }}>
        {images.length === 1 ? (
          /* Single image: polaroid frame with zoom */
          <div
            className="notebook-photo"
            style={{ maxWidth: "340px", cursor: "pointer", position: "relative" }}
            onClick={() => openModal(0)}
            role="button"
            tabIndex={0}
            aria-label="View full size image"
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openModal(0); }}
          >
            <ImageWithFallback
              src={images[0]}
              alt={title || "Recipe image"}
              width={320}
              height={220}
            />
            <div className="gallery-zoom-hint">
              <ZoomIn size={14} />
            </div>
            {title && <p className="notebook-photo-caption">{title}</p>}
          </div>
        ) : images.length === 2 ? (
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {images.map((src, index) => (
              <div
                key={index}
                className="notebook-photo"
                style={{ flex: "1 1 160px", maxWidth: "260px", cursor: "pointer", position: "relative" }}
                onClick={() => openModal(index)}
                role="button"
                tabIndex={0}
                aria-label={`View image ${index + 1}`}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openModal(index); }}
              >
                <ImageWithFallback
                  src={src}
                  alt={`Recipe image ${index + 1}`}
                  width={260}
                  height={180}
                />
                <div className="gallery-zoom-hint">
                  <ZoomIn size={14} />
                </div>
                {index === 0 && title && <p className="notebook-photo-caption">{title}</p>}
              </div>
            ))}
          </div>
        ) : (
          /* 3+ images: polaroid grid */
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {images.slice(0, 3).map((src, index) => (
              <div
                key={index}
                className="notebook-photo"
                style={{
                  flex: index === 0 ? "1 1 200px" : "1 1 140px",
                  maxWidth: index === 0 ? "300px" : "220px",
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => openModal(index)}
                role="button"
                tabIndex={0}
                aria-label={`View image ${index + 1}`}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openModal(index); }}
              >
                <ImageWithFallback
                  src={src}
                  alt={`Recipe image ${index + 1}`}
                  width={index === 0 ? 300 : 220}
                  height={index === 0 ? 210 : 150}
                />
                <div className="gallery-zoom-hint">
                  <ZoomIn size={14} />
                </div>
                {index === 0 && title && <p className="notebook-photo-caption">{title}</p>}
                {index === 2 && remainingCount > 0 && (
                  <div className="gallery-more-overlay">
                    <span className="gallery-more-count">+{remainingCount}</span>
                    <span className="gallery-more-label">more</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox modal */}
      {isModalOpen && (
        <div
          ref={modalRef}
          className="gallery-modal-backdrop"
          onClick={closeModal}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <div className="gallery-modal-inner">
            <button
              onClick={closeModal}
              className="gallery-modal-close"
              aria-label="Close lightbox"
            >
              <X size={24} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="gallery-modal-nav gallery-modal-nav--left"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="gallery-modal-nav gallery-modal-nav--right"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image
                src={images[currentImageIndex]}
                alt={`Recipe image ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 1280px) 90vw, 80vw"
                priority
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {images.length > 1 && (
              <>
                <div className="gallery-modal-counter">
                  {currentImageIndex + 1} / {images.length}
                </div>
                <div className="gallery-modal-thumbs">
                  {images.map((src, index) => (
                    <button
                      key={index}
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                      className={`gallery-thumb ${index === currentImageIndex ? "gallery-thumb--active" : ""}`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <Image src={src} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ImageWithFallback({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div style={{
        width: "100%", height: height, display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "var(--accent-light)", color: "var(--muted)",
      }}>
        <ImageOff size={36} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={{ width: "100%", height: "auto", objectFit: "cover", display: "block" }}
      loading="lazy"
      quality={85}
      onError={() => setError(true)}
    />
  );
}
