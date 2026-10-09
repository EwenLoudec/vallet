ValletViews.reservationModal = (app, reservation) => {
  const { createElement } = ValletDom;

  const closeButton = createElement('button', {
    type: 'button',
    className: 'modal__close',
    'aria-label': 'Fermer la fiche',
    title: 'Fermer (Échap)',
    textContent: '×',
    onClick: () => app.closeReservation(),
  });

  const dialog = createElement('div', {
    className: 'modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'reservation-dialog-title',
    tabindex: '-1',
  }, [closeButton, ValletViews.reservationDetail(app, reservation)]);

  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') {
      return;
    }
    const focusable = [...dialog.querySelectorAll('button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.disabled && element.offsetParent !== null);
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const overlay = createElement('div', { className: 'modal-overlay' }, [dialog]);
  let pressStartedOnBackdrop = false;
  overlay.addEventListener('pointerdown', (event) => {
    pressStartedOnBackdrop = event.target === overlay;
  });
  overlay.addEventListener('click', (event) => {
    if (pressStartedOnBackdrop && event.target === overlay) {
      app.closeReservation();
    }
  });

  return { overlay, dialog };
};
