const dropDownBtns = document.querySelectorAll(".dropdown-btn");
const typingInput = document.getElementById("typing-input");
const quoteDisplay = document.getElementById("quote-display");

dropDownBtns.forEach((btn) => {
  const dropDownContent = btn.nextElementSibling;
  const dropDownInputs = dropDownContent.querySelectorAll(`input[type="radio"]`);

  btn.addEventListener("click", () => {
    dropDownContent.classList.toggle("show");
  });

  dropDownInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        dropDownContent.classList.remove("show");
        btn.textContent = input.nextSibling.textContent.trim();
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown-content").forEach((content) => {
        content.classList.remove("show");
      });
    }
  });
});

typingInput.addEventListener("input", () => {
  console.log(typingInput.value);
});

const quote = document.createElement("span");
quote.textContent = `The archaeological expedition unearthed artifacts that complicated prevailing theories about Bronze Age trade networks. Obsidian from Anatolia, lapis lazuli from Afghanistan, and amber from the Baltic—all discovered in a single Mycenaean tomb—suggested commercial connections far more extensive than previously hypothesized. \"We've underestimated ancient peoples' navigational capabilities and their appetite for luxury goods,\" the lead researcher observed. \"Globalization isn't as modern as we assume.\"`;
quoteDisplay.appendChild(quote);