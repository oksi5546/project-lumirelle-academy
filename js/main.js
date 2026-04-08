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
const body = document.body;

/** Fallback if transitionend does not fire (matches .menu transform transition ~0.3s) */
const MENU_SCROLL_FALLBACK_MS = 400;

const scrollToElement = (targetEl) => {
  const top = targetEl.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: "smooth" });
};

const setMenuOpenState = (isOpen) => {
  if (!menu) return;
  menu.classList.toggle("is-open", isOpen);
  menuButton?.classList.toggle("active", isOpen);
  if (body) {
    body.style.overflow = isOpen ? "hidden" : "";
    body.style.touchAction = isOpen ? "none" : "";
  }
};

const closeMenuThenScroll = (targetEl) => {
  if (!menu || !targetEl) return;

  setMenuOpenState(false);

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
    const isOpen = !menu.classList.contains("is-open");
    setMenuOpenState(isOpen);
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

const sendRegistrationToTelegram = async ({ name, email, phone }) => {
  const cfg = window.TELEGRAM_CONFIG || {};
  const payload = { name, email, phone };

  if (cfg.proxyUrl) {
    const res = await fetch(cfg.proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || res.statusText);
    }
    return;
  }

  throw new Error("Configure TELEGRAM_CONFIG.proxyUrl");
};

const registrationForm = document.querySelector("#registration-form");
if (registrationForm) {
  const submitBtn = registrationForm.querySelector('button[type="submit"]');

  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(registrationForm);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();

    if (!name || !email) {
      window.alert("Please fill in name and email.");
      return;
    }

    const prevLabel = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    try {
      await sendRegistrationToTelegram({ name, email, phone });
      window.alert("Thank you! We will contact you soon.");
      registrationForm.reset();
    } catch (err) {
      console.error(err);
      window.alert(
        "Could not send the form. Check Telegram settings or try again later."
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        if (prevLabel) submitBtn.textContent = prevLabel;
      }
    }
  });
}
