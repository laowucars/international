const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};

let firebaseAuth = null;
let firebaseApp = null;
let currentAuthMode = 'login';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('laowu_user') || 'null');
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  localStorage.setItem('laowu_user', JSON.stringify(user));
}

function removeStoredUser() {
  localStorage.removeItem('laowu_user');
}

function isFirebaseConfigured() {
  return FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== '';
}

function initFirebaseAuth() {
  if (!isFirebaseConfigured() || typeof firebase === 'undefined') {
    return;
  }
  try {
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = firebase.auth();
    firebaseAuth.onAuthStateChanged((user) => {
      if (user) {
        const name = user.displayName || user.email?.split('@')[0] || 'Member';
        setStoredUser({ email: user.email, name });
        updateAuthState(user);
      } else {
        removeStoredUser();
        updateAuthState(null);
      }
    });
  } catch (error) {
    console.warn('Firebase initialization failed', error);
  }
}

function setAuthMode(mode) {
  currentAuthMode = mode;
  const title = document.getElementById('auth-title');
  const submit = document.getElementById('auth-submit');
  const confirmField = document.getElementById('confirm-password-label');
  const loginTab = document.querySelector('.auth-tab[data-mode="login"]');
  const signupTab = document.querySelector('.auth-tab[data-mode="signup"]');
  if (mode === 'signup') {
    title.textContent = 'Create a new account';
    submit.textContent = 'Sign up';
    confirmField.style.display = 'grid';
    loginTab?.classList.remove('active');
    signupTab?.classList.add('active');
  } else {
    title.textContent = 'Sign in to your account';
    submit.textContent = 'Sign in';
    confirmField.style.display = 'none';
    loginTab?.classList.add('active');
    signupTab?.classList.remove('active');
  }
}

function showAuthMessage(message, isError = false) {
  const authStatus = document.getElementById('auth-status');
  if (!authStatus) return;
  authStatus.textContent = message;
  authStatus.style.color = isError ? '#ffadad' : '#c8ffd4';
}

function updateAuthState(user = null) {
  const storedUser = getStoredUser();
  const displayUser = user ? { email: user.email, name: user.displayName || user.email?.split('@')[0] || 'Member' } : storedUser;
  const signInButton = document.getElementById('open-login');
  const signedInArea = document.getElementById('signed-in-area');
  if (displayUser) {
    if (signInButton) signInButton.style.display = 'none';
    if (signedInArea) {
      signedInArea.querySelector('.user-name').textContent = displayUser.name;
      signedInArea.style.display = 'inline-flex';
    }
  } else {
    if (signInButton) signInButton.style.display = 'inline-flex';
    if (signedInArea) signedInArea.style.display = 'none';
  }
}

function signOutUser() {
  if (firebaseAuth) {
    firebaseAuth.signOut().catch(() => {});
  }
  removeStoredUser();
  updateAuthState(null);
}

function performAuth(email, password) {
  if (currentAuthMode === 'signup') {
    const confirmPassword = document.querySelector('input[name="confirmPassword"]').value.trim();
    if (confirmPassword !== password) {
      showAuthMessage('Passwords do not match.', true);
      return;
    }
    if (firebaseAuth) {
      firebaseAuth.createUserWithEmailAndPassword(email, password)
        .then((result) => {
          const user = result.user;
          setStoredUser({ email: user.email, name: user.email?.split('@')[0] || 'Member' });
          showAuthMessage('Account created! Signed in successfully.');
          updateAuthState(user);
          setTimeout(() => document.getElementById('auth-modal')?.classList.remove('visible'), 900);
        })
        .catch((error) => showAuthMessage(error.message || 'Unable to create account.', true));
      return;
    }
    setStoredUser({ email, name: email.split('@')[0] });
    showAuthMessage('Account created locally. Signed in.');
    updateAuthState();
    setTimeout(() => document.getElementById('auth-modal')?.classList.remove('visible'), 900);
    return;
  }

  if (firebaseAuth) {
    firebaseAuth.signInWithEmailAndPassword(email, password)
      .then((result) => {
        const user = result.user;
        setStoredUser({ email: user.email, name: user.email?.split('@')[0] || 'Member' });
        showAuthMessage('Signed in successfully.');
        updateAuthState(user);
        setTimeout(() => document.getElementById('auth-modal')?.classList.remove('visible'), 900);
      })
      .catch((error) => showAuthMessage(error.message || 'Unable to sign in.', true));
    return;
  }

  setStoredUser({ email, name: email.split('@')[0] });
  showAuthMessage('Signed in locally for demo mode.');
  updateAuthState();
  setTimeout(() => document.getElementById('auth-modal')?.classList.remove('visible'), 900);
}

function initAuthUI() {
  initFirebaseAuth();

  const loginButton = document.getElementById('open-login');
  const authModal = document.getElementById('auth-modal');
  const closeAuth = document.getElementById('close-auth');
  const authForm = document.getElementById('auth-form');
  const authTabs = document.querySelectorAll('.auth-tab');
  const logoutButton = document.getElementById('logout-btn');

  loginButton?.addEventListener('click', () => {
    setAuthMode('login');
    showAuthMessage('');
    authModal?.classList.add('visible');
  });
  closeAuth?.addEventListener('click', () => authModal?.classList.remove('visible'));
  authModal?.addEventListener('click', (event) => {
    if (event.target === authModal) authModal.classList.remove('visible');
  });

  authTabs.forEach((tab) => {
    tab.addEventListener('click', () => setAuthMode(tab.dataset.mode));
  });

  authForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = authForm.querySelector('input[name="email"]').value.trim();
    const password = authForm.querySelector('input[name="password"]').value.trim();
    if (!email || !password) {
      showAuthMessage('Please enter a valid email and password.', true);
      return;
    }
    performAuth(email, password);
  });

  logoutButton?.addEventListener('click', () => signOutUser());
  updateAuthState();
}

document.addEventListener('DOMContentLoaded', initAuthUI);