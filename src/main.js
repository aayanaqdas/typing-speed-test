const dropDownBtns = document.querySelectorAll(".dropdown-btn");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const timeEl = document.getElementById("time");
const restartBtn = document.getElementById("restart-btn");
const typingInput = document.getElementById("typing-input");
const quoteDisplay = document.getElementById("quote-display");
const caretEl = document.getElementById("caret");
const settingInputs = document.querySelectorAll(`input[name="difficulty"], input[name="mode"]`);
const testOverOverlay = document.querySelector(".test-over-overlay");
const testOverRestartBtn = document.getElementById("test-over-btn");
const personalBestEl = document.querySelector(".word-count");

let settings = {
  difficulty: "easy",
  mode: "timed",
};

let quoteSpans = null;
let quotesData = null;
let quoteText = null;
let currentIndex = 0;
let minAllowedIndex = 0;

let correctChars = 0;
let totalKeyPresses = 0;
let totalErrors = 0;
let totalCharsTyped = 0;

let testStarted = false;
let testFinished = false;
let testCompleted = false;

let timer = null;
let timeLeft = 60;
let timeElapsed = 0;

let wpm = 0;
let accuracy = 0;

let personalBest = Number(localStorage.getItem("best")) || 0;

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
    letterSpan.dataset.errorCounted = "false";
    quoteDisplay.appendChild(letterSpan);
  });
  quoteSpans = quoteDisplay.querySelectorAll("span");
  moveCaret();
}

function checkTypedLetter() {
  const inputLetters = typingInput.value.split("");
  totalCharsTyped = inputLetters.length;

  correctChars = 0;

  quoteSpans.forEach((span, index) => {
    const letter = inputLetters[index];

    // Don't re-evaluate locked characters (before minAllowedIndex)
    if (index < minAllowedIndex) {
      // Just count if it's currently marked as correct
      if (span.classList.contains("correct")) {
        correctChars++;
      }
      return;
    }

    if (letter == null) {
      span.classList.remove("correct", "incorrect");
    } else if (letter === span.innerText) {
      span.classList.add("correct");
      span.classList.remove("incorrect");
      correctChars++;

      if (letter === " ") {
        minAllowedIndex = index + 1;
      }
    } else {
      span.classList.add("incorrect");
      span.classList.remove("correct");

      if (span.dataset.errorCounted !== "true") {
        totalErrors++;
        span.dataset.errorCounted = "true";
      }
    }
  });

  currentIndex = inputLetters.length;

  if (currentIndex >= quoteText.length) {
    endTest();
  }

  moveCaret();
  updateStats();
}

function moveCaret() {
  const target = quoteSpans[currentIndex];

  if (target) {
    scrollLines(target);
    caretEl.style.top = target.offsetTop - quoteDisplay.scrollTop + "px";
    caretEl.style.left = target.offsetLeft + "px";
  } else if (currentIndex === quoteSpans.length) {
    const lastSpan = quoteSpans[quoteSpans.length - 1];
    scrollLines(lastSpan);
    caretEl.style.top = lastSpan.offsetTop - quoteDisplay.scrollTop + "px";
    caretEl.style.left = lastSpan.offsetLeft + lastSpan.offsetWidth + "px";
  }
}

function reset() {
  clearInterval(timer);

  testStarted = false;
  testFinished = false;
  testCompleted = false;
  currentIndex = 0;
  minAllowedIndex = 0;
  correctChars = 0;
  totalKeyPresses = 0;
  totalErrors = 0;
  totalCharsTyped = 0;
  timeLeft = 60;
  timeElapsed = 0;
  timeEl.innerText = settings.mode === "timed" ? "1:00" : "0:00";

  wpm = 0;
  accuracy = 100;

  typingInput.value = "";
  wpmEl.textContent = "0";
  accuracyEl.textContent = "100%";

  quoteDisplay.scrollTop = 0;

  getQuote();
}

function startTest() {
  if (testStarted) return;
  console.log(quoteText.length);
  testStarted = true;
  testFinished = false;

  checkTypedLetter();

  if (settings.mode === "timed") {
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
  createTestOverOverlay();

  console.log("test ended");
}

function updateStats() {
  // Accuracy = (correct keypresses / total keypresses) * 100
  const calculatedAccuracy =
    totalKeyPresses === 0
      ? 100
      : Math.round(((totalKeyPresses - totalErrors) / totalKeyPresses) * 100);
  accuracy = Math.max(0, calculatedAccuracy);
  accuracyEl.innerText = accuracy + "%";

  if (timeElapsed > 0) {
    const timeInMinutes = timeElapsed / 60;

    // Net WPM (displayed as WPM) = (correct characters / 5) / time
    wpm = Math.round(correctChars / 5 / timeInMinutes);

    // Gross WPM (Raw WPM) = (all typed characters / 5) / time
    // const grossWpm = Math.round(totalCharsTyped / 5 / timeInMinutes);

    wpmEl.innerText = wpm;

  } else {
    wpmEl.innerText = 0;
  }
}

function scrollLines(activeSpan) {
  const relativeTop = activeSpan.offsetTop;
  const lineHeight = parseFloat(getComputedStyle(quoteDisplay).lineHeight);
  const currentLine = Math.floor(relativeTop / lineHeight);

  if (currentLine >= 2) {
    const scrollAmount = (currentLine - 1) * lineHeight;
    quoteDisplay.scrollTop = scrollAmount;
  }
}

function createTestOverOverlay() {
  const img = document.querySelector(".overlay-img");
  const header = document.querySelector(".test-over-h");
  const text = document.querySelector(".test-over-p");
  const btn = document.getElementById("test-over-btn");
  const wpmEl = document.getElementById("test-over-wpm");
  const accuracyEl = document.getElementById("test-over-accuracy");
  const charactersEl = document.getElementById("test-over-characters");

  const overlayConfig = {
    baseline: {
      header: "Baseline Established!",
      text: "You've set the bar. Now the real challenge begins. Time to beat it.",
      buttonText: "Beat This Score",
      imageUrl: "./assets/images/icon-completed.svg",
      class: "overlay-animation"
    },
    complete: {
      header: "Test Complete!",
      text: "Solid run. Keep pushing to beat your high score.",
      buttonText: "Go Again",
      imageUrl: "./assets/images/icon-completed.svg",
      class: "overlay-animation"
    },
    newPB: {
      header: "High Score Smashed!",
      text: "You are getting faster. That was incredible typing.",
      buttonText: "Beat This Score",
      imageUrl: "./assets/images/icon-new-pb.svg",
      class: "new-pb"
    },
  };

  let overlayType;
  if (personalBest === 0) {
    overlayType = "baseline";
    personalBest = wpm;
    localStorage.setItem("best", wpm);
    personalBestEl.textContent = wpm;
    console.log("baseline")
  } else if (wpm > personalBest) {
    overlayType = "newPB";
    personalBest = wpm;
    localStorage.setItem("best", wpm);
    personalBestEl.textContent = wpm;
    console.log("new")
  } else {
    overlayType = "complete";
    console.log("comp")
  }

  const config = overlayConfig[overlayType];

  img.classList.remove("newPB", "overlay-animation")

  testOverOverlay.style.display = "flex";
  
  header.textContent = config.header;
  text.textContent = config.text;
  img.src = config.imageUrl;
  img.classList.add(config.class);
  btn.textContent = config.buttonText;


  wpmEl.textContent = wpm;
  accuracyEl.textContent = accuracy + "%";
  accuracyEl.style.color = accuracy === 100 ? "var(--green-500)" : "var(--red-500)";
  charactersEl.innerHTML = `<span style="color: var(--green-500)">${correctChars}</span>/<span style="color: var(--red-500)">${totalErrors}</span>`;
}

testOverRestartBtn.addEventListener("click", () => {
  reset();
  testOverOverlay.style.display = "none";
});

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
typingInput.addEventListener("keydown", (e) => {
  const blockedKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  if (blockedKeys.includes(e.code)) {
    e.preventDefault();
    return;
  }

  if (!testFinished && testStarted) {
    totalKeyPresses++;
  }
});

//Keeps cursor at the end
typingInput.addEventListener("click", () => {
  typingInput.setSelectionRange(typingInput.value.length, typingInput.value.length);
});

typingInput.addEventListener("input", () => {
  if (testFinished) return;

  if (typingInput.value.length < minAllowedIndex) {
    typingInput.value = quoteText.substring(0, minAllowedIndex);
    checkTypedLetter()
    console.log("backspace clicked")
    return;
  }

  if (!testStarted) {
    startTest();
  } else {
    checkTypedLetter();
  }
});
window.addEventListener("resize", checkTypedLetter);
restartBtn.addEventListener("click", reset);

window.onload = () => {
  personalBestEl.textContent = personalBest;
  getQuote();
};
