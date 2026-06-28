import '@google/model-viewer';
import './styles.css';

const MODEL_URL = '/assets/moto-funcional4-animada-v2.glb';
const ANIMATIONS = {
  explode: 'Exploded_View',
  assemble: 'Assemble_View',
  present: 'Parts_Presentation',
};

const views = {
  full: { orbit: '35deg 72deg 105%', label: 'Full view' },
  front: { orbit: '0deg 76deg 100%', label: 'Front' },
  side: { orbit: '90deg 76deg 105%', label: 'Side' },
  rear: { orbit: '180deg 76deg 105%', label: 'Rear' },
  top: { orbit: '0deg 12deg 115%', label: 'Top' },
};

const parts = {
  front: {
    title: 'Front Wheel',
    description: 'The front contact point, engineered for direction, stability and precise road response.',
    orbit: '5deg 78deg 78%',
  },
  engine: {
    title: 'Engine',
    description: 'The mechanical core of the motorcycle, integrating power delivery and structural detail.',
    orbit: '65deg 72deg 73%',
  },
  tank: {
    title: 'Fuel Tank',
    description: 'A central visual mass that combines storage, ergonomics and the motorcycle’s silhouette.',
    orbit: '32deg 61deg 72%',
  },
  rear: {
    title: 'Rear Wheel',
    description: 'The rear assembly transfers power to the ground and supports traction under acceleration.',
    orbit: '155deg 78deg 78%',
  },
  seat: {
    title: 'Seat',
    description: 'The upper support surface, designed around rider comfort and the flow of the bodywork.',
    orbit: '125deg 58deg 76%',
  },
};

const presentationTimeline = [
  { start: 0.45, end: 1.6, label: 'Chassis, fuel tank and seat' },
  { start: 1.8, end: 2.95, label: 'Wiring, spring and mechanical components' },
  { start: 3.15, end: 4.3, label: 'Front suspension and handlebars' },
  { start: 4.5, end: 5.65, label: 'Brake system and controls' },
  { start: 5.85, end: 7, label: 'Headlight and lighting' },
  { start: 7.2, end: 8.35, label: 'Rear suspension' },
  { start: 8.55, end: 9.7, label: 'Wheels and tires' },
  { start: 9.9, end: 11.05, label: 'Rims and brake discs' },
  { start: 11.25, end: 12.4, label: 'Fenders and plates' },
  { start: 12.6, end: 13.75, label: 'MN logo and fasteners' },
];

const model = document.querySelector('#motorcycleModel');
const viewerFrame = document.querySelector('#viewerFrame');
const loadingState = document.querySelector('#loadingState');
const errorState = document.querySelector('#errorState');
const errorMessage = document.querySelector('#errorMessage');
const retryModel = document.querySelector('#retryModel');
const presentButton = document.querySelector('#presentParts');
const explodeButton = document.querySelector('#explodeModel');
const explodeLabel = explodeButton.querySelector('span');
const autoRotateButton = document.querySelector('#autoRotate');
const autoRotateLabel = autoRotateButton.querySelector('span');
const resetButton = document.querySelector('#resetView');
const fullscreenButton = document.querySelector('#fullscreenView');
const partCard = document.querySelector('#partCard');
const partTitle = document.querySelector('#partTitle');
const partDescription = document.querySelector('#partDescription');
const presentationCard = document.querySelector('#presentationCard');
const presentationLabel = document.querySelector('#presentationLabel');
const cameraButtons = [...document.querySelectorAll('[data-view]')];
const hotspotButtons = [...document.querySelectorAll('[data-part]')];

let availableAnimations = [];
let activeAnimation = '';
let exploded = false;
let autoRotate = true;
let retryCount = 0;

function setLoading(isLoading) {
  loadingState.hidden = !isLoading;
  model.classList.toggle('is-loading', isLoading);
}

function setError(message = '') {
  errorMessage.textContent = message || 'The model could not be loaded.';
  errorState.hidden = false;
  setLoading(false);
  viewerFrame.classList.add('has-error');
}

function clearError() {
  errorState.hidden = true;
  viewerFrame.classList.remove('has-error');
}

function setAutoRotate(enabled) {
  autoRotate = enabled;
  model.autoRotate = enabled;
  autoRotateButton.setAttribute('aria-pressed', String(enabled));
  autoRotateButton.classList.toggle('paused', !enabled);
  autoRotateLabel.textContent = enabled ? 'Pause rotation' : 'Auto rotate';
}

function updateAnimationControls() {
  const canPresent = availableAnimations.includes(ANIMATIONS.present);
  const desiredExplodeAnimation = exploded ? ANIMATIONS.assemble : ANIMATIONS.explode;
  presentButton.disabled = !canPresent || Boolean(activeAnimation);
  explodeButton.disabled = !availableAnimations.includes(desiredExplodeAnimation) || Boolean(activeAnimation);
  explodeLabel.textContent = exploded ? 'Assemble motorcycle' : 'Explode motorcycle';
  presentButton.classList.toggle('is-active', activeAnimation === ANIMATIONS.present);
  explodeButton.classList.toggle('is-active', [ANIMATIONS.explode, ANIMATIONS.assemble].includes(activeAnimation));
}

function setCamera(viewId) {
  const view = views[viewId] || views.full;
  model.cameraOrbit = view.orbit;
  model.jumpCameraToGoal?.();
  cameraButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === viewId));
  closePartCard();
}

function closePartCard() {
  partCard.hidden = true;
  hotspotButtons.forEach((button) => button.classList.remove('active'));
}

async function playAnimation(name) {
  if (!availableAnimations.includes(name) || activeAnimation) return;

  activeAnimation = name;
  setAutoRotate(false);
  updateAnimationControls();
  closePartCard();

  if (name === ANIMATIONS.present) {
    presentationCard.hidden = false;
    presentationLabel.textContent = 'Preparing the first component';
  }

  try {
    model.pause?.();
    model.animationName = name;
    await model.updateComplete;
    model.currentTime = 0;
    model.play({ repetitions: 1 });
  } catch (error) {
    console.error(`Could not play animation ${name}.`, error);
    activeAnimation = '';
    presentationCard.hidden = true;
    updateAnimationControls();
  }
}

model.addEventListener('load', () => {
  clearError();
  setLoading(false);
  retryCount = 0;
  availableAnimations = Array.from(model.availableAnimations || []);
  viewerFrame.classList.add('model-loaded');
  updateAnimationControls();

  if (!availableAnimations.length) {
    console.warn('The GLB loaded, but no animations were detected.');
  }
});

model.addEventListener('error', (event) => {
  console.error('Model Viewer error:', event);
  setError(`The GLB was not found or could not be decoded: ${MODEL_URL}`);
});

model.addEventListener('timeupdate', () => {
  if (activeAnimation !== ANIMATIONS.present) return;
  const time = Number(model.currentTime || 0);
  const item = presentationTimeline.find((entry) => time >= entry.start && time <= entry.end);
  presentationLabel.textContent = item?.label || 'Preparing the next component';
});

model.addEventListener('finished', () => {
  const finished = activeAnimation;
  activeAnimation = '';
  presentationCard.hidden = true;

  if (finished === ANIMATIONS.explode) {
    exploded = true;
  } else if (finished === ANIMATIONS.assemble || finished === ANIMATIONS.present) {
    exploded = false;
    setAutoRotate(true);
  }

  updateAnimationControls();
});

retryModel.addEventListener('click', () => {
  retryCount += 1;
  clearError();
  setLoading(true);
  model.src = `${MODEL_URL}?retry=${Date.now()}-${retryCount}`;
});

presentButton.addEventListener('click', () => playAnimation(ANIMATIONS.present));
explodeButton.addEventListener('click', () => playAnimation(exploded ? ANIMATIONS.assemble : ANIMATIONS.explode));

autoRotateButton.addEventListener('click', () => setAutoRotate(!autoRotate));

resetButton.addEventListener('click', () => {
  setCamera('full');
  if (exploded && !activeAnimation) {
    playAnimation(ANIMATIONS.assemble);
  } else if (!activeAnimation) {
    setAutoRotate(true);
  }
});

fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await viewerFrame.requestFullscreen();
    }
  } catch (error) {
    console.warn('Fullscreen is not available in this browser.', error);
  }
});

cameraButtons.forEach((button) => {
  button.addEventListener('click', () => setCamera(button.dataset.view));
});

hotspotButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const part = parts[button.dataset.part];
    if (!part) return;
    hotspotButtons.forEach((item) => item.classList.toggle('active', item === button));
    partTitle.textContent = part.title;
    partDescription.textContent = part.description;
    partCard.hidden = false;
    setAutoRotate(false);
    model.cameraOrbit = part.orbit;
    model.jumpCameraToGoal?.();
  });
});

document.querySelector('#closePart').addEventListener('click', closePartCard);
document.querySelector('#returnFull').addEventListener('click', () => setCamera('full'));

document.querySelector('#quoteForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const message = [
    'Hello, MN Animat! I would like to request a quote.',
    '',
    `Name: ${data.get('name')}`,
    `Email: ${data.get('email')}`,
    `Service: ${data.get('service')}`,
    `Project: ${data.get('details')}`,
  ].join('\n');
  window.open(`https://wa.me/5575982321124?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});

const mobileMenu = document.querySelector('.mobile-menu');
const mainNav = document.querySelector('.main-nav');
mobileMenu.addEventListener('click', () => {
  const expanded = mobileMenu.getAttribute('aria-expanded') === 'true';
  mobileMenu.setAttribute('aria-expanded', String(!expanded));
  mainNav.classList.toggle('open', !expanded);
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu.setAttribute('aria-expanded', 'false');
    mainNav.classList.remove('open');
  });
});

document.querySelector('#currentYear').textContent = new Date().getFullYear();
setLoading(true);
updateAnimationControls();
