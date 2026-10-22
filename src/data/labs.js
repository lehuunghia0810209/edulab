export const LABS = [
  {
    id: "chemlab",
    name: "ChemLab",
    subject: "Hóa học",
    url: import.meta.env.VITE_CHEMLAB_URL || "https://chemlab-edulab.pages.dev/",
    description: "Khám phá hóa học qua tương tác.",
    icon: "flask",
    category: "science"
  },
  {
    id: "physicslab",
    name: "PhysicsLab",
    subject: "Vật lý",
    url: import.meta.env.VITE_PHYSICSLAB_URL || "https://physicslab-edulab.pages.dev/",
    description: "Trực quan hóa các hiện tượng vật lý.",
    icon: "atom",
    category: "science"
  },
  {
    id: "mathlab",
    name: "MathLab",
    subject: "Toán học",
    url: import.meta.env.VITE_MATHLAB_URL || "https://mathlab-edulab.pages.dev/",
    description: "Khám phá toán học bằng hình ảnh.",
    icon: "function",
    category: "logic"
  },
  {
    id: "biolab",
    name: "BioLab",
    subject: "Sinh học",
    url: import.meta.env.VITE_BIOLAB_URL || "",
    description: "Tìm hiểu thế giới sự sống.",
    icon: "dna",
    category: "science"
  },
  {
    id: "itlab",
    name: "ITLab",
    subject: "Tin học",
    url: import.meta.env.VITE_ITLAB_URL || "",
    description: "Khám phá lập trình và công nghệ.",
    icon: "code",
    category: "logic"
  }
];

export const CATEGORY_LABELS = {
  science: "Khoa học tự nhiên",
  logic: "Toán học & Công nghệ"
};

export { LAB_ILLUSTRATIONS } from './artwork.js';

export function validateLabUrl(id, value) {
  if (!value) return '';
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    console.warn('URL cấu hình cho ' + id + ' không hợp lệ; liên kết đã được bỏ qua.');
    return '';
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    console.warn('URL cấu hình cho ' + id + ' phải dùng HTTP hoặc HTTPS; liên kết đã được bỏ qua.');
    return '';
  }
  return parsed.href;
}

for (const lab of LABS) {
  lab.url = validateLabUrl(lab.id, lab.url);
}

export const EXA = {
  id: "exa",
  name: "Exa",
  subject: "Kiểm tra trực tuyến",
  url: validateLabUrl("exa", import.meta.env.VITE_EXA_URL || "https://exa-edulab.pages.dev/")
};

const contactEmail = String(import.meta.env.VITE_CONTACT_EMAIL || "").trim();
export const CONTACT_EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(contactEmail) ? contactEmail : "";
if (contactEmail && !CONTACT_EMAIL) console.warn("VITE_CONTACT_EMAIL không hợp lệ; mục Liên hệ đã được ẩn.");
