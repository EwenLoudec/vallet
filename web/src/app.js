(() => {
  const { createElement, avatar, button } = ValletDom;
  const SESSION_KEY = 'vallet.session';

  let state = JSON.parse(JSON.stringify({
    today: ValletData.today,
    machines: ValletData.machines,
    reservations: ValletData.reservations,
    leads: ValletData.leads,
  }));
  let currentUser = null;

  const machineTypes = [...new Set(ValletData.machines.map((machine) => machine.type))];

  const view = {
    searchCriteria: { type: machineTypes[0], start: ValletData.today, end: ValletData.today },
    hasSearched: false,
    periodReasons: [],
    openBookingRef: null,
    bookingReasons: [],
    searchMessage: null,
    reservationsMessage: null,
    openReservationId: null,
    drafts: {},
    certificateId: null,
    workshopMessage: null,
    workshopReasonsByRef: {},
    vgpReasonsByRef: {},
    salesMessage: null,
    salesReasonsByRef: {},
    loginError: null,
    loginEmail: '',
    screen: 'login',
    publicTab: 'rent',
    publicCriteria: { type: machineTypes[0], start: ValletData.today, end: ValletData.today },
    publicSearched: false,
    publicBookingRef: null,
    publicReasons: [],
    publicMessage: null,
    usedRequestRef: null,
    usedReasons: [],
    usedMessage: null,
  };

  const storage = {
    read: () => {
      try {
        return window.sessionStorage.getItem(SESSION_KEY);
      } catch (error) {
        return null;
      }
    },
    write: (email) => {
      try {
        window.sessionStorage.setItem(SESSION_KEY, email);
      } catch (error) {
        return;
      }
    },
    clear: () => {
      try {
        window.sessionStorage.removeItem(SESSION_KEY);
      } catch (error) {
        return;
      }
    },
  };

  const screens = {
    login: document.getElementById('login-screen'),
    app: document.getElementById('app-shell'),
    public: document.getElementById('public-screen'),
  };

  const panels = {
    'panel-search': ValletViews.search,
    'panel-reservations': ValletViews.reservations,
    'panel-workshop': ValletViews.workshop,
    'panel-sales': ValletViews.sales,
  };

  const describeRole = (user) => (user.agency ? `${user.role} · ${user.agency}` : user.role);

  const app = {
    view,
    machineTypes,
    describeRole,
    getState: () => state,
    setState: (nextState) => {
      state = nextState;
    },
    getUser: () => currentUser,
  };

  const showScreen = (name) => {
    view.screen = name;
    Object.entries(screens).forEach(([screenName, element]) => {
      element.hidden = screenName !== name;
    });
  };

  const renderUserArea = () => {
    document.getElementById('user-area').replaceChildren(
      avatar(currentUser.name, 'user__avatar'),
      createElement('div', { className: 'user__identity' }, [
        createElement('span', { className: 'user__name', textContent: currentUser.name }),
        createElement('span', { className: 'user__role', textContent: describeRole(currentUser) }),
      ]),
      button('Se déconnecter', () => app.signOut()),
    );
  };

  const renderTabCounters = () => {
    const alertCount = ValletFleet.vgpAlerts(state).length;
    document.getElementById('tab-workshop-label').textContent = alertCount > 0 ? `Atelier (${alertCount})` : 'Atelier';
    document.getElementById('tab-workshop').classList.toggle('tabs__tab--alert', alertCount > 0);
  };

  const renderCertificate = () => {
    const container = document.getElementById('certificate-root');
    const certificate = view.certificateId === null ? null : ValletViews.certificate(app, view.certificateId);
    container.replaceChildren(...(certificate ? [certificate] : []));
    document.body.classList.toggle('has-certificate', Boolean(certificate));
  };

  app.render = () => {
    if (view.screen === 'public') {
      screens.public.replaceChildren(...ValletViews.publicSpace(app).filter(Boolean));
      return;
    }
    if (view.screen === 'login') {
      screens.login.replaceChildren(...ValletViews.login(app).filter(Boolean));
      return;
    }
    renderUserArea();
    renderTabCounters();
    Object.entries(panels).forEach(([panelId, renderPanel]) => {
      document.getElementById(panelId).replaceChildren(...renderPanel(app).filter(Boolean));
    });
    renderCertificate();
  };

  const selectTab = (selectedTab) => {
    document.querySelectorAll('.tabs__tab').forEach((tab) => {
      const isSelected = tab === selectedTab;
      tab.setAttribute('aria-selected', String(isSelected));
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !isSelected;
    });
  };

  app.openCertificate = (reservationId) => {
    view.certificateId = reservationId;
    renderCertificate();
  };

  app.closeCertificate = () => {
    view.certificateId = null;
    renderCertificate();
  };

  app.showLogin = () => {
    showScreen('login');
    app.render();
    const emailInput = document.getElementById('login-email');
    if (emailInput) {
      emailInput.focus();
    }
  };

  app.showPublic = (tab) => {
    view.publicTab = tab;
    showScreen('public');
    app.render();
  };

  app.signIn = (user) => {
    currentUser = user;
    storage.write(user.email);
    view.loginError = null;
    view.loginEmail = '';
    selectTab(document.getElementById('tab-search'));
    showScreen('app');
    app.render();
  };

  app.signOut = () => {
    currentUser = null;
    storage.clear();
    view.certificateId = null;
    renderCertificate();
    app.showLogin();
  };

  document.querySelectorAll('.tabs__tab').forEach((tab) => {
    tab.addEventListener('click', () => selectTab(tab));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && view.certificateId !== null) {
      app.closeCertificate();
    }
  });

  const sessionEmail = storage.read();
  const sessionUser = sessionEmail ? ValletAuth.findUser(ValletData.users, sessionEmail) : null;
  if (sessionUser) {
    currentUser = sessionUser;
    showScreen('app');
    app.render();
  } else {
    app.showLogin();
  }
})();
