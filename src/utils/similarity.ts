export function cleanString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, ' ') // replace non-alphanumeric with spaces
    .replace(/\s+/g, ' ') // replace multiple spaces with single space
    .trim();
}

export function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function calculateSimilarity(str1: string, str2: string): number {
  const clean1 = cleanString(str1);
  const clean2 = cleanString(str2);

  if (clean1 === clean2) return 100;
  if (!clean1 || !clean2) return 0;

  const words1 = clean1.split(' ');
  const words2 = clean2.split(' ');
  
  const commonWords = words1.filter(w => words2.includes(w));
  const wordMatchPercentage = (commonWords.length / Math.max(words1.length, words2.length)) * 100;

  const maxLength = Math.max(clean1.length, clean2.length);
  const distance = getLevenshteinDistance(clean1, clean2);
  const levenshteinPercentage = ((maxLength - distance) / maxLength) * 100;

  if (clean1.includes(clean2) || clean2.includes(clean1)) {
    return Math.min(100, Math.max(85, Math.round((levenshteinPercentage + wordMatchPercentage) / 2)));
  }

  return Math.round((levenshteinPercentage + wordMatchPercentage) / 2);
}

export function calculateCodeSimilarity(c1: string, c2: string): number {
  if (!c1 || !c2) return 0;

  const code1 = c1.toLowerCase().trim();
  const code2 = c2.toLowerCase().trim();

  if (code1 === code2) return 100;

  const len1 = code1.length;
  const len2 = code2.length;
  const minLen = Math.min(len1, len2);
  const maxLen = Math.max(len1, len2);

  // Check if one code is a substring of the other
  const contains = code1.includes(code2) || code2.includes(code1);

  if (contains) {
    return Math.round((minLen / maxLen) * 100);
  }

  // If they don't contain each other, similarity is 0%
  return 0;
}
