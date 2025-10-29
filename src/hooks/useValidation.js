import { useState, useCallback } from 'react';

export const useValidation = (rules) => {
  const [errors, setErrors] = useState({});

  const validate = useCallback((data) => {
    const newErrors = {};
    for (const key in rules) {
      if (rules.hasOwnProperty(key)) {
        const rule = rules[key];
        const value = data?.[key];

        if (rule?.required && (!value || (typeof value === 'string' && !value.trim()))) {
          newErrors[key] = rule.message || `${key} é obrigatório.`;
        }
        
        if (rule?.minLength && value && value.length < rule.minLength) {
            newErrors[key] = `Deve ter pelo menos ${rule.minLength} caracteres.`;
        }

        if (rule?.isNumeric && value && isNaN(Number(value))) {
            newErrors[key] = 'Deve ser um valor numérico.';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rules]);

  const validateField = useCallback((name, value) => {
    const rule = rules?.[name];
    if (!rule) return;

    let error = null;
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      error = rule.message || `${name} é obrigatório.`;
    } else if (rule.minLength && value && value.length < rule.minLength) {
      error = `Deve ter pelo menos ${rule.minLength} caracteres.`;
    } else if (rule.isNumeric && value && isNaN(Number(value))) {
      error = 'Deve ser um valor numérico.';
    }

    setErrors(prev => ({ ...prev, [name]: error }));
  }, [rules]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return { errors, validate, validateField, clearErrors };
};