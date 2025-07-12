'use strict';

/*
 * baza.js - tiny powerful two-way data binding lib
 * @version 0.2.0
 * @author Vitaliy (Vi+) Yermolenko
 */

class Baza {
  #root;
  #listeners;
  #model;

  constructor(initialModel = {}, rootSelector = 'body') {
    this.#listeners = {};
    this.#root = document.querySelector(rootSelector);

    this.#model = new Proxy(initialModel, {
      set: (target, prop, value) => {
        const old = target[prop];
        target[prop] = value;
        if (old !== value) {
          this.#syncView(prop);
          this.#notify(prop, value, old);
        }
        return true;
      },
      get: (target, prop) => target[prop]
    });


    this.#bindAll();

    this.#model.hidden = true;
  }


  on(prop, fn) {
    (this.#listeners[prop] ||= []).push(fn);
  }


  // user listeners
  #notify(prop, val, old) {
    (this.#listeners[prop] || []).forEach(fn => fn(val, old));
  }


  get model() {
    return this.#model;
  }


  #bindAll() {
    try {
      [...this.#root.querySelectorAll('[baza-bind]')].forEach(el => {
        const prop = el.getAttribute('baza-bind');
        if (el.type === 'radio') {
          el.checked = el.value === this.#model[prop];
          el.addEventListener('change', () => {
            if (el.checked) this.#model[prop] = el.value;
          });
        } else if (el.type === 'checkbox') {
          el.checked = Boolean(this.#model[prop]);
          el.addEventListener('change', () => {
            this.#model[prop] = el.checked;
          });
        } else {
          el.value = this.#model[prop] ?? '';
          el.addEventListener('input', () => {
            this.#model[prop] = el.value;
          });
        }
      });
    } catch (err) {
      console.error("#bindAll error:", err);
    }
  }

  // updating DOM
  #syncView(prop) {
    try {
      [...this.#root.querySelectorAll(`[baza-bind="${prop}"]`)].forEach(el => {
        if (el.type === 'radio') {
          el.checked = el.value === this.#model[prop];
        } else if (el.type === 'checkbox') {
          el.checked = Boolean(this.#model[prop]);
        } else {
          el.value = this.#model[prop] ?? '';
          if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) {
            el.textContent = this.#model[prop];
          }
        }
      });

      // toggling .hidden on the whole instance root
      if (prop === 'hidden') {
        this.#root.classList.toggle('hidden', Boolean(this.#model.hidden));
      }

    } catch (err) {
      console.error("#syncView error:", err);
    }
  }
}

window.Baza = Baza;
