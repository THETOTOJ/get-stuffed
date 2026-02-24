"use client";
import { useRef, Dispatch, SetStateAction } from "react";
import { X, Plus, ImagePlus } from "lucide-react";

interface SortableImageUploaderProps {
  images: File[];
  setImages: Dispatch<SetStateAction<File[]>>;
  previews: string[];
  setPreviews: Dispatch<SetStateAction<string[]>>;
  onRemove?: (index: number) => void | Promise<void>;
}

export default function SortableImageUploader({
  images,
  setImages,
  previews,
  setPreviews,
  onRemove,
}: SortableImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageCount = images.length;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemove(index: number) {
    if (onRemove) {
      onRemove(index);
    } else {
      setImages((prev) => prev.filter((_, i) => i !== index));
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    }
  }

  return (
    <div
      style={{
        background: "var(--background)",
        border: "1.5px dashed var(--border)",
        borderRadius: "10px",
        padding: "0.75rem",
        overflowX: "auto",
      }}
    >
      <div style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>

        {/* Existing image thumbnails */}
        {previews.map((src, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              width: "140px",
              height: "140px",
              flexShrink: 0,
              borderRadius: "8px",
              overflow: "hidden",
              border: "1.5px solid var(--border-light)",
              boxShadow: "0 2px 8px var(--shadow)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src || "/images/placeholder.png"}
              alt={`recipe image ${i + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleRemove(i)}
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.65)",
                border: "none",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                backdropFilter: "blur(4px)",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(180,40,30,0.9)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.65)"}
              aria-label="Remove image"
            >
              <X size={13} strokeWidth={2.5} />
            </button>

            {/* Order badge */}
            <div style={{
              position: "absolute",
              bottom: "5px",
              left: "6px",
              background: "rgba(0,0,0,0.5)",
              color: "white",
              fontFamily: "var(--hand-font, 'Caveat', cursive)",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "0.05rem 0.4rem",
              borderRadius: "20px",
              backdropFilter: "blur(4px)",
            }}>
              {i + 1}
            </div>
          </div>
        ))}

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "140px",
            height: "140px",
            flexShrink: 0,
            border: "1.5px dashed var(--accent)",
            borderRadius: "8px",
            background: "var(--accent-light)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            color: "var(--accent)",
            transition: "background 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
            position: "relative",
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "var(--card)";
            b.style.transform = "scale(1.03)";
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "var(--accent-light)";
            b.style.transform = "scale(1)";
          }}
          aria-label={`Upload images (${imageCount} added)`}
        >
          <ImagePlus size={28} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <span style={{
            fontFamily: "var(--hand-font, 'Caveat', cursive)",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "var(--accent)",
            lineHeight: 1.2,
            textAlign: "center",
          }}>
            {imageCount === 0 ? "Add photos" : "Add more"}
          </span>

          {/* Count badge */}
          {imageCount > 0 && (
            <div style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "var(--accent)",
              color: "var(--button-text)",
              fontFamily: "var(--body-font)",
              fontSize: "0.72rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--card)",
              boxShadow: "0 1px 4px var(--shadow)",
            }}>
              {imageCount}
            </div>
          )}
        </button>

      </div>

      {/* Empty hint */}
      {previews.length === 0 && (
        <p style={{
          fontFamily: "var(--hand-font, 'Caveat', cursive)",
          fontSize: "0.88rem",
          color: "var(--muted)",
          margin: "0.6rem 0 0",
          opacity: 0.75,
        }}>
          Click to add photos — you can add multiple at once
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}