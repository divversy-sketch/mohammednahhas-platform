// Accepts 01xxxxxxxxx, +201xxxxxxxxx or 00201xxxxxxxxx and keeps the local 11-digit form.
export const normalizeEgyptPhone = (value = '') => {
    let digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('0020')) digits = digits.slice(3);
    else if (digits.startsWith('20') && digits.length === 12) digits = digits.slice(1);
    return digits.slice(0, 11);
};

export const isValidEgyptPhone = (value = '') => /^01[0125]\d{8}$/.test(normalizeEgyptPhone(value));

export const validateEgyptianPhones = (studentPhone, parentPhone) => {
    const normalizedStudentPhone = normalizeEgyptPhone(studentPhone);
    const normalizedParentPhone = normalizeEgyptPhone(parentPhone);

    if (!isValidEgyptPhone(normalizedStudentPhone)) {
        return { ok: false, message: "رقم الطالب غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015" };
    }

    if (!isValidEgyptPhone(normalizedParentPhone)) {
        return { ok: false, message: "رقم ولي الأمر غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015" };
    }

    if (normalizedStudentPhone === normalizedParentPhone) {
        return { ok: false, message: "عفواً، لا يمكن أن يكون رقم الطالب هو نفسه رقم ولي الأمر." };
    }

    return {
        ok: true,
        normalizedStudentPhone,
        normalizedParentPhone
    };
};

