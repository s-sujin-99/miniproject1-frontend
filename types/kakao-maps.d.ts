// 카카오맵 JS SDK 공식 @types 패키지가 없어, PharmacyMap이 실제로 쓰는 API만 최소로 선언한다(ROADMAP T-22).
export {};

declare global {
  interface Window {
    kakao: typeof kakao;
  }

  namespace kakao.maps {
    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }

    class LatLngBounds {
      constructor();
      extend(latlng: LatLng): void;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class MarkerImage {
      constructor(src: string, size: Size);
    }

    interface MapOptions {
      center: LatLng;
      level?: number;
    }

    class Map {
      constructor(container: HTMLElement, options: MapOptions);
      setBounds(bounds: LatLngBounds): void;
      panTo(latlng: LatLng): void;
    }

    interface MarkerOptions {
      map?: Map;
      position: LatLng;
      image?: MarkerImage;
      zIndex?: number;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng;
      setImage(image: MarkerImage): void;
    }

    interface CustomOverlayOptions {
      map?: Map;
      position: LatLng;
      content: string | HTMLElement;
      yAnchor?: number;
      xAnchor?: number;
      zIndex?: number;
    }

    class CustomOverlay {
      constructor(options: CustomOverlayOptions);
      setMap(map: Map | null): void;
    }

    namespace event {
      function addListener(target: Marker, type: string, handler: () => void): void;
    }

    function load(callback: () => void): void;
  }
}
