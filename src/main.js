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
let lastQuoteEndIndex = 0;
let currentIndex = 0;
let minAllowedIndex = 0;

let displayStartIndex = 0; // Where DOM rendering starts in the full quoteText
let characterStates = []; // Stores state for each character: { correct: boolean, errorCounted: boolean }

let quoteLoadTriggered = false;

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
    const newQuote = difficulty[randomIndex].text;

    if (settings.mode === "timed" && testStarted) {
      //Add new quote in timed mode
      const oldLength = quoteText.length;
      quoteText += " " + newQuote;
      lastQuoteEndIndex = oldLength;
      quoteLoadTriggered = false;
      appendQuote(true);
      console.log("append quote: " + quoteText.length);
    } else {
      //Replace in passage mode
      quoteText = newQuote;
      lastQuoteEndIndex = newQuote.length;
      quoteLoadTriggered = false;
      console.log(quoteText.length);
      appendQuote(false);
    }
  } catch (error) {
    console.log(error);
  }
}

function appendQuote(appendMode = false) {
  if (!appendMode) {
    quoteDisplay.innerHTML = "";
    displayStartIndex = 0;
    characterStates = [];
  }

  typingInput.focus();

  // When appending start from where it left off (lastQuoteEndIndex)
  // When not appending start from 0
  const startPos = appendMode ? lastQuoteEndIndex : 0;
  const textToRender = quoteText.substring(startPos);

  textToRender.split("").forEach((letter) => {
    const letterSpan = document.createElement("span");
    letterSpan.innerText = letter;
    quoteDisplay.appendChild(letterSpan);
  });
  
  quoteSpans = quoteDisplay.querySelectorAll("span");
  moveCaret();
}

function checkTypedLetter() {
  const inputLetters = typingInput.value.split("");
  totalCharsTyped = inputLetters.length;

  correctChars = 0;

  inputLetters.forEach((letter, index) => {
    const quoteChar = quoteText[index];
    const prevState = characterStates[index];

    // Dont re-evaluate locked characters (before minAllowedIndex)
    if (index < minAllowedIndex) {
      if (prevState?.correct) {
        correctChars++;
      }
      return;
    }

    const isCorrect = letter === quoteChar;

    if (isCorrect) {
      characterStates[index] = { correct: true, errorCounted: prevState?.errorCounted || false };
      correctChars++;

      if (letter === " ") {
        minAllowedIndex = index + 1;
      }
    } else {
      const shouldCountError = !prevState || !prevState.errorCounted;
      if (shouldCountError) {
        totalErrors++;
      }
      characterStates[index] = { correct: false, errorCounted: true };
    }
  });

  if (inputLetters.length < characterStates.length) {
    characterStates.length = inputLetters.length;
  }

  quoteSpans.forEach((span, spanIndex) => {
    const actualIndex = displayStartIndex + spanIndex;
    const state = characterStates[actualIndex];

    if (actualIndex < minAllowedIndex) {
      if (state?.correct) {
        span.classList.add("correct");
        span.classList.remove("incorrect");
      }
      return;
    }

    if (!state) {
      span.classList.remove("correct", "incorrect");
    } else if (state.correct) {
      span.classList.add("correct");
      span.classList.remove("incorrect");
    } else {
      span.classList.add("incorrect");
      span.classList.remove("correct");
    }
  });

  currentIndex = inputLetters.length;

  if (currentIndex >= quoteText.length) {
    if (settings.mode === "passage") {
      endTest();
    }
    return;
  }

  moveCaret();
  updateStats();
}

function moveCaret() {
  const spanIndex = currentIndex - displayStartIndex;
  const target = quoteSpans[spanIndex];

  if (target) {
    scrollLines(target);
    caretEl.style.top = target.offsetTop - quoteDisplay.scrollTop + "px";
    caretEl.style.left = target.offsetLeft + "px";
  } else if (spanIndex === quoteSpans.length) {
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
  quoteLoadTriggered = false;
  lastQuoteEndIndex = 0;
  currentIndex = 0;
  minAllowedIndex = 0;
  displayStartIndex = 0;
  characterStates = [];
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

    // Remove old DOM content when far enough ahead
    // Only remove if not near the start
    if (settings.mode === "timed" && currentIndex > displayStartIndex + 150 && displayStartIndex < currentIndex - 50) {
      const charsToRemove = Math.min(50, currentIndex - displayStartIndex - 50);
      
      // Remove spans from beginning of DOM
      for (let i = 0; i < charsToRemove && quoteDisplay.firstChild; i++) {
        quoteDisplay.removeChild(quoteDisplay.firstChild);
      }
      
      displayStartIndex += charsToRemove;
      quoteSpans = quoteDisplay.querySelectorAll("span");
      quoteDisplay.scrollTop = 0;
      moveCaret();
    }

    if (settings.mode === "timed" && timeLeft > 0 && !quoteLoadTriggered) {
      const thresholds = {
        easy: 70,
        medium: 100,
        hard: 150,
      };

      const threshold = thresholds[settings.difficulty] || 50;
      const remainingChars = quoteText.length - currentIndex;

      if (remainingChars <= threshold) {
        quoteLoadTriggered = true;
        getQuote();
      }
    }
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
      class: "overlay-animation",
    },
    complete: {
      header: "Test Complete!",
      text: "Solid run. Keep pushing to beat your high score.",
      buttonText: "Go Again",
      imageUrl: "./assets/images/icon-completed.svg",
      class: "overlay-animation",
    },
    newPB: {
      header: "High Score Smashed!",
      text: "You are getting faster. That was incredible typing.",
      buttonText: "Beat This Score",
      imageUrl: "./assets/images/icon-new-pb.svg",
      class: "new-pb",
    },
  };

  let overlayType;
  if (personalBest === 0) {
    overlayType = "baseline";
    personalBest = wpm;
    localStorage.setItem("best", wpm);
    personalBestEl.textContent = wpm;
    console.log("baseline");
  } else if (wpm > personalBest) {
    overlayType = "newPB";
    personalBest = wpm;
    localStorage.setItem("best", wpm);
    personalBestEl.textContent = wpm;
    triggerConfetti();
    console.log("new");
  } else {
    overlayType = "complete";
    console.log("comp");
  }

  const config = overlayConfig[overlayType];

  img.classList.remove("newPB", "overlay-animation");

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

function triggerConfetti() {
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
    });
  }, 150);

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
    });
  }, 300);
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
    checkTypedLetter();
    console.log("backspace clicked");
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
