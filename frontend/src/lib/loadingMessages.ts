export const LOADING_MESSAGES = [
  "Counting how many times you said 'basically'… it's quite a few.",
  "Teaching the AI to appreciate your unique communication style.",
  "Translating human speech into something people will actually read.",
  "Running your transcript through our patented Un-Ramble™ technology.",
  "The algorithm is reading your transcript and nodding thoughtfully.",
  "Negotiating with GPT over the optimal paragraph structure.",
  "Extracting wisdom from your words. Discarding the filler. This takes a moment.",
  "The AI is debating whether to use a semicolon here. Classic AI.",
  "Summoning the spirit of a very productive writer on your behalf.",
  "Mining your audio for quotable moments. Found a few good ones.",
  "Converting your talking into writing. It's basically magic.",
  "Making your ideas sound like you rehearsed them. You didn't, but still.",
  "Adding words like 'furthermore' and 'it is worth noting' to class things up.",
  "Your ideas are being polished by invisible digital hands.",
  "The language model is deeply moved by your content. Emotionally.",
  "Restructuring your train of thought into something more… train-shaped.",
  "Running grammar checks at speeds no human could survive.",
  "Cross-referencing your content with the entire history of blogging.",
  "Extracting the signal from the noise… and the occasional cough.",
  "Distilling hours of thought into minutes of reading. You're welcome.",
  "The AI asks: H2 or H3? The debate rages on inside the model.",
  "Your words are doing great in there. Really coming together.",
  "Finding the perfect opening hook. The AI has strong opinions.",
  "Turning your stream of consciousness into a coherent article. Nearly there.",
  "Whispering your transcript into the ears of a very hardworking neural network.",
  "Converting caffeine (yours) into content (everyone's).",
  "Your blog post is being assembled with surgical precision and mild enthusiasm.",
  "Making your rough draft look like it was the first draft all along.",
  "Asking the model nicely to please make this sound intelligent.",
  "Almost ready. We're adding the finishing touches to your masterpiece.",
] as const;

/** Returns a new shuffled copy of the messages array. */
export function shuffleMessages(): string[] {
  const arr = [...LOADING_MESSAGES];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
