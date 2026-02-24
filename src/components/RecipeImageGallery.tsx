import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ImageOff } from "lucide-react";
import Image from "next/image";

interface RecipeImageGalleryProps {
  images: string[];
}

export default function RecipeImageGallery({
  images,
}: RecipeImageGalleryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const remainingCount = images.length - 3;

  const openModal = (index: number = 0) => {
    console.log("Opening modal with index:", index); // Debug log
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
  };

  // Shared hover/tilt effect class
  const tiltClass = "transition-all duration-300 ease-in-out hover:rotate-1 hover:scale-[1.02] hover:shadow-xl cursor-pointer";

  // Handle click on the image container
  const handleImageClick = (index: number) => {
    openModal(index);
  };

  return (
    <>
      <div className="w-full">
        {images.length === 1 ? (
          <div 
            className="w-full cursor-pointer" 
            onClick={() => handleImageClick(0)}
          >
            <ImageWithFallback
              src={images[0]}
              alt="Recipe image"
              className={`w-full h-80 sm:h-96 object-cover rounded-xl shadow-lg ${tiltClass}`}
            />
          </div>
        ) : images.length === 2 ? (
          <div className="grid grid-cols-2 gap-3">
            {images.slice(0, 2).map((src, index) => (
              <div
                key={index}
                className="relative aspect-square cursor-pointer"
                onClick={() => handleImageClick(index)}
              >
                <ImageWithFallback
                  src={src}
                  alt={`Recipe image ${index + 1}`}
                  className={`w-full h-full object-cover rounded-lg shadow-md ${tiltClass}`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 h-80">
            <div
              className="col-span-2 relative aspect-square sm:aspect-[4/3] cursor-pointer"
              onClick={() => handleImageClick(0)}
            >
              <ImageWithFallback
                src={images[0]}
                alt="Recipe image 1"
                className={`w-full h-full object-cover rounded-lg shadow-md ${tiltClass}`}
              />
            </div>

            <div className="col-span-2 grid grid-rows-2 gap-3">
              <div
                className="relative aspect-[2/1] cursor-pointer"
                onClick={() => handleImageClick(1)}
              >
                <ImageWithFallback
                  src={images[1]}
                  alt="Recipe image 2"
                  className={`w-full h-full object-cover rounded-lg shadow-md ${tiltClass}`}
                />
              </div>

              <div
                className="relative aspect-[2/1] cursor-pointer"
                onClick={() => handleImageClick(2)}
              >
                <ImageWithFallback
                  src={images[2]}
                  alt="Recipe image 3"
                  className={`w-full h-full object-cover rounded-lg shadow-md ${tiltClass}`}
                />
                {remainingCount > 0 && (
                  <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center pointer-events-none">
                    <div className="text-white text-center">
                      <div className="text-2xl font-bold">
                        +{remainingCount}
                      </div>
                      <div className="text-sm">more</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors p-2 bg-black/50 hover:bg-black/70 rounded-full"
            >
              <X size={24} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors p-3 bg-black/50 hover:bg-black/70 rounded-full"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors p-3 bg-black/50 hover:bg-black/70 rounded-full"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={images[currentImageIndex]}
                alt={`Recipe image ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 1280px) 90vw, 80vw"
                priority
                onClick={(e) => e.stopPropagation()}
                onError={() => {
                  console.error(
                    "Image failed to load:",
                    images[currentImageIndex]
                  );
                }}
              />
            </div>

            {images.length > 1 && (
              <>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>

                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-full overflow-x-auto px-4 pb-2">
                  {images.map((src, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:opacity-100 ${
                        index === currentImageIndex
                          ? "border-white opacity-100"
                          : "border-transparent opacity-50 hover:opacity-80"
                      }`}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={src}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
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
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className}`}
      >
        <ImageOff size={48} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover ${className}`}
        loading="lazy"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onError={() => setError(true)}
      />
    </div>
  );
}