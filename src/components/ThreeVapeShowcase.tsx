import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { computeScrollTelemetry } from '../utils/storeLogic';

function createOledDisplayTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, 512, 256);

    // Subtle border frame
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 492, 236);

    // Header status
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('VDK SMART TELEMETRY', 32, 50);

    // Battery bar
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 3;
    ctx.strokeRect(410, 32, 64, 22);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(414, 36, 52, 14);

    // Primary Wattage Readout
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 76px sans-serif';
    ctx.fillText('60.0W', 30, 140);

    // Sub-metrics
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('35,000 PUFFS', 32, 188);

    ctx.fillStyle = '#e4e4e7';
    ctx.font = '20px monospace';
    ctx.fillText('0.4Ω DUAL MESH · BOOST', 32, 222);

    // Right telemetry gauge
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(385, 145, 54, -Math.PI * 0.75, Math.PI * 0.55);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('98%', 360, 154);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createBrushedBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 2) {
      const shade = 115 + Math.floor(Math.random() * 25);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(0, y, 128, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function ThreeVapeShowcase() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [scrollTelemetry, setScrollTelemetry] = useState(() =>
    computeScrollTelemetry(typeof window !== 'undefined' ? window.scrollY : 0, 680)
  );

  // Mutable ref so window scroll & pointer events drive the 3D scene smoothly without re-mounting WebGLRenderer
  const controlStateRef = useRef<{
    pointerX: number;
    pointerY: number;
    scrollProgress: number;
  }>({
    pointerX: 0,
    pointerY: 0,
    scrollProgress: 0,
  });

  // Listen to window scroll to drive real-time Three.js scroll animation automatically
  useEffect(() => {
    const handleWindowScroll = () => {
      const telemetry = computeScrollTelemetry(window.scrollY, 680);
      controlStateRef.current.scrollProgress = telemetry.progress;
      setScrollTelemetry(telemetry);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    handleWindowScroll();
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    // 1. Software-WebGL detection from GPU renderer string
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = mount.clientWidth || 420;
    const height = mount.clientHeight || 380;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    scene.fog = new THREE.FogExp2(0x09090b, 0.08);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 4.9);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    // 2. Studio Environment Map via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // 3. Three-Point Studio Lighting Rig (Warm Key, Cool Hemisphere Fill, Cyan Rim)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x18181b, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.3);
    keyLight.position.set(4, 6, 5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -3;
      keyLight.shadow.camera.right = 3;
      keyLight.shadow.camera.top = 3;
      keyLight.shadow.camera.bottom = -3;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.7);
    rimLight.position.set(-4, 2, -4);
    scene.add(rimLight);

    // 4. Grounding Contact Shadow Disc
    const shadowDiscGeo = new THREE.CircleGeometry(1.6, 32);
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowDisc = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = -1.65;
    scene.add(shadowDisc);

    // 5. Composite 9-Part Procedural 3D Smart Vape Hardware Group
    const deviceGroup = new THREE.Group();
    scene.add(deviceGroup);

    const bumpTex = createBrushedBumpTexture();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const oledTex = createOledDisplayTexture(maxAniso);

    // Part 1: Main Anodized Body Chassis (Beveled ExtrudeGeometry)
    const bodyShape = new THREE.Shape();
    const bw = 0.56;
    const bd = 0.34;
    const br = 0.12;
    bodyShape.moveTo(-bw + br, -bd);
    bodyShape.lineTo(bw - br, -bd);
    bodyShape.quadraticCurveTo(bw, -bd, bw, -bd + br);
    bodyShape.lineTo(bw, bd - br);
    bodyShape.quadraticCurveTo(bw, bd, bw - br, bd);
    bodyShape.lineTo(-bw + br, bd);
    bodyShape.quadraticCurveTo(-bw, bd, -bw, bd - br);
    bodyShape.lineTo(-bw, -bd + br);
    bodyShape.quadraticCurveTo(-bw, -bd, -bw + br, -bd);

    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
      depth: 1.75,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    bodyGeo.rotateX(Math.PI / 2);
    bodyGeo.center();

    const obsidianColor = new THREE.Color(0x18181b);
    const cobaltColor = new THREE.Color(0x1d4ed8);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.34,
      metalness: 0.82,
      bumpMap: bumpTex,
      bumpScale: 0.008,
    });
    const chassisMesh = new THREE.Mesh(bodyGeo, chassisMat);
    chassisMesh.position.y = -0.35;
    deviceGroup.add(chassisMesh);

    // Part 2: Brushed Titanium Top Collar
    const collarGeo = new THREE.CylinderGeometry(0.46, 0.5, 0.16, 32);
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.18,
      metalness: 0.92,
      bumpMap: bumpTex,
      bumpScale: 0.005,
    });
    const topCollar = new THREE.Mesh(collarGeo, titaniumMat);
    topCollar.position.y = 0.62;
    deviceGroup.add(topCollar);

    // Part 3: Brushed Titanium Base Plate
    const basePlateGeo = new THREE.CylinderGeometry(0.5, 0.46, 0.14, 32);
    const basePlate = new THREE.Mesh(basePlateGeo, titaniumMat);
    basePlate.position.y = -1.32;
    deviceGroup.add(basePlate);

    // Part 4: Front Curved OLED Telemetry Display Panel
    const screenGroup = new THREE.Group();
    const screenBackingGeo = new THREE.BoxGeometry(0.84, 1.38, 0.04);
    const screenBackingMat = new THREE.MeshStandardMaterial({
      color: 0x050507,
      roughness: 0.1,
      metalness: 0.2,
    });
    const screenBacking = new THREE.Mesh(screenBackingGeo, screenBackingMat);
    screenGroup.add(screenBacking);

    const oledPlaneGeo = new THREE.PlaneGeometry(0.76, 1.24);
    const oledPlaneMat = new THREE.MeshBasicMaterial({
      map: oledTex,
    });
    const oledPlane = new THREE.Mesh(oledPlaneGeo, oledPlaneMat);
    oledPlane.position.z = 0.025;
    oledPlane.rotation.z = Math.PI / 2;
    screenGroup.add(oledPlane);
    screenGroup.position.set(0, -0.35, 0.39);
    deviceGroup.add(screenGroup);

    // Part 5 & 6: Tactile Fire Button & Wattage Rocker Buttons
    const buttonGroup = new THREE.Group();
    const fireBtnGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 24);
    fireBtnGeo.rotateZ(Math.PI / 2);
    const fireBtn = new THREE.Mesh(fireBtnGeo, titaniumMat);
    fireBtn.position.set(0.62, 0.18, 0);
    buttonGroup.add(fireBtn);

    const rockerGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.08, 20);
    rockerGeo.rotateZ(Math.PI / 2);
    const plusBtn = new THREE.Mesh(rockerGeo, titaniumMat);
    plusBtn.position.set(0.62, -0.25, 0);
    const minusBtn = new THREE.Mesh(rockerGeo, titaniumMat);
    minusBtn.position.set(0.62, -0.48, 0);
    buttonGroup.add(plusBtn, minusBtn);
    deviceGroup.add(buttonGroup);

    // Part 7: Internal Gold Dual-Mesh Atomizer Core & E-Liquid Chamber
    const atomizerGroup = new THREE.Group();
    const coilGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.56, 24);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.16,
      metalness: 0.96,
    });
    const coilMesh = new THREE.Mesh(coilGeo, goldMat);
    atomizerGroup.add(coilMesh);

    const liquidGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.34, 28);
    const liquidMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.72,
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.y = -0.08;
    atomizerGroup.add(liquidMesh);
    atomizerGroup.position.y = 0.98;
    deviceGroup.add(atomizerGroup);

    // Part 8: Optical Glass Tank Vessel
    const glassGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.58, 32);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.05,
      transmission: isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: isSoftwareGl ? 0.32 : 1.0,
      ior: 1.52,
      thickness: 0.4,
      depthWrite: false,
    });
    const glassTank = new THREE.Mesh(glassGeo, glassMat);
    glassTank.renderOrder = 2;
    glassTank.position.y = 0.98;
    deviceGroup.add(glassTank);

    // Part 9: Sculpted Ergonomic Mouthpiece (LatheGeometry)
    const tipPoints = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.32, 0.0),
      new THREE.Vector2(0.28, 0.14),
      new THREE.Vector2(0.19, 0.34),
      new THREE.Vector2(0.18, 0.48),
      new THREE.Vector2(0.11, 0.48),
    ];
    const mouthpieceGeo = new THREE.LatheGeometry(tipPoints, 32);
    const mouthpieceMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.55,
      metalness: 0.15,
    });
    const mouthpiece = new THREE.Mesh(mouthpieceGeo, mouthpieceMat);
    mouthpiece.position.y = 1.28;
    deviceGroup.add(mouthpiece);

    // 6. Animated InstancedMesh Vapor & Telemetry Particle Field (48 instances)
    const PARTICLE_COUNT = 48;
    const particleGeo = new THREE.IcosahedronGeometry(0.026, 1);
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      roughness: 0.25,
      metalness: 0.85,
    });
    const particleInstanced = new THREE.InstancedMesh(
      particleGeo,
      particleMat,
      PARTICLE_COUNT
    );
    particleInstanced.frustumCulled = false;

    const particleData = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      angle: (i / PARTICLE_COUNT) * Math.PI * 2 * 3,
      radius: 0.85 + (i % 5) * 0.18,
      yOffset: -1.4 + (i / PARTICLE_COUNT) * 2.8,
      speed: 0.35 + (i % 4) * 0.12,
      scale: 0.5 + (i % 3) * 0.25,
    }));

    const dummyMatrix = new THREE.Matrix4();
    const dummyPos = new THREE.Vector3();
    const dummyQuat = new THREE.Quaternion();
    const dummyScale = new THREE.Vector3();
    const targetColor = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particleData[i];
      dummyPos.set(
        Math.cos(p.angle) * p.radius,
        p.yOffset,
        Math.sin(p.angle) * p.radius
      );
      dummyScale.setScalar(p.scale);
      dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);
      particleInstanced.setMatrixAt(i, dummyMatrix);
      targetColor.setHex(i % 3 === 0 ? 0x38bdf8 : 0xd4d4d8);
      particleInstanced.setColorAt(i, targetColor);
    }
    particleInstanced.instanceMatrix.needsUpdate = true;
    if (particleInstanced.instanceColor) {
      particleInstanced.instanceColor.needsUpdate = true;
    }
    particleInstanced.computeBoundingSphere();
    scene.add(particleInstanced);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let lastTime = performance.now();
    const startTime = lastTime;
    let frameId = 0;
    let isDisposed = false;
    let explodeFactor = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = (now - startTime) / 1000;
      const ctrl = controlStateRef.current;

      // Pure Scroll-Driven 3D Choreography:
      // As the user scrolls down the page, the hardware smoothly deconstructs, shifts finish sheen, and orbits 360°
      explodeFactor = THREE.MathUtils.damp(explodeFactor, ctrl.scrollProgress, 7, dt);

      targetColor.copy(obsidianColor).lerp(cobaltColor, explodeFactor * 0.65);
      chassisMat.color.lerp(targetColor, 1 - Math.exp(-8 * dt));

      mouthpiece.position.y = 1.28 + explodeFactor * 0.48;
      glassTank.position.y = 0.98 + explodeFactor * 0.24;
      atomizerGroup.position.y = 0.98 + explodeFactor * 0.1;
      topCollar.position.y = 0.62 - explodeFactor * 0.05;
      basePlate.position.y = -1.32 - explodeFactor * 0.3;
      screenGroup.position.z = 0.39 + explodeFactor * 0.36;
      buttonGroup.position.x = explodeFactor * 0.25;

      const scrollAngleY =
        ctrl.scrollProgress * Math.PI * 2 + elapsed * 0.32 + ctrl.pointerX * 0.65;
      const scrollTiltX =
        0.08 + Math.sin(ctrl.scrollProgress * Math.PI) * 0.32 + ctrl.pointerY * 0.2;
      const scrollTiltZ = Math.sin(ctrl.scrollProgress * Math.PI * 2) * 0.14;

      deviceGroup.rotation.y = THREE.MathUtils.damp(deviceGroup.rotation.y, scrollAngleY, 6, dt);
      deviceGroup.rotation.x = THREE.MathUtils.damp(deviceGroup.rotation.x, scrollTiltX, 6, dt);
      deviceGroup.rotation.z = THREE.MathUtils.damp(deviceGroup.rotation.z, scrollTiltZ, 6, dt);

      const targetCamZ = 5.45 + ctrl.scrollProgress * 0.95;
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 6, dt);
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        0.05 + ctrl.scrollProgress * 0.22,
        6,
        dt
      );

      // Gentle levitation wave
      deviceGroup.position.y = -0.18 + Math.sin(elapsed * 1.8) * 0.05;
      camera.lookAt(0, -0.05, 0);

      // Update swirling 3D vapor / telemetry particles (scroll expands orbital radius & speed)
      const scrollBoost = 1 + explodeFactor * 0.45;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particleData[i];
        const a = p.angle + elapsed * p.speed * scrollBoost + explodeFactor * 1.8;
        const y = ((p.yOffset + elapsed * p.speed * 0.8 + 1.6) % 3.2) - 1.6;
        const r = (p.radius + Math.sin(elapsed * 1.5 + i) * 0.08) * scrollBoost;
        dummyPos.set(Math.cos(a) * r, y, Math.sin(a) * r);
        dummyQuat.setFromAxisAngle(dummyPos, elapsed * 0.5);
        dummyScale.setScalar(p.scale * (1 - Math.abs(y) / 2.2));
        dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);
        particleInstanced.setMatrixAt(i, dummyMatrix);
      }
      particleInstanced.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    let lastW = width;
    let lastH = height;

    const handleResize = () => {
      if (!mount || isDisposed) return;
      const w = mount.clientWidth || 300;
      const h = mount.clientHeight || 280;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };

    window.addEventListener('resize', handleResize);
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(mount);
    }

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      oledTex.dispose();
      bumpTex.dispose();
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    controlStateRef.current.pointerX = nx;
    controlStateRef.current.pointerY = ny;
  };

  const handlePointerLeave = () => {
    controlStateRef.current.pointerX = 0;
    controlStateRef.current.pointerY = 0;
  };

  return (
    <div
      data-testid="threejs-vape-showcase"
      data-scroll-angle={scrollTelemetry.angleDeg}
      data-scroll-explode={scrollTelemetry.explodePercent}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label="3D Smart Vape Hardware Scroll Animation"
      className="relative flex h-full min-h-[280px] sm:min-h-[340px] w-full overflow-hidden border border-zinc-800 bg-zinc-950"
    >
      <div
        ref={canvasMountRef}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
