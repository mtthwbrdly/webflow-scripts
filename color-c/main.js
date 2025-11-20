// ------------------------------------
//  Global Script Registry
// ------------------------------------

window.pageScripts = window.pageScripts || [];

window.registerPageScript = function (fn) {
  if (typeof fn === "function") {
    window.pageScripts.push(fn);
  }
};

function runPageScripts(container) {
  window.pageScripts.forEach(fn => {
    try {
      fn(container);
    } catch (e) {
      console.warn("Page script error:", e);
    }
  });
}

// ------------------------------------
//   Lenis Smooth Scroll
// ------------------------------------

window.initLenis = function () {
  if (window.lenis && window.lenis.destroy) {
    window.lenis.destroy();
  }

  window.lenis = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 0.8,
    gestureOrientation: "vertical",
    normalizeWheel: false,
    smoothTouch: false
  });

  function raf(time) {
    window.lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  if (window.jQuery) {
    $("[data-lenis-start]").off().on("click", () => window.lenis.start());
    $("[data-lenis-stop]").off().on("click", () => window.lenis.stop());
    $("[data-lenis-toggle]").off().on("click", function () {
      $(this).toggleClass("stop-scroll");
      $(this).hasClass("stop-scroll")
        ? window.lenis.stop()
        : window.lenis.start();
    });
  }
};

// ------------------------------------
//   Webflow IX2 Reinitialization
// ------------------------------------

window.registerPageScript(function () {
  if (window.Webflow && window.Webflow.require) {
    window.Webflow.destroy();
    window.Webflow.ready();

    const ix2 = window.Webflow.require("ix2");
    if (ix2 && ix2.init) ix2.init();
  }
});

// ------------------------------------
//   Lenis Auto-Init
// ------------------------------------

window.registerPageScript(function () {
  if (window.Lenis) {
    window.initLenis();
  }
});

// ------------------------------------
//   Parallax Header Image
// ------------------------------------

window.registerPageScript(function (container) {
  if (!window.gsap || !window.ScrollTrigger || !window.lenis) return;

  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.getAll().forEach(st => st.kill());

  if (!window.lenisScrollerProxySetup) {
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length) {
          window.lenis.scrollTo(value, { immediate: true });
        } else {
          return window.lenis.animatedScroll;
        }
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight
        };
      }
    });

    window.lenis.on("scroll", ScrollTrigger.update);
    
    window.lenisScrollerProxySetup = true;
  }

  const scope = container || document;
  const img = scope.querySelector(".header_cover-image");
  if (!img) return;

  const wrapper = img.closest(".header_cover-wrapper") || img;

  gsap.to(img, {
    yPercent: 15,
    ease: "none",
    scrollTrigger: {
      trigger: wrapper,
      start: "top top",
      end: "bottom top",
      scrub: true,
      scroller: document.body
    }
  });

  gsap.delayedCall(0.1, () => ScrollTrigger.refresh());
});

// ------------------------------------
//   Next Project CMS Script
// ------------------------------------

window.registerPageScript(function () {
  if (!window.jQuery) return;

  $("[tr-cmsnext-element='component']").each(function () {
    const componentEl = $(this);
    const cmsListEl = componentEl.find(".w-dyn-items").first();
    const cmsItemEl = cmsListEl.children();

    let currentItemEl = null;
    let noResultEl = componentEl.find("[tr-cmsnext-element='no-result']");

    cmsItemEl.each(function () {
      if ($(this).find(".w--current").length) {
        currentItemEl = $(this);
      }
    });

    if (!currentItemEl) return;

    let nextItemEl = currentItemEl.next();
    let prevItemEl = currentItemEl.prev();

    if (componentEl.attr("tr-cmsnext-loop") === "true") {
      if (!nextItemEl.length) nextItemEl = cmsItemEl.first();
      if (!prevItemEl.length) prevItemEl = cmsItemEl.last();
    }

    let displayEl = nextItemEl;
    if (componentEl.attr("tr-cmsnext-showprev") === "true") {
      displayEl = prevItemEl;
    }

    if (componentEl.attr("tr-cmsnext-showall") === "true") {
      prevItemEl.addClass("is-prev");
      currentItemEl.addClass("is-current");
      nextItemEl.addClass("is-next");
      return;
    }

    cmsItemEl.not(displayEl).remove();

    if (!displayEl.length) {
      noResultEl.show();
      if (componentEl.attr("tr-cmsnext-hideempty") === "true") {
        componentEl.hide();
      }
    }
  });
});

// ------------------------------------
//   Barba Page Transitions
// ------------------------------------

document.addEventListener("DOMContentLoaded", function () {
  if (window.barba && window.barba.use && window.barbaPrefetch) {
    barba.use(barbaPrefetch);
  }

  barba.init({
    prevent: ({ el }) => {
      if (el && el.hasAttribute("data-barba-prevent")) return true;
      if (el && el.getAttribute("href")?.startsWith("#")) return true;
      return false;
    },

    transitions: [
      {
        name: "default-transition",

        async leave(data) {
          const done = this.async();

          await gsap.to(data.current.container, {
            opacity: 0,
            duration: 1,
            ease: "power2.out"
          });

          gsap.killTweensOf("*");
          if (window.ScrollTrigger) {
            ScrollTrigger.getAll().forEach(st => st.kill());
          }

          done();
        },

        async enter(data) {
          window.scrollTo(0, 0);
          if (window.lenis) {
            window.lenis.stop();
            window.lenis.scrollTo(0, { immediate: true });
            window.lenis.start();
          }

          gsap.fromTo(
            data.next.container,
            { opacity: 0 },
            { opacity: 1, duration: 1, ease: "power2.out" }
          );

          runPageScripts(data.next.container);
        },

        async once(data) {
          runPageScripts(data.next.container);
        }
      }
    ]
  });
});

// ------------------------------------
//   Menu Open/Close Animation
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  function initMenu() {

    const menuWrapper   = document.querySelector(".menu_wrapper");
    const menuButton    = document.querySelector(".menu_button");
    const menuLinks     = document.querySelectorAll(".menu-link");
    const menuContainer = document.querySelector(".menu_container");

    function setMenuOpen() {
      menuButton.textContent = "Close";
      menuButton.style.color = "var(--mid-grey)";
    }

    function setMenuClosed() {
      menuButton.textContent = "Menu";
      menuButton.style.color = "";
    }

    if (!menuWrapper || !menuButton) return;

    gsap.set(menuWrapper, { 
      opacity: 0,
      clipPath: "circle(0px at var(--cx) var(--cy))"
    });

    gsap.set(menuLinks, { opacity: 0, y: 10 });

    menuContainer.style.pointerEvents = "none";
    menuWrapper.style.pointerEvents = "none";

    function updateButtonOrigin() {
      const rect = menuButton.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      menuWrapper.style.setProperty("--cx", cx + "px");
      menuWrapper.style.setProperty("--cy", cy + "px");
    }

    updateButtonOrigin();
    window.addEventListener("resize", updateButtonOrigin);

    function computeMaxRadius() {
      return Math.hypot(window.innerWidth, window.innerHeight);
    }

    const tlMenu = gsap.timeline({
      paused: true,
      reversed: true
    });

    tlMenu
      .to(menuWrapper, {
        opacity: 1,
        duration: 0.1,
        onStart: () => {
          menuContainer.style.pointerEvents = "auto";
          menuWrapper.style.pointerEvents = "auto";
        }
      })    
      .to(menuWrapper, {
        clipPath: () =>
          `circle(${computeMaxRadius()}px at var(--cx) var(--cy))`,
        duration: 1.1,
        ease: "power3.inOut"
      })     
      .to(menuButton, {
        color:"var(--mid-grey)",
        duration: 0.5,
        ease: "power3.inOut"
        }, "<")
      .to(menuLinks, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: "power2.out"
      }, "-=0.4")
      .eventCallback("onReverseComplete", () => {
        menuContainer.style.pointerEvents = "none";
        menuWrapper.style.pointerEvents = "none";
      });

    function toggleMenu() {
      const isOpening = tlMenu.reversed(); 
      tlMenu.reversed() ? tlMenu.play() : tlMenu.reverse();
      isOpening ? setMenuOpen() : setMenuClosed();
    }
    
    menuButton.removeEventListener("click", toggleMenu);
    menuButton.addEventListener("click", toggleMenu);

    function escClose(e) {
      if (e.key === "Escape" && !tlMenu.reversed()) {
        tlMenu.reverse();
        setMenuClosed();
      }
    }

    document.removeEventListener("keydown", escClose);
    document.addEventListener("keydown", escClose);

    menuLinks.forEach(link => {
      link.removeEventListener("click", link.__menuHandler);
      link.__menuHandler = () => {
        if (!tlMenu.reversed()) tlMenu.reverse();
        setMenuClosed();
      };
      link.addEventListener("click", link.__menuHandler);
    });
  }

  barba.hooks.after(() => {
    initMenu();
    const menuButton = document.querySelector(".menu_button");
    if (menuButton) setMenuClosed();
  });

  initMenu();

});

// ------------------------------------
//   Hero Text & Logo Animation
// ------------------------------------

window.registerPageScript(function (container) {

  const scope = container || document;  

  const title = scope.querySelector(".heading-style_hero");
  const logo  = scope.querySelector("#hero-logo");

  if (!title || !logo) return;

  const raw = title.textContent.trim();
  if (!raw) return; 

  // Split into words
  const words = raw.split(" ");
  title.innerHTML = words.map(w => `<span class="hero-word">${w}</span>`).join(" ");

  const wordEls = title.querySelectorAll(".hero-word");

  // Starting states
  gsap.set(wordEls, { y: 15, opacity: 0, visibility: "visible" });
  gsap.set(title,   { scale: 1.2, opacity: 1, transformOrigin: "center center" });
  gsap.set(logo,    { y: "20%", scale: 0.15, opacity: 0, transformOrigin: "top center", visibility: "visible" });

const tl = gsap.timeline({ delay: 2 });

tl
  .to(wordEls, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    stagger: 0.25,
    ease: "power3.out"
  })

  .to(logo, {
    opacity: 1,
    duration: 0.6,
    ease: "power2.out"
  }, ">")   // Note:  "<" is sync with previous, ">" is start after previous ends

  .to(title, {
    scale: 1,
    duration: 1.2,
    ease: "power3.inOut"
  }, "scale")

  .to(logo, {
    y: 0,
    scale: 1,
    duration: 1.2,
    ease: "power3.inOut"
  }, "scale");
  
});


// ------------------------------------
//   Menu Button Colour Detection
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  const menuButton = document.querySelector(".menu_button");
  if (!menuButton) return;

  function checkOverlapWithImage() {
    const btnRect = menuButton.getBoundingClientRect();
    const images = document.querySelectorAll("img, .header_cover-image");

    let isOnImage = false;

    images.forEach(img => {
      const imgRect = img.getBoundingClientRect();

      const overlap =
        btnRect.left < imgRect.right &&
        btnRect.right > imgRect.left &&
        btnRect.top < imgRect.bottom &&
        btnRect.bottom > imgRect.top;

      if (overlap) isOnImage = true;
    });

    menuButton.style.color = isOnImage ? "white" : "var(--light-grey)";
  }

  checkOverlapWithImage();
  window.addEventListener("scroll", checkOverlapWithImage);
  window.addEventListener("resize", checkOverlapWithImage);

});

// ------------------------------------
//   Client Thumbnails Reveal
// ------------------------------------

window.registerPageScript(function () {
  const clientItems = document.querySelectorAll(".clients_item");
  const displayThumbnail = document.querySelector(".clients_thumbnail");

  if (!clientItems.length || !displayThumbnail) return;

  // Remove any previously attached listeners to avoid duplication
  clientItems.forEach((item) => {
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
  });

  // Re-select after clone
  const freshClientItems = document.querySelectorAll(".clients_item");

  freshClientItems.forEach((item) => {
    const refImg = item.querySelector(".clients-thumbnail-reference");
    if (!refImg) return;

    const imageUrl = refImg.src;

    item.addEventListener("mouseenter", () => {
      displayThumbnail.src = imageUrl;
      displayThumbnail.style.opacity = "1";
    });

    item.addEventListener("mouseleave", () => {
      displayThumbnail.style.opacity = "0";
    });
  });
});