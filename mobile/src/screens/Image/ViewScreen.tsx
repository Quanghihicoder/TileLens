import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '../../hooks/useRedux';
import axios from 'axios';
import { API_URL } from '@env';
import {
  ImageViewRouteProp,
  Offset,
  PastedImage,
  Point,
  RootStackParamList,
} from '../../types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNotification } from '../../providers/Notification';
import { useImageMetadata } from '../../hooks/useImageMetadata';

const MIN_TILE_LEVEL = 0;

function ViewScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const showNotification = useNotification();
  const user = useAppSelector(state => state.user);
  const route = useRoute<ImageViewRouteProp>();
  const { imageId } = route.params;

  const { maxZoomLevel, imageWidth, imageHeight } = useImageMetadata(
    user.id!.toString(),
    imageId!,
  );

  // State: zoom level
  const [zoom, setZoom] = useState(MIN_TILE_LEVEL);
  const [transitionZoom, setTransitionZoom] = useState<number | null>(null);
  const prevZoomRef = useRef(zoom);

  // Container Ref
  const tilesContainerRef = useRef(null);
  const windowContainerRef = useRef(null);

  // Panning state
  const draggingRef = useRef(false);
  const dragStartRef = useRef<Offset | null>(null);
  const offsetStartRef = useRef<Offset>({ x: 0, y: 0 });

  // Clipping state
  const [isClipping, setIsClipping] = useState(false);
  const [clippingPath, setClippingPath] = useState<Point[]>([]);
  const [isEditClipping, setIsEditClipping] = useState(false);
  const [editPointIndex, setEditPointIndex] = useState<number | null>(null);
  const [isGenerateCircle, setIsGenerateCircle] = useState(false);
  const draggingPointRef = useRef(false);
  const [isSendingClipping, setIsSendingClipping] = useState(false);

  // Blending state
  const [isHovered, setIsHovered] = useState(false);
  const [isSendingBlending, setIsSendingBlending] = useState(false);
  const [pastedImages, setPastedImages] = useState<PastedImage[]>([]);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const [editImageIndex, setEditImageIndex] = useState<number | null>(null);
  const [editDirectionIndex, setEditDirectionIndex] = useState<number | null>(
    null,
  );
  const isResizeImageRef = useRef(false);

  const handleView = async () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text onPress={handleView}> View {imageId}</Text>
        <Text> View {maxZoomLevel}</Text>
        <Text> View {imageWidth}</Text>
        <Text> View {imageHeight}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ViewScreen;
