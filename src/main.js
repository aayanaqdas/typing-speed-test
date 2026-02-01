const dropDownBtns = document.querySelectorAll(".dropdown-btn");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const timeEl = document.getElementById("time");
const restartBtn = document.getElementById("restart-btn");
const typingInput = document.getElementById("typing-input");
const quoteDisplay = document.getElementById("quote-display");
const caretEl = document.getElementById("caret");
const settingInputs = document.querySelectorAll(`input[name="difficulty"], input[name="mode"]`);

let settings = {
  difficulty: "easy",
  mode: "timed",
};

let quoteSpans = null;
let quotesData = null;
let quoteText = null;
let currentIndex = 0;

let correctChars = 0;
let incorrectChars = 0;

let testStarted = false;
let testFinished = false;
let testCompleted = false;

let timer = null;
let timeLeft = 60;
let timeElapsed = 0;

async function getQuote() {
  try {
    if (!quotesData) {
      const response = await fetch("./data.json");
      quotesData = await response.json();
    }
    const difficulty = quotesData[settings.difficulty];
    const randomIndex = Math.floor(Math.random() * difficulty.length);
    quoteText = difficulty[randomIndex].text;
    renderQuote();
  } catch (error) {
    console.log(error);
  }
}

function renderQuote() {
  quoteDisplay.innerHTML = "";
  typingInput.focus();
  quoteText.split("").forEach((letter) => {
    const letterSpan = document.createElement("span");
    letterSpan.innerText = letter;
    quoteDisplay.appendChild(letterSpan);
  });
  quoteSpans = quoteDisplay.querySelectorAll("span");
  moveCaret();
}

function checkTypedLetter() {
  const inputLetters = typingInput.value.split("");

  correctChars = 0;
  incorrectChars = 0;
  quoteSpans.forEach((span, index) => {
    const letter = inputLetters[index];
    if (letter == null) {
      span.classList.remove("correct", "incorrect");
    } else if (letter === span.innerText) {
      span.classList.add("correct");
      span.classList.remove("incorrect");
      correctChars++;
    } else {
      span.classList.add("incorrect");
      span.classList.remove("correct");
      incorrectChars++;
    }
  });
  currentIndex = inputLetters.length;
  if (currentIndex >= quoteText.length) {
    endTest();
  }
  console.log("correct: " + correctChars, "incorrect: " + incorrectChars);
  moveCaret();
}

function moveCaret() {
  const target = quoteSpans[currentIndex];

  if (target) {
    caretEl.style.top = target.offsetTop + "px";
    caretEl.style.left = target.offsetLeft + "px";
  } else if (currentIndex === quoteSpans.length) {
    const lastSpan = quoteSpans[quoteSpans.length - 1];
    caretEl.style.top = lastSpan.offsetTop + "px";
    caretEl.style.left = lastSpan.offsetLeft + lastSpan.offsetWidth + "px";
  }
}

function reset() {
  clearInterval(timer);

  testStarted = false;
  testFinished = false;
  testCompleted = false;
  currentIndex = 0;
  correctChars = 0;
  incorrectChars = 0;
  timeLeft = 60;
  timeElapsed = 0;
  timeEl.innerText = settings.mode === "timed" ? "1:00" : "0:00";

  typingInput.value = "";
  wpmEl.textContent = "0";
  accuracyEl.textContent = "100%";

  getQuote();
}

function startTest() {
  if (testStarted) return;
  console.log(quoteText.length);
  testStarted = true;
  testFinished = false;

  checkTypedLetter();

  if (settings.mode === "timed") {
    timeEl.innerText = timeLeft;

    timer = setInterval(() => {
      timeLeft--;
      timeElapsed++;

      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timeEl.innerText = `${minutes}:${String(seconds).padStart(2, "0")}`;
      updateStats();

      if (timeLeft <= 0) {
        endTest();
      }
    }, 1000);
  } else {
    // Passage Mode
    timer = setInterval(() => {
      timeElapsed++;
      const minutes = Math.floor(timeElapsed / 60);
      const seconds = timeElapsed % 60;
      timeEl.innerText = `${minutes}:${String(seconds).padStart(2, "0")}`;
      updateStats();
    }, 1000);
  }
}

function endTest() {
  if (testFinished) return;

  clearInterval(timer);
  testFinished = true;
  testStarted = false;
  testCompleted = currentIndex >= quoteText.length;
  console.log("test ended");
}

function updateStats() {
  const totalTyped = correctChars + incorrectChars;

  const accuracy = totalTyped === 0 ? 100 : Math.round((correctChars / totalTyped) * 100);

  accuracyEl.innerText = accuracy + "%";

  if (timeElapsed > 0) {
    const timeInMinutes = timeElapsed / 60;

    const grossWpm = correctChars / 5 / timeInMinutes;
    const netWpm = grossWpm - incorrectChars / 5 / timeInMinutes;
    const wpm = Math.max(0, Math.round(netWpm));
    wpmEl.innerText = wpm;
  } else {
    wpmEl.innerText = 0;
  }
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
      reset();
      getQuote();
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

typingInput.addEventListener("input", () => {
  if (testFinished) return;

  if (!testStarted) {
    startTest();
  } else {
    checkTypedLetter();
  }
});
window.addEventListener("resize", checkTypedLetter);
restartBtn.addEventListener("click", reset);

getQuote();
