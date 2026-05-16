export type Locale = "en" | "si" | "ta";

export const localeMeta: Record<
  Locale,
  { label: string; native: string; short: string }
> = {
  en: { label: "English", native: "English", short: "EN" },
  si: { label: "Sinhala", native: "සිංහල", short: "සි" },
  ta: { label: "Tamil", native: "தமிழ்", short: "த" },
};

/**
 * Strings are kept lean and human. We translate the landing page essentials
 * (nav, hero, primary CTA labels) — content blocks stay in English for now,
 * since SoleBook's product copy is still evolving. Switcher proves the
 * intent and lets local owners see their language is welcome.
 */
export const dictionary = {
  en: {
    nav: {
      product: "Product",
      howItWorks: "How it works",
      forSMEs: "For SMEs",
      pricing: "Pricing",
      faq: "FAQ",
      signIn: "Sign in",
      getStarted: "Get early access",
    },
    hero: {
      eyebrow: "AI Financial Discipline for SMEs",
      titleA: "From cash chaos",
      titleB: "to financial control.",
      sub: "SoleBook helps Sri Lankan sole proprietors and small businesses allocate every rupee with intent — protect obligations, pay yourself properly, and grow without changing your bank.",
      ctaPrimary: "Get early access",
      ctaSecondary: "See how it works",
      trust: "Built for Sri Lankan SMEs · Works alongside your bank · No new account needed",
    },
    waitlist: {
      placeholder: "Your work email",
      button: "Join waitlist",
      success: "You're in. We'll be in touch soon.",
      error: "Something went wrong. Please try again.",
      already: "You're already on the list — see you soon.",
    },
  },
  si: {
    nav: {
      product: "නිෂ්පාදනය",
      howItWorks: "ක්‍රියා කරන ආකාරය",
      forSMEs: "කුඩා ව්‍යාපාර සඳහා",
      pricing: "මිල",
      faq: "ප්‍රශ්න",
      signIn: "පිවිසෙන්න",
      getStarted: "මුල් ප්‍රවේශය",
    },
    hero: {
      eyebrow: "කුඩා ව්‍යාපාර සඳහා AI මූල්‍ය විනය",
      titleA: "මුදල් අවුලෙන්,",
      titleB: "මූල්‍ය පාලනයට.",
      sub: "SoleBook ඔබට, ඔබේ බැංකුව වෙනස් නොකර, සෑම රුපියලකම අරමුණක් ලබා දී, වගකීම් ආරක්ෂා කර, නිසි ලෙස වැටුප් ලබා ගැනීමට උපකාර කරයි.",
      ctaPrimary: "මුල් ප්‍රවේශය ලබාගන්න",
      ctaSecondary: "ක්‍රියා කරන හැටි බලන්න",
      trust: "ශ්‍රී ලාංකික SME සඳහා · ඔබේ බැංකුව සමඟ ක්‍රියා කරයි · නව ගිණුමක් අවශ්‍ය නැත",
    },
    waitlist: {
      placeholder: "ඔබේ විද්‍යුත් තැපෑල",
      button: "ලැයිස්තුවට එක්වන්න",
      success: "ඔබ ලැයිස්තුවට එකතු විය. ඉක්මනින් අපි සම්බන්ධ වෙමු.",
      error: "දෝෂයක්. නැවත උත්සාහ කරන්න.",
      already: "ඔබ දැනටමත් ලැයිස්තුවේ සිටී.",
    },
  },
  ta: {
    nav: {
      product: "தயாரிப்பு",
      howItWorks: "எப்படி வேலை செய்கிறது",
      forSMEs: "சிறு வணிகங்களுக்கு",
      pricing: "விலை",
      faq: "கேள்விகள்",
      signIn: "உள்நுழைக",
      getStarted: "முன் அணுகல்",
    },
    hero: {
      eyebrow: "சிறு வணிகங்களுக்கான AI நிதி ஒழுக்கம்",
      titleA: "பண குழப்பத்திலிருந்து,",
      titleB: "நிதி கட்டுப்பாட்டிற்கு.",
      sub: "உங்கள் வங்கியை மாற்றாமலேயே, ஒவ்வொரு ரூபாயையும் நோக்கத்துடன் ஒதுக்கி, கடமைகளைப் பாதுகாத்து, சரியான முறையில் சம்பளம் பெற SoleBook உதவுகிறது.",
      ctaPrimary: "முன் அணுகலைப் பெறுங்கள்",
      ctaSecondary: "எப்படி வேலை செய்கிறது",
      trust: "இலங்கை SMEக்கானது · உங்கள் வங்கியுடன் இணைந்து இயங்குகிறது · புதிய கணக்கு தேவையில்லை",
    },
    waitlist: {
      placeholder: "உங்கள் மின்னஞ்சல்",
      button: "காத்திருப்பு பட்டியலில் சேருங்கள்",
      success: "நீங்கள் சேர்க்கப்பட்டுள்ளீர்கள். விரைவில் தொடர்பு கொள்கிறோம்.",
      error: "ஏதோ தவறு. மீண்டும் முயற்சிக்கவும்.",
      already: "நீங்கள் ஏற்கனவே பட்டியலில் உள்ளீர்கள்.",
    },
  },
} as const;

export type Dictionary = (typeof dictionary)[Locale];
