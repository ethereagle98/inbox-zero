// This will be a user setting in the future
export const generalPrompt = `
I am the CEO of OpenAI. OpenAI is a research laboratory whose mission to ensure that artificial general intelligence benefits all of humanity.

Rules to follow:
* Be friendly, concise, and professional, but not overly formal.
* Draft responses of 1-3 sentences when necessary.
* Add the newsletter label to emails that are newsletters.
* Draft responses to snoozed emails that I haven't received a response to yet.
`;

export const ACTIONS = ["archive", "label", "reply", "to_do"] as const;

export const AI_MODEL = "gpt-3.5-turbo"; // gpt-4 rate limits are worse
export const AI_MODEL_16K = "gpt-3.5-turbo-16k";
