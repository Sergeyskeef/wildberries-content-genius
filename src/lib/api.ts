export const API_BASE = "/api";

export const fetchIdeas = async () => {
    // В реальности здесь был бы GET /api/ideas
    // Но пока сделаем мок или реальный запрос если endpoint готов
    const res = await fetch(`${API_BASE}/ideas`);
    if (!res.ok) return []; // или throw
    return await res.json();
};

export const startParsing = async (hashtag: string) => {
    const res = await fetch(`${API_BASE}/parse/instagram?hashtag=${hashtag}`, {
        method: "POST"
    });
    return await res.json();
};

export const startAnalysis = async () => {
    const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST"
    });
    return await res.json();
};

export const approveIdea = async (id: number) => {
    const res = await fetch(`${API_BASE}/ideas/${id}/approve`, {
        method: "POST"
    });
    return await res.json();
};

