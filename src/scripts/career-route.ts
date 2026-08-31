export {};

/**
 * Scroll-linked route drawing for the portfolio career path. The plane travels
 * from the curved approach into the vertical rail; reversing scroll flips the
 * aircraft and retracts the line from the same position.
 */
const PLANE_SIZE = 16;
const CURVE_HEIGHT = 110;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function bootCareerRoute() {
  const track = document.querySelector<HTMLElement>('.career-track');
  const route = document.querySelector<HTMLElement>('[data-career-route]');
  const curve = document.querySelector<SVGPathElement>('[data-route-curve]');
  const rail = document.querySelector<HTMLElement>('[data-route-rail-lit]');
  const plane = document.querySelector<HTMLElement>('[data-route-plane]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!track || !route || !curve || !rail || !plane || reduceMotion.matches) return;

  const careerTrack = track;
  const careerRoute = route;
  const routeCurve = curve;
  const railLight = rail;
  const routePlane = plane;
  const curveLength = routeCurve.getTotalLength();
  let previousScroll = window.scrollY;
  let direction = 1;
  let frame = 0;

  function setPlanePosition(progress: number) {
    const routeHeight = careerRoute.clientHeight;
    const curveShare = clamp(CURVE_HEIGHT / routeHeight, 0.08, 0.28);
    const curveProgress = clamp(progress / curveShare);
    const railProgress = clamp((progress - curveShare) / (1 - curveShare));
    const curveDistance = curveLength * curveProgress;
    const point = curveProgress < 1
      ? routeCurve.getPointAtLength(curveDistance)
      : { x: 0.5, y: CURVE_HEIGHT + (routeHeight - CURVE_HEIGHT) * railProgress };
    const nextDistance = Math.min(curveLength, curveDistance + 1);
    const nextPoint = curveProgress < 1
      ? routeCurve.getPointAtLength(nextDistance)
      : { x: 0.5, y: point.y + 1 };
    const heading = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI) + 90;

    routeCurve.style.strokeDashoffset = String(1 - curveProgress);
    railLight.style.transform = `scaleY(${railProgress})`;
    routePlane.style.transform = `translate(${point.x - PLANE_SIZE / 2}px, ${point.y - PLANE_SIZE / 2}px) rotate(${heading}deg)`;
  }

  function update() {
    frame = 0;
    if (document.visibilityState !== 'visible') return;

    const scroll = window.scrollY;
    if (scroll !== previousScroll) {
      direction = scroll > previousScroll ? 1 : -1;
      previousScroll = scroll;
      routePlane.classList.toggle('is-returning', direction < 0);
    }

    const box = careerTrack.getBoundingClientRect();
    const progress = clamp((window.innerHeight * 0.85 - box.top) / (box.height + window.innerHeight * 0.45));
    setPlanePosition(progress);
  }

  function requestUpdate() {
    if (frame === 0) frame = requestAnimationFrame(update);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  document.addEventListener('visibilitychange', requestUpdate);
  requestUpdate();
}

bootCareerRoute();
