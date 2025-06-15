(() => {
  // Cache DOM elements
  const doc = document.documentElement;
  const body = document.body;

  // Initialize base classes
  doc.classList.remove('no-js');
  doc.classList.add('js');

  // Animation configuration
  const animationConfig = {
    reveal: {
      duration: 600,
      distance: '20px',
      easing: 'cubic-bezier(0.5, -0.01, 0, 1.005)',
      origin: 'bottom',
      interval: 100
    },
    heroFigure: {
      duration: 400,
      easing: 'easeInOutExpo',
      perspective: '500px'
    }
  };

  // Initialize animations if enabled
  if (body.classList.contains('has-animations')) {
    try {
      initializeAnimations();
    } catch (error) {
      console.error('Animation initialization failed:', error);
      // Gracefully degrade by removing animation class
      body.classList.remove('has-animations');
    }
  }

  function initializeAnimations() {
    // Initialize ScrollReveal
    const sr = window.sr = ScrollReveal();
    
    // Reveal animations for features and pricing
    sr.reveal('.feature, .pricing-table-inner', animationConfig.reveal);

    doc.classList.add('anime-ready');

    // Hero figure animations
    initializeHeroFigures();
  }

  function initializeHeroFigures() {
    // Box 05 animation
    anime.timeline({
      targets: '.hero-figure-box-05'
    })
    .add({
      ...animationConfig.heroFigure,
      scaleX: [0.05, 0.05],
      scaleY: [0, 1],
      delay: anime.random(0, 400)
    })
    .add({
      duration: 400,
      easing: 'easeInOutExpo',
      scaleX: 1
    })
    .add({
      duration: 800,
      rotateY: '-15deg',
      rotateX: '8deg',
      rotateZ: '-1deg'
    });

    // Box 06 and 07 animation
    anime.timeline({
      targets: '.hero-figure-box-06, .hero-figure-box-07'
    })
    .add({
      ...animationConfig.heroFigure,
      scaleX: [0.05, 0.05],
      scaleY: [0, 1],
      delay: anime.random(0, 400)
    })
    .add({
      duration: 400,
      easing: 'easeInOutExpo',
      scaleX: 1
    })
    .add({
      duration: 800,
      rotateZ: '20deg'
    });

    // Other hero figures animation
    const otherBoxes = '.hero-figure-box-01, .hero-figure-box-02, .hero-figure-box-03, .hero-figure-box-04, .hero-figure-box-08, .hero-figure-box-09, .hero-figure-box-10';
    
    anime({
      targets: otherBoxes,
      duration: anime.random(600, 800),
      delay: anime.random(600, 800),
      rotate: [
        anime.random(-360, 360),
        (el) => el.getAttribute('data-rotation')
      ],
      scale: [0.7, 1],
      opacity: [0, 1],
      easing: 'easeInOutExpo'
    });
  }
})();
