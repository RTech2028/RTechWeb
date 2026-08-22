(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = document.querySelector("[data-nav]");
  const burger = document.querySelector("[data-burger]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const progress = document.querySelector("[data-scroll-progress]");

  const updateScrollState = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = scrollable > 0 ? window.scrollY / scrollable : 0;
    progress?.style.setProperty("transform", `scaleX(${Math.min(1, Math.max(0, percentage))})`);
    nav?.classList.toggle("is-scrolled", window.scrollY > 16);
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });

  const closeMobileMenu = () => {
    mobileMenu?.classList.remove("is-open");
    burger?.setAttribute("aria-expanded", "false");
    burger?.setAttribute("aria-label", "Abrir menú");
  };

  burger?.addEventListener("click", () => {
    const isOpen = mobileMenu?.classList.toggle("is-open") ?? false;
    burger.setAttribute("aria-expanded", String(isOpen));
    burger.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMobileMenu));

  const revealElements = document.querySelectorAll("[data-reveal]");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const delay = Number(element.getAttribute("data-reveal-delay") ?? 0);
        window.setTimeout(() => element.classList.add("is-visible"), delay);
        observer.unobserve(element);
      });
    }, { threshold: 0.12 });

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  const cursorDot = document.querySelector("[data-cursor-dot]");
  const cursorGlow = document.querySelector("[data-cursor-glow]");
  if (cursorDot && cursorGlow && window.matchMedia("(pointer: fine)").matches && !prefersReducedMotion) {
    window.addEventListener("pointermove", (event) => {
      cursorDot.style.left = `${event.clientX}px`;
      cursorDot.style.top = `${event.clientY}px`;
      cursorGlow.style.left = `${event.clientX}px`;
      cursorGlow.style.top = `${event.clientY}px`;
    }, { passive: true });
  } else {
    cursorDot?.remove();
    cursorGlow?.remove();
  }

  document.querySelectorAll("[data-tilt]").forEach((element) => {
    if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) return;
    element.addEventListener("pointermove", (event) => {
      const bounds = element.getBoundingClientRect();
      const rotateX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -4;
      const rotateY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 5;
      element.style.setProperty("--tilt-x", `${rotateX}deg`);
      element.style.setProperty("--tilt-y", `${rotateY}deg`);
      const inner = element.querySelector("[data-tilt-inner]");
      inner?.setAttribute("style", `transform: perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg);`);
    });
    element.addEventListener("pointerleave", () => {
      const inner = element.querySelector("[data-tilt-inner]");
      inner?.removeAttribute("style");
    });
  });

  const counters = document.querySelector("[data-counters]");
  const animateCounters = () => {
    counters?.querySelectorAll("[data-count]").forEach((counter) => {
      const target = Number(counter.getAttribute("data-count") ?? 0);
      const suffix = counter.getAttribute("data-suffix") ?? "";
      if (prefersReducedMotion) {
        counter.textContent = `${target.toLocaleString("es-AR")}${suffix}`;
        return;
      }
      const start = performance.now();
      const duration = 1100;
      const tick = (time) => {
        const progressValue = Math.min(1, (time - start) / duration);
        const eased = 1 - Math.pow(1 - progressValue, 3);
        counter.textContent = `${Math.round(target * eased).toLocaleString("es-AR")}${suffix}`;
        if (progressValue < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  if (counters && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      animateCounters();
      observer.disconnect();
    }, { threshold: 0.4 });
    counterObserver.observe(counters);
  } else {
    animateCounters();
  }

  const slider = document.querySelector("[data-slider]");
  const sliderTrack = slider?.querySelector("[data-slider-track]");
  const sliderDots = slider?.querySelector("[data-slider-dots]");
  const sliderItems = sliderTrack ? Array.from(sliderTrack.children) : [];
  let activeSlide = 0;

  if (slider && sliderTrack && sliderDots && sliderItems.length > 1) {
    sliderItems.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Ver opinión ${index + 1}`);
      dot.addEventListener("click", () => {
        activeSlide = index;
        sliderTrack.style.transform = `translateX(-${activeSlide * 100}%)`;
        sliderDots.querySelectorAll("button").forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === activeSlide));
      });
      sliderDots.appendChild(dot);
    });
    sliderDots.querySelector("button")?.classList.add("is-active");
  }

  document.querySelectorAll("[data-accordion] .faq__item").forEach((item) => {
    const button = item.querySelector(".faq__q");
    const answer = item.querySelector(".faq__a");
    button?.addEventListener("click", () => {
      const isOpen = item.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      if (answer) answer.setAttribute("aria-hidden", String(!isOpen));
    });
  });

  const form = document.querySelector("#contactForm");
  const formNote = document.querySelector("[data-form-note]");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!(form instanceof HTMLFormElement) || !form.checkValidity()) {
      formNote.textContent = "Completá los campos para enviar tu solicitud.";
      form?.reportValidity();
      return;
    }
    const formData = new FormData(form);
    const subject = encodeURIComponent("Solicitud de diagnóstico R-TECH");
    const body = encodeURIComponent([
      `Nombre: ${formData.get("nombre")}`,
      `Teléfono: ${formData.get("telefono")}`,
      `Email: ${formData.get("email")}`,
      `Mensaje: ${formData.get("mensaje")}`,
    ].join("\n"));
    window.location.href = `mailto:rtech.solucionesinformatica@gmail.com?subject=${subject}&body=${body}`;
    formNote.textContent = "Se abrió tu correo para completar el envío.";
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
