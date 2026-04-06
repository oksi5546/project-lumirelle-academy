const swiper = new Swiper(".results__swiper", {
  loop: true,

  navigation: {
    nextEl: ".results__btn--next",
    prevEl: ".results__btn--prev",
  },

  spaceBetween: 30,
});

new Accordion(".accordion-container", {
  openOnInit: [0],
});

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
