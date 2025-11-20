// ------------------------------------
// MOBILE HEIGHT 
// ------------------------------------

let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
window.addEventListener('resize', () => {
  vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

// ------------------------------------
// DUAL SWIPER + HASH NAVIGATION 
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  const leftSlider = new Swiper('.swiper-left', {
    effect: 'fade',
    speed: 0,
    loop: true,
    allowTouchMove: false,
    fadeEffect: { crossFade: true }
  });

  const rightSlider = new Swiper('.swiper-right', {
    effect: 'fade',
    speed: 0,
    loop: true,
    allowTouchMove: false,
    fadeEffect: { crossFade: true }
  });

  // ------------------------------------
  // HASH NAVIGATION FOR SPREADS
  // ------------------------------------

  function getSlideNumber(swiper) {
    const active = swiper.slides[swiper.activeIndex];
    if (!active) return null;

    const label = active.getAttribute("aria-label"); // e.g. "7 / 50"
    if (!label) return null;

    const match = label.match(/^(\d+)\s*\//);
    return match ? parseInt(match[1], 10) : null;
  }

  function updateHashIfSpread() {
    const leftNum  = getSlideNumber(leftSlider);
    const rightNum = getSlideNumber(rightSlider);

    if (!leftNum || !rightNum) return;

    // Only update hash when BOTH match
    if (leftNum === rightNum) {
      const spread = leftNum;
      const newHash = "#" + spread;

      if (window.location.hash !== newHash) {
        history.replaceState(null, "", newHash);
      }
    }
  }

  // Run check on slide change
  leftSlider.on('slideChange', updateHashIfSpread);
  rightSlider.on('slideChange', updateHashIfSpread);

  // Initial check
  updateHashIfSpread();

// ------------------------------------
// LOAD SPREAD FROM HASH ON PAGE LOAD
// ------------------------------------

function goToHashSpread() {
  const hash = window.location.hash.replace("#", "");
  const num = parseInt(hash, 10);
  if (!num) return;

  const targetIndex = num - 1;

  // Ensure Swiper has completed its loop-setup before jumping
  leftSlider.once('init', () => {
    leftSlider.slideToLoop(targetIndex, 0, false);
  });
  rightSlider.once('init', () => {
    rightSlider.slideToLoop(targetIndex, 0, false);
  });

  // Fallback after everything is mounted
  setTimeout(() => {
    leftSlider.slideToLoop(targetIndex, 0, false);
    rightSlider.slideToLoop(targetIndex, 0, false);
  }, 150);
}

// Run AFTER Swiper has built its looped DOM
setTimeout(goToHashSpread, 200);

  const pattern = ['both', 'left', 'right', 'both', 'right', 'left'];
  let patternIndex = 0;

  function handlePattern(action, direction = 'next') {
    const method = direction === 'next' ? 'slideNext' : 'slidePrev';
    switch (action) {
      case 'right':
        rightSlider[method]();
        break;
      case 'left':
        leftSlider[method]();
        break;
      case 'both':
        leftSlider[method]();
        rightSlider[method]();
        break;
    }
  }

  function nextPatternSlide() {
    if (window.innerWidth <= 767) {
      leftSlider.slideNext();
    } else {
      const action = pattern[patternIndex % pattern.length];
      handlePattern(action, 'next');
      patternIndex = (patternIndex + 1) % pattern.length;
    }
    document.dispatchEvent(new Event('slideForward'));
  }

  function prevPatternSlide() {
    if (window.innerWidth <= 767) {
      leftSlider.slidePrev();
    } else {
      patternIndex = (patternIndex - 1 + pattern.length) % pattern.length;
      const action = pattern[patternIndex];
      handlePattern(action, 'prev');
    }
    document.dispatchEvent(new Event('slideBackward'));
  }

  // Click and key controls
  document.getElementById('nextSlide')?.addEventListener('click', nextPatternSlide);
  const leftEl = document.querySelector('.swiper-left');
  const rightEl = document.querySelector('.swiper-right');
  if (leftEl) leftEl.addEventListener('click', prevPatternSlide);
  if (rightEl) rightEl.addEventListener('click', nextPatternSlide);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextPatternSlide();
    else if (e.key === 'ArrowLeft') prevPatternSlide();
  });
});


// ------------------------------------
// Custom Cursor
// ------------------------------------

(() => {
  'use strict';

  const cursor = document.querySelector('.custom-cursor');
  const SELECTOR_ATTR = '[cursor-text]';
  const OFFSET = 8;
  const PAD = 8;
  let rafId = null;

  const showCursor = (text) => {
    cursor.textContent = text || '';
    cursor.style.opacity = text ? '1' : '0';
  };

  const positionAt = (x, y) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const r = cursor.getBoundingClientRect();

      let left = x + OFFSET;
      let top  = y + OFFSET;

      if (left + r.width + PAD > vw) left = x - r.width - OFFSET;
      if (top  + r.height + PAD > vh) top = y - r.height - OFFSET;

      left = Math.max(PAD, Math.min(left, vw - r.width - PAD));
      top  = Math.max(PAD, Math.min(top,  vh - r.height - PAD));

      cursor.style.transform = `translate(${left}px, ${top}px)`;
    });
  };

  document.addEventListener('mousemove', (e) =>
    positionAt(e.clientX, e.clientY)
  );

  /**
   * Helper: Determine the correct cursor text based on:
   * - If element has cursor-text normally
   * - If cursor-text="caption" AND user is hovering directly over a link inside it
   */
  const getCursorTextFrom = (node) => {
    const el = node?.closest?.(SELECTOR_ATTR);
    if (!el) return null;

    const baseText = el.getAttribute('cursor-text');

    // --- SPECIAL CASE FOR CAPTIONS ---
    if (baseText === 'caption') {
      // Only change to link URL if hovering the actual <a>
      const hoveredLink = node.closest?.('a');
      if (hoveredLink && el.contains(hoveredLink)) {
        return hoveredLink.getAttribute('href'); // or hoveredLink.innerText
      }

      // Otherwise: use the caption text
      return baseText;
    }

    // Default behaviour
    return baseText;
  };

  document.addEventListener('pointerover', (e) => {
    const txt = getCursorTextFrom(e.target);
    showCursor(txt);
  });

  document.addEventListener('pointerout', (e) => {
    const leaving = e.target.closest(SELECTOR_ATTR);
    if (!leaving) return;

    const entering = e.relatedTarget?.closest?.(SELECTOR_ATTR);
    if (!entering) showCursor('');
  });

})();

// ------------------------------------
// PAGE TURN SOUND EFFECTS
// ------------------------------------

  const pageTurnSounds = [
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4aa6e3e183997e3b564_page-turn-15.mp3',
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4aaa59c417c76eacac0_page-turn-16.mp3',
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4aaee627565cf4fc136_page-turn-11.mp3',
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4aa562e1c37ed6e1ee7_page-turn-13.mp3',
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4aa29960f1aa0ddc69a_page-turn-2.mp3',
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4aaaf21ec2101aef420_page-turn-14.mp3',
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4aa8ebf2e6c5ea0f943_page-turn-6.mp3',
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4aaae3e910af23248f7_page-turn-10.mp3',
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4aab45a1f270f6ae3e5_page-turn-7.mp3',
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4aad43bea7792cf77c0_page-turn-12.mp3',
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4a929960f1aa0ddc638_page-turn-1.mp3',
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4a9ae3e910af23248b4_page-turn-4.mp3',
    'https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/6908c4a9a094f3de2c0fc622_page-turn-3.mp3'
  ];

  function getRandomSound() {
    const randomIndex = Math.floor(Math.random() * pageTurnSounds.length);
    return pageTurnSounds[randomIndex];
  }


  function playRandomSound() {
    const sound = new Audio(getRandomSound());
    sound.volume = 0.35; // adjust volume 
    sound.play().catch(() => {

    });
  }

document.addEventListener('slideForward', playRandomSound);
  document.addEventListener('slideBackward', playRandomSound);

// ------------------------------------
// PLAY AUDIO ON HOVER 
// ------------------------------------

  document.querySelectorAll('[play-audio]').forEach(el => {
    let audio = null;
    el.addEventListener('mouseenter', () => {
      const src = el.getAttribute('play-audio');
      if (!src) return;
      audio = new Audio(src);
      audio.volume = 0.35; // volume adjustment
      audio.muted = window.SITE_MUTED || false; // Check global mute state
      audio.play().catch(() => {
      });
    });
    el.addEventListener('mouseleave', () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0; 
      }
    });
  });


// ------------------------------------
// GLOBAL MUTE / SOUND-TOGGLE 
// ------------------------------------

window.SITE_MUTED = false;

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("sound-toggle");
  const soundIcon = document.getElementById("sound-icon");
  
  if (!button || !soundIcon) {
    console.error("Elements not found:", { button, soundIcon });
    return;
  }
  
  // Create two SVG paths - one for sound, one for muted
  const svgNS = "http://www.w3.org/2000/svg";
  
  // GREEN speaker path (original)
  const pathSound = document.createElementNS(svgNS, "path");
  pathSound.setAttribute("id", "sound-path");
  pathSound.setAttribute("fill", "#23C552");
  pathSound.setAttribute("d", "M4.05,6.93c-.07-.04-.15-.09-.23-.17l-1.74-1.65s-.07-.04-.12-.04H.79c-.24,0-.43-.07-.57-.21s-.21-.34-.21-.6v-1.52c0-.26.07-.46.21-.6s.33-.21.57-.21h1.18c.05,0,.09-.01.12-.04L3.83.24c.09-.08.16-.14.23-.18s.15-.06.23-.06c.12,0,.22.04.3.13s.11.18.11.3v6.15c0,.12-.04.22-.11.3s-.17.12-.29.12c-.09,0-.17-.02-.25-.06ZM5.99,4.71c.24-.34.36-.74.36-1.22,0-.51-.12-.92-.36-1.22-.07-.09-.09-.18-.07-.28s.07-.18.16-.25c.07-.06.16-.08.26-.06s.18.07.24.15c.16.21.28.47.37.76s.13.59.13.9-.04.61-.13.91-.21.54-.37.75c-.07.08-.15.13-.24.15s-.18,0-.25-.06c-.19-.15-.22-.32-.09-.52ZM7.33,6.04c-.01-.1.01-.19.07-.28.23-.29.4-.63.52-1.03s.18-.81.18-1.24-.06-.83-.17-1.22-.29-.74-.51-1.06c-.06-.09-.08-.18-.07-.27s.06-.17.14-.24c.08-.06.17-.08.27-.06s.17.07.23.16c.27.39.48.81.62,1.27s.21.93.21,1.42c0,.52-.07,1.01-.22,1.47s-.35.87-.62,1.22c-.06.08-.13.13-.23.15s-.18,0-.27-.06c-.09-.05-.14-.13-.16-.23Z");
  pathSound.style.transition = "opacity 0.4s ease";
  pathSound.style.opacity = "1";
  
  // RED cross path (muted)
  const pathMuted = document.createElementNS(svgNS, "path");
  pathMuted.setAttribute("id", "muted-path");
  pathMuted.setAttribute("fill", "#F84F31");
  pathMuted.setAttribute("d", "M.09.55c-.06-.06-.09-.14-.09-.23S.03.16.09.09c.07-.06.14-.09.23-.09s.17.03.23.09l7.9,7.9c.06.06.09.14.09.23s-.03.17-.09.23c-.06.06-.14.09-.23.09s-.17-.03-.23-.09L.09.55ZM1.56,5.64c-.14-.14-.21-.34-.21-.6v-1.52c0-.13.03-.24.09-.35s.13-.17.21-.22h.11l4.24,4.22-.06.41s-.06.09-.11.12-.1.05-.17.05c-.09,0-.17-.02-.25-.06s-.15-.09-.23-.17l-1.74-1.65s-.07-.04-.12-.04h-1.18c-.24,0-.43-.07-.57-.21ZM5.18,1.03c.09-.08.16-.14.23-.18s.15-.06.24-.06c.12,0,.22.04.29.13s.11.18.11.3v3.62l-2.37-2.38,1.5-1.43Z");
  pathMuted.style.transition = "opacity 0.4s ease";
  pathMuted.style.opacity = "0";
  pathMuted.style.position = "absolute";
  pathMuted.style.top = "0";
  pathMuted.style.left = "0";
  
  // Clear existing content and add both paths
  soundIcon.innerHTML = "";
  soundIcon.appendChild(pathSound);
  soundIcon.appendChild(pathMuted);
  
  // Function to apply mute state to all media
  function applyMuteState(muted) {
    document.querySelectorAll("audio, video").forEach(el => {
      el.muted = muted;
    });
  }
  
  // Monitor for dynamically added audio/video elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === 'AUDIO' || node.nodeName === 'VIDEO') {
          node.muted = window.SITE_MUTED;
        }
        // Also check child nodes
        if (node.querySelectorAll) {
          node.querySelectorAll('audio, video').forEach(media => {
            media.muted = window.SITE_MUTED;
          });
        }
      });
    });
  });
  
  // Start observing the document for added audio/video elements
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Apply initial mute state to existing elements
  applyMuteState(window.SITE_MUTED);
  
  // Click handler
  button.addEventListener("click", () => {
    window.SITE_MUTED = !window.SITE_MUTED;
    
    // Crossfade between the two paths
    if (window.SITE_MUTED) {
      pathSound.style.opacity = "0";
      pathMuted.style.opacity = "1";
    } else {
      pathSound.style.opacity = "1";
      pathMuted.style.opacity = "0";
    }
    
    // Apply mute state to all current media
    applyMuteState(window.SITE_MUTED);
    
    console.log("Mute toggled:", window.SITE_MUTED);
  });
});

// ------------------------------------
// Top and Bottom Swipers
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  const topEl = document.querySelector(".top-swiper");
  const bottomEl = document.querySelector(".bottom-swiper");

  if (!topEl || !bottomEl) return;

  // Top Swiper
  new Swiper(topEl, {
 		direction: "horizontal",
    speed: 500,
    loop: true,
    centeredSlides: true,
    allowTouchMove: true,

    slidesPerView: 1,
    spaceBetween: 0,

    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },

    observer: true,
    observeParents: true,
  });

  // Bottom Swiper
  new Swiper(bottomEl, {
 		 direction: "horizontal",
     rtl: true,
    speed: 500,
    loop: true,
    centeredSlides: true,
    allowTouchMove: true,

    slidesPerView: 1,
    spaceBetween: 0,

    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
    },

    observer: true,
    observeParents: true,
  });

});

// ------------------------------------
// Overlay Fly Animation 
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Note: higher value will give a slower motion
  const FLY_SPEED_MULTIPLIER = 1;

  const flyers = document.querySelectorAll('[animation="fly"]');

  flyers.forEach(flyer => {
    const parent = flyer.closest('.swiper-slide');
    if (!parent) return;

    const w = parent.offsetWidth;
    const h = parent.offsetHeight;

    function random(min, max) {
      const delta = max - min;
      return (direction = 1) => (min + delta * Math.random()) * direction;
    }

    const randomX = random(-w * 0.5, w * 0.5);
    const randomY = random(-h * 0.3, h * 0.3);
    const randomAngle = random(-45, 45);
    const randomTime = random(6, 12);
    const randomTime2 = random(5, 8);

    const sides = ["top", "bottom", "left", "right"];
    const side = sides[Math.floor(Math.random() * sides.length)];
    let startX, startY;
    switch (side) {
      case "top": startX = Math.random() * w; startY = -200; break;
      case "bottom": startX = Math.random() * w; startY = h + 200; break;
      case "left": startX = -200; startY = Math.random() * h; break;
      case "right": startX = w + 200; startY = Math.random() * h; break;
    }

    gsap.set(flyer, { x: startX, y: startY, rotation: randomAngle() });

    function moveX(target, direction) {
      gsap.to(target, {
        duration: randomTime() * FLY_SPEED_MULTIPLIER,
        x: randomX(direction),
        ease: "sine.inOut",
        onComplete: moveX,
        onCompleteParams: [target, direction * -1]
      });
    }

    function moveY(target, direction) {
      gsap.to(target, {
        duration: randomTime() * FLY_SPEED_MULTIPLIER,
        y: randomY(direction),
        ease: "sine.inOut",
        onComplete: moveY,
        onCompleteParams: [target, direction * -1]
      });
    }

    function rotate(target, direction) {
      gsap.to(target, {
        duration: randomTime2() * FLY_SPEED_MULTIPLIER,
        rotation: randomAngle(direction),
        ease: "sine.inOut",
        onComplete: rotate,
        onCompleteParams: [target, direction * -1]
      });
    }

    moveX(flyer, 1);
    moveY(flyer, -1);
    rotate(flyer, 1);
  });
});

// ------------------------------------
// Overlay Drag Animation
// ------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const draggableElements = document.querySelectorAll('[animation="drag"]');
  const isMobile = window.matchMedia('(max-width: 767px)').matches;

  draggableElements.forEach((el) => {
    el.setAttribute('cursor-text', 'drag');

    let isDragging = false;
    let hasDragged = false;
    let startX, startY;
    let currentX = 0, currentY = 0;
    let currentRotation = 0;

    // Base styles
    Object.assign(el.style, {
      position: 'absolute',
      cursor: 'grab',
      touchAction: isMobile ? 'none' : 'auto',
      transform: 'translate3d(0, 0, 0) scale(1) rotate(0deg)',
      transition: 'transform 0.5s ease',
      willChange: 'transform',
      WebkitUserSelect: 'none',
      userSelect: 'none'
    });

    const randomRotation = () => {
      const angle = 5 + Math.random() * 5;
      const direction = Math.random() < 0.5 ? -1 : 1;
      return angle * direction;
    };

    const startDrag = (x, y) => {
      isDragging = true;
      hasDragged = false;
      el.style.cursor = 'grabbing';
      el.style.transition = 'none';
      el.style.pointerEvents = 'none';
      currentRotation = randomRotation();

      el.style.transform =
        `translate3d(${currentX}px, ${currentY}px, 0) scale(1.05) rotate(${currentRotation}deg)`;

      startX = x - currentX;
      startY = y - currentY;
    };

    const moveDrag = (x, y) => {
      if (!isDragging) return;

      const dx = x - (startX + currentX);
      const dy = y - (startY + currentY);

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;

      currentX = x - startX;
      currentY = y - startY;

      el.style.transform =
        `translate3d(${currentX}px, ${currentY}px, 0) scale(1.05) rotate(${currentRotation}deg)`;
    };

    const endDrag = () => {
      if (!isDragging) return;

      isDragging = false;
      el.style.cursor = 'grab';
      el.style.transition = 'transform 0.5s ease';
      el.style.pointerEvents = 'auto';

      el.style.transform =
        `translate3d(${currentX}px, ${currentY}px, 0) scale(1) rotate(0deg)`;

      // Prevent click after drag
      if (hasDragged) {
        const blockClick = (e) => {
          e.stopImmediatePropagation();
          e.preventDefault();
          document.removeEventListener('click', blockClick, true);
        };
        document.addEventListener('click', blockClick, true);
      }
    };

    const getClientPos = (e) =>
      e.touches && e.touches.length > 0
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };

    // Desktop
    if (!isMobile) {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startDrag(e.clientX, e.clientY);
      });

      document.addEventListener('mousemove', (e) =>
        moveDrag(e.clientX, e.clientY)
      );

      document.addEventListener('mouseup', endDrag);
    }

    // Mobile
    if (isMobile) {
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { x, y } = getClientPos(e);
        startDrag(x, y);
      }, { passive: false });

      document.addEventListener('touchmove', (e) => {
        const { x, y } = getClientPos(e);
        moveDrag(x, y);
      }, { passive: false });

      document.addEventListener('touchend', endDrag);
      document.addEventListener('touchcancel', endDrag);
    }

    // Click suppression
    el.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopImmediatePropagation();
      } else {
        e.stopPropagation();
      }
    });
  });
});

// ------------------------------------
// Carousel Auto Play
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll('[carousel="autoplay"]');

  carousels.forEach(carousel => {
    const images = carousel.querySelectorAll('.carousel-image');
    if (!images.length) return;

    let i = 0;
    images[i].classList.add('active');

    setInterval(() => {
      images[i].classList.remove('active');
      i = (i + 1) % images.length;
      images[i].classList.add('active');
    }, 2000);
  });
});

// ------------------------------------
// Overlay Position
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const randomOverlays = document.querySelectorAll('[overlay-position="random"]');
  
  randomOverlays.forEach(el => {
    const parent = el.offsetParent || document.body;
    const parentRect = parent.getBoundingClientRect();

    const elRect = el.getBoundingClientRect();

    const maxLeft = parentRect.width - elRect.width;
    const maxTop = parentRect.height - elRect.height;

    const left = Math.random() * maxLeft;
    const top = Math.random() * maxTop;

    el.style.position = "absolute";
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.transform = "none";
  });
});

// ------------------------------------
// Ovelerlay Rotation
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const rotatingItems = document.querySelectorAll("[overlay-rotation]");
  rotatingItems.forEach(el => {
    const deg = parseFloat(el.getAttribute("overlay-rotation"));
    if (!isNaN(deg)) {
      el.style.transform = `rotate(${deg}deg)`;
      el.style.transformOrigin = "center";
    }
  });
});

// ------------------------------------
// Contact Time
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const dateEl = document.querySelector(".date-text");
  const timeEl = document.querySelector(".time-text");

  function updateTime() {
    const now = new Date();

    // Format date: Wednesday, 12 November
    const dateString = now.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

    // Format time: 00:00 (24h)
    const timeString = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    dateEl.textContent = dateString;
    timeEl.textContent = timeString;
  }

  // Run immediately
  updateTime();

  // Update every second
  setInterval(updateTime, 1000);
});

// ------------------------------------
// Contact Modal Fade In
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const contactButton = document.getElementById("contact-button");
  const contactModal = document.getElementById("contact-modal");
  const contactClose = document.getElementById("close-button");

  // NEW: elements inside modal
  const contactWrapper = document.querySelector(".contact-container");
  const phoneWrapper = document.querySelector(".phone-wrapper");

  // Ensure starting state
  gsap.set(contactModal, { opacity: 0, pointerEvents: "none" });
  gsap.set(contactWrapper, { opacity: 0 });
  gsap.set(phoneWrapper, { opacity: 0, y: 10 });

  // Modal timeline
  const tl = gsap.timeline({ paused: true });

  tl.to(contactModal, {
    opacity: 1,
    duration: 0.1,
    pointerEvents: "auto",
    ease: "none",
  })

  // FIRST: fade in contact-wrapper
  .to(contactWrapper, {
    opacity: 1,
    y: 0,
    duration: 0.4,
    ease: "power2.out",
  })

  // SECOND: fade in phone-wrapper
  .to(phoneWrapper, {
    opacity: 1,
    y: 0,
    duration: 0.4,
    ease: "power2.out",
  })

  // onComplete after everything is visible
  .add(() => {
    document.dispatchEvent(new CustomEvent("contactModalOpened"));
  });

  // Open modal
  contactButton.addEventListener("click", () => {
    tl.play();
  });

  // Close modal (button)
  if (contactClose) {
    contactClose.addEventListener("click", () => {
      tl.reverse();
    });
  }

  // Close modal on Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tl.progress() > 0 && !tl.reversed()) {
      tl.reverse();
    }
  });
});

// ------------------------------------
// Contact Modal Notifications
// ------------------------------------

document.addEventListener("contactModalOpened", handleContactModal);

function handleContactModal() {
  document.removeEventListener("contactModalOpened", handleContactModal);

  const notificationsWrapper = document.querySelector(".notifications-list");
  const isMobile = window.matchMedia("(max-width: 767px)").matches;

// 		Notes:
// 		mobile: true     				(Show on mobile only)  
//		mobile: false						(Show on desktop only)  
//		mobile: null 						(Show everywhere)  

  const notifications = [
    {
      icon: "https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/69146bf74c1a7de6b9f73c8a_rkh-profile.jpg",
      sender: "Rodan Kane Hart",
      description: "Full website coming soon ⏳",
      link: null,
      animated: false,
      customClass: null,
      mobile: null
    },
    {
      icon: "https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/69146bf74c1a7de6b9f73c8a_rkh-profile.jpg",
      sender: "Rodan Kane Hart",
      description: "Click here to see process 📝",
      link: null,
      animated: true,
      customClass: "sketches-button",
      mobile: true
    },
    {
      icon: "https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/69146bf72c48dd508cbf7077_thefourth-logo.jpg",
      sender: "THE FOURTH",
      description: "or checkout THEFOURTH 🔗",
      link: "https://www.instagram.com/___thefourth___/",
      animated: false,
      customClass: null,
      mobile: null
    },
    {
      icon: "https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/69146bf7c75ae6d2b521a584_spaceby-logo.jpg",
      sender: "SPACE BY__",
      description: "and SPACE BY__ 🔗",
      link: "https://www.instagram.com/spaceby___/",
      animated: false,
      customClass: null,
      mobile: null
    },
    {
      icon: "https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/69146bf74c1a7de6b9f73c8a_rkh-profile.jpg",
      sender: "Rodan Kane Hart",
      description: "Tick tock Matthew Bradley... ⏰",
      link: "https://www.matthewbradley.info",
      animated: false,
      customClass: null,
      mobile: null
    }
  ];

  const notificationSound = new Audio(
    "https://cdn.prod.website-files.com/69045ba9ac3f8cc32ca5cded/691494a54949de5ef1480bd5_message-tone.mp3"
  );
  notificationSound.volume = 0.8;
  notificationSound.muted = window.SITE_MUTED || false;

  const normalizeUrl = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url.replace(/^\/\//, "")}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  function createNotification({ icon, sender, description, link, animated, customClass }) {

    const wrapper = link ? document.createElement("a") : document.createElement("div");
    wrapper.classList.add("notification-item");

    if (customClass) wrapper.classList.add(customClass);

    if (animated) wrapper.classList.add("animated", "gradient-border");
    
    if (link) {
      wrapper.href = normalizeUrl(link);
      wrapper.target = "_blank";
      wrapper.rel = "noopener noreferrer";
    }

    const iconDiv = document.createElement("div");
    iconDiv.classList.add("notification-icon");

    const img = document.createElement("img");
    img.classList.add("notification-image");
    img.src = icon;
    img.alt = `${sender} icon`;
    iconDiv.appendChild(img);

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("notification-content");

    const rowDiv = document.createElement("div");
    rowDiv.classList.add("notification-row");

    const senderText = document.createElement("div");
    senderText.classList.add("notification-text", "is-title");
    senderText.textContent = sender;

    const timeText = document.createElement("div");
    timeText.classList.add("notification-text", "is-time");
    timeText.textContent = getCurrentTime();

    rowDiv.appendChild(senderText);
    rowDiv.appendChild(timeText);

    const descriptionText = document.createElement("div");
    descriptionText.classList.add("notification-text", "is-description");
    descriptionText.textContent = description;

    contentDiv.appendChild(rowDiv);
    contentDiv.appendChild(descriptionText);

    wrapper.appendChild(iconDiv);
    wrapper.appendChild(contentDiv);

    return wrapper;
  }

  function animateIn(el) {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.willChange = "opacity, transform";
    el.style.transition = "all 0.4s ease";

    el.getBoundingClientRect();

    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });

    el.addEventListener("transitionend", () => {
      el.style.willChange = "";
    }, { once: true });
  }

  const staggerPattern = [1000, 2000, 1000, 1000, 3000];

  function showNotificationsStaggered(list) {
    let totalDelay = 500;

    list.forEach((notif, i) => {
      // --- MOBILE FILTERING LOGIC ---
      if (notif.mobile === true && !isMobile) return;   // mobile only
      if (notif.mobile === false && isMobile) return;   // desktop only
      // null/undefined → show everywhere

      const delay = staggerPattern[i] || (800 + Math.random() * 700);
      totalDelay += delay;

      setTimeout(() => {
        const el = createNotification(notif);
        notificationsWrapper.appendChild(el);

        notificationSound.muted = window.SITE_MUTED || false;
        notificationSound.currentTime = 0;
        notificationSound.play().catch(() => {});

        animateIn(el);
      }, totalDelay);
    });
  }

  showNotificationsStaggered(notifications);
}
// ------------------------------------
// Custom Buttons 
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const contactButton  = document.querySelector(".contact-button-container");
  const contactModal   = document.querySelector(".contact-modal");

  if (!contactButton || !contactModal) return;

  document.addEventListener("click", (e) => {
    const target = e.target.closest(".sketches-button");
    if (!target) return;

    gsap.to([contactButton, contactModal], {
      y: "-150%",
      opacity: 0,
      duration: 0.6,
      ease: "power3.inOut",
      onComplete: () => {
        contactButton.style.pointerEvents = "none";
        contactModal.style.pointerEvents = "none";
      }
    });
  });
});

// ------------------------------------
// Charger Animation Update
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const battery = document.querySelector(".is-battery");
  const charger = document.querySelector(".charger-wrapper");
  const redIcon = document.querySelector(".svg-icon.red");
  const phone = document.querySelector(".iphone-image");

  if (!battery || !charger || !redIcon || !phone) return;

  gsap.set(charger, { y: "200%" });

  const originalWidth = redIcon.getAttribute("width") || "10%";

  battery.setAttribute("cursor-text", "please charge");

  let isOpen = false;

  battery.addEventListener("click", () => {
    isOpen = !isOpen;

    gsap.to(charger, {
      y: isOpen ? "92%" : "200%",
      duration: 0.6,
      ease: "power3.out"
    });

    gsap.to(redIcon, { 
      fill: isOpen ? "#23C552" : "#f84f31",
      attr: { width: isOpen ? "70%" : originalWidth },
      duration: 10,
      ease: "power3.out"
    });

    gsap.to(phone, {
      filter: isOpen ? "brightness(1.25)" : "brightness(1)",
      duration: 10,
      ease: "power3.out",
      delay: 0.15
    });

    battery.setAttribute("cursor-text", isOpen ? "charging" : "please charge");
  });
});

// ------------------------------------
// Size Warning
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const sizeWarning = document.getElementById("sizeWarning");

  function checkSize() {
    const isDesktop = window.innerWidth >= 767;
    const tooShort = window.innerHeight < 650; // adjust this height

    if (isDesktop && tooShort) {
      sizeWarning.classList.add("show");
    } else {
      sizeWarning.classList.remove("show");
    }
  }

  checkSize();
  window.addEventListener("resize", checkSize);
});