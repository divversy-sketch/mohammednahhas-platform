export const normalizeEgyptPhone = (value = '') => value.replace(/\D/g, '').slice(0, 11);

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

