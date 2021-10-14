function Validator(options) {
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    };

    var selectorRules = {};

    // Cancel Error Message
    function removeInvalid(errorSelector, inputElement) {
        var erorrElement = getParent(inputElement, options.formGroupSelector).querySelector(errorSelector);
        erorrElement.innerText = '';
        getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
    }

    function addInvalid(errorSelector, inputElement, errorMessage) {
        var erorrElement = getParent(inputElement, options.formGroupSelector).querySelector(errorSelector);
        erorrElement.innerText = errorMessage;
        getParent(inputElement, options.formGroupSelector).classList.add('invalid');
    }

    function validate(errorSelector, inputElement, rule) {
        var errorMessage;
        var rules = selectorRules[rule.selector];

        for (let i = 0; i < rules.length; ++i) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](formElement.querySelector(rule.selector + ':checked'));
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }

            if (errorMessage) break;
        }

        if (errorMessage) {
            addInvalid(errorSelector, inputElement, errorMessage)
        } else {
            removeInvalid(errorSelector, inputElement);
        }

        return !errorMessage;
    };

    // Get formElement is validated
    var formElement = document.querySelector(options.form);
    var errorSelector = options.errorSelector;
    if (formElement) {
        formElement.onsubmit = e => {
            e.preventDefault();
            let isFormValid = true;
            options.rules.forEach(rule => {
                var inputElement = formElement.querySelector(rule.selector);
                let isValid = validate(errorSelector, inputElement, rule);
                if (!isValid) {
                    isFormValid = false;
                }
            });

            if (isFormValid) {
                if (typeof options.onSubmit === 'function') {
                    let enableInputs = formElement.querySelectorAll('[name]');
                    let formValues = Array.from(enableInputs).reduce((values, input) => {
                        switch (input.type) {
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                }
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'radio':
                                values[input.name] = formElement.querySelector(`input[name="${input.name}"]:checked`).value;
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values
                    }, {});

                    options.onSubmit(formValues);
                } else {
                    formElement.submit();
                }
            }
        };

        options.rules.forEach(rule => {
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach(inputElement => {
                // Handle when user blur without input
                inputElement.onblur = () => validate(errorSelector, inputElement, rule);

                // Handle when user typing in input
                inputElement.oninput = () => removeInvalid(errorSelector, inputElement);
            });
        });
    }
}

// Define rules
Validator.isRequired = (selector, message) => ({
    selector: selector,
    test: value => {
        if (typeof value === 'string') {
            return value.trim() ? undefined : message || "Please fill out this field";
        }
        return value ? undefined : message || "Please fill out this field";
    }

})

Validator.isEmail = (selector, message) => ({
    selector: selector,
    test: value => {
        var regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        return regex.test(value) ? '' : message || "This field is a invalid email";
    }
})

Validator.minLength = (selector, min, message) => ({
    selector: selector,
    test: value => value.length >= min ? undefined : message || `Please enter at least ${min} characters`
})

Validator.isConfirmed = (selector, getConfirmValue, message) => ({
    selector: selector,
    test: value => value === getConfirmValue() ? undefined : message || 'This field did not match'
})

// console.log