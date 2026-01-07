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

export const fetchContent = async (status?: string) => {
    const url = status ? `${API_BASE}/content?status=${status}` : `${API_BASE}/content`;
    const res = await fetch(url);
    return await res.json();
};

export const approveIdea = async (id: number) => {
    const res = await fetch(`${API_BASE}/ideas/${id}/approve`, {
        method: "POST"
    });
    return await res.json();
};

export const startRun = async (type: string, config: any = {}) => {
    const res = await fetch(`${API_BASE}/runs/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, config })
    });
    return await res.json();
};

export const fetchRuns = async () => {
    const res = await fetch(`${API_BASE}/runs`);
    return await res.json();
};

export const fetchRunStatus = async (id: number) => {
    const res = await fetch(`${API_BASE}/runs/${id}`);
    return await res.json();
};

export const fetchCarousels = async () => {
    const res = await fetch(`${API_BASE}/carousels`);
    return await res.json();
};

export const getCarouselDownloadUrl = async (id: number) => {
    const res = await fetch(`${API_BASE}/carousels/${id}/download`);
    return await res.json();
};

