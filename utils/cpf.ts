
/**
 * S.I.E PRO - CPF/CNPJ Utility Protocol
 * SRE Standardized V4.0
 */

// FIX: Added explicit exports for CPF utility functions
export const normalizeCPF = (cpf: string): string => {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
};

// FIX: Added checksum validation for CPF
export const validateCPF = (cpf: string): boolean => {
  const clean = normalizeCPF(cpf);
  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(clean.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(clean.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(10, 11))) return false;

  return true;
};

// FIX: Added format helper for CPF mask
export const formatCPF = (cpf: string): string => {
  const clean = normalizeCPF(cpf);
  return clean
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};
