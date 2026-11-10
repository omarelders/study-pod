/**
 * Bilingual English (en) & Native iOS Arabic (ar) Localization Dictionary & Helpers
 */

const GOAL_TRANSLATIONS_AR = {
  'study-hours': {
    title: 'دراسة عميقة',
    shortTitle: 'دراسة عميقة',
    subtitle: 'يومي · جلسات تركيز بومودورو (الهدف 8 ساعات)',
    unit: 'دقيقة',
  },
  flashcards: {
    title: 'بطاقات الاستذكار',
    shortTitle: 'البطاقات',
    subtitle: 'يومي · تكرار متباعد ونقاط خبرة (الهدف 10,000)',
    unit: 'نقطة',
  },
  reading: {
    title: 'قراءة وفصول',
    shortTitle: 'القراءة',
    subtitle: 'يومي · صفحات كتب ومراجع (الهدف 20 صفحة)',
    unit: 'صفحة',
  },
  lectures: {
    title: 'محاضرات مسجلة',
    shortTitle: 'المحاضرات',
    subtitle: 'يومي · دروس مشروحة ومكتملة (الهدف 8)',
    unit: 'درس',
  },
  'active-recall': {
    title: 'اختبار واسترجاع نشط',
    shortTitle: 'الاسترجاع',
    subtitle: 'يومي · اختبارات تدريبية (الهدف 10)',
    unit: 'اختبار',
  },
  'problem-sets': {
    title: 'حل مسائل وتدريبات',
    shortTitle: 'المسائل',
    subtitle: 'يومي · مسائل برمجية ورياضية (الهدف 60 دقيقة)',
    unit: 'دقيقة',
  },
  'daily-review': {
    title: 'مراجعة يومية',
    shortTitle: 'المراجعة',
    subtitle: 'يومي · مراجعة صباحية ومسائية (الهدف 2)',
    unit: 'مراجعة',
  },
  'mock-exams': {
    title: 'اختبارات تجريبية',
    shortTitle: 'اختبارات تجريبية',
    subtitle: 'مرحلي · مجموع نقاط الاختبارات (الهدف 200 نقطة)',
    unit: 'نقطة',
  },
  'syllabus-mastery': {
    title: 'إتقان المنهج',
    shortTitle: 'المنهج',
    subtitle: 'مرحلي · الوحدات المتقنة (الهدف 100 موضوع)',
    unit: 'موضوع',
  },
};

const WEEKDAY_AR_SHORT = {
  M: 'ن',
  T: 'ث',
  W: 'ر',
  F: 'ج',
  S: 'س',
};

export function getGoalTitle(goal, lang = 'en', short = false) {
  if (!goal) return '';
  if (lang === 'ar') {
    const entry = GOAL_TRANSLATIONS_AR[goal.id];
    if (entry) return short ? entry.shortTitle : entry.title;
    return goal.title;
  }
  if (short) {
    if (goal.id === 'flashcards' && goal.title === 'Flashcards & XP') {
      return 'Flashcards';
    }
    if (goal.id === 'active-recall' && goal.title === 'Quiz & Recall') {
      return 'Recall';
    }
  }
  return goal.title;
}

export function getGoalSubtitle(goal, lang = 'en') {
  if (!goal) return '';
  if (lang === 'ar') {
    return GOAL_TRANSLATIONS_AR[goal.id]?.subtitle || goal.subtitle;
  }
  return goal.subtitle;
}

export function getGoalUnit(goal, lang = 'en') {
  if (!goal) return '';
  if (lang === 'ar') {
    return GOAL_TRANSLATIONS_AR[goal.id]?.unit || goal.unit;
  }
  return goal.unit;
}

export function getWeekdayLabel(dayChar, idx, lang = 'en') {
  if (lang !== 'ar') return dayChar;
  const arDays = ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'];
  return arDays[idx] || WEEKDAY_AR_SHORT[dayChar] || dayChar;
}

export function getLocalizedDayHeader(isYesterday = false, lang = 'en') {
  const d = new Date();
  if (isYesterday) {
    d.setDate(d.getDate() - 1);
  }
  if (lang === 'ar') {
    const formatted = d.toLocaleDateString('ar-EG', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    return isYesterday ? `الأمس · ${formatted}` : formatted;
  }
  const formatted = d
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();
  return isYesterday ? `YESTERDAY · ${formatted}` : formatted;
}

export function getLocalizedWeekRange(uppercase = false, lang = 'en') {
  const now = new Date();
  const dayIdx = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayIdx);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  if (lang === 'ar') {
    const fmt = (d) =>
      d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    return `${fmt(monday)} – ${fmt(sunday)}`;
  }

  const fmt = (d) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const label = `${fmt(monday)} – ${fmt(sunday)}`;
  return uppercase ? label.toUpperCase() : label;
}

export const UI_TEXT = {
  en: {
    getApp: 'Get App',
    together: 'Together',
    insights: 'Insights',
    you: 'You',
    yourPartner: 'Your partner',
    goalsReachedToday: 'GOALS REACHED TODAY',
    percent: 'PERCENT',
    pairUpToStart: 'Pair up to start',
    yesterday: 'YESTERDAY',
    viewingYesterday: 'VIEWING YESTERDAY',
    todaysProgress: "Today's Progress",
    yesterdaysProgress: "Yesterday's Progress",
    goalsInSyncToday: (sync, total) =>
      `${sync} of ${total} goals in sync today`,
    pairToSyncGoals: 'Pair with a study partner to sync goals',
    beyondToday: 'Beyond Today',
    cumulativeMilestones: 'Cumulative milestones',
    partnerDefault: 'Partner',
    youSuffix: 'You',
    partnerSuffix: 'Partner',
    // Quick Log & Timer Modal
    studyLogAndTimer: 'Study Log & Focus Timer',
    doneBadge: (done, total) => `${done}/${total} done`,
    quickLogSubtitle: 'Tap + for instant step or tap any habit to scrub',
    focusTimer: 'FOCUS TIMER',
    liveBadge: 'LIVE',
    start: 'Start',
    pause: 'Pause',
    preset25: '25m Focus',
    preset50: '50m Deep',
    preset15: '15m Recall',
    subjectDeepStudy: 'Deep Study',
    subjectRecall: 'Quiz & Recall',
    dailyHabitsFor: (name) => `DAILY HABITS · ${name.toUpperCase()}`,
    tapRowToFineTune: 'Tap row to fine-tune',
    hitTarget: 'Hit Target',
    done: 'Done',
    // Insights
    togetherDays: (u1, u2, days) => `${u1} + ${u2} · together ${days} days`,
    podHealth: 'POD HEALTH',
    podHealthInfo: '70% daily goal completion + 30% shared pod sync',
    thriving: 'THRIVING',
    steady: 'STEADY',
    warmingUp: 'WARMING UP',
    days: 'days',
    totalDays: 'total days',
    bestStreak: 'Best streak',
    daysTogether: 'Days together',
    currentStreak: 'Current streak',
    weekly: 'Weekly',
    recap: 'Recap',
    yourWeek: 'YOUR WEEK',
    tapToOpenRecap: (days) => `Tap to open recap · ${days} days in sync`,
    individual: 'Individual',
    todaysPace: "Today's pace",
    studied: 'studied',
    daysInSyncThisWeek: 'days in sync this week',
    bothHitEveryGoal: 'Both of you hit every shared goal that day.',
    goalsHeader: 'GOALS',
    whereYouBothShowedUp: 'Where you both showed up this week',
    // Settings & Pairing
    youAndPodSettings: 'You & Pod Settings',
    settingsSubtitle:
      'Manage your study pod, rings, and gentle check-in preferences',
    yourName: 'Your Name',
    partnerName: 'Partner Name',
    languageSection: 'LANGUAGE · اللغة',
    appLanguage: 'App Language',
    podPairingAndSync: 'POD PAIRING & SYNC',
    pairedWith: (name) => `Paired with ${name}`,
    soloModeUnpaired: 'Solo Mode (Unpaired)',
    verifySync: 'Verify Sync',
    syncing: 'Syncing…',
    viewPodDetails: 'View Pod Details',
    shareCode: 'Share Code',
    iphoneHomeScreenApp: 'iPhone Home Screen App',
    runningStandaloneDesc: 'Running in full-screen native PWA mode',
    installStandaloneDesc: 'Install full-screen Liquid Glass app on iPhone',
    installed: 'Installed',
    install: 'Install',
    leavePod: 'Leave Pod',
    unpairRing: 'Unpair ring',
    repairWith: (name) => `Re-pair with ${name}`,
    goalsAndCheckins: 'GOALS & CHECK-INS',
    editStudyGoals: 'Edit Study Goals & Custom Goals',
    activeCount: (n) => `${n} active`,
    gentleReminders: 'Gentle Reminders',
    warmNudgesWhen: (name) => `Warm nudges when ${name} studies`,
    appearanceRingColor: 'APPEARANCE · RING COLOR',
    usersRing: (name) => `${name}'s Ring`,
    dataAndReset: 'DATA & RESET',
    resetZeroTitle: 'Reset All Progress to 0 (Real Tracking)',
    resetZeroDesc: 'Clears demo data and starts fresh for today',
    loadDemoTitle: 'Load 43% Video Demo Snapshot',
    startFreshTitle: 'Start Fresh / Launch Onboarding Wizard',
    // Pairing Modal
    yourPodCodeTab: 'Your Pod Code',
    enterCodeTab: 'Enter Code',
    inviteSheetTab: 'Invite Sheet',
    shareThisCodeDesc:
      'Share this code with your study partner to pair your pods',
    waitingForPartner: 'Waiting for partner',
    newCode: 'New code',
    copiedCode: (code) => `Copied! (${code})`,
    havePartnerCodeLink: "Have a partner's code? Enter invite code",
    enterInviteCodeTitle: 'Enter Invite Code',
    enterInviteCodeDesc: "Enter your study partner's 6-character pod code",
    cancel: 'Cancel',
    join: 'Join',
    invitedYou: (name) => `${name} invited you!`,
    joinPodAndTrackDesc: 'Join their pod and start tracking goals together.',
    acceptInvite: 'Accept Invite',
    notNow: 'Not Now',
    // PWA Install Modal
    iphoneNativeWebApp: 'iPhone Native Web App',
    installStudyPodApp: 'Install StudyPod App',
    installModalSubtitle:
      'Add to your iPhone Home Screen for full-screen Liquid Glass & instant partner sync',
    featFullScreen: 'Full Screen',
    featFullScreenSub: 'No Safari bars',
    featGlass: '120Hz Glass',
    featGlassSub: 'Native iOS feel',
    featLiveSync: 'Live Sync',
    featLiveSyncSub: 'Instant pod ring',
    installingStudyPod: 'Installing StudyPod…',
    downloadAndInstallNow: 'Download & Install App Now',
    howToInstallHeader: 'HOW TO INSTALL ON IPHONE (10 SEC)',
    step1Title: '1. Tap the',
    shareWord: 'Share',
    buttonWord: 'button',
    step1Sub: (loc) => `Located in your ${loc}`,
    step1Badge: 'Step 1',
    step2Title: '2. Select “Add to Home Screen”',
    step2Sub: 'Scroll down the share sheet menu & tap it',
    step2Badge: 'Step 2',
    step3Title: '3. Tap “Add” in top corner',
    step3Sub: 'Open StudyPod from your Home Screen like a native app',
    step3Badge: 'Done',
    gotItContinue: 'Got It — Continue to StudyPod',
    tapSharePointer: (loc) => `Tap Share in your ${loc} to install`,
  },
  ar: {
    getApp: 'تثبيت',
    together: 'معاً',
    insights: 'الإحصائيات',
    you: 'أنت',
    yourPartner: 'شريكك',
    goalsReachedToday: 'الأهداف المحققة اليوم',
    percent: 'بالمئة',
    pairUpToStart: 'اربط مع شريك للبدء',
    yesterday: 'الأمس',
    viewingYesterday: 'عرض الأمس',
    todaysProgress: 'تقدم اليوم',
    yesterdaysProgress: 'تقدم الأمس',
    goalsInSyncToday: (sync, total) =>
      `${sync} من ${total} أهداف متزامنة اليوم`,
    pairToSyncGoals: 'اربط مع شريك دراسة لمزامنة الأهداف',
    beyondToday: 'أهداف مرحلية',
    cumulativeMilestones: 'إنجازات تراكمية',
    partnerDefault: 'الشريك',
    youSuffix: 'أنت',
    partnerSuffix: 'الشريك',
    // Quick Log & Timer Modal
    studyLogAndTimer: 'سجل الدراسة ومؤقت التركيز',
    doneBadge: (done, total) => `${done}/${total} مكتمل`,
    quickLogSubtitle: 'اضغط + للإضافة السريعة أو اختر عادة للتعديل الدقيق',
    focusTimer: 'مؤقت التركيز',
    liveBadge: 'مباشر',
    start: 'ابدأ',
    pause: 'إيقاف',
    preset25: '25 د تركيز',
    preset50: '50 د عميق',
    preset15: '15 د مراجعة',
    subjectDeepStudy: 'دراسة عميقة',
    subjectRecall: 'مراجعة نشطة',
    dailyHabitsFor: (name) => `العادات اليومية · ${name}`,
    tapRowToFineTune: 'اضغط للتعديل الدقيق',
    hitTarget: 'إكمال الهدف',
    done: 'مكتمل',
    // Insights
    togetherDays: (u1, u2, days) => `${u1} + ${u2} · معاً منذ ${days} يوم`,
    podHealth: 'صحة المجموعة',
    podHealthInfo: '70% إكمال الأهداف اليومية + 30% التزامن المشترك',
    thriving: 'مزدهر',
    steady: 'مستقر',
    warmingUp: 'في البداية',
    days: 'أيام',
    totalDays: 'إجمالي الأيام',
    bestStreak: 'أفضل سلسلة',
    daysTogether: 'أيام معاً',
    currentStreak: 'السلسلة الحالية',
    weekly: 'الأسبوعي',
    recap: 'الملخص',
    yourWeek: 'أسبوعك',
    tapToOpenRecap: (days) => `اضغط لفتح الملخص · ${days} أيام متزامنة`,
    individual: 'الأداء الفردي',
    todaysPace: 'وتيرة اليوم',
    studied: 'دراسة',
    daysInSyncThisWeek: 'أيام متزامنة هذا الأسبوع',
    bothHitEveryGoal: 'حققتما معاً جميع الأهداف المشتركة في ذلك اليوم.',
    goalsHeader: 'الأهداف',
    whereYouBothShowedUp: 'الأهداف التي التزمتما بها معاً هذا الأسبوع',
    // Settings & Pairing
    youAndPodSettings: 'إعداداتك والمجموعة',
    settingsSubtitle: 'إدارة مجموعة الدراسة وحلقات الإنجاز والتنبيهات الهادئة',
    yourName: 'اسمك',
    partnerName: 'اسم الشريك',
    languageSection: 'اللغة · LANGUAGE',
    appLanguage: 'لغة التطبيق',
    podPairingAndSync: 'الربط والمزامنة السحابية',
    pairedWith: (name) => `مرتبط مع ${name}`,
    soloModeUnpaired: 'الوضع الفردي (غير مرتبط)',
    verifySync: 'تحقق من المزامنة',
    syncing: 'جارٍ التحقق…',
    viewPodDetails: 'تفاصيل المجموعة',
    shareCode: 'مشاركة الرمز',
    iphoneHomeScreenApp: 'تطبيق الشاشة الرئيسية للآيفون',
    runningStandaloneDesc: 'يعمل الآن بوضع ملء الشاشة الأصلي',
    installStandaloneDesc: 'ثبّت التطبيق بتصميم Liquid Glass على الآيفون',
    installed: 'مثبّت',
    install: 'تثبيت',
    leavePod: 'مغادرة المجموعة',
    unpairRing: 'إلغاء الربط',
    repairWith: (name) => `إعادة الربط مع ${name}`,
    goalsAndCheckins: 'الأهداف والتنبيهات',
    editStudyGoals: 'تعديل أهداف الدراسة والأهداف المخصصة',
    activeCount: (n) => `${n} نشط`,
    gentleReminders: 'تنبيهات لطيفة',
    warmNudgesWhen: (name) => `إشعارات ودية عندما يبدأ ${name} بالدراسة`,
    appearanceRingColor: 'المظهر · لون الحلقة',
    usersRing: (name) => `حلقة ${name}`,
    dataAndReset: 'البيانات وإعادة الضبط',
    resetZeroTitle: 'تصفير جميع الأهداف إلى 0 (تتبع حقيقي)',
    resetZeroDesc: 'مسح البيانات التجريبية والبدء من جديد لليوم',
    loadDemoTitle: 'تحميل العرض التجريبي (43%)',
    startFreshTitle: 'البدء من جديد / معالج الإعداد الأولي',
    // Pairing Modal
    yourPodCodeTab: 'رمز مجموعتك',
    enterCodeTab: 'إدخال رمز',
    inviteSheetTab: 'بطاقة الدعوة',
    shareThisCodeDesc: 'شارك هذا الرمز مع شريك دراستك لربط حسابيكما معاً',
    waitingForPartner: 'بانتظار الشريك',
    newCode: 'رمز جديد',
    copiedCode: (code) => `تم النسخ! (${code})`,
    havePartnerCodeLink: 'لديك رمز شريكك؟ أدخل رمز الدعوة',
    enterInviteCodeTitle: 'إدخال رمز الدعوة',
    enterInviteCodeDesc: 'أدخل رمز مجموعة شريكك المكون من 6 أحرف',
    cancel: 'إلغاء',
    join: 'انضمام',
    invitedYou: (name) => `${name} دعاك للانضمام!`,
    joinPodAndTrackDesc: 'انضم إلى مجموعته وابدآ تتبع الأهداف معاً.',
    acceptInvite: 'قبول الدعوة',
    notNow: 'ليس الآن',
    // PWA Install Modal
    iphoneNativeWebApp: 'تطبيق آيفون أصلي',
    installStudyPodApp: 'تثبيت تطبيق StudyPod',
    installModalSubtitle:
      'أضف التطبيق إلى شاشة الآيفون الرئيسية لتجربة Liquid Glass بملء الشاشة ومزامنة فورية',
    featFullScreen: 'ملء الشاشة',
    featFullScreenSub: 'بدون أشرطة سفاري',
    featGlass: 'زجاج 120Hz',
    featGlassSub: 'إحساس iOS أصلي',
    featLiveSync: 'مزامنة فورية',
    featLiveSyncSub: 'حلقة مشتركة حية',
    installingStudyPod: 'جارٍ تثبيت StudyPod…',
    downloadAndInstallNow: 'تنزيل وتثبيت التطبيق الآن',
    howToInstallHeader: 'طريقة التثبيت على الآيفون (10 ثوانٍ)',
    step1Title: '1. اضغط على زر',
    shareWord: 'المشاركة',
    buttonWord: '',
    step1Sub: (loc) => `الموجود في ${loc}`,
    step1Badge: 'خطوة 1',
    step2Title: '2. اختر "إضافة إلى الشاشة الرئيسية"',
    step2Sub: 'مرر لأسفل في قائمة المشاركة واضغط عليها',
    step2Badge: 'خطوة 2',
    step3Title: '3. اضغط على "إضافة" في الأعلى',
    step3Sub: 'افتح StudyPod من شاشتك الرئيسية كتطبيق أصلي',
    step3Badge: 'تم',
    gotItContinue: 'حسناً — المتابعة إلى StudyPod',
    tapSharePointer: (loc) => `اضغط على أيقونة المشاركة في ${loc} للتثبيت`,
  },
};

export function getTexts(lang = 'en') {
  return UI_TEXT[lang === 'ar' ? 'ar' : 'en'];
}
