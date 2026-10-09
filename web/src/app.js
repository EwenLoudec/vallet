(() => {
  const { createElement, avatar, button } = ValletDom;
  const SESSION_KEY = 'vallet.session';

  let state = JSON.parse(JSON.stringify({
    today: ValletData.today,
    machines: ValletData.machines,
    reservations: ValletData.reservations,
    leads: ValletData.leads,
    keyAccounts: ValletData.keyAccounts,
    inboxRead: ValletData.inboxRead,
    journal: ValletData.journal,
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
    document: null,
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
    planningAgency: '',
    inboxOpen: false,
    clientCriteria: { type: machineTypes[0], start: ValletData.today, end: ValletData.today },
    clientSearched: false,
  };

  const allUsers = [...ValletData.users, ...ValletData.clientUsers];

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
    client: document.getElementById('client-screen'),
  };

  const panels = {
    'panel-search': ValletViews.search,
    'panel-reservations': ValletViews.reservations,
    'panel-planning': ValletViews.planning,
    'panel-workshop': ValletViews.workshop,
    'panel-sales': ValletViews.sales,
    'panel-dashboard': ValletViews.dashboard,
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
    commit: (nextState, text) => {
      state = ValletJournal.record(nextState, currentUser ? currentUser.name : 'Visiteur', text);
    },
    commitAs: (nextState, author, text) => {
      state = ValletJournal.record(nextState, author, text);
    },
    getUser: () => currentUser,
    allUsers,
  };

  const showScreen = (name) => {
    view.screen = name;
    Object.entries(screens).forEach(([screenName, element]) => {
      element.hidden = screenName !== name;
    });
  };

  const renderUserArea = () => {
    document.getElementById('user-area').replaceChildren(
      ...[ValletViews.inbox(app)].filter(Boolean),
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
    const documentViews = { certificate: ValletViews.certificate, handover: ValletViews.handover };
    const certificate = view.document === null ? null : documentViews[view.document.kind](app, view.document.id);
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
    if (view.screen === 'client') {
      screens.client.replaceChildren(...ValletViews.client(app).filter(Boolean));
      renderCertificate();
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
    view.document = { kind: 'certificate', id: reservationId };
    renderCertificate();
  };

  app.closeCertificate = () => {
    view.document = null;
    renderCertificate();
  };

  app.openHandover = (reservationId) => {
    view.document = { kind: 'handover', id: reservationId };
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

  app.openReservation = (reservationId) => {
    view.openReservationId = reservationId;
    view.reservationsMessage = null;
    selectTab(document.getElementById('tab-reservations'));
    app.render();
    const detail = document.querySelector('#panel-reservations .detail');
    if (detail) {
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const enter = (user) => {
    currentUser = user;
    view.planningAgency = user.agency || '';
    view.inboxOpen = false;
    if (user.keyAccountId) {
      showScreen('client');
      app.render();
      return;
    }
    selectTab(document.getElementById('tab-search'));
    showScreen('app');
    app.render();
  };

  app.signIn = (user) => {
    storage.write(user.email);
    view.loginError = null;
    view.loginEmail = '';
    enter(user);
  };

  app.signOut = () => {
    currentUser = null;
    storage.clear();
    view.inboxOpen = false;
    view.clientSearched = false;
    view.document = null;
    renderCertificate();
    app.showLogin();
  };

  document.querySelectorAll('.tabs__tab').forEach((tab) => {
    tab.addEventListener('click', () => selectTab(tab));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && view.document !== null) {
      app.closeCertificate();
    }
  });

  const sessionEmail = storage.read();
  const sessionUser = sessionEmail ? ValletAuth.findUser(allUsers, sessionEmail) : null;
  if (sessionUser) {
    enter(sessionUser);
  } else {
    app.showLogin();
  }
})();
