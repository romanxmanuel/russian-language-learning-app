import type {
  LexicalChunk,
  ResearchAnchor,
  WeekProgram,
  WeekRoadmap,
} from "@/lib/types";

export const curriculum: WeekProgram[] = [
  {
    week: 1,
    slug: "sound-system",
    theme: "Cyrillic and Sound System",
    missionName: "Hear the shape of Russian",
    objective:
      "Lock in sound-symbol mapping and the repair chunks that stop panic before it starts.",
    milestone: "Read simple chunks aloud and repair a breakdown in Russian.",
    grammarFrame: "No rule dump. Sound, rhythm, and rescue chunks first.",
    pronunciationNote:
      "Focus on hard-soft contrast, vowel reduction, and chunk rhythm.",
    experiments: [
      "Surprise retrieval after the clip",
      "Bedtime shadowing on the weakest chunk",
    ],
    skillNodes: [
      {
        id: "w1-sound-map",
        week: 1,
        title: "Sound map before spelling",
        description: "Treat Cyrillic as a sound system, not an English code.",
        focus: "pronunciation",
        chunkIds: ["w1-hello", "w1-repeat", "w1-understand"],
      },
      {
        id: "w1-repair",
        week: 1,
        title: "Conversation rescue",
        description: "Use short repair chunks instead of freezing.",
        focus: "chunks",
        chunkIds: ["w1-repeat", "w1-understand"],
      },
    ],
    chunks: [
      {
        id: "w1-hello",
        week: 1,
        title: "Greeting cleanly",
        russian: "Привет",
        transliteration: "Privet",
        translation: "Hi",
        notes: "Keep the ending crisp; do not over-English the vowels.",
        stressHint: "pri-VYET",
        functions: ["greeting"],
        tags: ["survival", "pronunciation"],
        difficulty: 1,
        keywords: ["привет"],
      },
      {
        id: "w1-repeat",
        week: 1,
        title: "Ask for repetition",
        russian: "Повторите, пожалуйста",
        transliteration: "Povtorite, pozhaluysta",
        translation: "Repeat that, please",
        notes: "Train it as one chunk, not word by word.",
        stressHint: "pafta-RI-tye, pa-ZHA-luys-ta",
        functions: ["repair", "clarification"],
        tags: ["survival", "pronunciation"],
        difficulty: 2,
        keywords: ["повторите", "пожалуйста"],
      },
      {
        id: "w1-understand",
        week: 1,
        title: "Signal comprehension",
        russian: "Я не понимаю",
        transliteration: "Ya ne ponimayu",
        translation: "I don't understand",
        notes: "A survival chunk that buys you time.",
        stressHint: "ya nye pani-MA-yu",
        functions: ["comprehension"],
        tags: ["survival", "pronunciation"],
        difficulty: 2,
        keywords: ["я", "не", "понимаю"],
      },
    ],
    reviewItems: [
      {
        id: "w1-r1",
        chunkId: "w1-repeat",
        prompt: "Say: Repeat that, please.",
        answer: "Повторите, пожалуйста",
        cue: "Repair without leaving Russian.",
      },
      {
        id: "w1-r2",
        chunkId: "w1-understand",
        prompt: "Say: I don't understand.",
        answer: "Я не понимаю",
        cue: "Short and calm.",
      },
    ],
    inputClip: {
      id: "w1-clip",
      week: 1,
      title: "First contact",
      context: "A learner slows a fast conversation down.",
      instructions:
        "Listen once with no transcript and predict function before meaning.",
      captions: [
        {
          russian: "Привет. Я не понимаю.",
          translation: "Hi. I don't understand.",
          glosses: ["привет = hi", "не понимаю = don't understand"],
        },
        {
          russian: "Повторите, пожалуйста.",
          translation: "Repeat that, please.",
          glosses: ["повторите = repeat", "пожалуйста = please"],
        },
      ],
      comprehensionChecks: [
        "Which line repairs the breakdown?",
        "Which word softens the request?",
      ],
    },
    scenario: {
      id: "w1-scenario",
      week: 1,
      title: "Slow the exchange down",
      setting: "You miss a line and need usable Russian immediately.",
      objective: "Repair a breakdown without switching to English.",
      targetChunkIds: ["w1-hello", "w1-repeat", "w1-understand"],
      openingPrompt: "Поздоровайтесь и скажите, что не понимаете.",
      supportPrompt: "One clean repair chunk is enough.",
      stretchPrompt: "Ask for repetition, then say that you understand.",
      sampleLines: [
        {
          speaker: "local",
          russian: "Привет. Всё хорошо?",
          translation: "Hi. Everything okay?",
        },
        {
          speaker: "coach",
          russian: "Я не понимаю. Повторите, пожалуйста.",
          translation: "I don't understand. Repeat that, please.",
        },
      ],
    },
    reflectionPrompt:
      "Which sound still feels foreign in your mouth, and which chunk will you shadow tonight?",
  },
  {
    week: 2,
    slug: "survival-chunks",
    theme: "Survival Chunks",
    missionName: "Get needs met quickly",
    objective:
      "Use memorized chunks for help, price, and destination instead of building sentences from scratch.",
    milestone: "Handle a short transaction with Russian only.",
    grammarFrame: "Meaning first. Grammar comes later from repeated chunk use.",
    pronunciationNote:
      "Keep command forms clipped and avoid adding English vowels to clusters.",
    experiments: [
      "Micro-subtitle reconstruction",
      "Missing-the-train pressure scenario",
    ],
    skillNodes: [
      {
        id: "w2-help",
        week: 2,
        title: "Get help fast",
        description: "Use high-leverage chunks before embarrassment grows.",
        focus: "conversation",
        chunkIds: ["w2-help", "w2-price", "w2-ticket"],
      },
      {
        id: "w2-direction",
        week: 2,
        title: "Direction and price",
        description: "Connect movement with cost and need.",
        focus: "review",
        chunkIds: ["w2-price", "w2-ticket"],
      },
    ],
    chunks: [
      {
        id: "w2-help",
        week: 2,
        title: "Ask for help",
        russian: "Помогите, пожалуйста",
        transliteration: "Pomogite, pozhaluysta",
        translation: "Help me, please",
        notes: "Urgent, polite, and useful everywhere.",
        stressHint: "pama-GI-tye, pa-ZHA-luys-ta",
        functions: ["request"],
        tags: ["survival", "pronunciation"],
        difficulty: 2,
        keywords: ["помогите", "пожалуйста"],
      },
      {
        id: "w2-price",
        week: 2,
        title: "Ask price",
        russian: "Сколько это стоит?",
        transliteration: "Skolko eto stoit?",
        translation: "How much does this cost?",
        notes: "Keep the phrase as one rhythm block.",
        stressHint: "SKOL-ka E-ta STO-it",
        functions: ["price"],
        tags: ["survival", "food"],
        difficulty: 2,
        keywords: ["сколько", "это", "стоит"],
      },
      {
        id: "w2-ticket",
        week: 2,
        title: "Need a ticket",
        russian: "Мне нужен билет",
        transliteration: "Mne nuzhen bilet",
        translation: "I need a ticket",
        notes: "Use the whole need phrase as one chunk.",
        stressHint: "mnye NU-zhen bi-LYET",
        functions: ["need", "transport"],
        tags: ["survival", "cases"],
        difficulty: 3,
        keywords: ["мне", "нужен", "билет"],
      },
    ],
    reviewItems: [
      {
        id: "w2-r1",
        chunkId: "w2-help",
        prompt: "Say: Help me, please.",
        answer: "Помогите, пожалуйста",
        cue: "Urgent but polite.",
      },
      {
        id: "w2-r2",
        chunkId: "w2-ticket",
        prompt: "Say: I need a ticket.",
        answer: "Мне нужен билет",
        cue: "Use the whole need frame.",
      },
    ],
    inputClip: {
      id: "w2-clip",
      week: 2,
      title: "At the kiosk",
      context: "A learner needs a ticket and asks the price.",
      instructions:
        "Listen first and predict whether the key move is help, price, or need.",
      captions: [
        {
          russian: "Мне нужен билет.",
          translation: "I need a ticket.",
          glosses: ["мне нужен = I need", "билет = ticket"],
        },
        {
          russian: "Сколько это стоит?",
          translation: "How much does this cost?",
          glosses: ["сколько = how much", "стоит = costs"],
        },
      ],
      comprehensionChecks: [
        "Which line states the need?",
        "Which line asks the price?",
      ],
    },
    scenario: {
      id: "w2-scenario",
      week: 2,
      title: "Buy the ticket",
      setting: "You need a metro ticket fast.",
      objective: "State the need and ask the price without hesitation.",
      targetChunkIds: ["w2-ticket", "w2-price", "w2-help"],
      openingPrompt: "Скажите, что вам нужен билет, и спросите цену.",
      supportPrompt: "Need first, price second.",
      stretchPrompt: "Add a help chunk if the other person speaks too fast.",
      sampleLines: [
        {
          speaker: "local",
          russian: "Что вам нужно?",
          translation: "What do you need?",
        },
        {
          speaker: "coach",
          russian: "Мне нужен билет. Сколько это стоит?",
          translation: "I need a ticket. How much does this cost?",
        },
      ],
    },
    reflectionPrompt:
      "Which transaction chunk now feels automatic, and which still breaks apart under pressure?",
  },
  {
    week: 3,
    slug: "self-introduction",
    theme: "Self-Introduction",
    missionName: "Introduce yourself without translating",
    objective:
      "Build an identity script for name, origin, and current study.",
    milestone: "Deliver a calm self-introduction and answer one follow-up.",
    grammarFrame:
      "Identity chunks first. Patterns emerge after repetition, not before.",
    pronunciationNote:
      "Stabilize stress across a short multi-sentence introduction.",
    experiments: [
      "Story mission: first host-family meeting",
      "Morning recall from memory",
    ],
    skillNodes: [
      {
        id: "w3-script",
        week: 3,
        title: "Identity script",
        description: "Memorize your personal script so listening gets easier.",
        focus: "chunks",
        chunkIds: ["w3-name", "w3-from", "w3-study"],
      },
      {
        id: "w3-follow-up",
        week: 3,
        title: "Answer the next question",
        description: "Move from monologue into exchange.",
        focus: "conversation",
        chunkIds: ["w3-name", "w3-study"],
      },
    ],
    chunks: [
      {
        id: "w3-name",
        week: 3,
        title: "Say your name",
        russian: "Меня зовут ...",
        transliteration: "Menya zovut ...",
        translation: "My name is ...",
        notes: "Natural chunk, not a word-for-word translation.",
        stressHint: "mi-NYA za-VOOT",
        functions: ["introduction"],
        tags: ["survival", "cases"],
        difficulty: 2,
        keywords: ["меня", "зовут"],
      },
      {
        id: "w3-from",
        week: 3,
        title: "Say where you are from",
        russian: "Я из Орландо",
        transliteration: "Ya iz Orlando",
        translation: "I am from Orlando",
        notes: "Keep из attached tightly to the place name.",
        stressHint: "ya iz or-LAN-da",
        functions: ["origin"],
        tags: ["survival"],
        difficulty: 2,
        keywords: ["я", "из", "орландо"],
      },
      {
        id: "w3-study",
        week: 3,
        title: "Say what you are studying",
        russian: "Я изучаю русский",
        transliteration: "Ya izuchayu russkiy",
        translation: "I am studying Russian",
        notes: "Useful socially and as a level signal.",
        stressHint: "ya izu-CHA-yu RUS-skiy",
        functions: ["study"],
        tags: ["survival"],
        difficulty: 2,
        keywords: ["я", "изучаю", "русский"],
      },
    ],
    reviewItems: [
      {
        id: "w3-r1",
        chunkId: "w3-name",
        prompt: "Say: My name is Roman.",
        answer: "Меня зовут Роман",
        cue: "Use the natural intro chunk.",
      },
      {
        id: "w3-r2",
        chunkId: "w3-study",
        prompt: "Say: I am studying Russian.",
        answer: "Я изучаю русский",
        cue: "Short and useful.",
      },
    ],
    inputClip: {
      id: "w3-clip",
      week: 3,
      title: "Meeting a classmate",
      context: "A learner introduces himself and explains why he is here.",
      instructions:
        "Listen once and note which line gives identity versus current study.",
      captions: [
        {
          russian: "Меня зовут Роман. Я из Орландо.",
          translation: "My name is Roman. I am from Orlando.",
          glosses: ["меня зовут = my name is", "я из = I am from"],
        },
        {
          russian: "Я изучаю русский.",
          translation: "I am studying Russian.",
          glosses: ["изучаю = study", "русский = Russian"],
        },
      ],
      comprehensionChecks: [
        "Which line gives origin?",
        "Which line explains your current project?",
      ],
    },
    scenario: {
      id: "w3-scenario",
      week: 3,
      title: "Introduce yourself at a meetup",
      setting: "A Russian speaker asks who you are.",
      objective: "Give a short identity script and hold the floor calmly.",
      targetChunkIds: ["w3-name", "w3-from", "w3-study"],
      openingPrompt: "Представьтесь: имя, откуда вы и что изучаете.",
      supportPrompt: "Two short sentences beat one unstable long sentence.",
      stretchPrompt: "Add one more identity detail after the core script.",
      sampleLines: [
        {
          speaker: "local",
          russian: "Как вас зовут?",
          translation: "What is your name?",
        },
        {
          speaker: "coach",
          russian: "Меня зовут Роман. Я из Орландо. Я изучаю русский.",
          translation: "My name is Roman. I am from Orlando. I am studying Russian.",
        },
      ],
    },
    reflectionPrompt:
      "Which part of your identity script already feels like one sound chunk?",
  },
  {
    week: 4,
    slug: "movement-location",
    theme: "Movement and Location",
    missionName: "Move through the city",
    objective:
      "Use direction and destination chunks to talk about where you are going.",
    milestone: "Handle one short movement conversation with confidence.",
    grammarFrame: "Destination chunks first; full motion-verb theory later.",
    pronunciationNote:
      "Attach short function words tightly to place phrases.",
    experiments: [
      "Station-announcement micro-subtitles",
      "Surprise route-change prompt",
    ],
    skillNodes: [
      {
        id: "w4-move",
        week: 4,
        title: "Talk about movement",
        description: "Treat destination phrases as procedural chunks.",
        focus: "input",
        chunkIds: ["w4-go", "w4-need", "w4-where"],
      },
      {
        id: "w4-locate",
        week: 4,
        title: "Ask direction",
        description: "Ask where to go without overanalyzing the whole system.",
        focus: "conversation",
        chunkIds: ["w4-where", "w4-go"],
      },
    ],
    chunks: [
      {
        id: "w4-go",
        week: 4,
        title: "Say where you are going",
        russian: "Я иду в центр",
        transliteration: "Ya idu v tsentr",
        translation: "I am going downtown",
        notes: "Train movement plus destination together.",
        stressHint: "ya i-DU v TSEN-tr",
        functions: ["movement"],
        tags: ["movement"],
        difficulty: 3,
        keywords: ["я", "иду", "центр"],
      },
      {
        id: "w4-need",
        week: 4,
        title: "Need to get somewhere",
        russian: "Мне нужно в аэропорт",
        transliteration: "Mne nuzhno v aeroport",
        translation: "I need to get to the airport",
        notes: "Use the whole need-plus-destination frame.",
        stressHint: "mnye NUZH-na v aero-PORT",
        functions: ["need", "destination"],
        tags: ["movement", "cases"],
        difficulty: 3,
        keywords: ["мне", "нужно", "аэропорт"],
      },
      {
        id: "w4-where",
        week: 4,
        title: "Ask direction",
        russian: "Куда мне идти?",
        transliteration: "Kuda mne idti?",
        translation: "Where should I go?",
        notes: "Ask it cleanly, then listen for one landmark.",
        stressHint: "ku-DA mnye id-TI",
        functions: ["direction"],
        tags: ["movement", "cases"],
        difficulty: 3,
        keywords: ["куда", "мне", "идти"],
      },
    ],
    reviewItems: [
      {
        id: "w4-r1",
        chunkId: "w4-go",
        prompt: "Say: I am going downtown.",
        answer: "Я иду в центр",
        cue: "Movement and destination together.",
      },
      {
        id: "w4-r2",
        chunkId: "w4-where",
        prompt: "Say: Where should I go?",
        answer: "Куда мне идти?",
        cue: "Ask for direction fast.",
      },
    ],
    inputClip: {
      id: "w4-clip",
      week: 4,
      title: "Finding the station",
      context: "A learner needs directions into the center.",
      instructions:
        "Listen first and decide which line is movement versus direction.",
      captions: [
        {
          russian: "Мне нужно в аэропорт.",
          translation: "I need to get to the airport.",
          glosses: ["мне нужно = I need", "в аэропорт = to the airport"],
        },
        {
          russian: "Куда мне идти?",
          translation: "Where should I go?",
          glosses: ["куда = where to", "идти = go"],
        },
      ],
      comprehensionChecks: [
        "Which line states destination?",
        "Which line asks for direction?",
      ],
    },
    scenario: {
      id: "w4-scenario",
      week: 4,
      title: "Get to the airport",
      setting: "You need a fast route explanation.",
      objective: "Explain your destination and ask which way to go.",
      targetChunkIds: ["w4-need", "w4-where", "w4-go"],
      openingPrompt: "Скажите, что вам нужно в аэропорт, и спросите, куда идти.",
      supportPrompt: "Need first, direction second.",
      stretchPrompt: "Add where you are going after you get the answer.",
      sampleLines: [
        {
          speaker: "local",
          russian: "Куда вам нужно?",
          translation: "Where do you need to go?",
        },
        {
          speaker: "coach",
          russian: "Мне нужно в аэропорт. Куда мне идти?",
          translation: "I need to get to the airport. Where should I go?",
        },
      ],
    },
    reflectionPrompt:
      "Which movement chunk feels ready for spontaneous use now?",
  },
  {
    week: 5,
    slug: "shopping-food",
    theme: "Shopping and Food",
    missionName: "Order with confidence",
    objective:
      "Handle menus, preferences, and simple orders in cafes or shops.",
    milestone: "Order one item, state one preference, and close politely.",
    grammarFrame: "Teach request and preference frames through direct use.",
    pronunciationNote:
      "Shadow the rhythm of longer order phrases so they stay fluid.",
    experiments: [
      "Emotion-tagged cafe mission",
      "Learner-made caption for the closing line",
    ],
    skillNodes: [
      {
        id: "w5-order",
        week: 5,
        title: "Place the order",
        description: "Train ordering chunks as one motor program.",
        focus: "conversation",
        chunkIds: ["w5-menu", "w5-want", "w5-without"],
      },
      {
        id: "w5-preference",
        week: 5,
        title: "State preferences",
        description: "Add one preference so you stop relying on pointing.",
        focus: "review",
        chunkIds: ["w5-without", "w5-want"],
      },
    ],
    chunks: [
      {
        id: "w5-menu",
        week: 5,
        title: "Ask for the menu",
        russian: "Можно меню?",
        transliteration: "Mozhno menyu?",
        translation: "Can I have the menu?",
        notes: "One of the most reusable request chunks.",
        stressHint: "MOZH-na mye-NYU",
        functions: ["request", "restaurant"],
        tags: ["food", "survival"],
        difficulty: 2,
        keywords: ["можно", "меню"],
      },
      {
        id: "w5-want",
        week: 5,
        title: "Order something",
        russian: "Я хочу кофе",
        transliteration: "Ya khochu kofe",
        translation: "I want coffee",
        notes: "Direct, natural, and useful.",
        stressHint: "ya kha-CHU KO-fye",
        functions: ["ordering"],
        tags: ["food"],
        difficulty: 2,
        keywords: ["я", "хочу", "кофе"],
      },
      {
        id: "w5-without",
        week: 5,
        title: "State a preference",
        russian: "Без сахара, пожалуйста",
        transliteration: "Bez sakhara, pozhaluysta",
        translation: "Without sugar, please",
        notes: "Compact and transferable to many ingredients.",
        stressHint: "byez SA-kha-ra, pa-ZHA-luys-ta",
        functions: ["preference"],
        tags: ["food", "cases"],
        difficulty: 3,
        keywords: ["без", "сахара", "пожалуйста"],
      },
    ],
    reviewItems: [
      {
        id: "w5-r1",
        chunkId: "w5-want",
        prompt: "Say: I want coffee.",
        answer: "Я хочу кофе",
        cue: "Direct and useful.",
      },
      {
        id: "w5-r2",
        chunkId: "w5-without",
        prompt: "Say: Without sugar, please.",
        answer: "Без сахара, пожалуйста",
        cue: "Preference plus politeness.",
      },
    ],
    inputClip: {
      id: "w5-clip",
      week: 5,
      title: "Ordering at the cafe",
      context: "A learner orders and gives a preference.",
      instructions:
        "Listen for the request chunk first, then the preference line.",
      captions: [
        {
          russian: "Можно меню?",
          translation: "Can I have the menu?",
          glosses: ["можно = may/can", "меню = menu"],
        },
        {
          russian: "Я хочу кофе без сахара, пожалуйста.",
          translation: "I want coffee without sugar, please.",
          glosses: ["хочу = want", "без сахара = without sugar"],
        },
      ],
      comprehensionChecks: [
        "Which line opens the transaction?",
        "Which phrase carries the preference?",
      ],
    },
    scenario: {
      id: "w5-scenario",
      week: 5,
      title: "Make the order",
      setting: "You are in a cafe and want to sound clear, not robotic.",
      objective: "Ask for the menu and place a simple order with a preference.",
      targetChunkIds: ["w5-menu", "w5-want", "w5-without"],
      openingPrompt: "Попросите меню, потом закажите кофе без сахара.",
      supportPrompt: "Menu first, order second.",
      stretchPrompt: "Add a polite closing line after the order.",
      sampleLines: [
        {
          speaker: "local",
          russian: "Что вы хотите?",
          translation: "What would you like?",
        },
        {
          speaker: "coach",
          russian: "Я хочу кофе без сахара, пожалуйста.",
          translation: "I want coffee without sugar, please.",
        },
      ],
    },
    reflectionPrompt:
      "Which food chunk felt instantly real-world useful today?",
  },
  {
    week: 6,
    slug: "routines-time",
    theme: "Routines and Time",
    missionName: "Talk about your day",
    objective:
      "Describe routines and simple time anchors in useful spoken Russian.",
    milestone: "Say when you do things and what is different today.",
    grammarFrame:
      "Teach time anchors through use and contrast, not long tense lectures.",
    pronunciationNote:
      "Keep Russian stress even when talking about times and schedules.",
    experiments: [
      "Bedtime review and morning recall",
      "One surprise past-vs-future prompt",
    ],
    skillNodes: [
      {
        id: "w6-routine",
        week: 6,
        title: "Describe a routine",
        description: "Build a stable daily script.",
        focus: "chunks",
        chunkIds: ["w6-usually", "w6-work", "w6-today"],
      },
      {
        id: "w6-time",
        week: 6,
        title: "Anchor speech in time",
        description: "Use today and routine anchors cleanly.",
        focus: "review",
        chunkIds: ["w6-usually", "w6-today"],
      },
    ],
    chunks: [
      {
        id: "w6-usually",
        week: 6,
        title: "Say when you get up",
        russian: "Обычно я встаю в семь",
        transliteration: "Obychno ya vstayu v sem",
        translation: "I usually get up at seven",
        notes: "Keep usually and the verb tightly linked.",
        stressHint: "a-BYCH-na ya vsta-YU v SYEM",
        functions: ["routine", "time"],
        tags: ["time"],
        difficulty: 3,
        keywords: ["обычно", "встаю", "семь"],
      },
      {
        id: "w6-work",
        week: 6,
        title: "Say when you finish work",
        russian: "Я работаю до шести",
        transliteration: "Ya rabotayu do shesti",
        translation: "I work until six",
        notes: "До is tiny but essential; keep it attached to the time phrase.",
        stressHint: "ya ra-BO-ta-yu da shyes-TI",
        functions: ["routine", "time"],
        tags: ["time"],
        difficulty: 3,
        keywords: ["я", "работаю", "шести"],
      },
      {
        id: "w6-today",
        week: 6,
        title: "Anchor the current day",
        russian: "Сегодня у меня урок",
        transliteration: "Segodnya u menya urok",
        translation: "Today I have a lesson",
        notes: "A high-frequency Russian possession frame.",
        stressHint: "sye-VOD-nya u mi-NYA u-ROK",
        functions: ["today", "schedule"],
        tags: ["time", "cases"],
        difficulty: 3,
        keywords: ["сегодня", "у", "меня", "урок"],
      },
    ],
    reviewItems: [
      {
        id: "w6-r1",
        chunkId: "w6-usually",
        prompt: "Say: I usually get up at seven.",
        answer: "Обычно я встаю в семь",
        cue: "Routine plus time.",
      },
      {
        id: "w6-r2",
        chunkId: "w6-today",
        prompt: "Say: Today I have a lesson.",
        answer: "Сегодня у меня урок",
        cue: "Day anchor plus possession frame.",
      },
    ],
    inputClip: {
      id: "w6-clip",
      week: 6,
      title: "Talking about the day",
      context: "A learner explains a normal day and what is special today.",
      instructions:
        "Listen once and decide which line is habitual versus specific to today.",
      captions: [
        {
          russian: "Обычно я встаю в семь.",
          translation: "I usually get up at seven.",
          glosses: ["обычно = usually", "встаю = get up"],
        },
        {
          russian: "Сегодня у меня урок.",
          translation: "Today I have a lesson.",
          glosses: ["сегодня = today", "у меня = I have"],
        },
      ],
      comprehensionChecks: [
        "Which line is habitual?",
        "Which line is about today only?",
      ],
    },
    scenario: {
      id: "w6-scenario",
      week: 6,
      title: "Explain your day",
      setting: "Someone asks what your day looks like.",
      objective: "Give one routine line and one today line.",
      targetChunkIds: ["w6-usually", "w6-work", "w6-today"],
      openingPrompt: "Расскажите о своём обычном дне и добавьте, что у вас сегодня.",
      supportPrompt: "Start with usually, then add today.",
      stretchPrompt: "Add one more time line about work.",
      sampleLines: [
        {
          speaker: "local",
          russian: "Что вы обычно делаете?",
          translation: "What do you usually do?",
        },
        {
          speaker: "coach",
          russian: "Обычно я встаю в семь. Сегодня у меня урок.",
          translation: "I usually get up at seven. Today I have a lesson.",
        },
      ],
    },
    reflectionPrompt:
      "Which time anchor made your Russian feel more like real speech?",
  },
  {
    week: 7,
    slug: "social-situations",
    theme: "Social Situations",
    missionName: "Move from transactions to connection",
    objective:
      "Use invitation, availability, and preference chunks for social plans.",
    milestone: "Propose one plan and state one preference naturally.",
    grammarFrame:
      "Teach social moves as interactional chunks, not abstract grammar points.",
    pronunciationNote:
      "Shadow whole social phrases as melodies, not syllable piles.",
    experiments: [
      "Emotionally salient invitation scenario",
      "Surprise recall two hours later",
    ],
    skillNodes: [
      {
        id: "w7-invite",
        week: 7,
        title: "Make or answer an invitation",
        description: "Social fluency depends on prepared social moves.",
        focus: "conversation",
        chunkIds: ["w7-free", "w7-meet", "w7-like"],
      },
      {
        id: "w7-preference",
        week: 7,
        title: "State likes clearly",
        description: "Keep the conversation moving after the invitation.",
        focus: "chunks",
        chunkIds: ["w7-like"],
      },
    ],
    chunks: [
      {
        id: "w7-free",
        week: 7,
        title: "Ask availability",
        russian: "Вы свободны вечером?",
        transliteration: "Vy svobodny vecherom?",
        translation: "Are you free this evening?",
        notes: "A natural social-planning question.",
        stressHint: "vy sva-BOD-ny VYE-che-ram",
        functions: ["availability"],
        tags: ["social"],
        difficulty: 3,
        keywords: ["вы", "свободны", "вечером"],
      },
      {
        id: "w7-meet",
        week: 7,
        title: "Suggest meeting",
        russian: "Давайте встретимся завтра",
        transliteration: "Davayte vstretimsya zavtra",
        translation: "Let's meet tomorrow",
        notes: "Learn it as one invitation chunk.",
        stressHint: "da-VAY-tye fs-TRYE-tim-sya ZAF-tra",
        functions: ["invitation"],
        tags: ["social", "pronunciation"],
        difficulty: 4,
        keywords: ["давайте", "встретимся", "завтра"],
      },
      {
        id: "w7-like",
        week: 7,
        title: "Say what you like",
        russian: "Мне нравится музыка",
        transliteration: "Mne nravitsya muzyka",
        translation: "I like music",
        notes: "A classic Russian preference frame.",
        stressHint: "mnye NRA-vit-sya MU-zy-ka",
        functions: ["preference"],
        tags: ["social", "cases"],
        difficulty: 3,
        keywords: ["мне", "нравится", "музыка"],
      },
    ],
    reviewItems: [
      {
        id: "w7-r1",
        chunkId: "w7-meet",
        prompt: "Say: Let's meet tomorrow.",
        answer: "Давайте встретимся завтра",
        cue: "Invitation chunk.",
      },
      {
        id: "w7-r2",
        chunkId: "w7-free",
        prompt: "Say: Are you free this evening?",
        answer: "Вы свободны вечером?",
        cue: "Social planning question.",
      },
    ],
    inputClip: {
      id: "w7-clip",
      week: 7,
      title: "Making plans",
      context: "Two people plan an evening meet-up.",
      instructions:
        "Listen first and identify the invitation versus the preference line.",
      captions: [
        {
          russian: "Вы свободны вечером?",
          translation: "Are you free this evening?",
          glosses: ["свободны = free", "вечером = in the evening"],
        },
        {
          russian: "Давайте встретимся завтра.",
          translation: "Let's meet tomorrow.",
          glosses: ["давайте = let's", "встретимся = meet"],
        },
      ],
      comprehensionChecks: [
        "Which line checks availability?",
        "Which line proposes the plan?",
      ],
    },
    scenario: {
      id: "w7-scenario",
      week: 7,
      title: "Make evening plans",
      setting: "You want to make a simple social plan.",
      objective: "Ask if someone is free and suggest meeting.",
      targetChunkIds: ["w7-free", "w7-meet", "w7-like"],
      openingPrompt: "Спросите, свободен ли человек вечером, и предложите встретиться.",
      supportPrompt: "Availability first, invitation second.",
      stretchPrompt: "Add one preference line after the invitation.",
      sampleLines: [
        {
          speaker: "local",
          russian: "Вы свободны вечером?",
          translation: "Are you free this evening?",
        },
        {
          speaker: "coach",
          russian: "Да. Давайте встретимся завтра.",
          translation: "Yes. Let's meet tomorrow.",
        },
      ],
    },
    reflectionPrompt:
      "Which social chunk felt the least robotic today?",
  },
  {
    week: 8,
    slug: "consolidation-a2",
    theme: "A2 Scenario Packs",
    missionName: "Handle richer everyday situations",
    objective:
      "Consolidate earlier chunks into problems, recommendations, and action contrasts.",
    milestone: "Sustain a short multi-turn exchange with real communicative intent.",
    grammarFrame:
      "Use meaning contrasts for done vs. not-yet-done instead of drowning in terminology.",
    pronunciationNote:
      "At this stage the goal is intelligibility under speed, not perfection.",
    experiments: [
      "Story mission with a real-world problem",
      "Learner-generated micro-subtitles after the final clip",
    ],
    skillNodes: [
      {
        id: "w8-problem",
        week: 8,
        title: "Handle a minor problem",
        description: "Explain a problem and keep the exchange moving.",
        focus: "conversation",
        chunkIds: ["w8-problem", "w8-recommend", "w8-notyet"],
      },
      {
        id: "w8-aspect",
        week: 8,
        title: "Contrast done vs. not yet",
        description: "Feel completion through paired meaning.",
        focus: "review",
        chunkIds: ["w8-notyet"],
      },
    ],
    chunks: [
      {
        id: "w8-problem",
        week: 8,
        title: "State a problem",
        russian: "У меня проблема с заказом",
        transliteration: "U menya problema s zakazom",
        translation: "I have a problem with the order",
        notes: "A practical A2 repair chunk.",
        stressHint: "u mi-NYA pra-BLYE-ma s za-KA-zam",
        functions: ["problem-solving"],
        tags: ["cases", "survival"],
        difficulty: 4,
        keywords: ["у", "меня", "проблема", "заказом"],
      },
      {
        id: "w8-recommend",
        week: 8,
        title: "Ask for a recommendation",
        russian: "Можете порекомендовать место?",
        transliteration: "Mozhete porekomendovat mesto?",
        translation: "Can you recommend a place?",
        notes: "High-leverage chunk for richer conversation.",
        stressHint: "MO-zhy-tye parekamyen-da-VAT MYES-ta",
        functions: ["recommendation"],
        tags: ["social", "pronunciation"],
        difficulty: 4,
        keywords: ["можете", "порекомендовать", "место"],
      },
      {
        id: "w8-notyet",
        week: 8,
        title: "Not done yet",
        russian: "Я ещё не сделал это",
        transliteration: "Ya eshchyo ne sdelal eto",
        translation: "I have not done that yet",
        notes: "Use as the living opposite of already-done language.",
        stressHint: "ya i-SHCHO nye SDE-lal E-ta",
        functions: ["incompletion"],
        tags: ["aspect"],
        difficulty: 4,
        keywords: ["я", "ещё", "не", "сделал", "это"],
      },
    ],
    reviewItems: [
      {
        id: "w8-r1",
        chunkId: "w8-problem",
        prompt: "Say: I have a problem with the order.",
        answer: "У меня проблема с заказом",
        cue: "Practical repair chunk.",
      },
      {
        id: "w8-r2",
        chunkId: "w8-recommend",
        prompt: "Say: Can you recommend a place?",
        answer: "Можете порекомендовать место?",
        cue: "Recommendation chunk.",
      },
    ],
    inputClip: {
      id: "w8-clip",
      week: 8,
      title: "Recommendation plus problem",
      context: "A learner asks for a recommendation and explains a small problem.",
      instructions:
        "Listen once and label the recommendation move versus the problem move.",
      captions: [
        {
          russian: "Можете порекомендовать место?",
          translation: "Can you recommend a place?",
          glosses: ["можете = can you", "место = place"],
        },
        {
          russian: "У меня проблема с заказом.",
          translation: "I have a problem with the order.",
          glosses: ["проблема = problem", "с заказом = with the order"],
        },
      ],
      comprehensionChecks: [
        "Which line opens a new topic politely?",
        "Which line explains the issue?",
      ],
    },
    scenario: {
      id: "w8-scenario",
      week: 8,
      title: "Handle the issue and keep talking",
      setting: "A real-world exchange mixes help, repair, and recommendation.",
      objective: "Explain a problem and ask for a recommendation in the same conversation.",
      targetChunkIds: ["w8-problem", "w8-recommend", "w8-notyet"],
      openingPrompt:
        "Скажите, что у вас проблема, а потом попросите порекомендовать место.",
      supportPrompt: "Problem first, recommendation second.",
      stretchPrompt: "Add what you have not done yet.",
      sampleLines: [
        {
          speaker: "local",
          russian: "Чем я могу помочь?",
          translation: "How can I help?",
        },
        {
          speaker: "coach",
          russian: "У меня проблема с заказом. Можете порекомендовать место?",
          translation: "I have a problem with the order. Can you recommend a place?",
        },
      ],
    },
    reflectionPrompt:
      "Which chunk now feels like real usable Russian rather than practice language?",
  },
];

export const researchAnchors: ResearchAnchor[] = [
  {
    id: "anchor-phonetics",
    title: "High-variability phonetic training",
    finding:
      "Adult learners improve faster when they hear varied voices and focused phonetic contrasts early.",
    implication:
      "Pronunciation Lab should rotate voices and sound targets rather than use one sterile recording.",
    citationLabel: "HVPT meta-analysis",
    citationUrl:
      "https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/high-variability-phonetic-training-hvpt-a-metaanalysis-of-l2-perceptual-training-studies/6ABB8C1F32D88D53EA8D05A4565E76F6",
  },
  {
    id: "anchor-asr",
    title: "ASR with explicit feedback",
    finding:
      "Automatic speech recognition helps pronunciation most when feedback is explicit and targeted.",
    implication:
      "Pronunciation attempts should return actionable corrections, not just a generic score.",
    citationLabel: "ReCALL 2024",
    citationUrl: "https://doi.org/10.1017/S0958344023000113",
  },
  {
    id: "anchor-glosses",
    title: "Selective glosses beat overload",
    finding:
      "Glosses are effective for beginners, but too many supports at once dilute the effect.",
    implication:
      "Input Theater should reveal glosses progressively after the first listening pass.",
    citationLabel: "Acta Psychologica 2024",
    citationUrl: "https://doi.org/10.1016/j.actpsy.2024.104341",
  },
  {
    id: "anchor-subtitles",
    title: "Subtitles work best with active tasks",
    finding:
      "Captioned input helps most when learners predict, recall, or reconstruct instead of just watching.",
    implication:
      "Transcript withholding and reconstruction should stay central to the listening flow.",
    citationLabel: "Educ. Sci. 2023",
    citationUrl: "https://doi.org/10.3390/educsci13030274",
  },
  {
    id: "anchor-srl",
    title: "Self-regulated learning multiplies results",
    finding:
      "Strategy instruction and reflection improve language outcomes, confidence, and follow-through.",
    implication:
      "Mission Review should show weak spots, next actions, and reflection instead of filler gamification.",
    citationLabel: "Frontiers 2022",
    citationUrl:
      "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.1021101/full",
  },
];

export const weekRoadmap: WeekRoadmap[] = curriculum.map((week) => ({
  week: week.week,
  theme: week.theme,
  missionName: week.missionName,
  objective: week.objective,
  milestone: week.milestone,
}));
export const allChunks = curriculum.flatMap((week) => week.chunks);
export const allReviewItems = curriculum.flatMap((week) => week.reviewItems);
export const chunkIndex = new Map(allChunks.map((chunk) => [chunk.id, chunk]));
export const scenarioIndex = new Map(curriculum.map((week) => [week.scenario.id, week.scenario]));

export function getWeekProgram(week: number) {
  return curriculum[Math.max(0, Math.min(curriculum.length - 1, week - 1))];
}

export function getChunkById(chunkId: string): LexicalChunk | undefined {
  return chunkIndex.get(chunkId);
}

export function getScenarioById(scenarioId: string) {
  return scenarioIndex.get(scenarioId);
}
