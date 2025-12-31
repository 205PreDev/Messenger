import { format, formatDistanceToNow, isToday, isYesterday, isValid, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 입력을 유효한 Date 객체로 변환 (배열 형식 및 문자열 대응)
 */
function ensureDate(date) {
    if (!date) return new Date();

    // 만약 [2023, 12, 31, 10, 50] 같은 배열 형태라면 Date 객체로 변환
    if (Array.isArray(date)) {
        return new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0, date[5] || 0);
    }

    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);

    // 유효하지 않은 날짜인 경우 현재 시간 반환
    if (!isValid(dateObj)) {
        console.warn('Invalid date detected, falling back to current time:', date);
        return new Date();
    }

    return dateObj;
}

/**
 * 날짜를 "오늘", "어제", 또는 "YYYY년 MM월 DD일" 형식으로 포맷
 */
export function formatMessageDate(date) {
    const dateObj = ensureDate(date);

    if (isToday(dateObj)) {
        return '오늘';
    }

    if (isYesterday(dateObj)) {
        return '어제';
    }

    return format(dateObj, 'yyyy년 MM월 dd일', { locale: ko });
}

/**
 * 시간을 "오후 3:45" 형식으로 포맷
 */
export function formatMessageTime(date) {
    const dateObj = ensureDate(date);
    return format(dateObj, 'a h:mm', { locale: ko });
}

/**
 * 상대적 시간 포맷 ("3분 전", "2시간 전" 등)
 */
export function formatRelativeTime(date) {
    const dateObj = ensureDate(date);
    return formatDistanceToNow(dateObj, {
        addSuffix: true,
        locale: ko
    });
}

/**
 * 전체 날짜/시간 포맷
 */
export function formatFullDateTime(date) {
    const dateObj = ensureDate(date);
    return format(dateObj, 'yyyy년 MM월 dd일 a h:mm', { locale: ko });
}
