export const isAndroid = () => {
    return /Android/i.test(navigator.userAgent);
};

export const isWindows = () => {
    return /Windows/i.test(navigator.userAgent);
};

export const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const getPlatform = () => {
    if (isAndroid()) return 'android';
    if (isWindows()) return 'windows';
    return 'web';
};
