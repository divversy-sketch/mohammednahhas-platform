import { useMemo } from 'react';
import { splitLectureContent } from '@features/lectures/services/lectureAccess.js';

export const useLectures = (content = []) => useMemo(() => splitLectureContent(content), [content]);
export default useLectures;
