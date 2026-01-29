const dropDownBtns = document.querySelectorAll(".dropdown-btn");
const restartBtn = document.getElementById("restart-btn");
const typingInput = document.getElementById("typing-input");
const quoteDisplay = document.getElementById("quote-display");
const caretEl = document.getElementById("caret");
let quoteSpans = null;
const settingInputs = document.querySelectorAll(`input[name="difficulty"], input[name="mode"]`);
let quotesData = null;
let settings = {
  difficulty: "easy",
  mode: "timed",
};

async function getQuote() {
  try {
    if (!quotesData) {
      const response = await fetch("./data.json");
      quotesData = await response.json();
    }
    const difficulty = quotesData[settings.difficulty];
    const randomIndex = Math.floor(Math.random() * difficulty.length);
    console.log(randomIndex);
    const quoteText = difficulty[randomIndex].text;
    renderQuote(quoteText);
  } catch (error) {
    console.log(error);
  }
}

function renderQuote(quoteText) {
  quoteDisplay.innerHTML = "";
  typingInput.focus();
  quoteText.split("").forEach((letter) => {
    const letterSpan = document.createElement("span");
    letterSpan.innerText = letter;
    quoteDisplay.appendChild(letterSpan);
  });
  quoteSpans = quoteDisplay.querySelectorAll("span");
  moveCaret(0);
}

function checkTypedLetter() {
  const inputLetters = typingInput.value.split("");
  quoteSpans.forEach((span, index) => {
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
  moveCaret(inputLetters.length);
}

function moveCaret(index = 0) {
  const target = quoteSpans[index];
  if (target) {
    caretEl.style.top = target.offsetTop + "px";
    caretEl.style.left = target.offsetLeft + "px";
  } else if (index === quoteSpans.length) {
    const lastSpan = quoteSpans[quoteSpans.length - 1];
    caretEl.style.top = lastSpan.offsetTop + "px";
    caretEl.style.left = lastSpan.offsetLeft + lastSpan.offsetWidth + "px";
  }
}

function restart() {
  typingInput.value = "";
  getQuote();
}

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
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown")) {
    document.querySelectorAll(".dropdown-content").forEach((content) => {
      content.classList.remove("show");
    });
  }
});

settingInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) {
      settings[input.name] = input.value;
    }
  });
});
console.log("default", settings);
typingInput.addEventListener("keydown", (e) => {
  const blockedKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  if (blockedKeys.includes(e.code)) {
    e.preventDefault();
  }
});

//Keeps cursor at the end
typingInput.addEventListener("click", () => {
  typingInput.setSelectionRange(typingInput.value.length, typingInput.value.length);
});

typingInput.addEventListener("input", checkTypedLetter);
window.addEventListener("resize", checkTypedLetter);
restartBtn.addEventListener("click", restart);

getQuote();
