import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { IndexRow } from "@/components/ui/IndexRow";

export const metadata = { title: "Styleguide", robots: { index: false, follow: false } };

const TOKENS = ["bg", "surface", "border", "border-strong", "text", "muted", "accent", "on-accent"] as const;
const GLYPHS = "# $ % & * + < = > @ [ ] ^ { | } ~ « » “ ” ‘ ’ … – — × ÷ © ® ™ € £ ¥ § ¶ • ≤ ≥ ≠ ± ° № → ← ↑ ↓ ؛ ، ؟";

export default async function Styleguide({ params }: PageProps<"/[locale]/styleguide">) {
  // Verification surface only: hidden in production unless explicitly enabled.
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_STYLEGUIDE !== "1") notFound();
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container sg">
      <h1 className="pixel pixel--l">Styleguide</h1>

      <section id="colors">
        <h2 className="pixel pixel--m">01 Colors</h2>
        <div className="sg__swatches">
          {TOKENS.map((t) => (
            <div className="sg__swatch" key={t}>
              <div className="sg__chip" style={{ background: `var(--color-${t})` }} />
              <code className="ltr-run">--color-{t}</code>
            </div>
          ))}
        </div>
      </section>

      <section id="logos">
        <h2 className="pixel pixel--m">02 Logos</h2>
        <div className="sg__sample" style={{ display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "center" }}>
          <Logo name="as" title="AS" className="" />
          <Logo name="researches" title="Researches" />
          <Logo name="as-researches" title="AS Researches" />
        </div>
        <div className="sg__sample" style={{ color: "var(--color-accent)", fontSize: "48px" }}>
          <Logo name="as-researches" title="AS Researches (accent)" />
        </div>
      </section>

      <section id="pixel">
        <h2 className="pixel pixel--m">03 Pixel type</h2>
        <div className="sg__sample">
          <p className="pixel pixel--l" id="px-bold-en">Research Library 2026</p>
          <p className="pixel pixel--l pixel--regular" id="px-reg-en">Research Library 2026</p>
          <p className="pixel pixel--l" id="px-bold-ar" lang="ar" dir="rtl">مكتبة الأبحاث ١٢٣ 2026</p>
          <p className="pixel pixel--l pixel--regular" id="px-reg-ar" lang="ar" dir="rtl">مكتبة الأبحاث ١٢٣ 2026</p>
          <p className="pixel pixel--m" id="px-mixed" lang="ar" dir="rtl">
            بحث عن <span className="ltr-run">Next.js</span> و<span className="ltr-run">Supabase</span> — ٣ أقسام
          </p>
          <p className="pixel pixel--s" id="px-s">01 / SECTION 02 — الفصل ٠٣</p>
        </div>
        <h3 className="pixel pixel--s">Glyph coverage (Pixel stack)</h3>
        <p className="pixel pixel--m" id="glyphs" dir="ltr">{GLYPHS}</p>
        <p className="pixel pixel--m" id="zw" lang="ar" dir="rtl">
          {"كـتـاب"} / {"ك‍تاب"} / {"لا‌معنى"} / {"ال بحث"}
        </p>
        <p className="pixel pixel--m" id="tashkeel" lang="ar" dir="rtl">مَكْتَبَةٌ بَحْثِيَّةٌ</p>
      </section>

      <section id="body">
        <h2 className="pixel pixel--m">04 Body text</h2>
        <div className="sg__sample container--reading" style={{ marginInline: 0 }}>
          <p lang="en" dir="ltr" id="body-en">
            Montserrat carries English reading text. The reading column targets about 680px, with a calm rhythm and
            enough leading for long sessions. Arabic inline: مكتبة الأبحاث.
          </p>
          <p lang="ar" dir="rtl" id="body-ar">
            يحمل خط Cairo النصوص العربية الطويلة، مع مسافة بين الأسطر تناسب القراءة. مصطلح لاتيني داخل الجملة:{" "}
            <span className="ltr-run">Server Components</span>، ورابط: <a href="#body"><span className="ltr-run">https://example.com/a-b</span></a>،
            وأرقام ١٢٣ و 456 وكود <code className="ltr-run">npm run build</code>.
          </p>
        </div>
      </section>

      <section id="index">
        <h2 className="pixel pixel--m">05 Library index row</h2>
        <ul className="index">
          <IndexRow href="/styleguide" id="001" title={locale === "ar" ? "عنوان بحث تجريبي طويل قليلاً لاختبار التفاف السطر" : "A sample research title, long enough to test wrapping on narrow screens"} category={locale === "ar" ? "تقنية" : "Technology"} date={locale === "ar" ? "٣٠ أكتوبر ٢٠٢٦" : "30 Oct 2026"} />
          <IndexRow href="/styleguide" id="002" title={locale === "ar" ? "بحث ثانٍ" : "A second entry"} category={locale === "ar" ? "تصميم" : "Design"} date={locale === "ar" ? "١ نوفمبر ٢٠٢٦" : "1 Nov 2026"} />
        </ul>
      </section>

      <section id="controls">
        <h2 className="pixel pixel--m">06 Controls & states</h2>
        <p style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="control" type="button">Default</button>
          <button className="control control--accent" type="button">Accent</button>
          <button className="control" type="button" disabled>Disabled</button>
          <a className="control" href="#controls">Link control</a>
        </p>
        <p>
          <a href="#controls">Inline link</a> · <span className="muted">Muted text</span>
        </p>
        <table className="sg__table">
          <thead><tr><th>Wide table</th><th>scrolls</th><th>inside</th><th>its</th><th>own</th><th>container</th><th>not the page</th><th>at 360px</th></tr></thead>
          <tbody><tr><td>a</td><td>b</td><td>c</td><td>d</td><td>e</td><td>f</td><td>g</td><td>h</td></tr></tbody>
        </table>
      </section>
    </div>
  );
}
