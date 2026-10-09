var ValletDom = (() => {
  const DIRECT_PROPERTIES = ['className', 'textContent', 'value', 'type', 'id', 'name', 'checked', 'disabled', 'min', 'max', 'step', 'accept', 'multiple', 'htmlFor'];

  const createElement = (tag, properties, children) => {
    const element = document.createElement(tag);
    Object.entries(properties || {}).forEach(([name, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      if (name === 'onClick') {
        element.addEventListener('click', value);
        return;
      }
      if (name === 'onChange') {
        element.addEventListener('change', value);
        return;
      }
      if (name === 'onSubmit') {
        element.addEventListener('submit', (event) => {
          event.preventDefault();
          value(event);
        });
        return;
      }
      if (DIRECT_PROPERTIES.includes(name)) {
        element[name] = value;
        return;
      }
      element.setAttribute(name, value);
    });
    (children || []).forEach((child) => {
      if (child === null || child === undefined || child === false) {
        return;
      }
      element.append(typeof child === 'string' || typeof child === 'number' ? document.createTextNode(String(child)) : child);
    });
    return element;
  };

  const button = (label, onClick, variant) => createElement('button', {
    type: 'button',
    className: variant ? `button button--${variant}` : 'button',
    textContent: label,
    onClick,
  });

  const submitButton = (label) => createElement('button', { type: 'submit', className: 'button button--primary', textContent: label });

  const field = (label, input, hint) => createElement('label', { className: 'field' }, [
    createElement('span', { className: 'field__label', textContent: label }),
    input,
    hint ? createElement('span', { className: 'field__hint', textContent: hint }) : null,
  ]);

  const dateInput = (name, value) => createElement('input', { className: 'field__input', type: 'date', name, value: value || '' });

  const textInput = (name, value, type) => createElement('input', { className: 'field__input', type: type || 'text', name, value: value || '' });

  const amountInput = (name, value) => createElement('input', {
    className: 'field__input', type: 'number', name, value: value || '', min: '0', step: '0.01', inputmode: 'decimal',
  });

  const textArea = (name, value) => createElement('textarea', { className: 'field__input field__input--area', name, value: value || '', rows: '2' });

  const selectInput = (name, options, selectedValue, placeholder) => createElement('select', { className: 'field__input', name }, [
    placeholder ? createElement('option', { value: '', textContent: placeholder }) : null,
    ...options.map((option) => {
      const value = typeof option === 'string' ? option : option.value;
      const label = typeof option === 'string' ? option : option.label;
      const optionElement = createElement('option', { value, textContent: label });
      optionElement.selected = value === selectedValue;
      return optionElement;
    }),
  ]);

  const checkbox = (name, label, isChecked) => createElement('label', { className: 'checkbox' }, [
    createElement('input', { type: 'checkbox', name, checked: Boolean(isChecked) }),
    createElement('span', { textContent: label }),
  ]);

  const reasonList = (reasons) => createElement('ul', { className: 'reasons' }, reasons.map((reason) => createElement('li', { textContent: reason.message })));

  const errorMessage = (reasons) => createElement('div', { className: 'message message--error', role: 'alert' }, [
    createElement('strong', { textContent: 'Refusé :' }),
    reasonList(reasons),
  ]);

  const flashMessage = (message) => {
    if (!message) {
      return null;
    }
    return createElement('div', { className: `message message--${message.kind}`, role: message.kind === 'error' ? 'alert' : 'status', textContent: message.text });
  };

  const table = (headers, rows) => createElement('div', { className: 'table-wrapper' }, [
    createElement('table', { className: 'table' }, [
      createElement('thead', {}, [createElement('tr', {}, headers.map((header) => createElement('th', { textContent: header })))]),
      createElement('tbody', {}, rows),
    ]),
  ]);

  const cell = (content, className) => createElement('td', className ? { className } : {}, Array.isArray(content) ? content : [content]);

  const refCell = (ref) => cell(ref, 'table__ref');

  const actionCell = (content) => cell(content, 'table__action');

  const badge = (label, kind) => createElement('span', { className: `badge badge--${kind}`, textContent: label });

  const initialsOf = (name) => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const avatar = (name, className) => createElement('span', { className, 'aria-hidden': 'true', textContent: initialsOf(name) });

  const formatEuros = (amount) => `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;

  const emptyState = (text) => createElement('p', { className: 'empty', textContent: text });

  const photoGallery = (photos, emptyText) => {
    if (!photos || photos.length === 0) {
      return emptyState(emptyText);
    }
    return createElement('div', { className: 'gallery' }, photos.map((photo) => createElement('figure', { className: 'gallery__item' }, [
      createElement('img', { className: 'gallery__image', src: photo.url, alt: photo.name }),
      createElement('figcaption', { className: 'gallery__caption', textContent: photo.name }),
    ])));
  };

  const photoPicker = (label, photos) => {
    const gallery = createElement('div', { className: 'gallery gallery--small' });
    const counter = createElement('span', { className: 'field__hint' });
    const refresh = () => {
      gallery.replaceChildren(...photos.map((photo) => createElement('figure', { className: 'gallery__item' }, [
        createElement('img', { className: 'gallery__image', src: photo.url, alt: photo.name }),
      ])));
      counter.textContent = photos.length === 0 ? 'Aucune photo pour le moment.' : `${photos.length} photo(s) ajoutée(s).`;
    };
    const input = createElement('input', {
      className: 'photo-picker__input', type: 'file', accept: 'image/*', multiple: true, capture: 'environment',
      onChange: (event) => {
        [...event.target.files].forEach((file) => photos.push({ name: file.name, url: URL.createObjectURL(file) }));
        event.target.value = '';
        refresh();
      },
    });
    refresh();
    return createElement('div', { className: 'field photo-picker' }, [
      createElement('span', { className: 'field__label', textContent: label }),
      createElement('label', { className: 'button photo-picker__button' }, [input, 'Prendre ou ajouter des photos']),
      counter,
      gallery,
    ]);
  };

  const SIGNATURE_WIDTH = 480;
  const SIGNATURE_HEIGHT = 160;

  const signaturePad = (label, signature) => {
    const canvas = createElement('canvas', {
      className: 'signature__canvas',
      width: String(SIGNATURE_WIDTH),
      height: String(SIGNATURE_HEIGHT),
      role: 'img',
      'aria-label': `${label} : dessinez la signature dans ce cadre`,
    });
    const context = canvas.getContext('2d');
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#1d1f2e';
    if (signature.image) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0);
      image.src = signature.image;
    }
    let isDrawing = false;
    const pointFrom = (event) => {
      const bounds = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - bounds.left) / bounds.width) * SIGNATURE_WIDTH,
        y: ((event.clientY - bounds.top) / bounds.height) * SIGNATURE_HEIGHT,
      };
    };
    canvas.addEventListener('pointerdown', (event) => {
      isDrawing = true;
      canvas.setPointerCapture(event.pointerId);
      const point = pointFrom(event);
      context.beginPath();
      context.moveTo(point.x, point.y);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!isDrawing) {
        return;
      }
      const point = pointFrom(event);
      context.lineTo(point.x, point.y);
      context.stroke();
    });
    const finish = () => {
      if (!isDrawing) {
        return;
      }
      isDrawing = false;
      signature.image = canvas.toDataURL('image/png');
    };
    canvas.addEventListener('pointerup', finish);
    canvas.addEventListener('pointercancel', finish);
    return createElement('div', { className: 'field signature' }, [
      createElement('span', { className: 'field__label', textContent: label }),
      canvas,
      button('Effacer la signature', () => {
        context.clearRect(0, 0, SIGNATURE_WIDTH, SIGNATURE_HEIGHT);
        signature.image = '';
      }),
    ]);
  };

  const formValue = (form, name) => (form.elements[name] ? form.elements[name].value : '');

  return {
    createElement,
    button,
    submitButton,
    field,
    dateInput,
    textInput,
    amountInput,
    textArea,
    selectInput,
    checkbox,
    reasonList,
    errorMessage,
    flashMessage,
    table,
    cell,
    refCell,
    actionCell,
    badge,
    initialsOf,
    avatar,
    formatEuros,
    emptyState,
    photoGallery,
    photoPicker,
    signaturePad,
    formValue,
  };
})();

var ValletViews = {};
