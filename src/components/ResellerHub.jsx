import { useState } from 'react'
import {
  Shield, Smartphone, Printer, Lightbulb, Download, Copy, Check,
  ChevronDown, MessageCircle, FileText, Palette, Layers, ShoppingBag,
  Award, DollarSign, Rocket, MessageSquare, Star, Zap,
} from 'lucide-react'

// ─── Copy button ──────────────────────────────────────────────────────────────
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false)

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      onClick={handle}
      className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all shadow-sm
        ${copied
          ? 'bg-emerald-600 border-emerald-600 text-white'
          : 'bg-white border-green-200 text-green-700 hover:bg-green-50'
        }`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'הועתק! ✓' : 'העתק טקסט'}
    </button>
  )
}

// ─── Accordion item ───────────────────────────────────────────────────────────
const AccordionItem = ({ icon: Icon, iconBg, title, children }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-right"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-bold text-gray-900 text-sm md:text-base">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Download card ────────────────────────────────────────────────────────────
const DownloadCard = ({ icon: Icon, iconBg, badge, badgeBg, title, description, btnLabel, btnClass }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={`${badgeBg} text-xs font-semibold px-2.5 py-1 rounded-full`}>{badge}</span>
    </div>
    <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{description}</p>
    <a
      href="#"
      className={`${btnClass} text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02]`}
    >
      <Download className="w-4 h-4" />
      {btnLabel}
    </a>
  </div>
)

const WA_TEMPLATE_1 = `שלום [שם הלקוח] 👋

אני [שמך], הטכנאי שלך.

רציתי לשתף אותך בפתרון שאני ממליץ על יותר ולקוחות — iFilter.

זה מסנן אינטרנט חכם שמגן על הילדים שלך בבית — בלי להגביל את הגדולים, בלי טרחה.

שולח לך דף מידע קצר. אם יש שאלות — אני כאן! 😊`

const WA_TEMPLATE_2 = `שלום [שם הלקוח] 🙂

דיברנו אתמול על iFilter.

רציתי לציין — ההתקנה לוקחת כ-5 דקות בלבד, ואפשר לעשות אותה מרחוק.

הרבה הורים אחרי ההתקנה מרגישים הרבה יותר שקט נפשי. אני יכול לתאם זמן נוח עבורך ולדאוג לכל הטכני.

מתי נוח לך? 📅`

// ─── Main component ───────────────────────────────────────────────────────────
const ResellerHub = () => {
  return (
    <div className="overflow-y-auto h-full" dir="rtl">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-xl">iFilter</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              אזור משווקים מורשים
            </div>
          </div>

          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
              נבחרת המשווקים של iFilter
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight mb-4">
              ברוך הבא לנבחרת<br className="hidden md:block" /> המשווקים של iFilter!
            </h1>
            <p className="text-blue-100 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
              כאן תמצא את כל הכלים והחומרים שיעזרו לך להציע את iFilter ללקוחות שלך בקלות ולהגדיל את ההכנסות.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-8 max-w-md mx-auto">
              {[['12+', 'חומרי שיווק'], ['5 דק׳', 'ליישום מיידי'], ['24/7', 'זמין להורדה']].map(([val, lbl]) => (
                <div key={lbl} className="bg-white/15 rounded-2xl p-3 text-center">
                  <p className="text-2xl font-black">{val}</p>
                  <p className="text-blue-200 text-xs mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Wave */}
        <svg viewBox="0 0 1200 50" preserveAspectRatio="none" className="w-full h-10 fill-gray-50 block">
          <path d="M0,50 C300,0 900,50 1200,0 L1200,50 Z" />
        </svg>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16">

        {/* ── Section A — Digital ── */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-8 mt-8">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900">📱 חומרי שיווק לדיגיטל</h2>
              <p className="text-gray-500 text-sm mt-0.5">פוסטים, PDF וערכת מיתוג — הורדה ישירה</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <DownloadCard
              icon={MessageCircle} iconBg="bg-green-50 text-green-500"
              badge="חדש" badgeBg="bg-green-100 text-green-700"
              title="תמונות סטטוס לווטסאפ"
              description="סט תמונות מעוצבות בפורמט Story לשיתוף בסטטוס הווטסאפ שלך — מושכות תשומת לב ומניעות פניות."
              btnLabel="הורד תמונות (ZIP)"
              btnClass="bg-gradient-to-l from-blue-700 to-blue-600"
            />
            <DownloadCard
              icon={FileText} iconBg="bg-red-50 text-red-500"
              badge="PDF" badgeBg="bg-blue-100 text-blue-700"
              title="דף מידע דיגיטלי ללקוח"
              description="עמוד אחד שמסביר ללקוח מה זה iFilter, למה הוא צריך את זה ומה הוא מקבל — לשלוח בווטסאפ או במייל."
              btnLabel="הורד PDF"
              btnClass="bg-gradient-to-l from-blue-700 to-blue-600"
            />
            <DownloadCard
              icon={Palette} iconBg="bg-purple-50 text-purple-500"
              badge="מיתוג" badgeBg="bg-purple-100 text-purple-700"
              title="לוגו רשמי וחומרי מיתוג"
              description="ערכת מיתוג מלאה: לוגו בפורמטים שונים, צבעי המותג, פונטים רשמיים ותבניות עיצוב בסיסיות."
              btnLabel="הורד ערכת מיתוג"
              btnClass="bg-gradient-to-l from-blue-700 to-blue-600"
            />
          </div>

          {/* WhatsApp Templates */}
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 bg-gradient-to-l from-green-50 to-white px-5 py-4 border-b border-green-100">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm md:text-base">תבניות הודעה מוכנות לווטסאפ</h3>
                <p className="text-gray-500 text-xs">העתק, שלח, סגור עסקה — פחות מ-30 שניות</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'תבנית #1 — פנייה ראשונה', text: WA_TEMPLATE_1 },
                { label: 'תבנית #2 — מעקב לאחר ביקור', text: WA_TEMPLATE_2 },
              ].map(({ label, text }) => (
                <div key={label} className="bg-gradient-to-l from-green-50 to-emerald-50 border-r-4 border-green-400 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{label}</span>
                    <CopyButton text={text} />
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section B — Print ── */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Printer className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900">🛒 חומרי שיווק לחנות / פרינט</h2>
              <p className="text-gray-500 text-sm mt-0.5">מדפיסים, שמים בחנות — ומכירות מגיעות לבד</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <DownloadCard
              icon={Layers} iconBg="bg-amber-50 text-amber-500"
              badge="A5" badgeBg="bg-amber-100 text-amber-700"
              title="מעמד דלפק קשיח"
              description="מעמד A5 מעוצב לדלפק חנות — מסביר ללקוחות מה זה iFilter בזמן שהם ממתינים. עצמאי, שקט, ומוכר."
              btnLabel="הורד PDF להדפסה"
              btnClass="bg-gradient-to-l from-amber-600 to-amber-500"
            />
            <DownloadCard
              icon={ShoppingBag} iconBg="bg-orange-50 text-orange-500"
              badge="פלייר" badgeBg="bg-orange-100 text-orange-700"
              title="פלייר לחלוקה בתוך שקית"
              description="פלייר קומפקטי שנכנס לתוך שקית הרכישה — הלקוח מגלה את iFilter בבית, ומתקשר אליך לשאול."
              btnLabel="הורד PDF להדפסה"
              btnClass="bg-gradient-to-l from-amber-600 to-amber-500"
            />
            <DownloadCard
              icon={Award} iconBg="bg-yellow-50 text-yellow-500"
              badge="מדבקה" badgeBg="bg-yellow-100 text-yellow-700"
              title='מדבקת חלון "משווק מורשה"'
              description="מדבקת חלון רשמית עם לוגו iFilter — מציגה את החנות שלך כמשווק מורשה ובונה אמון עם לקוחות חדשים."
              btnLabel="הורד לייקאות להדפסה"
              btnClass="bg-gradient-to-l from-amber-600 to-amber-500"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-amber-800 font-semibold text-sm">טיפ להדפסה</p>
              <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                כל קבצי ה-PDF מוכנים לדפוס ב-CMYK ברזולוציה 300 DPI. מומלץ להדפיס על נייר מצופה לתוצאה מושלמת. צריך שליחה לדפוס? נוכל לסייע — דבר איתנו.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section C — Cheat-sheet ── */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Lightbulb className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900">🔑 המדריך למכירה מהירה</h2>
              <p className="text-gray-500 text-sm mt-0.5">תשובות מוכנות לכל שלב בשיחת המכירה</p>
            </div>
          </div>

          <div className="space-y-3">

            {/* Q1 */}
            <AccordionItem
              icon={MessageSquare} iconBg="bg-blue-100 text-blue-600"
              title='איך לפתוח את השיחה עם הלקוח?'
            >
              <p className="text-gray-500 text-sm mb-3">בחר את המשפט שמתאים לסיטואציה — ואז תן לשאלות של הלקוח להוביל:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['🏪 בחנות פיזית', 'אגב, יש לך ילדים בבית? יש לנו פתרון חדש שהרבה הורים מבקשים — תן לי לספר לך בשניה.'],
                  ['🔧 ביקור טכנאי בבית', 'כבר כשאני פה, שנייה — אפשר להוסיף בלי עלות כמעט סינון אינטרנט לכל הבית. לא צריך ציוד חדש.'],
                  ['💬 בווטסאפ ללקוח ישן', 'שלום, יש לי בשורה ללקוחות שלי — פתרון פשוט שמגן על הילדים ברשת. שלח לי אם מעניין ואסביר.'],
                  ['📦 בנקודת מכירה', 'ראית את המדבקה על הדלת? אנחנו מורשים של iFilter — הגנה חכמה על האינטרנט של הבית.'],
                ].map(([title, text]) => (
                  <div key={title} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-xs font-bold text-blue-600 mb-1.5">{title}</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </AccordionItem>

            {/* Q2 */}
            <AccordionItem
              icon={Shield} iconBg="bg-orange-100 text-orange-500"
              title='איך לענות: "למה אני צריך סינון אינטרנט?"'
            >
              <p className="text-gray-500 text-sm mb-3">לא תתווכח — תעשה לו תמונה. בחר טקטיקה לפי הלקוח:</p>
              <div className="space-y-3">
                {[
                  ['🎯 טקטיקת ה"תמונה" — הכי חזקה', 'תחשוב ככה: הבית שלך יש לו דלת עם מנעול. האינטרנט שלך — עד היום — לא היה לו מנעול. iFilter זה המנעול.'],
                  ['📊 טקטיקת הנתונים', 'ילד ממוצע בישראל חשוף לתוכן לא הולם כבר מגיל 8. אם יש לך ילדים — זה לא שאלה של ׳אם׳, אלא ׳מתי׳.'],
                  ['💡 לגבר שאומר "אני סומך על הילדים שלי"', 'אני לא מדבר על לא לסמוך. אני מדבר על להגן. הבן שלך יכול להיות הכי אחראי בעולם — ועדיין להיחשף לדברים שאף אחד לא רוצה. זה לא על אמון, זה על הגנה.'],
                ].map(([title, text]) => (
                  <div key={title} className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <p className="text-xs font-bold text-orange-600 mb-1.5">{title}</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </AccordionItem>

            {/* Q3 — Profit */}
            <AccordionItem
              icon={DollarSign} iconBg="bg-green-100 text-green-600"
              title="כמה אני מרוויח מכל מכירה?"
            >
              {/* Profit box */}
              <div className="bg-gradient-to-l from-emerald-900 to-green-900 rounded-2xl p-5 text-white mb-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-10 -translate-y-10 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-6 translate-y-6 pointer-events-none" />
                <p className="text-emerald-300 font-bold text-xs mb-3 uppercase tracking-widest relative z-10">הכנסה למשווק</p>
                <div className="grid grid-cols-3 gap-3 relative z-10">
                  {[['₪XX', 'מכל מנוי חדש'], ['XX%', 'עמלת חידוש שנתי'], ['∞', 'ללא הגבלת לקוחות']].map(([val, lbl]) => (
                    <div key={lbl} className="text-center">
                      <p className="text-3xl font-black">{val}</p>
                      <p className="text-emerald-300 text-xs mt-1">{lbl}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  ['הכנסה פסיבית', 'כל לקוח שמחדש מנוי — מרוויח עליו שוב, ללא כל עבודה נוספת.'],
                  ['מינוף הלקוחות הקיימים', '10 לקוחות שהגיעו לתיקון = 10 פוטנציאלים. שאל כל אחד — פנייה אחת = ₪XX.'],
                  ['זמן ההתקנה', 'כ-5-10 דקות בלבד. שירות שמוסיף ערך ללקוח ולך — בו זמנית.'],
                ].map(([bold, text]) => (
                  <div key={bold} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <p className="text-gray-700 text-sm"><strong>{bold}:</strong> {text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-blue-700 text-xs">
                  <strong>חישוב מהיר:</strong> אם תמכור ל-3 לקוחות בשבוע, זה כ-<strong>₪XXX+ בחודש</strong> — רק מiFilter.
                </p>
              </div>
            </AccordionItem>

            {/* Q4 */}
            <AccordionItem
              icon={Rocket} iconBg="bg-indigo-100 text-indigo-600"
              title="מה ההתקנה כוללת ואיך עושים את זה?"
            >
              <p className="text-gray-500 text-sm mb-4">תהליך פשוט ב-3 שלבים — גם מרחוק:</p>
              <div className="relative">
                <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-indigo-100" />
                <div className="space-y-4 mr-10">
                  {[
                    { num: '1', color: 'bg-indigo-600', bg: 'bg-indigo-50 border-indigo-100', title: 'גישה לראוטר הביתי', desc: 'דקה אחת — כניסה לדשבורד של הראוטר (אפשר גם בטלפון מרחוק)' },
                    { num: '2', color: 'bg-indigo-600', bg: 'bg-indigo-50 border-indigo-100', title: 'הגדרת DNS של iFilter', desc: 'שני שדות, שתי דקות — הכל מוסבר בהדרכה שנשלחת אליך' },
                    { num: '✓', color: 'bg-green-500',  bg: 'bg-green-50 border-green-100',   title: 'הבית מוגן — לקוח שמח', desc: 'בדיקה מהירה, הסבר ב-2 משפטים ללקוח — ועסקה סגורה' },
                  ].map(({ num, color, bg, title, desc }) => (
                    <div key={title} className="relative">
                      <div className={`absolute -right-[2.75rem] w-8 h-8 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm`}>{num}</div>
                      <div className={`${bg} rounded-xl p-3 border`}>
                        <p className="font-semibold text-gray-900 text-sm">{title}</p>
                        <p className="text-gray-500 text-xs mt-1">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionItem>

          </div>
        </section>

        {/* ── Footer / Support ── */}
        <div className="bg-gray-900 rounded-2xl p-6 md:p-8 text-white text-center">
          <div className="w-14 h-14 bg-green-900/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-7 h-7 text-green-400" />
          </div>
          <h3 className="text-xl font-black mb-2">צריך עזרה?</h3>
          <p className="text-gray-300 text-sm mb-6 max-w-md mx-auto">
            חסר לך חומר שיווקי ספציפי? יש שאלה על מוצר? רוצה תמיכה בסגירת עסקה? <strong className="text-white">אנחנו כאן!</strong>
          </p>
          <a
            href="https://wa.me/972XXXXXXXXX?text=שלום%2C%20אני%20משווק%20iFilter%20ואני%20צריך%20עזרה"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg text-sm"
          >
            <MessageCircle className="w-5 h-5" />
            דבר איתנו בווטסאפ הצוות
          </a>
          <p className="text-gray-600 text-xs mt-3">בד"כ עונים תוך שעה בשעות העבודה</p>
        </div>

      </div>
    </div>
  )
}

export default ResellerHub
