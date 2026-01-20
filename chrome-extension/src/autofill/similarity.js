// ═══════════════════════════════════════════════════════════════════════════
// CUBE Chrome Extension - Similarity Algorithms
// ═══════════════════════════════════════════════════════════════════════════
// String similarity and matching algorithms for intelligent autofill

/**
 * Calculates Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance (0 = identical)
 */
function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const matrix = [];

  // Initialize first column
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Calculates similarity between two strings (0.0 to 1.0)
 * Combines exact match, substring match, word overlap, and Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (1.0 = identical, 0.0 = completely different)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1.0;

  // Substring match
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return 0.7 + (shorter / longer) * 0.3;
  }

  // Word overlap
  const words1 = s1.split(/\s+/).filter(w => w.length > 0);
  const words2 = s2.split(/\s+/).filter(w => w.length > 0);
  const commonWords = words1.filter(w => words2.includes(w)).length;
  const totalWords = new Set([...words1, ...words2]).size;

  if (commonWords > 0) {
    const wordScore = commonWords / totalWords;
    if (wordScore > 0.5) return 0.6 + wordScore * 0.4;
  }

  // Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  const similarity = 1 - distance / maxLen;

  return Math.max(0, similarity);
}

/**
 * Fuzzy matches a search string against a list of candidates
 * @param {string} search - Search string
 * @param {string[]} candidates - Array of candidate strings
 * @param {number} threshold - Minimum similarity threshold (default 0.5)
 * @returns {Array<{value: string, score: number}>} - Sorted matches
 */
function fuzzyMatch(search, candidates, threshold = 0.5) {
  const matches = [];

  for (const candidate of candidates) {
    const score = calculateSimilarity(search, candidate);
    if (score >= threshold) {
      matches.push({ value: candidate, score });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches;
}

/**
 * Finds best match for a field name from data keys
 * @param {string} fieldName - Field name to match
 * @param {string[]} dataKeys - Available data keys
 * @returns {{key: string, score: number} | null} - Best match or null
 */
function findBestMatch(fieldName, dataKeys) {
  const matches = fuzzyMatch(fieldName, dataKeys, 0.5);
  return matches.length > 0 ? { key: matches[0].value, score: matches[0].score } : null;
}

/**
 * Calculates Jaro-Winkler similarity (alternative to Levenshtein)
 * Better for short strings and typos
 * @param {string} s1 - First string
 * @param {string} s2 - Second string
 * @returns {number} - Similarity score (0.0 to 1.0)
 */
function jaroWinklerSimilarity(s1, s2) {
  const str1 = s1.toLowerCase();
  const str2 = s2.toLowerCase();

  if (str1 === str2) return 1.0;

  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0 || len2 === 0) return 0.0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const str1Matches = new Array(len1).fill(false);
  const str2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Find transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  // Jaro similarity
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;

  // Jaro-Winkler (boost for matching prefixes)
  let prefixLength = 0;
  for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
    if (str1[i] === str2[i]) prefixLength++;
    else break;
  }

  return jaro + prefixLength * 0.1 * (1 - jaro);
}

/**
 * Normalizes a string for comparison (removes special chars, extra spaces)
 * @param {string} str - String to normalize
 * @returns {string} - Normalized string
 */
function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts keywords from a string
 * @param {string} str - Input string
 * @returns {string[]} - Array of keywords
 */
function extractKeywords(str) {
  const normalized = normalizeString(str);
  const words = normalized.split(' ').filter(w => w.length > 2);
  return [...new Set(words)]; // Remove duplicates
}

/**
 * Checks if string matches any of the keywords
 * @param {string} str - String to check
 * @param {string[]} keywords - Keywords to match
 * @returns {boolean} - True if any keyword matches
 */
function matchesAnyKeyword(str, keywords) {
  const normalized = normalizeString(str);
  return keywords.some(keyword => normalized.includes(keyword.toLowerCase()));
}

/**
 * Scores field name confidence based on keywords
 * @param {string} fieldName - Field name
 * @param {string[]} keywords - Expected keywords
 * @returns {number} - Confidence score (0.0 to 1.0)
 */
function calculateKeywordConfidence(fieldName, keywords) {
  if (!keywords || keywords.length === 0) return 0.5;

  const normalized = normalizeString(fieldName);
  const matchedKeywords = keywords.filter(k => 
    normalized.includes(k.toLowerCase())
  ).length;

  const baseScore = 0.5;
  const keywordBonus = (matchedKeywords / keywords.length) * 0.5;

  return Math.min(1.0, baseScore + keywordBonus);
}
