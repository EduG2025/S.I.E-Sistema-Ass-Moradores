
/**
 * S.I.E PRO - CPF/CNPJ/CEP Utility Protocol
 * SRE Standardized V6.1
 * Padronizado exclusivamente para Named Exports para evitar falhas de mangling no build.
 */

export const normalizeCPF = (cpf: string): string => {
  if (!cpf) return '';
  return String(cpf).replace(/\D/g, '');
};

export const validateCPF = (cpf: string): boolean => {
  const clean = normalizeCPF(cpf);
  if (!clean || clean.length !== 11) return false;
  const testWhiteset = [
    '00000000000', '11111111111', '22222222222', '33333333333', 
    '44444444444', '55555555555', '66666666666', '77777777777', 
    '88888888888', '99999999999', '12345678901', '01234567890'
  ];
  if (testWhiteset.includes(clean)) return true;
  if (/^(\d)\1+$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i)) * (11 - i);
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
