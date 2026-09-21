export interface YouTubeVideoData {
  id: string;
  youtubeId: string;
  title: string;
  badge: string;
  date: string;
  location: string;
  description: string;
  channelTitle: string;
  channelUrl: string;
  videoUrl: string;
}

export interface InstagramPostData {
  id: string;
  title: string;
  category: string;
  date: string;
  images: string[];
  caption: string;
  likesCount?: number | null;
  postUrl: string;
}

export interface InstagramProfileData {
  username: string;
  handle: string;
  displayName: string;
  tagline: string;
  avatarUrl: string;
  profileUrl: string;
  followersCount: string;
  postsCount: number;
}

export const OFFICIAL_YOUTUBE_VIDEO: YouTubeVideoData = {
  id: "yt-1",
  youtubeId: "ABs7uaqojsY",
  title: "Forum Koordinasi Penyelenggaraan Perencanaan Pembangunan Daerah BAPPEDA Halmahera Utara",
  badge: "Siaran Resmi BAPPEDA HALUT",
  date: "17 September 2026",
  location: "Ruang Rapat Utama BAPPEDA, Tobelo",
  description: "Rapat koordinasi dan evaluasi sinkronisasi program prioritas daerah Kabupaten Halmahera Utara menuju integrasi perencanaan yang terpadu, transparan, dan akuntabel.",
  channelTitle: "Bappeda Halmahera Utara Official",
  channelUrl: "https://www.youtube.com/@bappedahalmaherautara",
  videoUrl: "https://www.youtube.com/watch?v=ABs7uaqojsY",
};

export const OFFICIAL_INSTAGRAM_PROFILE: InstagramProfileData = {
  username: "bappeda_halut",
  handle: "@bappeda_halut",
  displayName: "BAPPEDA HALUT",
  tagline: "Sinergi Lokal, Solusi Global — Halmahera Utara Hebat",
  avatarUrl: "/images/bappeda/logo-halut.png",
  profileUrl: "https://www.instagram.com/bappeda_halut",
  followersCount: "3.4K",
  postsCount: 128,
};

export const OFFICIAL_INSTAGRAM_POSTS: InstagramPostData[] = [
  {
    id: "ig-1",
    title: "SIAPA YANG MENENTUKAN PRIORITAS PEMBANGUNAN?",
    category: "WARTA PERENCANAAN",
    date: "16 September 2026",
    images: [
      "/storage/instagram/ig_DdWPhSjGqos_slide_1.jpg",
      "/storage/instagram/ig_DdWPhSjGqos_slide_2.jpg",
      "/storage/instagram/ig_DdWPhSjGqos_slide_3.jpg",
      "/storage/instagram/ig_DdWPhSjGqos_slide_4.jpg",
      "/storage/instagram/ig_DdWPhSjGqos_slide_5.jpg",
      "/storage/instagram/ig_DdWPhSjGqos_slide_6.jpg",
      "/storage/instagram/ig_DdWPhSjGqos_slide_7.jpg",
      "/storage/instagram/ig_DdWPhSjGqos_slide_8.jpg",
    ],
    caption: `SIAPA YANG MENENTUKAN PRIORITAS PEMBANGUNAN?\n\nTahukah Kawan Bappeda?\n\nPrioritas pembangunan bukan ditentukan oleh satu pihak saja. Masyarakat, pemerintah daerah, DPRD, dan pemangku kepentingan lainnya memiliki peran dalam proses perencanaan pembangunan.\n\nUsulan masyarakat menjadi salah satu bahan penting, kemudian dipertimbangkan berdasarkan data, kebutuhan, urgensi, manfaat, dan kemampuan anggaran daerah.\n\n👉 Yuk, geser carousel untuk tahu bagaimana prioritas pembangunan ditentukan!\n\nMenurut Kawan Bappeda, apa yang paling penting dalam menentukan prioritas pembangunan?\n.\n.\n.\n#bappedahalut #halmaherautara #halutsetara #pemdahalut #banggamelayanibangsa`,
    likesCount: 5,
    postUrl: "https://www.instagram.com/p/DdWPhSjGqos/",
  },
  {
    id: "ig-2",
    title: "Sinkronisasi Perencanaan Tata Ruang dan Kehutanan Berkelanjutan",
    category: "SPASIAL & LINGKUNGAN",
    date: "16 September 2026",
    images: [
      "/images/bappeda/raker-2024.jpg",
      "/images/bappeda/pokja-pkp.jpg",
    ],
    caption: `🌿 Integrasi Tata Ruang Spasial dengan Rencana Pembangunan Berkelanjutan!\n\nBAPPEDA Kabupaten Halmahera Utara menggelar Focus Group Discussion (FGD) bersama Dinas Kehutanan, Dinas Lingkungan Hidup, dan stakeholder terkait dalam rangka harmonisasi revisi RTRW dan penetapan kawasan lindung.\n\nLangkah strategis ini memastikan pembangunan infrastruktur wilayah berjalan selaras dengan pelestarian ekosistem hutan dan mitigasi potensi bencana geologis di Halut.\n\n#TataRuang #GeospasialHalut #BappedaHalut #KonservasiLingkungan #PembangunanHijau`,
    likesCount: null,
    postUrl: "https://www.instagram.com/bappeda_halut",
  },
];

