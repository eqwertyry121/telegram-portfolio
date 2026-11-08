document.querySelectorAll('.method').forEach(function (method) {
  method.addEventListener('toggle', function () {
    method.classList.toggle('is-open', method.open);
  });
});

// Keep the subtle shade on the mouth as the image crops on different screens.
const heroPoster = document.querySelector('.hero-poster');
const heroImage = document.querySelector('.hero-image');
const teethShade = document.querySelector('.hero-teeth-shade');

function positionTeethShade() {
  if (!heroPoster || !heroImage || !teethShade || !heroImage.naturalWidth || !heroImage.naturalHeight) return;

  const posterRect = heroPoster.getBoundingClientRect();
  const imageRect = heroImage.getBoundingClientRect();
  const imageStyle = getComputedStyle(heroImage);
  const position = imageStyle.objectPosition.split(/\s+/).map(parseFloat);
  const positionX = Number.isFinite(position[0]) ? position[0] / 100 : .5;
  const positionY = Number.isFinite(position[1]) ? position[1] / 100 : .5;
  const scale = Math.max(imageRect.width / heroImage.naturalWidth, imageRect.height / heroImage.naturalHeight);
  const imageWidth = heroImage.naturalWidth * scale;
  const imageHeight = heroImage.naturalHeight * scale;
  const offsetX = (imageRect.width - imageWidth) * positionX;
  const offsetY = (imageRect.height - imageHeight) * positionY;

  teethShade.style.left = `${imageRect.left - posterRect.left + offsetX + imageWidth * .4875}px`;
  teethShade.style.top = `${imageRect.top - posterRect.top + offsetY + imageHeight * .531}px`;
  teethShade.style.width = `${imageWidth * .15}px`;
  teethShade.style.height = `${imageHeight * .08}px`;
}

if (heroImage && heroPoster) {
  if (heroImage.complete) positionTeethShade();
  heroImage.addEventListener('load', positionTeethShade);
  window.addEventListener('resize', positionTeethShade, { passive: true });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(positionTeethShade);
    observer.observe(heroImage);
    observer.observe(heroPoster);
  }
}

// Short, glowing trails rise from the button and fall as they cool.
const contactButton = document.querySelector('.footer-button');
const sparkCanvas = document.querySelector('.footer-sparks');
const sparkContext = sparkCanvas && sparkCanvas.getContext('2d');

if (contactButton && sparkCanvas && sparkContext) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sparks = [];
  let hovering = false;
  let focused = false;
  let frame = 0;
  let lastTime = 0;
  let emission = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let origin = { x: 0, y: 0, width: 0 };

  function sizeSparkCanvas() {
    const canvasRect = sparkCanvas.getBoundingClientRect();
    const buttonRect = contactButton.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = canvasRect.width;
    canvasHeight = canvasRect.height;
    sparkCanvas.width = Math.round(canvasWidth * scale);
    sparkCanvas.height = Math.round(canvasHeight * scale);
    sparkContext.setTransform(scale, 0, 0, scale, 0, 0);
    origin = { x: buttonRect.left - canvasRect.left, y: buttonRect.top - canvasRect.top, width: buttonRect.width };
  }

  function emitSpark() {
    if (sparks.length >= 90) return;
    const angle = -Math.PI / 2 + (Math.random() - .5) * 2.5;
    const speed = 140 + Math.random() * 260;
    const lifetime = .45 + Math.random() * .5;
    sparks.push({
      x: origin.x + Math.random() * origin.width,
      y: origin.y + 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: lifetime,
      lifetime,
      width: 1.1 + Math.random() * 1.7,
      trail: .05 + Math.random() * .05
    });
  }

  function drawSparks(time) {
    if (!lastTime) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, .04);
    lastTime = time;
    sparkContext.clearRect(0, 0, canvasWidth, canvasHeight);

    if ((hovering || focused) && !reducedMotion.matches) {
      emission += dt * 48;
      while (emission >= 1) { emitSpark(); emission -= 1; }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const spark = sparks[i];
      spark.life -= dt;
      if (spark.life <= 0) { sparks.splice(i, 1); continue; }
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vy += 520 * dt;
      spark.vx *= Math.pow(.97, dt * 60);
      const alpha = Math.min(1, spark.life / (spark.lifetime * .4));
      const tailX = spark.x - spark.vx * spark.trail;
      const tailY = spark.y - spark.vy * spark.trail;
      const trail = sparkContext.createLinearGradient(tailX, tailY, spark.x, spark.y);
      trail.addColorStop(0, 'rgba(255, 72, 5, 0)');
      trail.addColorStop(.6, `rgba(255, 140, 25, ${alpha * .85})`);
      trail.addColorStop(1, `rgba(255, 244, 191, ${alpha})`);
      sparkContext.strokeStyle = trail;
      sparkContext.shadowColor = `rgba(255, 89, 10, ${alpha * .7})`;
      sparkContext.shadowBlur = 9;
      sparkContext.lineWidth = spark.width;
      sparkContext.lineCap = 'round';
      sparkContext.beginPath();
      sparkContext.moveTo(tailX, tailY);
      sparkContext.lineTo(spark.x, spark.y);
      sparkContext.stroke();
    }

    if ((hovering || focused) && !reducedMotion.matches || sparks.length) {
      frame = requestAnimationFrame(drawSparks);
    } else {
      frame = 0;
      lastTime = 0;
      emission = 0;
    }
  }

  function startSparks() {
    if (reducedMotion.matches) return;
    sizeSparkCanvas();
    for (let i = 0; i < 28; i++) emitSpark();
    if (!frame) frame = requestAnimationFrame(drawSparks);
  }

  contactButton.addEventListener('pointerenter', function (event) {
    if (event.pointerType === 'touch') return;
    hovering = true;
    startSparks();
  });
  contactButton.addEventListener('pointerleave', function () { hovering = false; });
  contactButton.addEventListener('focus', function () { focused = true; startSparks(); });
  contactButton.addEventListener('blur', function () { focused = false; });
  window.addEventListener('resize', function () { if (frame) sizeSparkCanvas(); }, { passive: true });
  reducedMotion.addEventListener('change', function () {
    if (reducedMotion.matches) {
      sparks.length = 0;
      sparkContext.clearRect(0, 0, canvasWidth, canvasHeight);
    } else if (hovering || focused) {
      startSparks();
    }
  });
}
