import '../styles/index.scss';

import { switchMap, tap, map } from 'rxjs/operators';
import { fromEvent, BehaviorSubject, NEVER, combineLatest, interval } from 'rxjs';

// Get DOM elements
let bpm = document.querySelector('#bpm');
let playButton = document.querySelector('#play');
let rhythmOne = document.querySelector('#rhythm-one');
let rhythmTwo = document.querySelector('#rhythm-two');

// Play click Observable
let playClick$ = fromEvent(playButton, 'click');

// BPM changes Observable
let bpmChange$ = fromEvent(bpm, 'change').pipe(map(x => +x.target.value));

// Rhythm change Observable, filter only not null values
let rhythmChangeEvents$ = [fromEvent(rhythmOne, 'change'), fromEvent(rhythmTwo, 'change')];
let rhythms$ = combineLatest(...rhythmChangeEvents$).pipe(
  map(rhythmChangeEvents => rhythmChangeEvents.map(x => +x.target.value).filter(x => !!x))
);

// Boolean Observable that triggers play/stop
let play$ = new BehaviorSubject(false);
playClick$.subscribe(() => play$.next(!play$.getValue()));

// TAP - Toggles play/stop sign on button
// switchMap - starts/stops clock Observable
let clock$ = combineLatest(rhythms$, bpmChange$, play$).pipe(
  tap(([, , play]) => togglePlayButtonText(play)),
  switchMap(([rhythms, bpm, play]) => (play ? interval(convertToMs(bpm, rhythms)) : NEVER))
);

// Subscribe to clock, tap in values to trigger the sounds
combineLatest(clock$, rhythms$)
  .pipe(
    tap(([clock, rhythms]) =>
      rhythms.forEach(rhythm => {
        if (clock % rhythm === 0) {
          console.log('played', rhythm);
          playDrum();
        }
      })
    )
  )
  .subscribe();

// Trigger the change events so that combineLatest emits initially
rhythmOne.dispatchEvent(new Event('change'));
rhythmTwo.dispatchEvent(new Event('change'));
bpm.dispatchEvent(new Event('change'));

function playDrum() {
  new Audio(
    'https://sampleswap.org/samples-ghost/DRUMS%20(FULL%20KITS)/ROLAND%20TR-66/1[kb]66-rim-03.wav.mp3'
  ).play();
}

// Converts from BPM and rhythms to ms for the clock
function convertToMs(bpm, rhythms) {
  let segmentsInAMeasure = rhythms.reduce((a, b) => a * b);
  let mainRhythm = Math.min(...rhythms);
  const minuteInMS = 60000;
  return 1 / (bpm / minuteInMS) / (segmentsInAMeasure / mainRhythm);
}

function togglePlayButtonText(playOn) {
  playButton.innerText = playOn ? 'STOP' : 'PLAY';
}
