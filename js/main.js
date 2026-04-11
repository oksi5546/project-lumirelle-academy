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

function initRegistrationIntlPhone() {
  const root = document.getElementById("registration-phone-root");
  if (
    !root ||
    !window.intlTelInputUtils ||
    !window.intlTelInput ||
    typeof window.IMask !== "function"
  ) {
    return;
  }
  if (root.dataset.intlPhoneInit === "1") return;
  root.dataset.intlPhoneInit = "1";

  const utils = window.intlTelInputUtils;
  const intlTelInput = window.intlTelInput;
  const IMask = window.IMask;
  const { E164 } = utils.numberFormat;

  const countries = intlTelInput
    .getCountryData()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "en"));

  const defaultCountry =
    countries.find((c) => c.iso2 === "ua") || countries[0] || null;
  if (!defaultCountry) return;

  let selected = {
    iso2: defaultCountry.iso2,
    dialCode: defaultCountry.dialCode,
    name: defaultCountry.name,
  };

  const row = document.createElement("div");
  row.className = "registration__phone-row";

  const codeWrap = document.createElement("div");
  codeWrap.className = "registration__phone-code";

  const codeBtn = document.createElement("button");
  codeBtn.type = "button";
  codeBtn.className = "registration__phone-code-button";
  codeBtn.setAttribute("aria-expanded", "false");
  codeBtn.setAttribute("aria-haspopup", "listbox");
  codeBtn.setAttribute("aria-controls", "registration-phone-code-list");

  const flagEl = document.createElement("span");
  flagEl.className = `registration__phone-flag iti__flag iti__${selected.iso2}`;
  flagEl.setAttribute("aria-hidden", "true");

  const caret = document.createElement("img");
  caret.src = "public/icons/prapor.svg";
  caret.alt = "";
  caret.className = "registration__phone-caret";

  const dialSpan = document.createElement("span");
  dialSpan.className = "registration__phone-dial p17";
  dialSpan.textContent = `+${selected.dialCode}`;

  codeBtn.append(flagEl, caret, dialSpan);

  const list = document.createElement("div");
  list.className = "registration__phone-code-list";
  list.id = "registration-phone-code-list";
  list.setAttribute("role", "listbox");

  const searchWrap = document.createElement("div");
  searchWrap.className = "registration__phone-code-search-wrap";
  const searchIcon = document.createElement("img");
  searchIcon.src = "public/icons/search.svg";
  searchIcon.alt = "";
  searchIcon.className = "registration__phone-code-search-icon";
  searchIcon.setAttribute("aria-hidden", "true");
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.setAttribute("inputmode", "search");
  searchInput.className = "registration__phone-code-search p17";
  searchInput.placeholder = "Country or code";
  searchInput.setAttribute("autocomplete", "off");
  searchInput.setAttribute(
    "aria-label",
    "Search country by name or calling code",
  );
  searchWrap.append(searchIcon, searchInput);

  const listScroll = document.createElement("div");
  listScroll.className = "registration__phone-code-list-scroll";

  for (const c of countries) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "registration__phone-code-item";
    item.dataset.iso2 = c.iso2;
    item.setAttribute("role", "option");

    const f = document.createElement("span");
    f.className = `iti__flag iti__${c.iso2}`;
    f.setAttribute("aria-hidden", "true");

    const nameSpan = document.createElement("span");
    nameSpan.className = "registration__phone-code-item-name";
    nameSpan.textContent = c.name;

    const dial = document.createElement("span");
    dial.className = "registration__phone-code-item-dial";
    dial.textContent = `+${c.dialCode}`;

    item.append(f, nameSpan, dial);
    listScroll.appendChild(item);
  }

  list.append(searchWrap, listScroll);

  const normalizeForSearch = (s) => {
    let x = String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    try {
      x = x.normalize("NFD").replace(/\p{M}/gu, "");
    } catch {
      /* старі браузери без Unicode property escapes */
    }
    return x.replace(/[''`’]/g, "");
  };

  const phoneSearchSynonymPhrase = {
    us: "united states",
    usa: "united states",
    america: "united states",
    uk: "united kingdom",
    britain: "united kingdom",
    england: "united kingdom",
    uae: "united arab emirates",
    emirates: "united arab emirates",
    holland: "netherlands",
  };

  /** Рядок схожий лише на код (цифри / + / пробіли) — фільтр по префіксу dialCode */
  const queryLooksLikeDialOnly = (trimmed) => {
    const d = trimmed.replace(/\D/g, "");
    if (!d) return false;
    return !/[^\d\s+]/.test(trimmed);
  };

  const countryMatchesFilter = (c, trimmed) => {
    if (!trimmed) return true;
    const qNorm = normalizeForSearch(trimmed);
    const qDigits = trimmed.replace(/\D/g, "");
    const nameNorm = normalizeForSearch(c.name);
    const dialStr = String(c.dialCode);
    const words = nameNorm.split(/[\s,-]+/).filter(Boolean);

    if (/^[a-z]{2}$/i.test(trimmed) && c.iso2.toLowerCase() === trimmed.toLowerCase()) {
      return true;
    }

    if (queryLooksLikeDialOnly(trimmed)) {
      return dialStr.startsWith(qDigits) || qDigits.startsWith(dialStr);
    }

    if (nameNorm.startsWith(qNorm)) return true;
    if (words.some((w) => w.startsWith(qNorm))) return true;

    const synPhrase = phoneSearchSynonymPhrase[qNorm];
    if (synPhrase && nameNorm.includes(synPhrase)) return true;

    for (const [alias, phrase] of Object.entries(phoneSearchSynonymPhrase)) {
      if (alias.startsWith(qNorm) && nameNorm.includes(phrase)) return true;
    }

    return false;
  };

  const applyCountryFilter = (raw) => {
    const trimmed = String(raw || "").trim();
    for (const item of listScroll.querySelectorAll(
      ".registration__phone-code-item",
    )) {
      const iso = item.dataset.iso2;
      const c = countries.find((x) => x.iso2 === iso);
      if (!c) continue;
      const show = countryMatchesFilter(c, trimmed);
      item.hidden = !show;
      item.setAttribute("aria-hidden", show ? "false" : "true");
    }
  };

  const national = document.createElement("input");
  national.type = "tel";
  national.className = "registration__phone-national p17";
  national.setAttribute("inputmode", "tel");
  national.setAttribute("autocomplete", "tel-national");

  const hidden = document.createElement("input");
  hidden.type = "hidden";
  hidden.name = "phone";
  hidden.value = "";

  codeWrap.append(codeBtn, list);
  row.append(codeWrap, national);
  root.append(row, hidden);

  /**
   * Маска номера (IMask / шаблони нижче) — лише для вводу й розмітки поля.
   * Валідація форми не змінює mask, lazy чи обробник accept — див. registrationPhonePasses + input на national.
   *
   * intl-tel-input getCountryData() не містить рядка маски — шаблон беремо з libphonenumber
   * (getExampleNumber) і передаємо в IMask: «0» = одна цифра, решта — літерали () - пробіл.
   */
  const NATIONAL_MASK_PATTERN_OVERRIDES = {
    ua: "(00)000-00-00",
  };

  const getNationalExampleString = (iso) => {
    try {
      let ex = utils.getExampleNumber(
        iso,
        true,
        utils.numberType.MOBILE,
        false,
      );
      if (!ex) {
        ex = utils.getExampleNumber(
          iso,
          true,
          utils.numberType.FIXED_LINE_OR_MOBILE,
          false,
        );
      }
      return ex ? String(ex) : "";
    } catch {
      return "";
    }
  };

  const getImaskPatternForIso = (iso) => {
    if (NATIONAL_MASK_PATTERN_OVERRIDES[iso]) {
      return NATIONAL_MASK_PATTERN_OVERRIDES[iso];
    }
    const ex = getNationalExampleString(iso);
    const p = ex.replace(/\d/g, "0");
    return p.length > 0 ? p : "000000000000000";
  };

  let phoneMask = null;

  const buildInternationalDigits = (digits) => {
    const dc = String(selected.dialCode);
    let d = digits.replace(/\D/g, "");
    if (selected.iso2 === "ua" && d.startsWith("0")) {
      d = d.slice(1);
    }
    return `+${dc}${d}`;
  };

  const syncPhoneHidden = () => {
    const digits = phoneMask?.unmaskedValue ?? "";
    if (!digits) {
      hidden.value = "";
      return;
    }
    const full = buildInternationalDigits(digits);
    let e164 = "";
    try {
      e164 = utils.formatNumber(full, selected.iso2, E164);
    } catch {
      e164 = full.replace(/\s/g, "");
    }
    hidden.value = e164;

    if (window.__DEBUG_REGISTRATION_PHONE) {
      console.log("[registration phone]", {
        country: selected.iso2,
        dialCode: selected.dialCode,
        imaskUnmasked: digits,
        fullInternational: full,
        hiddenInputE164: e164,
        imaskPattern: getImaskPatternForIso(selected.iso2),
      });
    }
  };

  const setupNationalImask = () => {
    if (phoneMask) {
      phoneMask.destroy();
      phoneMask = null;
    }
    const pattern = getImaskPatternForIso(selected.iso2);
    phoneMask = IMask(national, {
      mask: pattern,
      lazy: false,
    });
    phoneMask.on("accept", syncPhoneHidden);
    syncPhoneHidden();
  };

  const updatePlaceholder = () => {
    national.placeholder = "";
  };

  const setPhoneCodeOpen = (open) => {
    list.classList.toggle("is-open", open);
    codeBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      searchInput.value = "";
      applyCountryFilter("");
      requestAnimationFrame(() => searchInput.focus());
    } else {
      searchInput.value = "";
      applyCountryFilter("");
    }
  };

  const selectCountry = (c) => {
    if (!c) return;
    selected = { iso2: c.iso2, dialCode: c.dialCode, name: c.name };
    dialSpan.textContent = `+${c.dialCode}`;
    flagEl.className = `registration__phone-flag iti__flag iti__${c.iso2}`;
    hidden.value = "";
    hidden.dataset.phoneIso2 = selected.iso2;
    setupNationalImask();
    updatePlaceholder();
    setPhoneCodeOpen(false);
  };

  codeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setPhoneCodeOpen(!list.classList.contains("is-open"));
  });

  list.addEventListener("click", (e) => {
    const item = e.target.closest(".registration__phone-code-item");
    if (!item) return;
    e.stopPropagation();
    const iso = item.dataset.iso2;
    const c = countries.find((x) => x.iso2 === iso);
    selectCountry(c);
  });

  const runCountrySearch = () => applyCountryFilter(searchInput.value);
  searchInput.addEventListener("input", runCountrySearch);
  searchInput.addEventListener("keyup", runCountrySearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.preventDefault();
  });

  document.addEventListener("click", (e) => {
    if (!codeWrap.contains(e.target)) setPhoneCodeOpen(false);
  });

  const form = root.closest("form");
  form?.addEventListener("reset", () => {
    selectCountry(defaultCountry);
  });

  hidden.dataset.phoneIso2 = selected.iso2;

  setupNationalImask();
  updatePlaceholder();

  const schedulePhoneLabelSync = () => {
    queueMicrotask(() => syncRegistrationLabelFromInput(hidden));
  };
  national.addEventListener("input", schedulePhoneLabelSync);
  national.addEventListener("change", schedulePhoneLabelSync);
}

function whenIntlPhoneReady() {
  if (
    window.intlTelInputUtils &&
    window.intlTelInput &&
    typeof window.IMask === "function"
  ) {
    initRegistrationIntlPhone();
    return;
  }
  window.addEventListener(
    "intl-tel-utils-ready",
    () => initRegistrationIntlPhone(),
    { once: true },
  );
}

whenIntlPhoneReady();

const REGISTRATION_EMAIL_REGEX =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/;

const validateEmail = (email) =>
  REGISTRATION_EMAIL_REGEX.test(String(email || "").trim());

const registrationEmailPasses = (value) => validateEmail(value);

const registrationPhonePasses = (value, iso2) => {
  const v = String(value || "").trim();
  const country = String(iso2 || "").trim();
  if (!v || !country) return false;
  const u = window.intlTelInputUtils;
  if (!u) return false;
  try {
    if (u.isValidNumber(v, country)) return true;
    if (typeof u.isPossibleNumber === "function")
      return u.isPossibleNumber(v, country);
    return false;
  } catch {
    return false;
  }
};

const registrationFieldPasses = (input) => {
  if (!input) return true;
  const fieldName = input.getAttribute("name");
  if (fieldName === "name") return input.value.trim().length > 0;
  if (fieldName === "email") return registrationEmailPasses(input.value);
  if (fieldName === "country") return input.value.trim().length > 0;
  if (fieldName === "phone")
    return registrationPhonePasses(input.value, input.dataset.phoneIso2);
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

const COUNTRIES_JSON_URL = "public/data/countries-en.json";

/** ~60 найвідоміших країн; назви як у `public/data/countries-en.json`. */
const REGISTRATION_COUNTRIES = [
  // Європа
  "Ukraine",
  "United Kingdom",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Poland",
  "Netherlands",
  "Belgium",
  "Austria",
  "Switzerland",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Ireland",
  "Portugal",
  "Greece",
  "Czechia",
  "Romania",
  "Hungary",
  "Croatia",
  "Slovakia",
  "Serbia",
  "Bulgaria",
  "Lithuania",
  "Latvia",
  "Estonia",
  // Азія
  "China",
  "Japan",
  "India",
  "South Korea",
  "Indonesia",
  "Thailand",
  "Vietnam",
  "Philippines",
  "Malaysia",
  "Singapore",
  "Turkey",
  "Israel",
  "United Arab Emirates",
  "Saudi Arabia",
  "Iran",
  "Pakistan",
  "Bangladesh",
  "Kazakhstan",
  "Taiwan",
  "Iraq",
  // Америки
  "United States",
  "Canada",
  "Mexico",
  "Brazil",
  "Argentina",
  "Chile",
  "Colombia",
  "Peru",
  "Venezuela",
  "Cuba",
  "Dominican Republic",
  "Puerto Rico",
];

const registrationCountrySet = new Set(REGISTRATION_COUNTRIES);

const fillRegistrationCountryList = async (listEl) => {
  try {
    const res = await fetch(COUNTRIES_JSON_URL);
    if (!res.ok) throw new Error(res.statusText);
    const names = await res.json();
    if (!Array.isArray(names)) throw new Error("Invalid countries JSON");
    const frag = document.createDocumentFragment();
    for (const name of names) {
      if (typeof name !== "string" || !name.trim()) continue;
      if (!registrationCountrySet.has(name)) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "registration__country-item";
      btn.textContent = name;
      frag.appendChild(btn);
    }
    listEl.replaceChildren(frag);
  } catch (err) {
    console.error("Countries list:", err);
  }
};

const countryBtn = document.querySelector(".registration__country-button");
const countryList = document.querySelector(".registration__country-list");
const countryInput = document.querySelector(".registration__input--country");

if (countryBtn && countryList) {
  fillRegistrationCountryList(countryList);

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

const REGISTRATION_SUCCESS_STORAGE_KEY =
  "lumirelle-academy-registration-success";

const registrationFormSuccessEl = document.querySelector(
  ".registration__form-success",
);

function showRegistrationSubmittedState() {
  registrationFormSuccessEl?.classList.add("is-open");
  try {
    localStorage.setItem(REGISTRATION_SUCCESS_STORAGE_KEY, "1");
  } catch {
    /* quota / private mode */
  }
}

if (registrationFormSuccessEl) {
  try {
    if (localStorage.getItem(REGISTRATION_SUCCESS_STORAGE_KEY) === "1") {
      registrationFormSuccessEl.classList.add("is-open");
    }
  } catch {
    /* ignore */
  }
}

const registrationForm = document.querySelector("#registration-form");
if (registrationForm) {
  bindRegistrationFieldValidation(registrationForm);

  const submitBtn = registrationForm.querySelector('button[type="submit"]');

  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = registrationForm.querySelector('[name="name"]');
    const emailInput = registrationForm.querySelector('[name="email"]');
    const countryField = registrationForm.querySelector('[name="country"]');

    const phoneHidden = registrationForm.querySelector('input[name="phone"]');

    [nameInput, emailInput, countryField, phoneHidden].forEach((input) => {
      if (input) syncRegistrationLabelFromInput(input);
    });
    if (!phoneHidden) {
      registrationForm
        .querySelector(".registration__label--phone")
        ?.classList.add("error");
    }

    if (registrationForm.querySelector(".registration__label.error")) {
      return;
    }

    const fd = new FormData(registrationForm);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const country = String(fd.get("country") || "").trim();

    if (!name || !registrationEmailPasses(email) || !country || !phone) {
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
      showRegistrationSubmittedState();
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
