try {
  new Swiper(".results__swiper", {
    loop: true,

    navigation: {
      nextEl: ".results__btn--next",
      prevEl: ".results__btn--prev",
    },

    spaceBetween: 30,
  });
} catch (err) {
  console.warn("Swiper init:", err);
}

try {
  new Accordion(".accordion-container", {
    openOnInit: [0],
  });
} catch (err) {
  console.warn("Accordion init:", err);
}

const phoneInput = document.querySelector(".registration__input--phone");
if (phoneInput) {
  const syncPhoneMask = () => {
    const digits = phoneInput.value.replace(/\D/g, "");
    if (!digits) {
      phoneInput.value = document.activeElement === phoneInput ? "+" : "";
    } else {
      phoneInput.value = "+" + digits;
    }
  };

  phoneInput.addEventListener("input", syncPhoneMask);

  phoneInput.addEventListener("focus", () => {
    if (phoneInput.value === "") {
      phoneInput.value = "+";
      requestAnimationFrame(() => {
        const end = phoneInput.value.length;
        phoneInput.setSelectionRange(end, end);
      });
    }
  });

  phoneInput.addEventListener("blur", () => {
    if (phoneInput.value === "+") {
      phoneInput.value = "";
    }
  });
}

const menuButton = document.querySelector(".menu-button");
const menu = document.querySelector(".menu");

/** Fallback if transitionend does not fire (matches .menu transform transition ~0.3s) */
const MENU_SCROLL_FALLBACK_MS = 400;

const scrollToElement = (targetEl) => {
  const top = targetEl.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: "smooth" });
};

const closeMenuThenScroll = (targetEl) => {
  if (!menu || !targetEl) return;

  menu.classList.remove("is-open");
  menuButton?.classList.remove("active");

  let scrolled = false;
  const runScroll = () => {
    if (scrolled) return;
    scrolled = true;
    scrollToElement(targetEl);
  };

  const onTransitionEnd = (e) => {
    if (e.propertyName !== "transform") return;
    menu.removeEventListener("transitionend", onTransitionEnd);
    clearTimeout(fallbackId);
    runScroll();
  };

  menu.addEventListener("transitionend", onTransitionEnd);
  const fallbackId = window.setTimeout(() => {
    menu.removeEventListener("transitionend", onTransitionEnd);
    runScroll();
  }, MENU_SCROLL_FALLBACK_MS);
};

if (menuButton && menu) {
  menuButton.addEventListener("click", () => {
    menu.classList.toggle("is-open");
    menuButton.classList.toggle("active");
  });
}

const bindMenuNav = (buttonSelector, targetSelector) => {
  const btn = document.querySelector(buttonSelector);
  const target = document.querySelector(targetSelector);
  if (btn && target) {
    btn.addEventListener("click", () => {
      closeMenuThenScroll(target);
    });
  }
};

bindMenuNav(".menu__button--about", "#about");
bindMenuNav(".menu__button--course", "#course");
/** No separate sign-in page yet — same block as registration */
bindMenuNav(".menu__button--sign-in", "#registration");
bindMenuNav(".menu__button--contacts", "#contacts");
bindMenuNav(".menu__button--registration", "#registration");
