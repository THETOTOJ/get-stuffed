"use client";
import { useRef, Dispatch, SetStateAction, useState } from "react";
import { X, Plus, ImagePlus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableImageUploaderProps {
  images: File[];
  setImages: Dispatch<SetStateAction<File[]>>;
  previews: string[];
  setPreviews: Dispatch<SetStateAction<string[]>>;
  onRemove?: (index: number) => void | Promise<void>;
}

function SortableImageItem({
  id,
  src,
  index,
  onRemove,
}: {
  id: string;
  src: string;
  index: number;
  onRemove: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: false // Ensure it's not disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation(); // Stop all propagation
    console.log("🗑️ Remove clicked for index:", index);
    onRemove(index);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-image-item ${isDragging ? "dragging" : ""}`}
    >
      {/* Drag handle area - only this part should trigger drag */}
      <div className="drag-handle" {...attributes} {...listeners}>
        <img
          src={src || "/images/placeholder.png"}
          alt={`recipe image ${index + 1}`}
          className="sortable-image"
        />
      </div>
      
      {/* Remove button - completely separate from drag handle */}
      <button
        type="button"
        onClick={handleRemoveClick}
        className="remove-button"
        aria-label="Remove image"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
      
      <div className="order-badge">
        {index + 1}
      </div>
    </div>
  );
}

export default function SortableImageUploader({
  images,
  setImages,
  previews,
  setPreviews,
  onRemove,
}: SortableImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const imageCount = images.length;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Only start dragging after moving 8px
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemove(index: number) {
    console.log("🔴 handleRemove called with index:", index);
    console.log("Current previews length:", previews.length);
    console.log("Current images length:", images.length);
    
    if (onRemove) {
      // If parent provides onRemove, let parent handle it
      onRemove(index);
    } else {
      // Clean up the object URL to prevent memory leaks
      if (previews[index]) {
        URL.revokeObjectURL(previews[index]);
      }
      
      // Use functional updates to ensure we have the latest state
      setImages((currentImages) => {
        const newImages = currentImages.filter((_, i) => i !== index);
        console.log("New images length:", newImages.length);
        return newImages;
      });
      
      setPreviews((currentPreviews) => {
        const newPreviews = currentPreviews.filter((_, i) => i !== index);
        console.log("New previews length:", newPreviews.length);
        return newPreviews;
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = parseInt(active.id as string);
    const newIndex = parseInt(over.id as string);

    setImages((prev) => {
      const reordered = [...prev];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      return reordered;
    });

    setPreviews((prev) => {
      const reordered = [...prev];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      return reordered;
    });
  }

  function handleDragStart() {
    setIsDragging(true);
  }

  const itemIds = previews.map((_, i) => String(i));

  return (
    <div className="sortable-uploader-container">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <SortableContext
          items={itemIds}
          strategy={horizontalListSortingStrategy}
        >
          <div className="images-wrapper">
            {previews.map((src, i) => (
              <SortableImageItem
                key={`image-${i}-${Date.now()}`} // Force re-render on changes
                id={String(i)}
                src={src}
                index={i}
                onRemove={handleRemove}
              />
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="upload-button"
              aria-label={`Upload images (${imageCount} added)`}
            >
              <ImagePlus size={28} strokeWidth={1.5} className="upload-icon" />
              <span className="upload-text">
                {imageCount === 0 ? "Add photos" : "Add more"}
              </span>

              {imageCount > 0 && (
                <div className="count-badge">
                  {imageCount}
                </div>
              )}
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {previews.length === 0 && (
        <p className="empty-hint">
          Click to add photos, you can add multiple at once!
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden-input"
        onChange={handleFileChange}
      />
    </div>
  );
}