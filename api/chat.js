module.exports = async (req, res) => {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'POST 요청만 지원합니다.' });
    }

    let question = '';
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        question = body?.question;
    } catch (e) {
        question = req.body?.question;
    }

    if (!question) {
        return res.status(400).json({ error: '질문 내용이 없습니다.' });
    }

    // Vercel 환경 변수에서 안전하게 키를 가져옵니다.
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'Vercel 환경 변수(GROQ_API_KEY)가 등록되지 않았습니다.' });
    }

    try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { 
                        role: "system", 
                        content: "당신은 한국의 금융, 주식 공시, 정책, 세무 데이터를 심층 분석하는 전문 'AI 팩트체크 에이전트'입니다. 사용자의 질문에 대해 핵심 팩트와 수치 위주로 3~4문장으로 간결하고 전문적인 답변을 한국어로 제공하세요. 답변 끝에는 항상 '(※ 본 답변은 공개 데이터를 기반으로 한 참고용 정보이며 투자 권유가 아닙니다.)'를 덧붙이세요." 
                    },
                    { role: "user", content: question }
                ],
                temperature: 0.5,
                max_tokens: 500
            })
        });

        const data = await groqResponse.json();
        
        if (data.choices && data.choices[0]) {
            return res.status(200).json({ answer: data.choices[0].message.content });
        } else {
            return res.status(500).json({ error: data.error?.message || "AI 응답을 가져오지 못했습니다." });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
