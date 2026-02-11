# Typing Speed Test

This was a challenge from FrontendMentor which is where the assets and designs are from but i added my own styles and functions.

## How it works

#### Test Controls

- Start the test by clicking the passage and typing.
- Select a difficulty level (Easy, Medium, Hard) for passages.
- Switch between "Timed (60s)" mode and "Passage" mode (timer counts up, no limit)
- Timed mode has punctions and numbers option.
- Restart at any time to get a new random passage from the selected difficulty

#### Typing Experience

- See real time WPM, accuracy, and time stats while typing
- See visual feedback showing correct characters (green), errors (red/underlined), and cursor position

#### Results & Progress

- View results showing WPM, accuracy, and characters (correct/incorrect) after completing a test
- See a "Baseline Established!" message on the first test, setting the personal best
- See a "High Score Smashed!" celebration with confetti when beating the personal best

### Behaviors

- **Starting the test**: The timer begins when the user starts typing.
- **Timed mode**: 60-second countdown. Test ends when timer reaches 0.
- **Passage mode**: Timer counts up with no limit. Test ends when the full passage is typed
- **Error handling**: Incorrect characters are highlighted in red with an underline. Backspace allows corrections, but errors still count against accuracy
- **Results logic**:
  - First completed test: "Baseline Established!" sets initial personal best
  - New personal best: "High Score Smashed!" with confetti animation
  - Normal completion: "Test Complete!" with encouragement message

### Data

Passage data is provided from `quotes.json`.
Words data is provided from `english_5k.json` (got from MonkeyType Repo)
