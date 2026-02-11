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

const punctuationCheckbox = document.getElementById("punctuation");
const numbersCheckbox = document.getElementById("numbers");
const difficultyDropdown = document.getElementById("difficulty-dropdown");
const optionsDropdown = document.getElementById("options-dropdown");

let settings = {
  difficulty: "easy",
  mode: "timed",
  punctuation: false,
  numbers: false,
};

let quotesData = null;
let wordsData = null;
let quoteText = null;
let quoteSpans = null;

let currentIndex = 0;
let minAllowedIndex = 0;
let characterStates = [];

let correctChars = 0;
let totalKeyPresses = 0;
let totalErrors = 0;
let totalCharsTyped = 0;
let wpm = 0;
let accuracy = 0;

let testStarted = false;
let testFinished = false;
let testCompleted = false;

let timer = null;
let timeLeft = 60;
let timeElapsed = 0;

let personalBest = Number(localStorage.getItem("best")) || 0;

async function getQuote() {
  try {
    if (settings.mode === "timed") {
      await generateWords();
    } else {
      await generatePassage();
    }
  } catch (error) {
    console.error(error);
  }
}

async function generatePassage() {
  if (!quotesData) {
    const response = await fetch("./quotes.json");
    quotesData = await response.json();
  }

  const difficulty = quotesData[settings.difficulty];
  const randomIndex = Math.floor(Math.random() * difficulty.length);
  quoteText = difficulty[randomIndex].text;

  appendQuote();
}

async function generateWords() {
  if (!wordsData) {
    const response = await fetch("./english_5k.json");
    const data = await response.json();
    wordsData = data.words;
  }

  const words = [];
  const targetWordCount = 150;

  for (let i = 0; i < targetWordCount; i++) {
    let word = wordsData[Math.floor(Math.random() * wordsData.length)];
    words.push(word);
  }

  if (settings.numbers) {
    const numberOfNumbers = Math.floor(words.length * 0.12);

    for (let i = 0; i < numberOfNumbers; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      const randomNumber = Math.floor(Math.random() * 1000);
      words[randomIndex] = randomNumber.toString();
    }
  }

  if (settings.punctuation) {
    const capPunctuations = [".", "!", "?"];
    const unCapPunctuations = [",", ";", ":", " -"];
    let shouldCapitalize = true;

    for (let i = 0; i < words.length; i++) {
      //skips number
      if (words[i].match(/^\d+$/)) {
        continue;
      }

      if (shouldCapitalize) {
        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        shouldCapitalize = false;
      }

      //adds punctuation every 5-12 words
      const sentenceLength = Math.floor(Math.random() * 8) + 5;
      const isEndOfSentence = (i + 1) % sentenceLength === 0 && i < words.length - 1;

      if (isEndOfSentence) {
        words[i] += capPunctuations[Math.floor(Math.random() * capPunctuations.length)];
        shouldCapitalize = true;
      }
      //chance of other punctuations mid sentence
      else if (Math.random() < 0.12 && !shouldCapitalize) {
        words[i] += unCapPunctuations[Math.floor(Math.random() * unCapPunctuations.length)];
      }
    }
  }
  quoteText = words.join(" ");
  appendQuote();
}

function appendQuote() {
  quoteDisplay.innerHTML = "";
  characterStates = [];

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
  totalCharsTyped = inputLetters.length;
  correctChars = 0;

  inputLetters.forEach((letter, index) => {
    const quoteChar = quoteText[index];
    const prevState = characterStates[index];

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

  updateVisualFeedback();
  currentIndex = inputLetters.length;

  if (currentIndex >= quoteText.length) {
    endTest();
    return;
  }

  moveCaret();
  updateStats();
}

function updateVisualFeedback() {
  quoteSpans.forEach((span, spanIndex) => {
    const state = characterStates[spanIndex];

    if (spanIndex < minAllowedIndex) {
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
}

function moveCaret() {
  const target = quoteSpans[currentIndex];

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

function scrollLines(activeSpan) {
  const relativeTop = activeSpan.offsetTop;
  const lineHeight = parseFloat(getComputedStyle(quoteDisplay).lineHeight);
  const currentLine = Math.floor(relativeTop / lineHeight);

  if (currentLine >= 2) {
    const scrollAmount = (currentLine - 1) * lineHeight;
    quoteDisplay.scrollTop = scrollAmount;
  }
}

function startTest() {
  if (testStarted) return;

  console.log(quoteText.length);
  testStarted = true;
  testFinished = false;
  checkTypedLetter();

  if (settings.mode === "timed") {
    startTimedMode();
  } else {
    startPassageMode();
  }
}

function startTimedMode() {
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
}

function startPassageMode() {
  timer = setInterval(() => {
    timeElapsed++;
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    timeEl.innerText = `${minutes}:${String(seconds).padStart(2, "0")}`;
    updateStats();
  }, 1000);
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

function reset() {
  clearInterval(timer);

  testStarted = false;
  testFinished = false;
  testCompleted = false;

  currentIndex = 0;
  minAllowedIndex = 0;
  characterStates = [];

  correctChars = 0;
  totalKeyPresses = 0;
  totalErrors = 0;
  totalCharsTyped = 0;
  wpm = 0;
  accuracy = 100;

  timeLeft = 60;
  timeElapsed = 0;
  timeEl.innerText = settings.mode === "timed" ? "1:00" : "0:00";

  typingInput.value = "";
  wpmEl.textContent = "0";
  accuracyEl.textContent = "100%";
  quoteDisplay.scrollTop = 0;

  getQuote();
}
function updateStats() {
  updateAccuracy();
  updateWPM();
}

function updateAccuracy() {
  const calculatedAccuracy =
    totalKeyPresses === 0
      ? 100
      : Math.round(((totalKeyPresses - totalErrors) / totalKeyPresses) * 100);
  accuracy = Math.max(0, calculatedAccuracy);
  accuracyEl.innerText = accuracy + "%";
}

function updateWPM() {
  if (timeElapsed > 0) {
    const timeInMinutes = timeElapsed / 60;
    wpm = Math.round(correctChars / 5 / timeInMinutes);
    wpmEl.innerText = wpm;
  } else {
    wpmEl.innerText = 0;
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

  const overlayType = determineOverlayType();
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

function determineOverlayType() {
  if (personalBest === 0) {
    personalBest = wpm;
    localStorage.setItem("best", wpm);
    personalBestEl.textContent = wpm;
    console.log("baseline");
    return "baseline";
  } else if (wpm > personalBest) {
    personalBest = wpm;
    localStorage.setItem("best", wpm);
    personalBestEl.textContent = wpm;
    triggerConfetti();
    console.log("new");
    return "newPB";
  } else {
    console.log("comp");
    return "complete";
  }
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

dropDownBtns.forEach((btn) => {
  const dropDownContent = btn.nextElementSibling;
  const dropDownInputs = dropDownContent.querySelectorAll(
    `input[type="radio"], input[type="checkbox"]`,
  );

  btn.addEventListener("click", () => {
    dropDownContent.classList.toggle("show");
  });

  dropDownInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.type === "radio" && input.checked) {
        dropDownContent.classList.remove("show");
        btn.textContent = input.nextSibling.textContent.trim();
      }

      if (input.type === "checkbox") {
        const punctChecked = document.getElementById("punctuation").checked;
        const numbersChecked = document.getElementById("numbers").checked;

        if (!punctChecked && !numbersChecked) {
          btn.textContent = "Options";
          dropDownContent.classList.toggle("show");
        } else if (punctChecked && !numbersChecked) {
          btn.textContent = "Punctuation";
        } else if (!punctChecked && numbersChecked) {
          btn.textContent = "Numbers";
        } else {
          btn.textContent = "Punct + Num";
          dropDownContent.classList.toggle("show");
        }
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

      if (input.name === "mode") {
        if (input.value === "timed") {
          difficultyDropdown.style.display = "none";
          optionsDropdown.style.display = "block";
        } else {
          difficultyDropdown.style.display = "block";
          optionsDropdown.style.display = "none";
        }
      }

      reset();
    }
  });
});

if (punctuationCheckbox) {
  punctuationCheckbox.addEventListener("change", (e) => {
    settings.punctuation = e.target.checked;
    reset();
  });
}

if (numbersCheckbox) {
  numbersCheckbox.addEventListener("change", (e) => {
    settings.numbers = e.target.checked;
    reset();
  });
}

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

typingInput.addEventListener("click", () => {
  typingInput.setSelectionRange(typingInput.value.length, typingInput.value.length);
});

typingInput.addEventListener("input", () => {
  if (testFinished) return;

  if (typingInput.value.length < minAllowedIndex) {
    typingInput.value = quoteText.substring(0, minAllowedIndex);
    checkTypedLetter();
    return;
  }

  if (!testStarted) {
    startTest();
  } else {
    checkTypedLetter();
  }
});

restartBtn.addEventListener("click", reset);

testOverRestartBtn.addEventListener("click", () => {
  reset();
  testOverOverlay.style.display = "none";
});

window.addEventListener("resize", checkTypedLetter);

window.onload = () => {
  personalBestEl.textContent = personalBest;
  getQuote();
};
