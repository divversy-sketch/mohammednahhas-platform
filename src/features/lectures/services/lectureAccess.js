export const splitLectureContent = (content = []) => ({
  videos: content.filter((item) => item.type === 'video'),
  files: content.filter((item) => ['file', 'link'].includes(item.type)),
  htmls: content.filter((item) => item.type === 'html')
});
