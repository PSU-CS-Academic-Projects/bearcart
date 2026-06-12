/**
 * Filipino / Bisaya profanity words added to the leo-profanity dictionary.
 * Spelled out deliberately — this file is a moderation config, not content.
 */
export const FILIPINO_PROFANITY: string[] = [
  // Tagalog
  "putangina", "putang ina", "putanginamo", "putang ina mo",
  "tangina", "tanginamo", "tangina mo",
  "puta", "pute",
  "gago", "gaga", "gagong",
  "tarantado", "tarantada",
  "ulol", "ulolmong",
  "bobo", "boba",
  "tanga", "hangal",
  "leche", "letse",
  "punyeta", "punyita",
  "pakyu", "pakyo",
  "bwisit", "buwisit",
  "hinayupak", "hayop",
  "anak ng puta", "anak ng tupa",
  "animal ka",
  "putcha", "putcha mo",
  "shet", "shyet",
  "gago ka", "tanga ka",
  "lintik",
  "salot",
  "pesteng yawa",
  "supot",
  "abnormal",
  "animal",
  "inutil",

  // Bisaya / Cebuano
  "yawa", "yawa ka",
  "bogo", "boang",
  "buang",
  "bilat",
  "kantot",
  "kineme",
  "pisti", "pesteng",
  "unggoy",
  "luoy",
  "kayat",
  "ihi",
  "bobo bisaya",
  "atay",
  "giatay",
  "paktay",
  "pakyas",
  "bwakaw",
  "amaw",
  "maldita", "maldito",
  "hunghang",
  "buanga",

  // Ilocano
  "napaitan",
  "pinarakuran",

  // Common substitution spellings
  "p0ta", "g4go", "t4nga", "b0bo",
  "putang!na", "tang!na",

  // Common profane number jokes
  "42069", "69", "69420", "666", "80085", "8008"
];

/**
 * Words that leo-profanity's English dictionary may false-flag in a
 * university marketplace context. These are added to the whitelist so
 * legitimate listings are never blocked.
 */
export const WHITELISTED_WORDS: string[] = [
  // Academic / marketplace terms that contain substrings matching slurs
  "class",
  "classes",
  "classic",
  "classical",
  "classify",
  "classification",
  "assignment",
  "assignments",
  "assassin",        // "ass" substring
  "assassinate",
  "assess",
  "assessment",
  "associate",
  "assumption",
  "assistance",
  "assistant",
  "passage",
  "passionate",
  "mass",
  "massive",
  "bass",
  "glasses",
  "brass",
  "grass",
  "grass-fed",
  "harass",
  "embarrass",
  "analytics",
  "analysis",
  "analyst",
  "tissue",
  "compass",
  "casserole",
  "cassette",
  "cassia",
  "massage",         // body care items
  "mastermind",      // project management context
  "masterclass",
  "dick",            // common Filipino surname / Richard nickname
  "cox",             // surname
  "ho",              // surname (e.g. Ho Chi Minh references)
  "wang",            // surname
  "dong",            // surname
  "boner",           // academic term (anatomy)
  "erection",        // construction/building context
  "sex",             // biology, health education
  "sexual",
  "sexuality",
  "penis",           // anatomy, health
  "vagina",          // anatomy, health
  "breast",          // anatomy, food (chicken breast)
  "breasts",
  "nipple",          // engineering (pipe nipple fittings)
  "intercourse",     // communication context
  "screw",           // hardware/tools
  "screws",
  "screwdriver",
  "nuts",            // hardware
  "joint",           // architecture, woodworking
  "crack",           // surface damage description
  "crack",
  "pot",             // cookware
  "cocoa",
];
