// Simple content filter for inappropriate words
const BAD_WORDS = [
  'spam', 'scam', 'fraud', 'fake', 'hate', 'violence', 'illegal', 'drugs',
  'abuse', 'harassment', 'discriminat', 'racist', 'sexist', 'threat',
  'attack', 'kill', 'murder', 'suicide', 'harm', 'weapon'
];

export function containsBadWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BAD_WORDS.some(word => lowerText.includes(word));
}

export function filterBadWords(text: string): string {
  let filteredText = text;
  const lowerText = text.toLowerCase();
  
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  });
  
  return filteredText;
}

export function validateContent(content: string): { isValid: boolean; message?: string } {
  if (containsBadWords(content)) {
    return {
      isValid: false,
      message: "Your post contains inappropriate content. Please revise and try again."
    };
  }
  
  return { isValid: true };
}