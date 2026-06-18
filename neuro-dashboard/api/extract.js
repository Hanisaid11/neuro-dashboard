// Vercel Serverless Function: POST /api/extract
// Body: { image: "<base64 без البادئة data:...>", mediaType: "image/jpeg", kind: "income" | "operations" }
//
// Requires an ANTHROPIC_API_KEY environment variable set on the Vercel
// project (Settings -> Environment Variables). The key is only ever used
// here, on the server - it is never sent to or exposed in the browser.

const INCOME_CATEGORIES = [
  'oldHospital', // استدعاءات - مستشفى قديم
  'newHospital', // استدعاءات - مستشفى جديد
  'medication', // نسب أدوية
  'hospitalPct', // نسب مستشفى
  'mriPct', // نسب من الرنين
  'nervePct', // نسب تخطيط الأعصاب
  'eegPct', // نسب تخطيط الدماغ
  'implantsPct', // نسب البراغي والشنتات
  'salary' // الراتب الأساسي
];

function buildPrompt(kind) {
  if (kind === 'operations') {
    return `أنت تقرأ صورة من دفتر مكتوب بخط اليد لجراح أعصاب، يحتوي على سجل عمليات جراحية.
استخرج كل سطر/عملية ظاهرة في الصورة كعنصر JSON بالحقول التالية فقط:
- date: التاريخ بصيغة YYYY-MM-DD إن كان واضحًا ومحددًا تمامًا، وإلا اجعله null
- patientName: اسم المريض كما هو مكتوب، أو null إن لم يكن واضحًا
- operationType: نوع العملية الجراحية، أو null إن لم يكن واضحًا
- details: أي تفاصيل إضافية مكتوبة عن الحالة، أو null إن لم توجد

قواعد صارمة:
- إن لم تكن متأكدًا من قراءة حقل بثقة عالية، اجعله null تمامًا، لا تخمّن أبدًا.
- لا تخترع أي بيانات غير موجودة في الصورة.
- أرجع فقط مصفوفة JSON صحيحة بدون أي نص أو شرح أو علامات Markdown حولها.`;
  }

  return `أنت تقرأ صورة من دفتر مكتوب بخط اليد لجراح أعصاب، يحتوي على دخل شهري/يومي من مصادر متعددة.
استخرج كل قيمة/سطر ظاهر في الصورة كعنصر JSON بالحقول التالية فقط:
- date: التاريخ بصيغة YYYY-MM-DD إن كان يوم محدد واضح مكتوب، وإلا null
- category: واحدة فقط من هذه القيم بالضبط: ${INCOME_CATEGORIES.join(', ')}
  (oldHospital = استدعاءات مستشفى قديم، newHospital = استدعاءات مستشفى جديد، medication = نسب أدوية، hospitalPct = نسب مستشفى، mriPct = نسب رنين، nervePct = نسب تخطيط أعصاب، eegPct = نسب تخطيط دماغ، implantsPct = نسب براغي وشنتات، salary = الراتب الأساسي)
  إن لم تستطع تحديد الفئة بثقة، اجعلها null
- amount: القيمة الرقمية فقط بدون أي عملة أو رموز، أو null إن لم تكن مقروءة بوضوح
- note: أي نص إضافي قريب من القيمة (مثل اسم الدواء أو ملاحظة)، أو null

قواعد صارمة:
- إن لم تكن متأكدًا من قراءة حقل بثقة عالية، اجعله null تمامًا، لا تخمّن أبدًا.
- لا تخترع أي بيانات غير موجودة في الصورة.
- أرجع فقط مصفوفة JSON صحيحة بدون أي نص أو شرح أو علامات Markdown حولها.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY غير مضبوط على الخادم' });
    return;
  }

  try {
    const { image, mediaType, kind } = req.body || {};
    if (!image) {
      res.status(400).json({ error: 'لم تُرسل صورة' });
      return;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
              { type: 'text', text: buildPrompt(kind) }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ error: `Anthropic API error: ${errText}` });
      return;
    }

    const data = await response.json();
    const text = (data.content || [])
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();

    const cleaned = text.replace(/^```json\s*|^```\s*|```\s*$/g, '').trim();
    let rows;
    try {
      rows = JSON.parse(cleaned);
    } catch {
      res.status(502).json({ error: 'تعذر تفسير استجابة النموذج', raw: text });
      return;
    }

    res.status(200).json({ rows: Array.isArray(rows) ? rows : [] });
  } catch (err) {
    res.status(500).json({ error: err.message || 'خطأ غير متوقع' });
  }
}
