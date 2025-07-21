import { useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  LayoutChangeEvent,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { useAppSelector } from '../../hooks/useRedux';
import { ImageViewRouteProp, Offset } from '../../types';
import { useRoute } from '@react-navigation/native';
import { useImageMetadata } from '../../hooks/useImageMetadata';
import { useImage } from '../../hooks/useImage';
import { useOffset } from '../../hooks/useOffset';
import Header from '../../components/Header';
import { GridDisplay } from '../../components/GridDisplay';
import { ZoomControls } from '../../components/ZoomControls';

const MIN_TILE_LEVEL = 0;

function ViewScreen() {
  const user = useAppSelector(state => state.user);
  const route = useRoute<ImageViewRouteProp>();
  const { imageId } = route.params;

  const { maxZoomLevel, imageWidth, imageHeight } = useImageMetadata(
    user.id!.toString(),
    imageId!,
  );

  // State: zoom level
  const [zoom, setZoom] = useState(MIN_TILE_LEVEL);
  const prevZoomRef = useRef(zoom);

  // Container Ref
  const windowContainerDimensionsRef = useRef({
    width: 0,
    height: 0,
  });

  // Panning state
  const draggingRef = useRef(false);
  const dragStartRef = useRef<Offset | null>(null);
  const offsetStartRef = useRef<Offset>({ x: 0, y: 0 });

  // Image data
  const {
    levelWidth,
    levelHeight,
    levelWidthBefore,
    levelHeightBefore,
    maxNumberOfTilesX,
    maxNumberOfTilesY,
    maxNumberOfTilesXBefore,
    maxNumberOfTilesYBefore,
  } = useImage(imageWidth, imageHeight, zoom, prevZoomRef);

  // Check if the image at zoom level is bigger than the view port
  const widthOverflow = useMemo(() => {
    return levelWidth > windowContainerDimensionsRef.current.width;
  }, [levelWidth]);

  const heightOverflow = useMemo(() => {
    return levelHeight > windowContainerDimensionsRef.current.height;
  }, [levelHeight]);

  const { offset, clampOffset, prevOffsetRef, setOffset } = useOffset(
    levelWidth,
    levelHeight,
    zoom,
    maxNumberOfTilesX,
    maxNumberOfTilesY,
    maxNumberOfTilesXBefore,
    maxNumberOfTilesYBefore,
    widthOverflow,
    heightOverflow,
    windowContainerDimensionsRef,
    prevZoomRef,
  );

  const onWindowContainerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    windowContainerDimensionsRef.current = { width, height };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      // Like onMouseDown
      onPanResponderGrant: (
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        const { locationX, locationY, pageX, pageY } = e.nativeEvent;
        draggingRef.current = true;
        dragStartRef.current = { x: pageX, y: pageY };
        // This wont work, because the panResponder is useRef
        // offsetStartRef.current = { ...offset };
        // So, do this trick
        // This doesn't actually change the state
        // But you need to get the updated offset
        setOffset(currentOffset => {
          offsetStartRef.current = { ...currentOffset };
          return currentOffset;
        });
      },

      // Like onMouseMove
      onPanResponderMove: (
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        if (!draggingRef.current || !dragStartRef.current) return;
        const newOffsetX = offsetStartRef.current.x + gestureState.dx;
        const newOffsetY = offsetStartRef.current.y + gestureState.dy;
        const clamped = clampOffset(newOffsetX, newOffsetY);
        prevOffsetRef.current = clamped;
        setOffset(clamped);
      },

      // Like onMouseUp
      onPanResponderRelease: (
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        draggingRef.current = false;
        dragStartRef.current = null;
      },

      // Like onMouseLeave (finger dragged outside)
      onPanResponderTerminate: (e, gestureState) => {
        draggingRef.current = false;
        dragStartRef.current = null;
      },
    }),
  ).current;

  return (
    <SafeAreaView style={styles.container}>
      <Header imageId={imageId} />

      <View style={styles.body}>
        <View
          style={[
            styles.displayArea,
            {
              overflow: 'hidden',
            },
            !widthOverflow && styles.displayAreaCenterX,
            !heightOverflow && styles.displayAreaCenterY,
          ]}
          onLayout={onWindowContainerLayout}
        >
          <View
            style={{
              transform: [{ translateX: offset.x }, { translateY: offset.y }],
            }}
            {...panResponder.panHandlers}
          >
            <GridDisplay
              userId={user.id!.toString()}
              imageId={imageId}
              levelWidth={levelWidth}
              levelHeight={levelHeight}
              zoom={zoom}
              offset={offset}
              containerDimensionsRef={windowContainerDimensionsRef}
            />
          </View>
        </View>
      </View>
      <View style={styles.box}>
        <ZoomControls
          onZoomIn={() => {
            if (zoom < maxZoomLevel) {
              setTimeout(() => setZoom(zoom + 1), 100);
            }
          }}
          onZoomOut={() => {
            if (zoom > MIN_TILE_LEVEL) {
              setTimeout(() => setZoom(zoom - 1), 100);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayArea: {
    width: '85%',
    height: '90%',
    zIndex: 10,
    flexDirection: 'row',
  },
  displayAreaCenterX: { justifyContent: 'center' },
  displayAreaCenterY: { alignItems: 'center' },
  box: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 50,
  },
});

export default ViewScreen;
