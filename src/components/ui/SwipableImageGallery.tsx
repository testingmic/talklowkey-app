import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Text,
} from "react-native";
import ImageViewer from "./ImageViewer";

const { width: screenWidth } = Dimensions.get("window");

interface SwipableImageGalleryProps {
  images: string[];
  fullSizeImages?: string[]; // Optional full-size images for full-screen viewing
  style?: any;
  imageHeight?: number;
  showCounter?: boolean;
}

const SwipableImageGallery: React.FC<SwipableImageGalleryProps> = ({
  images,
  fullSizeImages,
  style,
  imageHeight = 200,
  showCounter = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);

  const handleImagePress = (index: number) => {
    setFullScreenIndex(index);
    setShowFullScreen(true);
  };

  if (!images || images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    // Single image - no swiping needed
    return (
      <View style={[styles.container, style]}>
        <TouchableOpacity onPress={() => handleImagePress(0)}>
          <Image
            source={{ uri: images[0] }}
            style={[styles.singleImage, { height: imageHeight }]}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Full-screen image viewer */}
        <ImageViewer
          visible={showFullScreen}
          images={fullSizeImages || images}
          initialIndex={fullScreenIndex}
          onClose={() => setShowFullScreen(false)}
        />
      </View>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const handleNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.galleryContainer, { height: imageHeight }]}>
        <View style={styles.imageStack}>
          {images.map((imageUri, index) => {
            if (Math.abs(index - currentIndex) > 1) {
              // Don't render images that are more than 1 position away
              return null;
            }

            const isActive = index === currentIndex;
            const isPrev = index === currentIndex - 1;
            const isNext = index === currentIndex + 1;

            let translateXValue = 0;
            if (isPrev) translateXValue = -screenWidth;
            if (isNext) translateXValue = screenWidth;

            return (
              <View
                key={index}
                style={[
                  styles.imageSlide,
                  {
                    transform: [
                      {
                        translateX: translateXValue,
                      },
                    ],
                    zIndex: isActive ? 1 : 0,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleImagePress(index)}
                  style={styles.fullImageContainer}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={[styles.fullImage, { height: imageHeight }]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Image counter */}
        {showCounter && images.length > 1 && (
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {currentIndex + 1}/{images.length}
            </Text>
          </View>
        )}

        {/* Navigation dots */}
        {images.length > 1 && images.length <= 5 && (
          <View style={styles.dotsContainer}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentIndex(index)}
                style={[styles.dot, index === currentIndex && styles.activeDot]}
              />
            ))}
          </View>
        )}

        {/* Navigation arrows - always visible with looping */}
        {images.length > 1 && (
          <>
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={handlePrevious}
            >
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={handleNext}
            >
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Full-screen image viewer */}
      <ImageViewer
        visible={showFullScreen}
        images={fullSizeImages || images}
        initialIndex={fullScreenIndex}
        onClose={() => setShowFullScreen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 10,
  },
  singleImage: {
    width: "100%",
    borderRadius: 10,
  },
  galleryContainer: {
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  imageStack: {
    flex: 1,
    position: "relative",
  },
  imageSlide: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
  },
  fullImageContainer: {
    flex: 1,
    width: "100%",
  },
  fullImage: {
    width: "100%",
    borderRadius: 10,
  },
  counterContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  counterText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  dotsContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    transform: [{ translateY: -20 }],
  },
  prevButton: {
    left: 10,
  },
  nextButton: {
    right: 10,
  },
  navButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default SwipableImageGallery;
