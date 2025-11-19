// ------------------------------------
// MOBILE HEIGHT SCRIPT
// ------------------------------------
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
window.addEventListener('resize', () => {
  vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});


// ------------------------------------
// DUAL SWIPER + HASH NAVIGATION SCRIPT
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
// CUSTOM CURSOR SCRIPT
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
  // PAGE TURN SOUND EFFECTS

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
// PLAY AUDIO ON HOVER SCRIPT
// ------------------------------------
  // --- PLAY AUDIO ON HOVER SCRIPT ---
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
// GLOBAL MUTE / SOUND-TOGGLE SCRIPT
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
// INDEPENDENT TOP & BOTTOM SWIPERS
// ------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  const topEl = document.querySelector(".top-swiper");
  const bottomEl = document.querySelector(".bottom-swiper");

  if (!topEl || !bottomEl) return;

  // TOP SWIPER (independent)
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

  // BOTTOM SWIPER (independent)
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