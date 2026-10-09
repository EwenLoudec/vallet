ValletViews.login = (app) => {
  const { createElement, field, avatar } = ValletDom;
  const { view } = app;

  const emailInput = createElement('input', {
    className: 'field__input', type: 'email', name: 'email', id: 'login-email', value: view.loginEmail, autocomplete: 'username',
  });
  const passwordInput = createElement('input', {
    className: 'field__input', type: 'password', name: 'password', id: 'login-password', autocomplete: 'current-password',
  });

  const form = createElement('form', {
    className: 'login__form',
    onSubmit: () => {
      const result = ValletAuth.authenticate(ValletData.users, emailInput.value, passwordInput.value);
      if (!result.ok) {
        view.loginError = result.message;
        view.loginEmail = emailInput.value;
        app.showLogin();
        return;
      }
      app.signIn(result.user);
    },
  }, [
    createElement('h2', { className: 'login__title', textContent: 'Connexion' }),
    createElement('p', { className: 'login__intro', textContent: 'Connectez-vous pour rechercher et réserver une machine dans les 7 agences.' }),
    view.loginError ? createElement('div', { className: 'message message--error', role: 'alert', textContent: view.loginError }) : null,
    field('E-mail', emailInput),
    field('Mot de passe', passwordInput),
    createElement('button', { type: 'submit', className: 'button button--primary button--block', textContent: 'Se connecter' }),
  ]);

  const demoAccounts = createElement('div', { className: 'login__demo' }, [
    createElement('p', { className: 'login__demo-title', textContent: 'Comptes de démonstration' }),
    createElement('p', { className: 'login__demo-hint', textContent: `Mot de passe commun : ${ValletData.demoPassword}` }),
    createElement('div', { className: 'login__accounts' }, ValletData.users.map((user) => createElement('button', {
      type: 'button',
      className: 'account',
      onClick: () => {
        emailInput.value = user.email;
        passwordInput.value = ValletData.demoPassword;
        passwordInput.focus();
      },
    }, [
      avatar(user.name, 'account__avatar'),
      createElement('span', { className: 'account__identity' }, [
        createElement('span', { className: 'account__name', textContent: user.name }),
        createElement('span', { className: 'account__role', textContent: app.describeRole(user) }),
      ]),
    ]))),
  ]);

  const publicLinks = createElement('div', { className: 'login__public' }, [
    createElement('p', { className: 'login__demo-title', textContent: 'Vous êtes client ?' }),
    createElement('div', { className: 'login__public-links' }, [
      createElement('button', { type: 'button', className: 'button button--block-light', textContent: 'Particuliers : réserver en ligne', onClick: () => app.showPublic('rent') }),
      createElement('button', { type: 'button', className: 'button button--block-light', textContent: "Machines d'occasion", onClick: () => app.showPublic('used') }),
    ]),
  ]);

  return [
    createElement('div', { className: 'login__brand' }, [
      createElement('span', { className: 'brand__mark brand__mark--large', 'aria-hidden': 'true', textContent: 'VL' }),
      createElement('h1', { className: 'login__brand-title', textContent: 'Vallet Location' }),
      createElement('p', { className: 'login__brand-subtitle', textContent: 'Réservations multi-agences' }),
      createElement('p', { className: 'login__brand-detail', textContent: '7 agences en Auvergne-Rhône-Alpes, un seul planning.' }),
    ]),
    createElement('div', { className: 'login__panel' }, [
      createElement('div', { className: 'login__card' }, [form, demoAccounts, publicLinks]),
    ]),
  ];
};
