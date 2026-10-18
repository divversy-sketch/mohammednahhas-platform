// The ten Nahhas skins. Single source of truth: the design gallery and the platform's
// generated src/v2/styles/skins.css are both built from this file.
// Token keys map 1:1 to the platform's --nx-* variables (see TOKEN_MAP at the end).

const S = (o) => o;

export const SKINS = [
  S({
    id: 'cinema', name: 'السينما', tagline: 'إحساس منصات المشاهدة: بوستر متحرك وصفوف بتتسحب، أحمر وكهرماني',
    flavor: 'cinema',
    body: "'Almarai'", display: "'Changa'", gf: 'family=Almarai:wght@400;700;800&family=Changa:wght@600;700;800',
    radius: [8, 10, 12, 16, 22],
    light: {
      bg: '#F4F1EE', bg2: '#EBE6E1', surface: '#FFFFFF', surface2: '#FBF9F7', sunk: '#EEE9E4', line: '#E3DBD4', lineStrong: '#D2C6BC',
      ink: '#1B1614', ink2: '#5E534C', ink3: '#8C7F77',
      accent: '#D62B2F', accent2: '#FF7A45', accentDeep: '#A61E22', accentSoft: '#FCE3E1', onAccent: '#FFFFFF',
      gold: '#B26B00', gold2: '#FFB547', goldSoft: '#FFF0D6', patina: '#12805C', patina2: '#3DD69B', patinaSoft: '#DDF4EA',
      danger: '#C81E3A', dangerSoft: '#FCE2E6', info: '#2563EB', infoSoft: '#E0EAFD',
      night: '#120C0B', night2: '#1E1412', night3: '#2A1C19', nightLine: 'rgba(255,200,170,.14)', nightInk: '#FFF7F1', nightDim: '#C9B4A8',
      shadow1: '0 1px 2px rgba(40,20,15,.06), 0 4px 12px -6px rgba(40,20,15,.12)', shadow2: '0 22px 44px -24px rgba(40,20,15,.45)',
    },
    dark: {
      bg: '#0B0908', bg2: '#110D0C', surface: '#171210', surface2: '#1D1714', sunk: '#231B18', line: '#2E2420', lineStrong: '#3F322C',
      ink: '#F7F2EE', ink2: '#C5B6AD', ink3: '#8E7F77',
      accent: '#FF4D4F', accent2: '#FF7A45', accentDeep: '#D62B2F', accentSoft: '#3A1514', onAccent: '#FFFFFF',
      gold: '#FFB547', gold2: '#FFC978', goldSoft: '#3A2A10', patina: '#3DD69B', patina2: '#7BE6BE', patinaSoft: '#0F3226',
      danger: '#FF6B81', dangerSoft: '#3B1520', info: '#7AA7FF', infoSoft: '#16233F',
      night: '#070505', night2: '#140E0C', night3: '#1E1512', nightLine: 'rgba(255,200,170,.12)', nightInk: '#FFF7F1', nightDim: '#B8A396',
      shadow1: '0 1px 2px rgba(0,0,0,.5)', shadow2: '0 24px 50px -24px rgba(0,0,0,.9)',
    },
  }),
  S({
    id: 'nahhas', name: 'النحاس', tagline: 'نحاس دافئ وليل عميق، هوية المنصة الأصلية بعد تنعيمها',
    flavor: 'classic',
    body: "'Readex Pro'", display: "'Aref Ruqaa'", gf: 'family=Readex+Pro:wght@300;400;500;600;700&family=Aref+Ruqaa:wght@700',
    radius: [8, 12, 16, 22, 28],
    light: {
      bg: '#FAF6F1', bg2: '#F5EFE7', surface: '#FFFFFF', surface2: '#FDFBF8', sunk: '#F2ECE4', line: '#E8DED2', lineStrong: '#D9CBBB',
      ink: '#1A120D', ink2: '#5E5148', ink3: '#8F8173',
      accent: '#C0592A', accent2: '#E68A4E', accentDeep: '#9A3F18', accentSoft: '#FBE7DA', onAccent: '#FFFFFF',
      gold: '#B97F14', gold2: '#F2C063', goldSoft: '#FCEFD3', patina: '#13806F', patina2: '#4CCDB4', patinaSoft: '#D9F0EB',
      danger: '#C0303F', dangerSoft: '#FBE3E5', info: '#2C6FB7', infoSoft: '#E1EDF9',
      night: '#0C0907', night2: '#18110C', night3: '#231912', nightLine: 'rgba(255,220,190,.12)', nightInk: '#F7EFE7', nightDim: '#B7A595',
      shadow1: '0 1px 2px rgba(70,35,10,.05), 0 2px 8px -2px rgba(70,35,10,.06)', shadow2: '0 2px 4px rgba(70,35,10,.05), 0 18px 40px -18px rgba(70,35,10,.28)',
    },
    dark: {
      bg: '#0F0B09', bg2: '#140F0C', surface: '#1A1410', surface2: '#1F1813', sunk: '#241C16', line: '#33281F', lineStrong: '#46382C',
      ink: '#F6EEE6', ink2: '#C4B5A7', ink3: '#8E8073',
      accent: '#EE8450', accent2: '#F6A56E', accentDeep: '#C0592A', accentSoft: '#3B2216', onAccent: '#1A0E07',
      gold: '#F2C063', gold2: '#F6D28A', goldSoft: '#3A2C12', patina: '#4CCDB4', patina2: '#7FE0CC', patinaSoft: '#133029',
      danger: '#F27F8B', dangerSoft: '#3B1A1F', info: '#7EB6F2', infoSoft: '#16263A',
      night: '#0A0705', night2: '#18110C', night3: '#231912', nightLine: 'rgba(255,220,190,.12)', nightInk: '#F7EFE7', nightDim: '#B7A595',
      shadow1: '0 1px 2px rgba(0,0,0,.4)', shadow2: '0 2px 4px rgba(0,0,0,.4), 0 18px 40px -18px rgba(0,0,0,.8)',
    },
  }),
  S({
    id: 'zumurrud', name: 'الزمرّد', tagline: 'أخضر أكاديمي وذهب ونقش هندسي، وقار الجامعات العريقة',
    flavor: 'geo',
    body: "'IBM Plex Sans Arabic'", display: "'Reem Kufi'", gf: 'family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Reem+Kufi:wght@600;700',
    radius: [6, 8, 12, 16, 20],
    light: {
      bg: '#F2F5F1', bg2: '#EAF0E9', surface: '#FFFFFF', surface2: '#FAFCF9', sunk: '#E6EDE5', line: '#D9E3D8', lineStrong: '#C3D1C1',
      ink: '#0E1F19', ink2: '#46594F', ink3: '#7A8C82',
      accent: '#0B6B52', accent2: '#1E9C78', accentDeep: '#064A38', accentSoft: '#DCEFE7', onAccent: '#FFFFFF',
      gold: '#A87A1C', gold2: '#E3B651', goldSoft: '#F6ECD2', patina: '#2B7A3D', patina2: '#5FC27A', patinaSoft: '#DDF1E2',
      danger: '#B4323C', dangerSoft: '#F8E1E3', info: '#2A6A9E', infoSoft: '#E0ECF6',
      night: '#062A21', night2: '#0A3A2E', night3: '#0F4A3B', nightLine: 'rgba(227,182,81,.2)', nightInk: '#F3F7F2', nightDim: '#A9C3B8',
      shadow1: '0 1px 2px rgba(6,42,33,.06)', shadow2: '0 14px 34px -20px rgba(6,42,33,.35)',
    },
    dark: {
      bg: '#07120F', bg2: '#0A1713', surface: '#0F1E19', surface2: '#13241E', sunk: '#172B24', line: '#213A31', lineStrong: '#2E4B40',
      ink: '#EAF3EE', ink2: '#A9BFB5', ink3: '#73897F',
      accent: '#3DD6A3', accent2: '#7BE6C2', accentDeep: '#1E9C78', accentSoft: '#10372B', onAccent: '#04150F',
      gold: '#E3B651', gold2: '#F0CD7F', goldSoft: '#33290F', patina: '#6FD38A', patina2: '#9BE4AE', patinaSoft: '#12321C',
      danger: '#F08A92', dangerSoft: '#3A1A1E', info: '#7DB7EA', infoSoft: '#13283A',
      night: '#041510', night2: '#082119', night3: '#0C2C22', nightLine: 'rgba(227,182,81,.18)', nightInk: '#F3F7F2', nightDim: '#9CB5AA',
      shadow1: '0 1px 2px rgba(0,0,0,.45)', shadow2: '0 16px 36px -18px rgba(0,0,0,.85)',
    },
  }),
  S({
    id: 'mawj', name: 'الموج', tagline: 'زجاج شفاف فوق أزرق المحيط، خفيف ومنعش',
    flavor: 'glass',
    body: "'Tajawal'", display: "'Tajawal'", gf: 'family=Tajawal:wght@400;500;700;800;900',
    radius: [10, 14, 18, 24, 30],
    light: {
      bg: '#E9F2FB', bg2: '#DFEBF8', surface: '#FFFFFF', surface2: '#F6FAFE', sunk: '#E3EDF8', line: '#D3E1F0', lineStrong: '#B9CDE3',
      ink: '#0B1B2E', ink2: '#45607C', ink3: '#7D93AB',
      accent: '#0A6CFF', accent2: '#4D9BFF', accentDeep: '#0049B8', accentSoft: '#DCEAFF', onAccent: '#FFFFFF',
      gold: '#B07607', gold2: '#F5C450', goldSoft: '#FCF0D2', patina: '#0B8A7B', patina2: '#4FD8C6', patinaSoft: '#D6F4EF',
      danger: '#D22F4C', dangerSoft: '#FBE2E7', info: '#6A4CFF', infoSoft: '#E8E3FF',
      night: '#071A33', night2: '#0B2547', night3: '#10305A', nightLine: 'rgba(160,205,255,.18)', nightInk: '#EEF5FF', nightDim: '#A3BAD6',
      shadow1: '0 1px 2px rgba(10,60,120,.06)', shadow2: '0 20px 44px -22px rgba(10,60,120,.35)',
    },
    dark: {
      bg: '#050E1B', bg2: '#081426', surface: '#0E1B2E', surface2: '#122238', sunk: '#142741', line: '#1E3452', lineStrong: '#2A4567',
      ink: '#EAF2FD', ink2: '#A7BCD6', ink3: '#6F87A6',
      accent: '#4DA3FF', accent2: '#85C1FF', accentDeep: '#0A6CFF', accentSoft: '#0F2A4D', onAccent: '#031024',
      gold: '#F5C450', gold2: '#F8D888', goldSoft: '#33280E', patina: '#3FD3C0', patina2: '#7FE6D8', patinaSoft: '#0E322E',
      danger: '#FF7C92', dangerSoft: '#3A1622', info: '#A592FF', infoSoft: '#221A47',
      night: '#030A16', night2: '#071430', night3: '#0B1D40', nightLine: 'rgba(160,205,255,.14)', nightInk: '#EEF5FF', nightDim: '#94AACA',
      shadow1: '0 1px 2px rgba(0,0,0,.5)', shadow2: '0 22px 48px -22px rgba(0,0,0,.9)',
    },
  }),
  S({
    id: 'shafaq', name: 'الشفق', tagline: 'تدرّجات بنفسجية ووردية كضوء الشفق، حيوية للجيل الجديد',
    flavor: 'aurora',
    body: "'Rubik'", display: "'Rubik'", gf: 'family=Rubik:wght@400;500;600;700;800',
    radius: [10, 14, 18, 24, 30],
    light: {
      bg: '#F6F4FF', bg2: '#EFEBFF', surface: '#FFFFFF', surface2: '#FBFAFF', sunk: '#ECE8FA', line: '#E2DCF5', lineStrong: '#CDC3EC',
      ink: '#1A1033', ink2: '#5A4F7A', ink3: '#8D84A8',
      accent: '#7A35E6', accent2: '#E0479E', accentDeep: '#5520B0', accentSoft: '#EDE2FF', onAccent: '#FFFFFF',
      gold: '#B26C08', gold2: '#FBBF4A', goldSoft: '#FDF0D5', patina: '#0C8A66', patina2: '#3FD8A6', patinaSoft: '#D7F5EA',
      danger: '#DB2D6A', dangerSoft: '#FCE1EC', info: '#2E7BEA', infoSoft: '#E0ECFD',
      night: '#170B33', night2: '#221048', night3: '#2E1660', nightLine: 'rgba(200,170,255,.2)', nightInk: '#F5F0FF', nightDim: '#B9A9DB',
      shadow1: '0 1px 2px rgba(60,20,140,.06)', shadow2: '0 20px 44px -22px rgba(90,30,200,.35)',
    },
    dark: {
      bg: '#0A0716', bg2: '#0E0A1E', surface: '#151027', surface2: '#1A1430', sunk: '#1F1838', line: '#2C2349', lineStrong: '#3B305E',
      ink: '#F1ECFF', ink2: '#B9AEDA', ink3: '#7F75A0',
      accent: '#B38BFF', accent2: '#FF7AC3', accentDeep: '#7A35E6', accentSoft: '#2A1A4E', onAccent: '#12082A',
      gold: '#FBBF4A', gold2: '#FCD27E', goldSoft: '#3A2A0E', patina: '#4BE0B0', patina2: '#86EDCB', patinaSoft: '#0F3A2C',
      danger: '#FF7AA8', dangerSoft: '#3E1428', info: '#7FB0FF', infoSoft: '#16264A',
      night: '#0D0620', night2: '#1A0C3A', night3: '#26124F', nightLine: 'rgba(200,170,255,.16)', nightInk: '#F5F0FF', nightDim: '#AA9BCF',
      shadow1: '0 1px 2px rgba(0,0,0,.5)', shadow2: '0 22px 48px -20px rgba(122,53,230,.45)',
    },
  }),
  S({
    id: 'daftar', name: 'الدفتر والسبورة', tagline: 'نهارًا ورقة دفتر بقلم أزرق، وليلًا سبورة خضراء بالطباشير',
    flavor: 'notebook',
    body: "'Noto Naskh Arabic'", display: "'Amiri'", gf: 'family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Amiri:wght@700',
    radius: [4, 6, 8, 10, 12],
    light: {
      bg: '#FDFDFB', bg2: '#F4F5F2', surface: '#FFFFFF', surface2: '#FBFBF9', sunk: '#EFF1EC', line: '#DCE1EA', lineStrong: '#C3CAD6',
      ink: '#141821', ink2: '#4A5262', ink3: '#858C99',
      accent: '#1D3FBF', accent2: '#4C6EF0', accentDeep: '#142C8A', accentSoft: '#E3E9FC', onAccent: '#FFFFFF',
      gold: '#B7791F', gold2: '#F2C14E', goldSoft: '#FBF0D6', patina: '#1F7A4C', patina2: '#4CC08A', patinaSoft: '#DDF2E6',
      danger: '#D0312D', dangerSoft: '#FBE3E2', info: '#6B46C1', infoSoft: '#ECE6FA',
      night: '#16213A', night2: '#1D2A48', night3: '#253456', nightLine: 'rgba(200,215,255,.16)', nightInk: '#F4F6FB', nightDim: '#AEB8CF',
      shadow1: 'none', shadow2: '0 10px 24px -18px rgba(20,24,33,.35)',
    },
    dark: {
      bg: '#18211D', bg2: '#1C2621', surface: '#212C27', surface2: '#25322C', sunk: '#2A3832', line: '#34443C', lineStrong: '#46594F',
      ink: '#EEF2EC', ink2: '#BCC7BE', ink3: '#87958B',
      accent: '#F5D76E', accent2: '#F9E59E', accentDeep: '#D9B740', accentSoft: '#3B3A22', onAccent: '#1A1E12',
      gold: '#F2B66D', gold2: '#F7CD98', goldSoft: '#3D2E17', patina: '#8FE3B0', patina2: '#B5EEC9', patinaSoft: '#1F3B2B',
      danger: '#FF8A80', dangerSoft: '#45231F', info: '#9CC9FF', infoSoft: '#1E3045',
      night: '#101713', night2: '#141D18', night3: '#1A241F', nightLine: 'rgba(238,242,236,.14)', nightInk: '#EEF2EC', nightDim: '#A9B5AC',
      shadow1: 'none', shadow2: '0 12px 28px -18px rgba(0,0,0,.7)',
    },
  }),
  S({
    id: 'jari', name: 'الجريء', tagline: 'حدود سوداء سميكة وأصفر صارخ وظلال صلبة، طاقة عالية',
    flavor: 'brutal',
    body: "'Cairo'", display: "'Lalezar'", gf: 'family=Cairo:wght@400;600;700;800;900&family=Lalezar',
    radius: [6, 8, 10, 12, 14],
    light: {
      bg: '#FFF9E8', bg2: '#FFF3D1', surface: '#FFFFFF', surface2: '#FFFDF6', sunk: '#FFF0C2', line: '#111111', lineStrong: '#111111',
      ink: '#0B0B0B', ink2: '#3B3B3B', ink3: '#6B6B6B',
      accent: '#2A4BFF', accent2: '#6F86FF', accentDeep: '#1A33C4', accentSoft: '#DFE5FF', onAccent: '#FFFFFF',
      gold: '#B87400', gold2: '#FFD23F', goldSoft: '#FFF1BF', patina: '#0A8F5F', patina2: '#2FE0A0', patinaSoft: '#CFF7E6',
      danger: '#E5243B', dangerSoft: '#FFDDE1', info: '#8A2BE2', infoSoft: '#EEDDFF',
      night: '#FFC800', night2: '#FFD84D', night3: '#FFE27A', nightLine: 'rgba(0,0,0,.85)', nightInk: '#0B0B0B', nightDim: '#3D3300',
      shadow1: '3px 3px 0 #0B0B0B', shadow2: '5px 5px 0 #0B0B0B',
    },
    dark: {
      bg: '#121212', bg2: '#171717', surface: '#1E1E1E', surface2: '#232323', sunk: '#2A2A2A', line: '#EDEDED', lineStrong: '#EDEDED',
      ink: '#F7F7F7', ink2: '#CFCFCF', ink3: '#9A9A9A',
      accent: '#8FA2FF', accent2: '#B3C0FF', accentDeep: '#2A4BFF', accentSoft: '#1E2550', onAccent: '#0B0B0B',
      gold: '#FFD23F', gold2: '#FFE07A', goldSoft: '#3A3110', patina: '#3BE3A8', patina2: '#7DEDC4', patinaSoft: '#113A2C',
      danger: '#FF6B7D', dangerSoft: '#3E1A1F', info: '#C08CFF', infoSoft: '#2C1A45',
      night: '#FFC800', night2: '#FFD84D', night3: '#FFE27A', nightLine: 'rgba(0,0,0,.85)', nightInk: '#0B0B0B', nightDim: '#3D3300',
      shadow1: '3px 3px 0 #FFC800', shadow2: '5px 5px 0 #FFC800',
    },
  }),
  S({
    id: 'graphite', name: 'الجرافيت', tagline: 'رمادي هادئ وخط كوفي هندسي ولون أزرق واحد، تركيز بلا تشتيت',
    flavor: 'minimal',
    body: "'Noto Kufi Arabic'", display: "'Noto Kufi Arabic'", gf: 'family=Noto+Kufi+Arabic:wght@400;500;600;700;800',
    radius: [6, 8, 10, 12, 14],
    light: {
      bg: '#F8F8F9', bg2: '#F2F2F4', surface: '#FFFFFF', surface2: '#FCFCFD', sunk: '#EFEFF2', line: '#E6E6EA', lineStrong: '#D4D4DA',
      ink: '#111114', ink2: '#55555E', ink3: '#8B8B94',
      accent: '#2B59C3', accent2: '#5B82E0', accentDeep: '#1D3F92', accentSoft: '#E4EBFA', onAccent: '#FFFFFF',
      gold: '#A16207', gold2: '#E5A93B', goldSoft: '#F8EDD9', patina: '#15803D', patina2: '#4ADE80', patinaSoft: '#DDF3E4',
      danger: '#C42B2B', dangerSoft: '#F9E1E1', info: '#6D28D9', infoSoft: '#EEE5FC',
      night: '#111114', night2: '#1A1A1F', night3: '#24242B', nightLine: 'rgba(255,255,255,.1)', nightInk: '#F5F5F7', nightDim: '#A1A1AA',
      shadow1: 'none', shadow2: '0 8px 24px -16px rgba(0,0,0,.25)',
    },
    dark: {
      bg: '#09090B', bg2: '#0D0D10', surface: '#131316', surface2: '#17171B', sunk: '#1C1C21', line: '#26262C', lineStrong: '#34343C',
      ink: '#F4F4F5', ink2: '#A1A1AA', ink3: '#71717A',
      accent: '#7AA2FF', accent2: '#A5C0FF', accentDeep: '#2B59C3', accentSoft: '#172340', onAccent: '#08101F',
      gold: '#F0B44C', gold2: '#F5CB7E', goldSoft: '#33260C', patina: '#4ADE80', patina2: '#86EFAC', patinaSoft: '#0F2E1A',
      danger: '#F87171', dangerSoft: '#3A1414', info: '#B794F6', infoSoft: '#24183D',
      night: '#141418', night2: '#1B1B20', night3: '#232329', nightLine: 'rgba(255,255,255,.08)', nightInk: '#F4F4F5', nightDim: '#A1A1AA',
      shadow1: 'none', shadow2: '0 10px 28px -16px rgba(0,0,0,.8)',
    },
  }),
  S({
    id: 'marah', name: 'المرح', tagline: 'مرجاني وفيروزي وحروف مدوّرة وأزرار بارزة، ودود للصغار',
    flavor: 'playful',
    body: "'Baloo Bhaijaan 2'", display: "'Baloo Bhaijaan 2'", gf: 'family=Baloo+Bhaijaan+2:wght@400;500;600;700;800',
    radius: [12, 16, 22, 28, 34],
    light: {
      bg: '#FFF7F2', bg2: '#FFEFE6', surface: '#FFFFFF', surface2: '#FFFBF8', sunk: '#FDECE2', line: '#F6DFD2', lineStrong: '#EDC9B6',
      ink: '#2A1A14', ink2: '#6B5249', ink3: '#A08A80',
      accent: '#E8462C', accent2: '#FF8A6E', accentDeep: '#B9341E', accentSoft: '#FFE2DA', onAccent: '#FFFFFF',
      gold: '#B87400', gold2: '#FFC145', goldSoft: '#FFF0CC', patina: '#0F958D', patina2: '#3FD9CF', patinaSoft: '#D3F5F2',
      danger: '#D6264E', dangerSoft: '#FDE0E6', info: '#3D7BF0', infoSoft: '#E1EBFD',
      night: '#0E7F78', night2: '#12A39A', night3: '#19B8AE', nightLine: 'rgba(255,255,255,.22)', nightInk: '#FFFFFF', nightDim: '#D2F3F0',
      shadow1: '0 2px 0 rgba(42,26,20,.06)', shadow2: '0 18px 36px -20px rgba(232,70,44,.35)',
    },
    dark: {
      bg: '#160F0D', bg2: '#1B1310', surface: '#231915', surface2: '#291E19', sunk: '#2F221C', line: '#3D2D25', lineStrong: '#503C31',
      ink: '#FFF3EE', ink2: '#D2BBB1', ink3: '#9C857B',
      accent: '#FF7A62', accent2: '#FFA28F', accentDeep: '#E8462C', accentSoft: '#45211A', onAccent: '#2A0C05',
      gold: '#FFC145', gold2: '#FFD47E', goldSoft: '#3D2E0C', patina: '#3FD9CF', patina2: '#80E8E1', patinaSoft: '#0E3633',
      danger: '#FF7D97', dangerSoft: '#40172A', info: '#84AEFF', infoSoft: '#172A4A',
      night: '#0B4D49', night2: '#0E5F5A', night3: '#127069', nightLine: 'rgba(255,255,255,.16)', nightInk: '#F2FFFD', nightDim: '#A6DCD7',
      shadow1: '0 2px 0 rgba(0,0,0,.35)', shadow2: '0 18px 36px -18px rgba(0,0,0,.8)',
    },
  }),
  S({
    id: 'malaki', name: 'الملكي', tagline: 'كحلي عميق وخيوط ذهبية وخط المسيري، فخامة رسمية',
    flavor: 'royal',
    body: "'Noto Sans Arabic'", display: "'El Messiri'", gf: 'family=Noto+Sans+Arabic:wght@400;500;600;700&family=El+Messiri:wght@600;700',
    radius: [4, 8, 10, 14, 18],
    light: {
      bg: '#F4F5F8', bg2: '#ECEEF3', surface: '#FFFFFF', surface2: '#FBFBFD', sunk: '#ECEEF3', line: '#E0E3EB', lineStrong: '#C9CEDB',
      ink: '#0E1530', ink2: '#4B5470', ink3: '#868DA5',
      accent: '#1B2A6B', accent2: '#3A4EA8', accentDeep: '#111B49', accentSoft: '#E2E6F5', onAccent: '#FFFFFF',
      gold: '#9E7A22', gold2: '#D9B865', goldSoft: '#F5ECD4', patina: '#1E7D63', patina2: '#46C49F', patinaSoft: '#DAF1E9',
      danger: '#B3263A', dangerSoft: '#F7E0E4', info: '#2F6DB5', infoSoft: '#E0EBF7',
      night: '#0E1530', night2: '#151E42', night3: '#1D2854', nightLine: 'rgba(217,184,101,.3)', nightInk: '#F6F1E3', nightDim: '#BDB9A8',
      shadow1: '0 1px 2px rgba(14,21,48,.06)', shadow2: '0 18px 40px -22px rgba(14,21,48,.4)',
    },
    dark: {
      bg: '#080B18', bg2: '#0B0F20', surface: '#10152B', surface2: '#141A33', sunk: '#19203D', line: '#252D4F', lineStrong: '#343D63',
      ink: '#F2EEE3', ink2: '#BDB8A8', ink3: '#858198',
      accent: '#D9B865', accent2: '#EBD08F', accentDeep: '#B08A2E', accentSoft: '#2E2814', onAccent: '#14100A',
      gold: '#E7C877', gold2: '#F0DA9F', goldSoft: '#322A12', patina: '#5FD3AE', patina2: '#93E3C9', patinaSoft: '#0F3328',
      danger: '#F2828F', dangerSoft: '#3A1820', info: '#8EB8F0', infoSoft: '#162844',
      night: '#060914', night2: '#0B1024', night3: '#111733', nightLine: 'rgba(217,184,101,.25)', nightInk: '#F6F1E3', nightDim: '#ABA796',
      shadow1: '0 1px 2px rgba(0,0,0,.5)', shadow2: '0 20px 44px -22px rgba(0,0,0,.9)',
    },
  }),
  S({
    id: 'zahri', name: 'الزهري', tagline: 'ألوان باستيل وردية ولافندر وزوايا ناعمة، هدوء ورقة',
    flavor: 'soft',
    body: "'Almarai'", display: "'Lemonada'", gf: 'family=Almarai:wght@400;700;800&family=Lemonada:wght@600;700',
    radius: [14, 18, 22, 28, 34],
    light: {
      bg: '#FCF6F8', bg2: '#F8EEF2', surface: '#FFFFFF', surface2: '#FFFBFC', sunk: '#F5E9EE', line: '#F0E0E7', lineStrong: '#E4CBD6',
      ink: '#2B1724', ink2: '#6E5464', ink3: '#A38E9A',
      accent: '#C2417A', accent2: '#E27AA8', accentDeep: '#962B5C', accentSoft: '#FBE1EC', onAccent: '#FFFFFF',
      gold: '#B97A0E', gold2: '#F2BE5C', goldSoft: '#FCEFD6', patina: '#2E8F7A', patina2: '#67D2B9', patinaSoft: '#DCF2EC',
      danger: '#D0344B', dangerSoft: '#FBE0E4', info: '#7A5AE0', infoSoft: '#ECE6FC',
      night: '#2C1530', night2: '#3A1C40', night3: '#4A2450', nightLine: 'rgba(255,200,230,.18)', nightInk: '#FFF1F7', nightDim: '#D8B9CF',
      shadow1: '0 2px 10px -4px rgba(194,65,122,.12)', shadow2: '0 24px 48px -26px rgba(194,65,122,.35)',
    },
    dark: {
      bg: '#140C12', bg2: '#190F17', surface: '#21151E', surface2: '#271A24', sunk: '#2D1E29', line: '#3A2835', lineStrong: '#4E3647',
      ink: '#FBEFF5', ink2: '#D2B8C7', ink3: '#9B8291',
      accent: '#FF8DBE', accent2: '#FFB3D4', accentDeep: '#C2417A', accentSoft: '#43192F', onAccent: '#2A0717',
      gold: '#F2BE5C', gold2: '#F7D592', goldSoft: '#3A2B10', patina: '#6FDCC2', patina2: '#A0E9D7', patinaSoft: '#123630',
      danger: '#FF8396', dangerSoft: '#42172A', info: '#B39CFF', infoSoft: '#251D45',
      night: '#1E0F1C', night2: '#2A1427', night3: '#361A33', nightLine: 'rgba(255,200,230,.14)', nightInk: '#FFF1F7', nightDim: '#C9A9BF',
      shadow1: '0 2px 10px -4px rgba(0,0,0,.5)', shadow2: '0 24px 48px -24px rgba(0,0,0,.9)',
    },
  }),
];

// token key -> platform css variable
export const TOKEN_MAP = {
  bg: '--nx-bg', bg2: '--nx-bg-2', surface: '--nx-surface', surface2: '--nx-surface-2', sunk: '--nx-sunk', line: '--nx-line', lineStrong: '--nx-line-strong',
  ink: '--nx-ink', ink2: '--nx-ink-2', ink3: '--nx-ink-3',
  accent: '--nx-copper', accent2: '--nx-copper-2', accentDeep: '--nx-copper-deep', accentSoft: '--nx-copper-soft', onAccent: '--nx-on-copper',
  gold: '--nx-gold', gold2: '--nx-gold-2', goldSoft: '--nx-gold-soft', patina: '--nx-patina', patina2: '--nx-patina-2', patinaSoft: '--nx-patina-soft',
  danger: '--nx-danger', dangerSoft: '--nx-danger-soft', info: '--nx-info', infoSoft: '--nx-info-soft',
  night: '--nx-night', night2: '--nx-night-2', night3: '--nx-night-3', nightLine: '--nx-night-line', nightInk: '--nx-night-ink', nightDim: '--nx-night-dim',
  shadow1: '--nx-shadow-1', shadow2: '--nx-shadow-2',
};

function hexToRgb(h) {
  const m = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16));
}
export function alpha(hex, a) {
  if (!hex.startsWith('#')) return hex;
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Fill in the tokens every skin derives the same way.
export function fullTokens(skin, mode) {
  const t = { ...skin[mode] };
  const L = skin.light;
  t.glass = alpha(t.surface, mode === 'dark' ? 0.78 : 0.8);
  t.glassLine = mode === 'dark' ? 'rgba(255,255,255,.08)' : alpha(t.ink, 0.08);
  t.scrim = mode === 'dark' ? 'rgba(0,0,0,.62)' : alpha(t.night, 0.48);
  t.shadow3 = mode === 'dark' ? '0 30px 70px -24px rgba(0,0,0,.9)' : `0 30px 70px -24px ${alpha(t.ink, 0.4)}`;
  t.glow = `0 10px 30px -10px ${alpha(t.accent, 0.5)}`;
  // solid colours stay saturated in both themes (used by bridged Tailwind buttons with white text)
  t.accentSolid = L.accent; t.accentSolidDeep = L.accentDeep;
  t.goldSolid = L.gold; t.goldSolidDeep = L.gold;
  t.patinaSolid = L.patina; t.patinaSolidDeep = L.patina;
  t.dangerSolid = L.danger; t.dangerSolidDeep = L.danger;
  return t;
}
