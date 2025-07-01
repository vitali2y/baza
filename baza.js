/*
 * baza.js - simple two-way data binding lib
 * @version 0.1.0
 * @author Vitaliy (Vi+) Yermolenko
 */

(() => {
    // defining binding handlers
    const bindingHandlers = {
        value: (element, value) => {
            if (element.type === 'checkbox') {
                element.checked = !!value;
            } else if (element.type === 'radio') {
                element.checked = element.value === value;
            } else {
                element.value = value !== undefined ? value : '';
            }
        },
        text: (element, value) => {
            element.textContent = value !== undefined ? value : '';
        },
        checked: (element, value) => {
            if (element.type === 'radio') {
                element.checked = element.value === value;
            } else {
                element.checked = !!value;
            }
        },
        visible: (element, value) => {
            element.classList.toggle('hidden', !value);
        },
        disabled: (element, value) => {
            element.disabled = !!value;
        }
    };

    let model;

    // updatng all bindings when data changes
    function updateBindings(changedKey) {
        document.querySelectorAll('[data-bind]').forEach(element => {
            try {
                const bindings = element.getAttribute('data-bind').split(';');
                bindings.forEach(binding => {
                    const [type, key] = binding.split(':').map(s => s.trim());
                    if (changedKey === undefined || key === changedKey) {
                        const handler = bindingHandlers[type];
                        if (handler) {
                            handler(element, model[key]);
                        } else {
                            console.warn(`no binding handler found for type: ${type}`);
                        }
                    }
                });
            } catch (error) {
                console.error("error updating bindings:", error);
            }
        });
    }

    // setting up event listeners for two-way binding
    function initializeBindings() {
        document.querySelectorAll('[data-bind]').forEach(element => {
            try {
                const bindings = element.getAttribute('data-bind').split(';');
                bindings.forEach(binding => {
                    const [type, key] = binding.split(':').map(s => s.trim());
                    if (type === 'value' || type === 'checked') {
                        const event = element.type === 'checkbox' || element.type === 'radio' ? 'change' : 'input';
                        element.addEventListener(event, () => {
                            try {
                                if (element.type === 'checkbox') {
                                    model[key] = element.checked;
                                } else if (element.type === 'radio' && element.checked) {
                                    model[key] = element.value;
                                } else {
                                    model[key] = element.type === 'number' ?
                                        Number(element.value) : element.value;
                                }
                            } catch (error) {
                                console.error("error handling input change:", error);
                            }
                        });
                    }
                });
            } catch (error) {
                console.error("error init bindings:", error);
            }
        });
    }

    // centralized action handling
    function handleAction(action) {
        if (typeof model[action] === 'function') {
            model[action]();
        } else {
            console.warn(`no action found for: ${action}`);
        }
    }

    function attachActionListeners() {
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                handleAction(action);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const script = document.querySelector('script[src="baza.js"]');
        const modelName = script.dataset.model;

        if (!modelName) {
            console.error("no data-model attr found on script tag");
            return;
        }

        let initialModel = window[modelName];

        if (!initialModel) {
            console.error(`model "${modelName}" not found in window scope`);
            return;
        }

        // proxy the model to trigger updates
        model = new Proxy(initialModel, {
            set(target, key, value) {
                if (target[key] !== value) {
                    target[key] = value;
                    updateBindings(key);
                    return true;
                }
                return true;
            }
        });

        window[modelName] = model;

        initializeBindings();
        attachActionListeners();
        updateBindings();
    });
})();
