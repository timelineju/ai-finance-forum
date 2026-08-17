module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
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

    const GROQ_API_KEY = "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";

    try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: "당신은 한국의 금융, 주식 공시, 정책, 세무 데이터를 심층 분석하는 전문 AI 팩트체크 에이전트입니다. 사용자의 질문에 대해 핵심 수치와 팩트 위주로 3~4문장으로 명확하게 한국어로 답변하세요. 끝에는 '(※ 본 답변은 공개 데이터를 기반으로 한 참고용 정보이며 투자 권유가 아닙니다.)'를 반드시 포함하세요." 
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
            return res.status(500).json({ error: data.error?.message || "AI 응답 생성 실패" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
