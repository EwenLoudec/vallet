ValletViews.inbox = (app) => {
  const { createElement, button, emptyState } = ValletDom;
  const { view } = app;
  const user = app.getUser();
  if (!user || !user.agency) {
    return null;
  }
  const state = app.getState();
  const messages = ValletInbox.messagesFor(state, user.agency);
  const unread = messages.filter((message) => !message.read).length;

  const bell = createElement('button', {
    type: 'button',
    className: unread > 0 ? 'bell bell--unread' : 'bell',
    'aria-expanded': String(view.inboxOpen),
    'aria-label': `Notifications : ${unread} non lue${unread > 1 ? 's' : ''}`,
    onClick: () => {
      view.inboxOpen = !view.inboxOpen;
      app.render();
    },
  });
  bell.innerHTML = '<svg class="bell__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>';
  if (unread > 0) {
    bell.append(createElement('span', { className: 'bell__count', textContent: String(unread) }));
  }

  const markRead = (key) => {
    app.setState(ValletInbox.markRead(app.getState(), user.agency, key));
    app.render();
  };

  const panel = view.inboxOpen ? createElement('div', { className: 'inbox', role: 'region', 'aria-label': `Notifications de ${user.agency}` }, [
    createElement('div', { className: 'inbox__header' }, [
      createElement('strong', { textContent: `Notifications · ${user.agency}` }),
      unread > 0 ? button('Tout marquer comme lu', () => {
        app.setState(ValletInbox.markAllRead(app.getState(), user.agency));
        app.render();
      }) : null,
    ]),
    messages.length === 0
      ? emptyState('Aucune notification.')
      : createElement('ul', { className: 'inbox__list' }, messages.map((message) => createElement('li', { className: message.read ? 'inbox__item' : 'inbox__item is-unread' }, [
        createElement('span', { className: `badge badge--${message.kind === 'relocate' ? 'warning' : 'info'}`, textContent: message.kind === 'relocate' ? 'À replacer' : 'Réservation' }),
        createElement('p', { className: 'inbox__text', textContent: message.text }),
        createElement('div', { className: 'button-group' }, [
          button('Voir la fiche', () => {
            view.inboxOpen = false;
            app.setState(ValletInbox.markRead(app.getState(), user.agency, message.key));
            app.openReservation(message.reservationId);
          }),
          message.read ? null : button('Marquer comme lu', () => markRead(message.key)),
        ]),
      ]))),
  ]) : null;

  return createElement('div', { className: 'inbox-anchor' }, [bell, panel]);
};
