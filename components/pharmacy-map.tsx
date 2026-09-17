'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/format';
import type { SearchResultItem } from '@/types/search';

const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

const COLOR_RECOMMENDED = '#059669';
const COLOR_DEFAULT = '#6b7280';
const COLOR_USER = '#3b82f6';

// 결과가 몇 건이든 지도는 항상 반경 500m 정도의 주변 지역이 보이게 고정한다.
const VIEW_RADIUS_M = 500;
const EARTH_RADIUS_M = 6371000;

// 위경도 1도가 몇 m인지는 위도마다 달라(경도는 cos(위도)만큼 좁아짐) 중심점 기준으로 근사한다.
function extendBoundsByRadius(
  bounds: kakao.maps.LatLngBounds,
  center: { lat: number; lng: number },
  radiusMeters: number,
) {
  const latDelta = (radiusMeters / EARTH_RADIUS_M) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos((center.lat * Math.PI) / 180);
  bounds.extend(new window.kakao.maps.LatLng(center.lat + latDelta, center.lng + lngDelta));
  bounds.extend(new window.kakao.maps.LatLng(center.lat - latDelta, center.lng - lngDelta));
}

function pinImage(color: string, size: number): kakao.maps.MarkerImage {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return new window.kakao.maps.MarkerImage(src, new window.kakao.maps.Size(size, size));
}

function overlayContent(price: number, recommended: boolean): string {
  const bg = recommended ? COLOR_RECOMMENDED : '#ffffff';
  const color = recommended ? '#ffffff' : '#111827';
  const border = recommended ? 'none' : '1px solid #d1d5db';
  return `<div style="background:${bg};color:${color};border:${border};border-radius:9999px;padding:2px 8px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,0.15);transform:translateY(-4px);">${formatPrice(price)}</div>`;
}

interface MarkerEntry {
  marker: kakao.maps.Marker;
  overlay: kakao.maps.CustomOverlay;
  normalImage: kakao.maps.MarkerImage;
  activeImage: kakao.maps.MarkerImage;
}

interface PharmacyMapProps {
  center: { lat: number; lng: number };
  results: SearchResultItem[];
  activeId: number | null;
  onMarkerClick: (pharmacyId: number) => void;
}

// ROADMAP T-22 — SDK 로드가 실패해도(키 미설정, 도메인 미등록, 네트워크 차단 등) 검색 자체는
// 지도 없이 리스트만으로 동작해야 한다(자신을 null로 렌더해 자리를 접는다).
export function PharmacyMap({ center, results, activeId, onMarkerClick }: PharmacyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef(new Map<number, MarkerEntry>());
  const prevActiveRef = useRef<number | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [unavailable, setUnavailable] = useState(!KAKAO_MAP_KEY);

  useEffect(() => {
    if (!sdkReady || !containerRef.current || mapRef.current) return;
    mapRef.current = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: 5,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 지도 인스턴스는 최초 1회만 생성한다.
  }, [sdkReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(({ marker, overlay }) => {
      marker.setMap(null);
      overlay.setMap(null);
    });
    markersRef.current.clear();

    const bounds = new window.kakao.maps.LatLngBounds();
    const userPosition = new window.kakao.maps.LatLng(center.lat, center.lng);
    bounds.extend(userPosition);
    new window.kakao.maps.Marker({
      map,
      position: userPosition,
      image: pinImage(COLOR_USER, 14),
      zIndex: 10,
    });

    results.forEach((item) => {
      const position = new window.kakao.maps.LatLng(item.pharmacy.lat, item.pharmacy.lng);
      bounds.extend(position);
      const baseColor = item.recommended ? COLOR_RECOMMENDED : COLOR_DEFAULT;
      const baseSize = item.recommended ? 30 : 22;
      const normalImage = pinImage(baseColor, baseSize);
      const activeImage = pinImage(baseColor, baseSize + 8);
      const marker = new window.kakao.maps.Marker({
        map,
        position,
        image: normalImage,
        zIndex: item.recommended ? 5 : 1,
      });
      const overlay = new window.kakao.maps.CustomOverlay({
        map,
        position,
        content: overlayContent(item.price.repPrice, item.recommended),
        yAnchor: 2.2,
      });
      window.kakao.maps.event.addListener(marker, 'click', () => onMarkerClick(item.pharmacy.id));
      markersRef.current.set(item.pharmacy.id, { marker, overlay, normalImage, activeImage });
    });

    // 결과가 멀리 떨어져 있어도 지도가 지나치게 축소되지 않도록 반경 500m는 항상 보이게 한다.
    extendBoundsByRadius(bounds, center, VIEW_RADIUS_M);
    map.setBounds(bounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onMarkerClick은 useCallback으로 부모가 고정해서 넘긴다.
  }, [sdkReady, results, center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const prevId = prevActiveRef.current;
    if (prevId != null && prevId !== activeId) {
      const prevEntry = markersRef.current.get(prevId);
      prevEntry?.marker.setImage(prevEntry.normalImage);
    }
    if (activeId != null) {
      const entry = markersRef.current.get(activeId);
      if (entry) {
        entry.marker.setImage(entry.activeImage);
        map.panTo(entry.marker.getPosition());
      }
    }
    prevActiveRef.current = activeId;
  }, [activeId]);

  const handleLoad = useCallback(() => {
    window.kakao.maps.load(() => setSdkReady(true));
  }, []);

  const handleError = useCallback(() => setUnavailable(true), []);

  if (unavailable) return null;

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={handleLoad}
        onError={handleError}
      />
      <div ref={containerRef} className="bg-muted h-64 w-full rounded-lg md:h-80" />
    </>
  );
}
