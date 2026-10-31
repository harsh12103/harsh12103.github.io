import * as THREE from "three";

const canvas = document.querySelector("#hero-canvas");
const visual = document.querySelector("#heroVisual");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setupDataCore() {
  if (!canvas || !visual) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    visual.classList.add("webgl-fallback");
    console.warn("3D visual unavailable; using CSS fallback.", error);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  const root = new THREE.Group();
  scene.add(root);

  scene.add(new THREE.AmbientLight(0xc4c8ee, 1.35));
  const keyLight = new THREE.PointLight(0xc0b8ff, 38, 14);
  keyLight.position.set(3, 3, 4);
  scene.add(keyLight);
  const cyanLight = new THREE.PointLight(0x8edce5, 26, 12);
  cyanLight.position.set(-3, -1, 3);
  scene.add(cyanLight);
  const warmLight = new THREE.PointLight(0xe9c99e, 15, 10);
  warmLight.position.set(0, -3, -2);
  scene.add(warmLight);

  // Main faceted data core
  const coreGeometry = new THREE.IcosahedronGeometry(1.12, 2);
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xaaa2ed,
    metalness: 0.58,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    flatShading: true
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  root.add(core);

  // Fine wireframe gives the core a technical / data-network surface
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.145, 2),
    new THREE.MeshBasicMaterial({
      color: 0x8176d4,
      wireframe: true,
      transparent: true,
      opacity: 0.38
    })
  );
  root.add(wire);

  // Floating inner nucleus
  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xe9eaff,
      emissive: 0xaaa2ed,
      emissiveIntensity: 0.34,
      metalness: 0.4,
      roughness: 0.23
    })
  );
  root.add(nucleus);

  // Three orbital rings, each in a different plane
  const rings = [];
  const ringSpecs = [
    { radius: 1.72, tube: 0.012, color: 0xa49ae8, rotation: [0.8, 0.15, 0.2] },
    { radius: 1.98, tube: 0.009, color: 0x74c5d2, rotation: [1.15, 0.8, -0.4] },
    { radius: 2.2, tube: 0.007, color: 0xdab481, rotation: [0.25, 1.1, 0.65] }
  ];
  ringSpecs.forEach((spec) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, spec.tube, 8, 180),
      new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.72
      })
    );
    ring.rotation.set(...spec.rotation);
    root.add(ring);
    rings.push(ring);
  });

  // Orbiting nodes positioned around the central core
  const nodeGroup = new THREE.Group();
  root.add(nodeGroup);
  const nodeMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x65b6c7, emissive: 0x397d90, emissiveIntensity: 0.7, metalness: 0.3, roughness: 0.25 }),
    new THREE.MeshStandardMaterial({ color: 0x9a8de2, emissive: 0x6759b5, emissiveIntensity: 0.55, metalness: 0.35, roughness: 0.25 }),
    new THREE.MeshStandardMaterial({ color: 0xdab481, emissive: 0x987048, emissiveIntensity: 0.45, metalness: 0.35, roughness: 0.28 })
  ];
  const nodes = [];
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    const radius = i % 2 === 0 ? 2.18 : 1.78;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(i % 4 === 0 ? 0.075 : 0.045, 16, 16),
      nodeMaterials[i % nodeMaterials.length]
    );
    node.userData = {
      angle,
      radius,
      speed: (i % 2 === 0 ? 1 : -1) * (0.13 + (i % 4) * 0.025),
      height: Math.sin(angle * 2) * 0.5
    };
    nodeGroup.add(node);
    nodes.push(node);
  }

  // Background star / data-point field
  const starCount = 430;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const radius = 2.6 + Math.random() * 3.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0x9ca6c9,
      size: 0.018,
      transparent: true,
      opacity: 0.62,
      sizeAttenuation: true
    })
  );
  scene.add(stars);

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  visual.addEventListener("pointermove", (event) => {
    const rect = visual.getBoundingClientRect();
    pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.6;
    pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.45;
  });
  visual.addEventListener("pointerleave", () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  });

  function resize() {
    const width = Math.max(visual.clientWidth, 1);
    const height = Math.max(visual.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(visual);
  resize();

  let frame = 0;
  const clock = new THREE.Clock();

  function render() {
    const time = clock.getElapsedTime();
    pointer.x += (pointer.targetX - pointer.x) * 0.035;
    pointer.y += (pointer.targetY - pointer.y) * 0.035;

    root.rotation.y = time * 0.12 + pointer.x;
    root.rotation.x = Math.sin(time * 0.22) * 0.1 + pointer.y;
    core.rotation.x = time * 0.12;
    core.rotation.y = time * 0.18;
    wire.rotation.set(-core.rotation.x * 0.75, -core.rotation.y * 0.75, -core.rotation.z * 0.75);
    nucleus.scale.setScalar(1 + Math.sin(time * 1.4) * 0.035);

    rings[0].rotation.z += 0.0015;
    rings[1].rotation.y -= 0.0011;
    rings[2].rotation.x += 0.0009;

    nodes.forEach((node) => {
      const d = node.userData;
      const angle = d.angle + time * d.speed;
      node.position.set(
        Math.cos(angle) * d.radius,
        Math.sin(angle * 1.25) * 0.7 + d.height * 0.3,
        Math.sin(angle) * d.radius * 0.62
      );
    });
    nodeGroup.rotation.y = -time * 0.035;
    stars.rotation.y = time * 0.008;
    stars.rotation.x = Math.sin(time * 0.05) * 0.025;

    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  }

  if (reducedMotion) {
    renderer.render(scene, camera);
  } else {
    render();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (!document.hidden && !reducedMotion && !frame) {
      clock.start();
      render();
    }
  });

  window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    renderer.dispose();
    coreGeometry.dispose();
    coreMaterial.dispose();
    wire.geometry.dispose();
    wire.material.dispose();
    starGeometry.dispose();
    stars.material.dispose();
    nodeMaterials.forEach((material) => material.dispose());
  }, { once: true });
}

setupDataCore();

// Navigation glass effect
const nav = document.querySelector(".nav");
window.addEventListener("scroll", () => nav?.classList.toggle("scrolled", window.scrollY > 24), { passive: true });

// Scroll reveal
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

// Project card 3D tilt (subtle and disabled on touch/reduced-motion devices)
if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 5;
      const rotateX = (0.5 - y) * 5;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

// Mobile menu
const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelector("#navLinks");
menuToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();
