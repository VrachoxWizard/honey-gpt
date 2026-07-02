export const CONSTANTS = {
  // API endpoints
  OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',

  // LLM settings
  LLM_TEMPERATURE: 0.9,
  CODING_LLM_TEMPERATURE: 0.3,
  MAX_REQUEST_BODY_BYTES: 1_000_000,
  MAX_IMAGE_DATA_URL_CHARS: 500_000,

  // Chat context limits
  MAX_MESSAGES: 18,
  MAX_MESSAGE_CHARS: 8_000,

  // Summarization settings
  SUMMARIZATION_THRESHOLD: 10,
  SUMMARIZED_CONTEXT_MESSAGES: 6,
  SUMMARIZATION_MAX_TOKENS: 150,
  SUMMARIZATION_TEMPERATURE: 0.3,

  // Timeouts
  SYNC_TIMEOUT_MS: 15_000,
  STREAM_TIMEOUT_MS: 20_000,
  RSS_TIMEOUT_MS: 4_000,
  REDIS_TIMEOUT_MS: 3_000,

  // Caching settings
  LRU_MAX_ENTRIES: 150,
  LRU_TTL_MS: 30 * 60 * 1000, // 30 minutes
  MULTI_TURN_CACHE_TTL_MS: 10 * 60 * 1000, // 10 minutes
  SUMMARIZATION_MIN_TOTAL_CHARS: 500,
  CACHE_STREAM_CHUNK_SIZE: 4,
  CACHE_STREAM_DELAY_MS: 6,
  NEWS_CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  REDIS_KEY_EXPIRE_SECONDS: 120, // 2 minutes

  // Content detection
  MAX_NEWS_HEADLINES: 4,
  NEWS_KEYWORDS: [
    'vijest',
    'novost',
    'dogadaj',
    'novog',
    'sabor',
    'izbor',
    'desilo',
    'dogodilo',
    'novine',
  ] as const,
  ANGRY_KEYWORDS: ['glup', 'lud', 'sranje', 'proklet', 'ubij', 'mrzi', 'kreten', 'idiot'] as const,
  SAD_KEYWORDS: [
    'tuzan',
    'tužan',
    'depres',
    'zalost',
    'žalost',
    'nesretan',
    'plac',
    'plač',
  ] as const,
  CODE_KEYWORDS: [
    'kod',
    'code',
    'programira',
    'funkcij',
    'skript',
    'aplikacij',
    'bug',
    'error',
    'javascript',
    'typescript',
    'react',
    'html',
    'css',
    'const',
    'let',
    'var',
    'console.log',
    'return',
  ] as const,

  // Frontend/UI limits (some can be shared)
  DEFAULT_SESSION_TITLE: 'Novi razgovor',
  SESSION_TITLE_MAX_LENGTH: 30,
  TOAST_DURATION_MS: 3_000,
  IMAGE_MAX_DIMENSION: 1024,
  IMAGE_QUALITY: 0.85,
  MAX_INPUT_CHARS: 8_000,
  INPUT_WARNING_THRESHOLD: 7_000,
};
