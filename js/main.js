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

/** local@host.tld — латиниця, цифри, типові символи; TLD від 2 літер */
const REGISTRATION_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

const registrationEmailPasses = (value) => {
  const v = String(value || "").trim();
  return v.length > 0 && REGISTRATION_EMAIL_REGEX.test(v);
};

const registrationFieldPasses = (input) => {
  if (!input) return true;
  const fieldName = input.getAttribute("name");
  if (fieldName === "name") return input.value.trim().length > 0;
  if (fieldName === "email") return registrationEmailPasses(input.value);
  if (fieldName === "country") return input.value.trim().length > 0;
  return true;
};

const syncRegistrationLabelFromInput = (input) => {
  const label = input?.closest(".registration__label");
  if (!label) return;
  label.classList.toggle("error", !registrationFieldPasses(input));
};

const bindRegistrationFieldValidation = (form) => {
  if (!form) return;
  form
    .querySelectorAll(
      'input[name="name"], input[name="email"], input[name="country"]',
    )
    .forEach((input) => {
      input.addEventListener("invalid", () => {
        input.closest(".registration__label")?.classList.add("error");
      });
      input.addEventListener("input", () =>
        syncRegistrationLabelFromInput(input),
      );
      input.addEventListener("change", () =>
        syncRegistrationLabelFromInput(input),
      );
    });
};

const countryBtn = document.querySelector(".registration__country-button");
const countryList = document.querySelector(".registration__country-list");
const countryInput = document.querySelector(".registration__input--country");

if (countryBtn && countryList) {
  const setCountryDropdownOpen = (open) => {
    countryList.classList.toggle("is-open", open);
    countryBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  countryBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setCountryDropdownOpen(!countryList.classList.contains("is-open"));
  });

  countryList.addEventListener("click", (e) => {
    const item = e.target.closest(".registration__country-item");
    if (!item || !countryInput) return;
    e.stopPropagation();
    countryInput.value = item.textContent.trim();
    syncRegistrationLabelFromInput(countryInput);
    setCountryDropdownOpen(false);
  });

  document.addEventListener("click", () => {
    setCountryDropdownOpen(false);
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

const sendRegistrationToTelegram = async ({ name, email, phone, country }) => {
  const cfg = window.TELEGRAM_CONFIG || {};
  const payload = { name, email, phone, country };

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
  bindRegistrationFieldValidation(registrationForm);

  const submitBtn = registrationForm.querySelector('button[type="submit"]');

  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = registrationForm.querySelector('[name="name"]');
    const emailInput = registrationForm.querySelector('[name="email"]');
    const countryField = registrationForm.querySelector('[name="country"]');

    [nameInput, emailInput, countryField].forEach((input) => {
      if (input) syncRegistrationLabelFromInput(input);
    });

    if (registrationForm.querySelector(".registration__label.error")) {
      return;
    }

    const fd = new FormData(registrationForm);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const country = String(fd.get("country") || "").trim();

    if (!name || !registrationEmailPasses(email) || !country) {
      return;
    }

    const prevLabel = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    try {
      await sendRegistrationToTelegram({ name, email, phone, country });
      registrationForm.reset();
      registrationForm
        .querySelectorAll(".registration__label.error")
        .forEach((el) => el.classList.remove("error"));
    } catch (err) {
      console.error(err);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        if (prevLabel) submitBtn.textContent = prevLabel;
      }
    }
  });
}
