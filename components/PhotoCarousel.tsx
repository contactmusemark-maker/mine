import { Image } from "expo-image";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Photo {
  uri: string;
  type?: "image" | "video";
}

interface PhotoCarouselProps {
  photos: Photo[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export function PhotoCarousel({
  photos,
  initialIndex = 0,
  visible,
  onClose,
}: PhotoCarouselProps) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(initialIndex);
  const listRef = useRef<FlatList>(null);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrent(viewableItems[0].index!);
    }
  }).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.counter}>
            {current + 1} / {photos.length}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Feather name="x" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_W,
            offset: SCREEN_W * index,
            index,
          })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image
                source={{ uri: item.uri }}
                style={styles.image}
                contentFit="contain"
                transition={200}
              />
            </View>
          )}
        />

        {photos.length > 1 && (
          <View style={[styles.dots, { paddingBottom: insets.bottom + 16 }]}>
            {photos.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  listRef.current?.scrollToIndex({ index: i, animated: true });
                  setCurrent(i);
                }}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: i === current ? "#FFF" : "rgba(255,255,255,0.4)" },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

interface PhotoGridProps {
  photos: Photo[];
  maxVisible?: number;
  thumbSize?: number;
}

export function PhotoGrid({ photos, maxVisible = 4, thumbSize = 90 }: PhotoGridProps) {
  const [carouselVisible, setCarouselVisible] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  if (photos.length === 0) return null;

  const shown = photos.slice(0, maxVisible);
  const extra = photos.length - maxVisible;

  const openAt = (idx: number) => {
    setStartIndex(idx);
    setCarouselVisible(true);
  };

  return (
    <>
      <View style={styles.grid}>
        {shown.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.thumb, { width: thumbSize, height: thumbSize }]}
            onPress={() => openAt(i)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: p.uri }} style={styles.thumbImg} contentFit="cover" transition={200} />
            {p.type === "video" && (
              <View style={styles.playOverlay}>
                <Feather name="play" size={18} color="#FFF" />
              </View>
            )}
            {i === maxVisible - 1 && extra > 0 && (
              <View style={styles.moreOverlay}>
                <Text style={styles.moreText}>+{extra}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <PhotoCarousel
        photos={photos}
        initialIndex={startIndex}
        visible={carouselVisible}
        onClose={() => setCarouselVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.97)",
    justifyContent: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  counter: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  closeBtn: { padding: 8 },
  slide: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: SCREEN_W, height: SCREEN_H * 0.8 },
  dots: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumb: { borderRadius: 10, overflow: "hidden", position: "relative" },
  thumbImg: { width: "100%", height: "100%" },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: { color: "#FFF", fontSize: 20, fontWeight: "700" },
});
