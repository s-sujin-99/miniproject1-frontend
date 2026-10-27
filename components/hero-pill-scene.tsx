'use client';

import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Float } from '@react-three/drei';
import type { Group } from 'three';

// Pill 지오메트리 치수 — FramedPill의 화면-밖-클램프 계산에도 같이 쓴다.
const PILL_RADIUS = 0.62;
const PILL_HALF_LEN = 0.75;
// 캡슐은 마우스에 따라 자유롭게 회전하므로, 회전과 무관하게 항상 안전한 경계는
// "중심에서 가장 먼 지점까지의 거리"(끝쪽 반구 캡의 끝)뿐이다 — 단면 반지름(RADIUS)만 쓰면
// 캡슐이 길게 눕는 회전에서 끝부분이 경계 밖으로 나가 잘린다.
const PILL_BOUNDING_RADIUS = PILL_HALF_LEN + PILL_RADIUS;

// 레퍼런스(leoparpeix.com)의 "화면을 지배하는 3D 오브젝트 + 커서 패럴럭스" 연출을
// 커스텀 3D 모델 없이(캡슐 지오메트리 3개 조합) 가볍게 재현한다.
function Pill() {
  const groupRef = useRef<Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    pointer.current.x += (state.pointer.x - pointer.current.x) * 0.04;
    pointer.current.y += (state.pointer.y - pointer.current.y) * 0.04;
    group.rotation.y = Math.PI * 0.15 + pointer.current.x * 0.5;
    group.rotation.x = -pointer.current.y * 0.3;
  });

  // 진짜 알약 캡슐처럼 몸통 정중앙에서 정확히 반으로 갈라 한쪽은 빨강, 반대쪽은 흰색으로 칠한다
  // (끝부분만 빨간 "캡+캡" 배색이 아니라, 절반 전체 — 둥근 끝까지 포함 — 가 한 색이어야 한다).
  const RADIUS = PILL_RADIUS;
  const HALF_LEN = PILL_HALF_LEN;

  return (
    <group ref={groupRef} rotation={[0, Math.PI * 0.15, Math.PI * 0.22]}>
      <mesh castShadow receiveShadow position={[0, HALF_LEN / 2, 0]}>
        <cylinderGeometry args={[RADIUS, RADIUS, HALF_LEN, 48]} />
        <meshStandardMaterial color="#ff5500" roughness={0.25} metalness={0.15} />
      </mesh>
      <mesh castShadow position={[0, HALF_LEN, 0]}>
        <sphereGeometry args={[RADIUS, 48, 32]} />
        <meshStandardMaterial color="#ff5500" roughness={0.25} metalness={0.15} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -HALF_LEN / 2, 0]}>
        <cylinderGeometry args={[RADIUS, RADIUS, HALF_LEN, 48]} />
        <meshStandardMaterial color="#f2f1ec" roughness={0.2} metalness={0.05} />
      </mesh>
      <mesh castShadow position={[0, -HALF_LEN, 0]}>
        <sphereGeometry args={[RADIUS, 48, 32]} />
        <meshStandardMaterial color="#f2f1ec" roughness={0.2} metalness={0.05} />
      </mesh>
    </group>
  );
}

// 배경이 풀블리드라 화면 비율에 따라 viewportWidth/viewportHeight(카메라 프러스텀의 실제
// 가로/세로 폭)가 크게 출렁인다. 캡슐은 두 가지를 동시에 지켜야 한다 —
//  1) 왼쪽 텍스트 열(px-6 24px + max-w-xl 576px = 600px)과 절대 겹치지 않을 것
//  2) 프러스텀 오른쪽/위아래 밖으로 잘리지 않을 것
// 창이 넓을 땐 둘 다 여유롭지만, 창이 좁아지면 두 제약이 서로 부딪힌다 — 이때는 위치를 밀어내는
// 대신 캡슐 크기를 줄여서 둘 다 지킨다(고정 위치를 유지하려던 이전 접근은 좁은 창에서 텍스트와
// 겹치거나 화면 밖으로 잘리는 두 가지 버그를 냈다).
function FramedPill({ textBottomFraction }: { textBottomFraction: number }) {
  const viewportWidth = useThree((s) => s.viewport.width);
  const viewportHeight = useThree((s) => s.viewport.height);
  const pxWidth = useThree((s) => s.size.width);
  // app/page.tsx가 히어로 레이아웃(텍스트 크기, 높이)을 나누는 것과 같은 640px 기준을 쓴다.
  const isMobile = pxWidth < 640;
  // 모바일 폭에서는 텍스트 열이 화면 폭 대부분을 차지해 캡슐을 옆이든 아래든 어디에 둬도
  // 어색하다(사용자 확인) — 위치를 맞추려 하지 말고 아예 숨긴다.
  if (isMobile) return null;

  let offsetX: number;
  let offsetY: number;
  let scale: number;

  const unitsPerPx = viewportWidth / pxWidth;
  const TEXT_EDGE_PX = 600; // px-6(24) + max-w-xl(576) — app/page.tsx 히어로 텍스트 열 기준
  const GAP_PX = 24;
  const minLeftEdge = (TEXT_EDGE_PX + GAP_PX - pxWidth / 2) * unitsPerPx;
  const rightSafeEdge = viewportWidth / 2 - 0.35;
  // 데스크톱 회피(옆 배치) 레이아웃이 쓸 수 있는 가장 작은 스케일. 이 스케일로도 옆에 놓을
  // 공간이 안 나오면 — 즉 창이 그만큼 좁으면 — 옆으로 피하는 배치 자체가 성립하지 않는다.
  const MIN_DESKTOP_SCALE = 0.3;
  const hasRoomForDesktopLayout =
    rightSafeEdge - minLeftEdge >= 2 * PILL_BOUNDING_RADIUS * MIN_DESKTOP_SCALE;

  if (!hasRoomForDesktopLayout) {
    // 태블릿처럼 애매하게 좁은 폭 — 옆에 놓을 자리가 넉넉하진 않지만(모바일만큼 좁지는
    // 않다) 옆 배치를 유지한다. 크기는 텍스트 블록 아래 남는 공간 기준(availableBelow)으로
    // 구하고, 가로는 고정값이 아니라 화면 오른쪽 안전선(rightSafeEdge)에 닿기 직전까지
    // 최대한 밀어 텍스트와의 접촉을 없앤다.
    const textBottomWorldY = (0.5 - textBottomFraction) * viewportHeight;
    const margin = 0.15;
    const availableBelow = textBottomWorldY + viewportHeight / 2 - margin;
    scale = Math.max(0.35, Math.min(0.85, availableBelow / (2 * PILL_BOUNDING_RADIUS)));
    offsetX = Math.max(0.3, rightSafeEdge - PILL_BOUNDING_RADIUS * scale);
    offsetY = 0.5;
  } else {
    offsetY = 0;

    const wideExtra = Math.max(0, viewportWidth - 6.4);
    const preferredScale = Math.min(1.2 + wideExtra * 0.08, 1.6);
    const preferredOffsetX = Math.min(1.9 + wideExtra * 0.35, 3.2);

    // 태블릿 폭처럼 옆에 남는 공간이 넉넉지 않을 때는 캡슐을 충분히 작게 줄여서라도 옆
    // 배치(텍스트 비침범)를 지킨다 — 바닥은 MIN_DESKTOP_SCALE, hasRoomForDesktopLayout이
    // 이미 그 바닥으로도 자리가 남을 너비만 이 브랜치로 들여보냈다는 걸 보장한다.
    const scaleByHeight = Math.max(
      MIN_DESKTOP_SCALE,
      (viewportHeight / 2 - 0.3) / PILL_BOUNDING_RADIUS,
    );
    const scaleBySpace = Math.max(
      MIN_DESKTOP_SCALE,
      (rightSafeEdge - minLeftEdge) / (2 * PILL_BOUNDING_RADIUS),
    );
    scale = Math.min(preferredScale, scaleByHeight, scaleBySpace);

    // 텍스트 회피(minLeftEdge)가 항상 우선하는 하한이고, 우측 클리핑 방지(rightSafeEdge)는
    // 그 하한을 어기지 않는 선에서만 적용되는 상한이다 — hasRoomForDesktopLayout 체크로 이미
    // 둘이 공존 가능함을 보장했지만, 방어적으로 순서를 명시한다.
    const minOffsetX = minLeftEdge + PILL_BOUNDING_RADIUS * scale;
    const maxOffsetX = Math.max(minOffsetX, rightSafeEdge - PILL_BOUNDING_RADIUS * scale);
    offsetX = Math.min(Math.max(preferredOffsetX, minOffsetX), maxOffsetX);
  }

  return (
    <group position={[offsetX, offsetY, 0]} scale={scale}>
      <Float speed={1.6} floatIntensity={0.6} rotationIntensity={0.15}>
        <Pill />
      </Float>
      {/* 크림 배경에서는 어두운 콘택트 섀도우가 자연스럽게 보이므로 따뜻한 다크 톤을 쓴다. */}
      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.35}
        scale={5}
        blur={2.8}
        far={2}
        color="#000000"
      />
    </group>
  );
}

// 히어로 전체 폭을 캔버스로 쓰므로(레퍼런스처럼 텍스트가 3D 오브젝트 위에 겹쳐 뜬다) 오브젝트
// 자체는 화면 오른쪽으로 치우치게 둬서 왼쪽 텍스트와 겹치지 않게 한다.
export function HeroPillScene({ textBottomFraction }: { textBottomFraction: number }) {
  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      camera={{ position: [0, 0, 6.5], fov: 34 }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 4]} intensity={1.3} castShadow />
      <directionalLight position={[-4, -2, -3]} intensity={0.35} color="#ff5500" />
      <FramedPill textBottomFraction={textBottomFraction} />
    </Canvas>
  );
}
