

export const GradeOptions = () => (
    <>
        <optgroup label="المرحلة الإعدادية">
            <option value="1prep">الصف الأول الإعدادي</option>
            <option value="2prep">الصف الثاني الإعدادي</option>
            <option value="3prep">الصف الثالث الإعدادي</option>
        </optgroup>
        <optgroup label="المرحلة الثانوية">
            <option value="1sec">الصف الأول الثانوي</option>
            <option value="2sec">الصف الثاني الثانوي</option>
            <option value="3sec">الصف الثالث الثانوي</option>
        </optgroup>
    </>
);

export const getGradeLabel = (g) => {
    const map = { '1prep': 'أولى إعدادي', '2prep': 'تانية إعدادي', '3prep': 'تالتة إعدادي', '1sec': 'أولى ثانوي', '2sec': 'تانية ثانوي', '3sec': 'تالتة ثانوي' };
    if (map[g]) return map[g];
    // أكواد قديمة/بديلة: first_secondary, third-prep, sec3 …
    const k = String(g || '').toLowerCase();
    const num = /first|1/.test(k) ? '1' : /third|3/.test(k) ? '3' : /second|2/.test(k) ? '2' : '';
    const stage = /sec|thanaw/.test(k) ? 'sec' : /prep|edad/.test(k) ? 'prep' : '';
    return (num && stage && map[num + stage]) || g;
};


/** أكواد الصفوف بالترتيب (لأزرار اختيار الصفوف) */
export const GRADE_OPTIONS = ['1prep', '2prep', '3prep', '1sec', '2sec', '3sec'];
