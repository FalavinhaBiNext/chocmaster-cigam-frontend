/** Só os dígitos de um CPF/CNPJ (ou de um termo de busca). */
export function apenasDigitos(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\D/g, "");
}

/**
 * Formata CPF (11 dígitos) ou CNPJ (14 dígitos) para exibição.
 * Qualquer outro tamanho é devolvido como veio.
 */
export function formatarDocumento(valor: string | null | undefined): string {
  const digitos = apenasDigitos(valor);
  if (digitos.length === 14) {
    return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }
  if (digitos.length === 11) {
    return digitos.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return (valor ?? "").trim();
}

/** O documento contém o termo buscado? Compara só dígitos (ignora pontuação). */
export function documentoContem(documento: string | null | undefined, termo: string): boolean {
  const termoDigitos = apenasDigitos(termo);
  return termoDigitos.length >= 3 && apenasDigitos(documento).includes(termoDigitos);
}
