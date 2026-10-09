var ValletModal = (() => {
  const FOCUSABLE = 'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

  const trapFocus = (dialog) => {
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') {
        return;
      }
      const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter((element) => !element.disabled && element.offsetParent !== null);
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
  };

  const build = (app, content, titleId) => {
    const { createElement } = ValletDom;
    const closeButton = createElement('button', {
      type: 'button',
      className: 'modal__close',
      'aria-label': 'Fermer la fiche',
      title: 'Fermer (Échap)',
      textContent: '×',
      onClick: () => app.closeModal(),
    });
    const dialog = createElement('div', {
      className: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, tabindex: '-1',
    }, [closeButton, content]);
    trapFocus(dialog);
    const overlay = createElement('div', { className: 'modal-overlay' }, [dialog]);
    let pressStartedOnBackdrop = false;
    overlay.addEventListener('pointerdown', (event) => {
      pressStartedOnBackdrop = event.target === overlay;
    });
    overlay.addEventListener('click', (event) => {
      if (pressStartedOnBackdrop && event.target === overlay) {
        app.closeModal();
      }
    });
    return { overlay, dialog };
  };

  const contentFor = (app) => {
    const { view } = app;
    const state = app.getState();
    if (view.screen !== 'app') {
      return null;
    }
    if (view.openReservationId !== null) {
      const reservation = ValletRules.findReservation(state, view.openReservationId);
      return reservation ? { node: ValletViews.reservationDetail(app, reservation), titleId: 'reservation-dialog-title' } : null;
    }
    if (view.openMachineRef !== null) {
      const history = ValletMachines.history(state, view.openMachineRef);
      return history ? { node: ValletViews.machineDetail(app, history), titleId: 'machine-dialog-title' } : null;
    }
    return null;
  };

  const create = (app) => {
    const { view } = app;
    let focusBeforeModal = null;

    const render = () => {
      const root = document.getElementById('modal-root');
      const content = contentFor(app);
      if (!content) {
        root.replaceChildren();
        document.body.classList.remove('has-modal');
        return;
      }
      const previousOverlay = root.querySelector('.modal-overlay');
      const wasOpen = Boolean(previousOverlay);
      const previousScroll = wasOpen ? previousOverlay.scrollTop : 0;
      const focusWasInside = wasOpen && root.contains(document.activeElement);
      const { overlay, dialog } = build(app, content.node, content.titleId);
      root.replaceChildren(overlay);
      document.body.classList.add('has-modal');
      overlay.scrollTop = view.modalScrollToTop ? 0 : previousScroll;
      view.modalScrollToTop = false;
      if (view.modalScrollToMessage) {
        view.modalScrollToMessage = false;
        const message = dialog.querySelector('.message--error, .message--success, .message--warning');
        if (message) {
          message.scrollIntoView({ block: 'center' });
        }
      }
      if (!wasOpen || focusWasInside || document.activeElement === document.body) {
        dialog.focus({ preventScroll: true });
      }
    };

    const remember = () => {
      if (!document.getElementById('modal-root').contains(document.activeElement)) {
        focusBeforeModal = document.activeElement;
      }
    };

    const openReservation = (reservationId) => {
      remember();
      view.openMachineRef = null;
      view.openReservationId = reservationId;
      view.modalScrollToTop = true;
      app.render();
    };

    const openMachine = (ref) => {
      remember();
      view.openReservationId = null;
      view.openMachineRef = ref;
      view.modalScrollToTop = true;
      app.render();
    };

    const close = () => {
      const focusKey = focusBeforeModal && focusBeforeModal.dataset ? focusBeforeModal.dataset.focusKey : null;
      view.openReservationId = null;
      view.openMachineRef = null;
      app.render();
      const target = focusKey ? document.querySelector(`[data-focus-key="${focusKey}"]`) : focusBeforeModal;
      if (target && document.body.contains(target)) {
        target.focus();
      }
      focusBeforeModal = null;
    };

    const isOpen = () => view.openReservationId !== null || view.openMachineRef !== null;

    return { render, openReservation, openMachine, close, isOpen };
  };

  return { create };
})();
