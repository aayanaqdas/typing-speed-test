const dropDownBtns = document.querySelectorAll(".dropdown-btn");
const typingInput = document.getElementById("typing-input");
const quoteDisplay = document.getElementById("quote-display");
const quoteText =
  "The sun rose over the quiet town. Birds sang in the trees as people woke up and started their day. It was going to be a warm and sunny morning.";
let quoteletters = null;
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

function renderQuote() {
  quoteDisplay.innerHTML = "";

  quoteText.split("").forEach((letter) => {
    const letterSpan = document.createElement("span");
    letterSpan.innerText = letter;
    quoteDisplay.appendChild(letterSpan);
  });
}

typingInput.addEventListener("input", () => {
  const quoteletters = quoteDisplay.querySelectorAll("span");
  const inputLetters = typingInput.value.split("");

  quoteletters.forEach((span, index) => {
    const letter = inputLetters[index];

    if (letter == null) {
      span.classList.remove("correct", "incorrect");
    } else if (letter === span.innerText) {
      span.classList.add("correct");
      span.classList.remove("incorrect");
    } else {
      span.classList.add("incorrect");
      span.classList.remove("correct");
    }
  });
  console.log(typingInput.value);
});

renderQuote();
