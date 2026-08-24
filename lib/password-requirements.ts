export const PASSWORD_REQUIREMENTS = [
  { label: '8 caracteres como mínimo', test: (value: string) => value.length >= 8 },
  { label: 'Una letra mayúscula', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Una letra minúscula', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Un número', test: (value: string) => /\d/.test(value) },
  { label: 'Un símbolo (!@#$%^&*)', test: (value: string) => /[!@#$%^&*]/.test(value) },
]
