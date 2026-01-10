const API_BASE_URL = 'http://127.0.0.1:5000';

export const loginUser = async (credentials: any) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    return response.json();
};

export const signupUser = async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    return response.json();
};

export const processFrame = async (base64Image: string, source: string = 'IMAGE-EVIDENCE', signal?: AbortSignal) => {
    // Convert base64 to blob
    const res = await fetch(base64Image);
    const blob = await res.blob();

    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');
    formData.append('source', source);

    const response = await fetch(`${API_BASE_URL}/detect`, {
        method: 'POST',
        body: formData,
        signal
    });
    return response.json();
};

export const fetchStats = async () => {
    const response = await fetch(`${API_BASE_URL}/stats`);
    return response.json();
};

export const purgeDetections = async (range: { start: string, end: string }) => {
    const token = localStorage.getItem('safecity_token');
    const response = await fetch(`${API_BASE_URL}/purge`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(range)
    });
    return response.json();
};

export const fetchLogs = async () => {
    const response = await fetch(`${API_BASE_URL}/logs`);
    const data = await response.json();
    return data.map((log: any) => ({
        ...log,
        plateNumber: log.plate_number,
        timestamp: log.timestamp // Backend already sends ISO string with Z
    }));
};
