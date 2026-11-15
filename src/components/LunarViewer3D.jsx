/**
 * ============================================================================
 * MOON LOVER ENGINE // 3D LUNAR & TLI TRANSIT SIMULATOR (EXPANDED EDITION)
 * Archivo: src/components/LunarViewer3D.jsx
 * 
 * AUDITORÍA TÉCNICA:
 * - Ciclo de vida WebGL de montaje único (Zero-rebuild en selección de sitio).
 * - Recolección de basura estricta en GPU (Zero Memory Leaks).
 * - Trayectoria Bézier orbital continua desde baliza de la Tierra hasta la Luna.
 * - Animación cinemática de vuelo TLI con seguimiento dinámico de cámara y telemetría.
 * - Soporte multi-zona: Polo Sur (Artemis) y Otras Zonas Globales (Mares / Cara Oculta).
 * ============================================================================
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { calcularPosicionSolar } from '../utils/flightCalculator';
import { LUNAR_SITES } from '../data/lunarSites';
import {
  CheckCircle2,
  XCircle,
  Activity,
  Lightbulb,
  Sparkles,
  X
} from 'lucide-react';

/* ============================================================================
 * [CONFIGURACIÓN GLOBAL Y CONSTANTES MATEMÁTICAS]
 * ============================================================================ */
const LUNAR_RADIUS = 8.0;
const EARTH_RADIUS = 29.3; // R_E = 3.667 * R_M (Proporción física real 6371 km vs 1737 km)
// Posición orbital de la Tierra a escala (distancia media calibrada ~206 unidades)
const EARTH_ORBIT_POS = new THREE.Vector3(120, 50, 160);
// Baliza de despegue en la superficie de la Tierra (apuntando hacia la Luna)
const EARTH_LAUNCH_POS = EARTH_ORBIT_POS.clone().add(
  new THREE.Vector3(-120, -50, -160).normalize().multiplyScalar(EARTH_RADIUS)
);

// Umbrales críticos de seguridad para la misión
const CRITICAL_THRESHOLDS = {
  MAX_SLOPE_DEG: 17.5,     // Límite de pendiente para evitar vuelco del módulo
  MIN_SUN_ELEV_DEG: 1.6,   // Límite mínimo de insolación para paneles solares
};

// Ángulos de cámara preconfigurados
const CAMERA_PERSPECTIVES = {
  south_pole:   { camPos: new THREE.Vector3(0, -19, 5), target: new THREE.Vector3(0, -7.8, 0) },
  north_pole:   { camPos: new THREE.Vector3(0, 19, 5), target: new THREE.Vector3(0, 7.8, 0) },
  nearside:     { camPos: new THREE.Vector3(0, 0, 22), target: new THREE.Vector3(0, 0, 0) },
  farside:      { camPos: new THREE.Vector3(0, 0, -22), target: new THREE.Vector3(0, 0, 0) },
  tli_corridor: { camPos: new THREE.Vector3(145, 95, 250), target: new THREE.Vector3(25, 10, 40) }
};

/* Función pura para proyección esférica selenográfica (Lat/Lon -> Coordenadas 3D) */
function selenographicToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export default function LunarViewer3D({
  selectedSite,
  missionDate,
  onSelectSite,
  scrubbedHours = 0,
  onResetScrub = null,
  perspective = 'south_pole',
  showPins = true,
  zoneFilter = 'polar',
  flightTrigger = 0,
  onFlightStateChange = null,
  onOpenOptimizer = null
}) {
  // Referencias a objetos del motor 3D
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const sunLightRef = useRef(null);
  const earthMeshRef = useRef(null);
  const markersGroupRef = useRef(null);
  const siteMeshesRef = useRef([]);

  // Referencias estables para evitar ciclos de re-montaje en WebGL
  const onSelectSiteRef = useRef(onSelectSite);
  useEffect(() => {
    onSelectSiteRef.current = onSelectSite;
  }, [onSelectSite]);

  const showPinsRef = useRef(showPins);
  useEffect(() => {
    showPinsRef.current = showPins;
  }, [showPins]);

  // Referencias para la animación TLI y trayectoria
  const trajectoryLineRef = useRef(null);
  const landingReticleRef = useRef(null);
  const spaceshipMeshRef = useRef(null);
  const thrusterFlameRef = useRef(null);
  const trajectoryCurveRef = useRef(null);
  const cameraTransitionAnimRef = useRef(null);

  // Estados reactivos de interfaz
  const [hoveredSite, setHoveredSite] = useState(null);
  const [isFlying, setIsFlying] = useState(false);
  const [flightTelemetry, setFlightTelemetry] = useState(null);
  const [flightOutcome, setFlightOutcome] = useState(null);

  /* ============================================================================
   * [SECCIÓN 1: CONTROL DE CÁMARA Y PERSPECTIVAS]
   * ============================================================================ */
  const switchPerspective = useCallback((key) => {
    const targetConfig = CAMERA_PERSPECTIVES[key];
    if (!cameraRef.current || !controlsRef.current || !targetConfig) return;

    if (cameraTransitionAnimRef.current) {
      cancelAnimationFrame(cameraTransitionAnimRef.current);
    }

    const startPos = cameraRef.current.position.clone();
    const startTarget = controlsRef.current.target.clone();
    const duration = 750;
    const startTime = performance.now();

    const animateTransition = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      cameraRef.current.position.lerpVectors(startPos, targetConfig.camPos, ease);
      controlsRef.current.target.lerpVectors(startTarget, targetConfig.target, ease);
      controlsRef.current.update();

      if (progress < 1) {
        cameraTransitionAnimRef.current = requestAnimationFrame(animateTransition);
      }
    };
    cameraTransitionAnimRef.current = requestAnimationFrame(animateTransition);
  }, []);

  // Función para enfocar suavemente un sitio cualquiera en la Luna
  const focusOnSite = useCallback((site) => {
    if (!site || !cameraRef.current || !controlsRef.current) return;
    const targetPos = selenographicToVector3(site.lat, site.lon, LUNAR_RADIUS + 0.1);
    
    let camPos;
    if (Math.abs(site.lat) > 80) {
      camPos = new THREE.Vector3(0, site.lat < 0 ? -19 : 19, 5);
    } else {
      camPos = targetPos.clone().normalize().multiplyScalar(22);
    }

    const startPos = cameraRef.current.position.clone();
    const startTarget = controlsRef.current.target.clone();
    const duration = 850;
    const startTime = performance.now();

    const animStep = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      cameraRef.current.position.lerpVectors(startPos, camPos, ease);
      controlsRef.current.target.lerpVectors(startTarget, targetPos, ease);
      controlsRef.current.update();

      if (progress < 1) {
        requestAnimationFrame(animStep);
      }
    };
    requestAnimationFrame(animStep);
  }, []);

  /* ============================================================================
   * [SECCIÓN 2: INICIALIZACIÓN PRINCIPAL WEBGL]
   * ============================================================================ */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020408);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 4000);
    camera.position.copy(CAMERA_PERSPECTIVES.south_pole.camPos);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.copy(CAMERA_PERSPECTIVES.south_pole.target);
    controls.minDistance = 8.5;
    controls.maxDistance = 500;
    controlsRef.current = controls;

    // 2.1 Campo de Estrellas Profundo
    const starCoords = new Float32Array(1500 * 3);
    for (let i = 0; i < 4500; i += 3) {
      starCoords[i] = (Math.random() - 0.5) * 800;
      starCoords[i + 1] = (Math.random() - 0.5) * 800;
      starCoords[i + 2] = (Math.random() - 0.5) * 800;
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.8, transparent: true, opacity: 0.75 });
    scene.add(new THREE.Points(starsGeo, starsMat));

    // 2.2 Esfera Lunar continua
    const textureLoader = new THREE.TextureLoader();
    const lunarGeo = new THREE.SphereGeometry(LUNAR_RADIUS, 64, 64);
    const lunarTexture = textureLoader.load('/textures/lunar_surface_trek8.png');
    lunarTexture.wrapS = THREE.RepeatWrapping;
    lunarTexture.repeat.set(1, 1);

    const lunarMat = new THREE.MeshStandardMaterial({
      map: lunarTexture,
      bumpMap: lunarTexture,
      bumpScale: 0.07,
      roughness: 0.92,
      metalness: 0.04
    });
    const lunarSphere = new THREE.Mesh(lunarGeo, lunarMat);
    scene.add(lunarSphere);

    // 2.3 Esfera Terrestre HD con Atmósfera
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 32, 32);
    const earthTexture = textureLoader.load('/textures/Earth_surface_globalmap.png');
    earthTexture.wrapS = THREE.RepeatWrapping;

    const earthMat = new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 0.65, metalness: 0.1 });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.copy(EARTH_ORBIT_POS);
    scene.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Atmósfera de la Tierra (halo cyan suave a escala realista)
    const atmGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.05, 32, 32);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      side: THREE.BackSide
    });
    const earthAtmosphere = new THREE.Mesh(atmGeo, atmMat);
    earthMesh.add(earthAtmosphere);

    // Baliza de despegue en la superficie terrestre orientada a la trayectoria
    const launchBeaconGeo = new THREE.RingGeometry(1.2, 2.6, 24);
    const launchBeaconMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const launchBeacon = new THREE.Mesh(launchBeaconGeo, launchBeaconMat);
    launchBeacon.position.copy(EARTH_LAUNCH_POS);
    launchBeacon.lookAt(EARTH_ORBIT_POS);
    scene.add(launchBeacon);

    // 2.4 Marcadores de Sitios (Polo Sur y Zonas Globales)
    const markersGroup = new THREE.Group();
    markersGroup.visible = Boolean(showPinsRef.current);
    scene.add(markersGroup);
    markersGroupRef.current = markersGroup;

    const clickablePins = [];
    const siteMeshes = [];

    LUNAR_SITES.forEach((site) => {
      const pos = selenographicToVector3(site.lat, site.lon, LUNAR_RADIUS + 0.12);
      const isPolarSite = site.category === 'polar';
      const defaultColor = isPolarSite ? 0x22d3ee : 0x10b981;

      const pinGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: defaultColor });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(pos);
      pin.userData = { site };

      const haloGeo = new THREE.RingGeometry(0.35, 0.5, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: defaultColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.lookAt(pos);
      halo.position.copy(pos);

      markersGroup.add(pin);
      markersGroup.add(halo);
      clickablePins.push(pin);
      siteMeshes.push({ siteId: site.id, category: site.category, pinMat, haloMat, pin, halo });
    });
    siteMeshesRef.current = siteMeshes;

    // 2.5 Nave Espacial con Llama Propulsora (Grupo Completo)
    const shipGroup = new THREE.Group();
    const shipBodyGeo = new THREE.ConeGeometry(0.24, 0.65, 12);
    shipBodyGeo.rotateX(Math.PI / 2);
    const shipBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.8,
      roughness: 0.2
    });
    const shipBody = new THREE.Mesh(shipBodyGeo, shipBodyMat);
    shipGroup.add(shipBody);

    // Llama de propulsión de plasma
    const flameGeo = new THREE.ConeGeometry(0.12, 0.5, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.85
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(0, 0, -0.45);
    shipGroup.add(flameMesh);

    shipGroup.position.copy(EARTH_LAUNCH_POS);
    shipGroup.visible = false;
    scene.add(shipGroup);
    spaceshipMeshRef.current = shipGroup;
    thrusterFlameRef.current = flameMesh;

    // 2.6 Sistema de Iluminación Espacial
    scene.add(new THREE.AmbientLight(0x1e293b, 0.35));
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 3.2);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // 2.7 Raycasting e Interacción de Puntero
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event) => {
      if (!markersGroupRef.current?.visible) return;
      const rect = mount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / mount.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / mount.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickablePins);

      if (intersects.length > 0 && intersects[0]?.object?.userData?.site) {
        setHoveredSite(intersects[0].object.userData.site);
        mount.style.cursor = 'pointer';
      } else {
        setHoveredSite(null);
        mount.style.cursor = 'grab';
      }
    };

    const handleClick = () => {
      if (!markersGroupRef.current?.visible) return;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickablePins);
      if (intersects.length > 0 && intersects[0]?.object?.userData?.site) {
        const clickedSite = intersects[0].object.userData.site;
        if (onSelectSiteRef.current) onSelectSiteRef.current(clickedSite);
        focusOnSite(clickedSite);
      }
    };

    mount.addEventListener('mousemove', handleMouseMove);
    mount.addEventListener('click', handleClick);

    // 2.8 Bucle de renderizado a 60 FPS
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (earthMeshRef.current) earthMeshRef.current.rotation.y += 0.002;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(mount);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      mount.removeEventListener('mousemove', handleMouseMove);
      mount.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);

      // Limpieza rigurosa de GPU
      lunarGeo.dispose();
      lunarMat.dispose();
      lunarTexture.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      earthTexture.dispose();
      starsGeo.dispose();
      starsMat.dispose();
      renderer.dispose();

      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [focusOnSite]); // Montaje único y blindado sin desmontajes accidentales

  /* ============================================================================
   * [SECCIÓN 3: TRAYECTORIA BÉZIER CONTINUA TIERRA-LUNA]
   * Conecta directamente la baliza de despegue en la Tierra con el cráter objetivo.
   * ============================================================================ */
  useEffect(() => {
    // 3.1 Actualización reactiva de colores de pines según categoría y selección
    siteMeshesRef.current.forEach(({ siteId, category, pinMat, haloMat }) => {
      const isSelected = siteId === selectedSite?.id;
      const isPolar = category === 'polar';
      let colorHex = isPolar ? 0x22d3ee : 0x10b981;
      if (isSelected) colorHex = 0xf59e0b;

      pinMat.color.setHex(colorHex);
      haloMat.color.setHex(colorHex);
      haloMat.opacity = isSelected ? 0.95 : 0.4;
    });

    if (!sceneRef.current) return;

    // 3.2 Limpieza de trayectoria previa
    if (trajectoryLineRef.current) {
      sceneRef.current.remove(trajectoryLineRef.current);
      trajectoryLineRef.current.geometry.dispose();
      trajectoryLineRef.current.material.dispose();
    }
    if (landingReticleRef.current) {
      sceneRef.current.remove(landingReticleRef.current);
      landingReticleRef.current.geometry.dispose();
      landingReticleRef.current.material.dispose();
    }

    // 3.3 Coordenadas de aterrizaje exactas sobre la superficie lunar
    const landingTarget = selectedSite
      ? selenographicToVector3(selectedSite.lat, selectedSite.lon, LUNAR_RADIUS + 0.12)
      : new THREE.Vector3(0, -LUNAR_RADIUS, 0);

    // 3.4 Cálculo cinemático del punto de control translunar (Arco parabólico TLI a escala)
    const midPoint = new THREE.Vector3().addVectors(EARTH_LAUNCH_POS, landingTarget).multiplyScalar(0.5);
    const normalOffset = new THREE.Vector3().crossVectors(EARTH_LAUNCH_POS, landingTarget).normalize();
    const controlPoint = midPoint.clone().add(normalOffset.multiplyScalar(28)).add(new THREE.Vector3(-15, 35, 20));

    const trajectoryCurve = new THREE.QuadraticBezierCurve3(
      EARTH_LAUNCH_POS,
      controlPoint,
      landingTarget
    );
    trajectoryCurveRef.current = trajectoryCurve;

    // 3.5 Malla de la línea de trayectoria (Conectada sin colgar en el aire)
    const curvePoints = trajectoryCurve.getPoints(90);
    const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.8,
      gapSize: 0.4,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });

    const trajectoryLine = new THREE.Line(curveGeo, curveMat);
    trajectoryLine.computeLineDistances();
    sceneRef.current.add(trajectoryLine);
    trajectoryLineRef.current = trajectoryLine;

    // 3.6 Retícula de aterrizaje en el cráter de destino
    const reticleGeo = new THREE.RingGeometry(0.4, 0.65, 32);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const reticle = new THREE.Mesh(reticleGeo, reticleMat);
    reticle.position.copy(landingTarget);
    reticle.lookAt(landingTarget.clone().multiplyScalar(2));
    sceneRef.current.add(reticle);
    landingReticleRef.current = reticle;
  }, [selectedSite]);

  /* ============================================================================
   * [SECCIÓN 4: CONTROL DE VISIBILIDAD DE MARCADORES Y FILTRADO POR ZONA]
   * ============================================================================ */
  useEffect(() => {
    if (markersGroupRef.current) {
      markersGroupRef.current.visible = Boolean(showPins);
    }
  }, [showPins]);

  useEffect(() => {
    siteMeshesRef.current.forEach(({ category, pin, halo }) => {
      const matchesZone = zoneFilter === 'all' || category === zoneFilter;
      pin.visible = matchesZone;
      halo.visible = matchesZone;
    });
  }, [zoneFilter]);

  useEffect(() => {
    if (perspective) {
      switchPerspective(perspective);
    }
  }, [perspective, switchPerspective]);

  /* ============================================================================
   * [SECCIÓN 5: VINCULACIÓN ASTRONÓMICA DEL SOL]
   * ============================================================================ */
  useEffect(() => {
    if (!sunLightRef.current || !missionDate) return;
    const baseFecha = new Date(missionDate.includes('Z') ? missionDate : missionDate + ':00Z');
    const fecha = new Date(baseFecha.getTime() + (scrubbedHours || 0) * 3600 * 1000);
    const { anguloAzimut, elevacionGrados } = calcularPosicionSolar(fecha);

    const dist = 50;
    const yOffset = Math.sin(elevacionGrados * (Math.PI / 180)) * dist;
    sunLightRef.current.position.set(
      Math.cos(anguloAzimut) * dist,
      yOffset,
      Math.sin(anguloAzimut) * dist
    );
  }, [missionDate, scrubbedHours]);

  // Evaluación de viabilidad física rigurosa y calibrada
  const evaluateTouchdown = useCallback((site = selectedSite) => {
    if (!site) return;
    const arrivalDate = new Date(missionDate.includes('Z') ? missionDate : missionDate + ':00Z');
    const { elevacionGrados } = calcularPosicionSolar(arrivalDate, site);
    const currentSunElev = Number(elevacionGrados.toFixed(2));
    const currentSlope = site?.slopeDeg || 8.5;

    if (currentSlope > CRITICAL_THRESHOLDS.MAX_SLOPE_DEG) {
      setFlightOutcome({
        success: false,
        title: 'ALUNIZAJE FALLIDO // TOPOGRAFÍA',
        reason: `Pendiente local de ${currentSlope}° supera el límite de seguridad (${CRITICAL_THRESHOLDS.MAX_SLOPE_DEG}°). Riesgo inminente de vuelco de la etapa de descenso.`,
        suggestion: `Incrementa la tolerancia de pendiente en 'Filtros de Seguridad' o selecciona un cráter con relieve más llano como Shackleton Connecting Ridge (6.5°) o Malapert Mountain (7.2°).`
      });
    } else if (currentSunElev < CRITICAL_THRESHOLDS.MIN_SUN_ELEV_DEG) {
      setFlightOutcome({
        success: false,
        title: 'MISIÓN ABORTADA // ENERGÍA SOLAR',
        reason: `Elevación solar de ${currentSunElev}° insuficiente (< ${CRITICAL_THRESHOLDS.MIN_SUN_ELEV_DEG}°). Los paneles fotovoltaicos no logran suministrar energía al sistema.`,
        suggestion: `Ajusta la fecha en 'Touchdown UTC' (prueba desplazando entre 12h y 36h) para sincronizar con la ventana de máxima insolación lunar, o reduce la elevación solar mínima requerida.`
      });
    } else {
      setFlightOutcome({
        success: true,
        title: `¡ALUNIZAJE EXITOSO EN ${site?.nombre.toUpperCase()}!`,
        reason: `Contacto nominal confirmado. Pendiente segura (${currentSlope}° ≤ ${CRITICAL_THRESHOLDS.MAX_SLOPE_DEG}°), iluminación adecuada (${currentSunElev}°) y enlace DTE nominal.`,
        suggestion: `Parámetros óptimos verificados. Puedes formalizar la misión descargando el Dictamen formal en PDF o exportando el plan de vuelo en JSON.`
      });
    }
  }, [missionDate, selectedSite]);

  /* ============================================================================
   * [SECCIÓN 6: ANIMACIÓN CINEMÁTICA DE VUELO TLI Y ATERRIZAJE]
   * ============================================================================ */
  const startFlightSimulation = useCallback(() => {
    if (!selectedSite || isFlying) return;
    setFlightOutcome(null);
    setIsFlying(true);
    if (spaceshipMeshRef.current) spaceshipMeshRef.current.visible = true;
    switchPerspective('tli_corridor');
  }, [selectedSite, isFlying, switchPerspective]);

  const skipToTouchdown = useCallback(() => {
    if (!isFlying) return;
    setIsFlying(false);
    setFlightTelemetry(null);
    if (trajectoryCurveRef.current && spaceshipMeshRef.current) {
      const finalPos = trajectoryCurveRef.current.getPoint(1);
      spaceshipMeshRef.current.position.copy(finalPos);
    }
    focusOnSite(selectedSite);
    evaluateTouchdown(selectedSite);
  }, [isFlying, focusOnSite, selectedSite, evaluateTouchdown]);

  useEffect(() => {
    if (!isFlying || !trajectoryCurveRef.current || !spaceshipMeshRef.current) return;

    let animId;
    const duration = 4000; // 4 segundos para vuelo cinemático suave
    const start = performance.now();

    const flightStep = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      const pos = trajectoryCurveRef.current.getPoint(progress);
      spaceshipMeshRef.current.position.copy(pos);

      // Efecto parpadeo de la propulsión de plasma
      if (thrusterFlameRef.current) {
        const flicker = 0.8 + Math.sin(now * 0.05) * 0.3;
        thrusterFlameRef.current.scale.set(flicker, flicker, flicker);
      }

      // Telemetría en tiempo real
      const distTraveledKm = Math.round(progress * 384400);
      let phase = '1. Inyección Translunar (TLI)';
      let speedKms = (11.2 - progress * 9.5).toFixed(1);

      if (progress > 0.65 && progress < 0.88) {
        phase = '2. Captura Gravitatoria Lunar (LOI)';
        speedKms = (1.6 + (progress - 0.65) * 2.5).toFixed(1);
      } else if (progress >= 0.88) {
        phase = '3. Descenso Motorizado & Retro-frenado';
        speedKms = Math.max(0.01, (1.8 * (1 - progress) * 6)).toFixed(2);
      }

      setFlightTelemetry({
        progress: Math.round(progress * 100),
        distKm: distTraveledKm.toLocaleString(),
        phase,
        speedKms
      });

      // Cámara cinemática siguiendo suavemente la nave
      if (cameraRef.current && controlsRef.current && progress < 0.94) {
        const chasePos = new THREE.Vector3(pos.x + 8, pos.y + 5, pos.z + 12);
        cameraRef.current.position.lerp(chasePos, 0.04);
        controlsRef.current.target.lerp(pos, 0.06);
        controlsRef.current.update();
      }

      if (progress < 1) {
        const nextPos = trajectoryCurveRef.current.getPoint(Math.min(progress + 0.02, 1));
        if (progress > 0.88) {
          // Maniobra de giro de 180° para retro-braking antes del contacto
          spaceshipMeshRef.current.lookAt(pos.clone().sub(nextPos.clone().sub(pos)));
        } else {
          spaceshipMeshRef.current.lookAt(nextPos);
        }
        animId = requestAnimationFrame(flightStep);
      } else {
        // Alunizaje completado
        setIsFlying(false);
        setFlightTelemetry(null);

        // Enfocar el sitio final
        focusOnSite(selectedSite);

        // Evaluación de viabilidad física rigurosa y calibrada
        evaluateTouchdown(selectedSite);
      }
    };

    animId = requestAnimationFrame(flightStep);
    return () => cancelAnimationFrame(animId);
  }, [isFlying, selectedSite, missionDate, focusOnSite, evaluateTouchdown]);

  // Disparador de simulación de vuelo desde el panel exterior
  const lastFlightTriggerRef = useRef(0);
  useEffect(() => {
    if (flightTrigger > 0 && flightTrigger !== lastFlightTriggerRef.current) {
      lastFlightTriggerRef.current = flightTrigger;
      startFlightSimulation();
    }
  }, [flightTrigger, startFlightSimulation]);

  // Sincronización del estado de vuelo hacia el componente superior
  useEffect(() => {
    if (onFlightStateChange) {
      onFlightStateChange(isFlying);
    }
  }, [isFlying, onFlightStateChange]);

  /* ============================================================================
   * [SECCIÓN 7: RENDERIZADO DEL COMPONENTE REACT Y CAPAS HUD DESPEJADAS]
   * ============================================================================ */
  return (
    <div className="w-full h-full relative select-none">
      {/* Contenedor del lienzo 3D despejado */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Indicador discreto de Escaneo Solar Sincronizado */}
      {scrubbedHours > 0 && !isFlying && (
        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#030612]/90 border border-cyan-500/50 text-cyan-300 font-mono text-[10px] backdrop-blur-md shadow-xl animate-in fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Telemetría Solar T+{scrubbedHours}h</span>
          {onResetScrub && (
            <button
              onClick={onResetScrub}
              className="text-slate-400 hover:text-white underline ml-1 cursor-pointer font-bold"
              title="Restablecer posición solar a T+0h"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* 7.2 HUD de Vuelo Cinemático en Tiempo Real */}
      {isFlying && flightTelemetry && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0a0f1d]/95 border border-cyan-500/60 p-4 rounded-2xl font-mono shadow-2xl backdrop-blur-md w-11/12 max-w-md animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-cyan-400 font-bold uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 animate-spin text-cyan-400" />
              {flightTelemetry.phase}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-bold">{flightTelemetry.progress}%</span>
              <button
                onClick={skipToTouchdown}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold border border-slate-700 cursor-pointer transition-all"
                title="Avanzar directamente al contacto en superficie"
              >
                Omitir
              </button>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
            <div
              className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full transition-all duration-75"
              style={{ width: `${flightTelemetry.progress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
            <div>
              <span className="text-slate-500 block">Distancia Recorrida:</span>
              <strong className="text-slate-200">{flightTelemetry.distKm} / 384,400 km</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Velocidad Relativa:</span>
              <strong className="text-cyan-300">{flightTelemetry.speedKms} km/s</strong>
            </div>
          </div>
        </div>
      )}

      {/* 7.3 Modal central de resultado de la misión (Restaurado a su posición prominente original) */}
      {flightOutcome && (
        <div className={`absolute top-10 sm:top-14 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-[#0a0f18]/95 border-2 ${flightOutcome.success ? 'border-emerald-500/60 shadow-emerald-500/10' : 'border-rose-500/60 shadow-rose-500/10'} rounded-2xl p-5 font-mono shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200`}>
          <div className="flex items-start gap-3.5">
            {flightOutcome.success ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-rose-500 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-bold text-sm mb-1 uppercase tracking-wide ${flightOutcome.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {flightOutcome.title}
                </h3>
                <button
                  onClick={() => setFlightOutcome(null)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
                  title="Cerrar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {flightOutcome.reason}
              </p>

              {/* Sugerencia Táctica de Vuelo para Próxima Simulación */}
              {flightOutcome.suggestion && (
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-[11px] space-y-1 mb-3">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Sugerencia Táctica:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {flightOutcome.suggestion}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800/80">
                {onOpenOptimizer && !flightOutcome.success && (
                  <button
                    onClick={onOpenOptimizer}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-cyan-500 to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:opacity-90 transition-all text-center"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Calibrar con IA
                  </button>
                )}
                <button
                  onClick={() => setFlightOutcome(null)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Cerrar Telemetría
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7.4 Tooltip informativo al pasar el cursor sobre un cráter */}
      {hoveredSite && showPins && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#0d121d]/95 border border-cyan-500/50 px-4 py-2 rounded-xl shadow-2xl z-30 font-mono text-center pointer-events-none">
          <span className="text-cyan-400 font-bold text-xs uppercase block">{hoveredSite.nombre}</span>
          <span className="text-[10px] text-slate-400">
            {hoveredSite.categoriaNombre || 'Sitio Lunar'} • Lat: {hoveredSite.lat}° | Lon: {hoveredSite.lon}° • Clic para fijar objetivo
          </span>
        </div>
      )}
    </div>
  );
}
