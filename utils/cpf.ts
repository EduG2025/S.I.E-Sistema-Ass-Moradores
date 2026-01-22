/**
 * S.I.E PRO - CPF/CNPJ Utility Protocol
 * SRE Standardized V6.2 - High Precision Validator
 */

export const normalizeCPF = (cpf: string): string => {
  if (!cpf) return '';
  return String(cpf).replace(/\D/g, '');
};

export const validateCPF = (cpf: string): boolean => {
  const clean = normalizeCPF(cpf);
  
  if (!clean || clean.length !== 11) return false;

  // Bloqueia sequências repetitivas conhecidas como inválidas
  if (/^(\d)\1+$/.test(clean)) return false;

  // Validação do Primeiro Dígito Verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9))) return false;

  // Validação do Segundo Dígito Verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10))) return false;

  return true;
};

export const formatCPF = (cpf: string): string => {
  const clean = normalizeCPF(cpf);
  if (!clean) return '';
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  }
  return clean;
};

export const formatCEP = (cep: string): string => {
  return cep.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2');
};