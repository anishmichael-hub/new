(function () {
  'use strict';

  // Split headline text into per-letter spans for the rise-in animation
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var text = el.textContent;
    if (!el.hasAttribute('aria-hidden')) el.setAttribute('aria-label', text);
    el.textContent = '';
    Array.from(text).forEach(function (char, i) {
      var outer = document.createElement('span');
      outer.className = 'ch';
      outer.setAttribute('aria-hidden', 'true');
      var inner = document.createElement('span');
      inner.textContent = char === ' ' ? ' ' : char;
      inner.style.transitionDelay = (i * 55) + 'ms';
      outer.appendChild(inner);
      el.appendChild(outer);
    });
  });

  // Index children of stagger groups so CSS can delay each one
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    Array.from(group.children).forEach(function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  // Reveal on scroll
  var revealTargets = document.querySelectorAll('[data-reveal], [data-stagger], [data-split], .quake');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  }

  // Cover headline plays straight away
  requestAnimationFrame(function () {
    document.querySelectorAll('.cover [data-split]').forEach(function (el) { el.classList.add('in'); });
  });

  // Scroll progress + nav state
  var bar = document.querySelector('.progress span');
  var nav = document.querySelector('.nav');
  var lastY = window.scrollY;
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('hide', y > lastY && y > 400 && !menu.classList.contains('open'));
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  // Active nav link
  var links = document.querySelectorAll('.nav-links a');
  var groups = {
    introduction: ['introduction'],
    content: ['content', 'missing-piece', 'trikaya', 'pro-pilates', 'redwings', 'top', 'top-carousels', 'top-reels', 'top-team', 'mannr', 'mannr-reels', 'brandquake', 'brandquake-reels', 'golds-gym'],
    'other-projects': ['other-projects'],
    contact: ['contact']
  };
  if ('IntersectionObserver' in window) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        links.forEach(function (a) {
          var key = a.getAttribute('href').slice(1);
          a.classList.toggle('active', (groups[key] || []).indexOf(id) !== -1);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { navIo.observe(s); });
  }

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.nav-links');
  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    });
  });

  // Cover photo follows the pointer a little
  var cover = document.querySelector('.cover');
  var photo = document.querySelector('.cover-photo');
  if (window.matchMedia('(hover: hover)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cover.addEventListener('mousemove', function (e) {
      var r = cover.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      photo.style.transform = 'perspective(800px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg)';
    });
    cover.addEventListener('mouseleave', function () { photo.style.transform = ''; });
    photo.style.transition = 'transform .4s cubic-bezier(.2,.8,.2,1)';
  }

  // Only one video plays at a time
  var videos = document.querySelectorAll('video');
  videos.forEach(function (v) {
    v.addEventListener('play', function () {
      videos.forEach(function (o) { if (o !== v) o.pause(); });
    });
  });

  // Lightbox for images
  var images = Array.from(document.querySelectorAll('figure.card img, .strip img'));
  var lb = document.querySelector('.lightbox');
  var lbImg = lb.querySelector('img');
  var current = 0;
  var lastFocus = null;
  function show(i) {
    current = (i + images.length) % images.length;
    lbImg.src = images[current].src;
    lbImg.alt = images[current].alt;
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lightbox-close').focus();
  }
  function closeLb() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; }, 300);
    if (lastFocus) lastFocus.focus();
  }
  images.forEach(function (img, i) {
    var target = img.closest('figure') || img;
    target.setAttribute('tabindex', '0');
    target.setAttribute('role', 'button');
    target.setAttribute('aria-label', 'View larger: ' + img.alt);
    target.addEventListener('click', function () { openLb(i); });
    target.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); }
    });
  });
  lb.querySelector('.lightbox-close').addEventListener('click', closeLb);
  lb.querySelector('.prev').addEventListener('click', function () { show(current - 1); });
  lb.querySelector('.next').addEventListener('click', function () { show(current + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
})();
