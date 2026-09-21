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
  likesCount: number;
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
    title: "Apresiasi Kinerja Perencanaan Pembangunan Daerah 2026",
    category: "WARTA PERENCANAAN",
    date: "17 September 2026",
    images: [
      "/images/bappeda/fgd-keuangan.png",
      "/images/bappeda/penilaian-ppd.jpg",
      "/images/bappeda/raker-2024.jpg",
    ],
    caption: `✨ Apresiasi untuk Kinerja, Semangat untuk Terus Berbenah!\n\nKepala BAPPEDA Kabupaten Halmahera Utara beserta jajaran menghadiri Rapat Koordinasi dan Evaluasi Capaian Indikator Kinerja Utama Perencanaan Pembangunan Daerah Tahun 2026.\n\nApresiasi diberikan atas dedikasi seluruh Tim Pokja dalam mengawal konsistensi target RPJMD dan RKPD Kabupaten Halmahera Utara, khususnya dalam percepatan penanggulangan kemiskinan ekstrem, pemerataan infrastruktur, dan digitalisasi satu data perencanaan.\n\nMari terus memperkuat sinergi lintas perangkat daerah demi mewujudkan Halmahera Utara yang maju, sejahtera, dan berdaya saing tinggi! 🏛️🇲🇨\n\n#BappedaHalut #HalmaheraUtara #PerencanaanDaerah #Tobelo #SinergiPembangunan`,
    likesCount: 184,
    postUrl: "https://www.instagram.com/bappeda_halut",
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
    likesCount: 142,
    postUrl: "https://www.instagram.com/bappeda_halut",
  },
  {
    id: "ig-3",
    title: "Peringatan Hari Perhubungan & Konektivitas Wilayah Kepulauan",
    category: "INFRASTRUKTUR",
    date: "15 September 2026",
    images: [
      "/images/bappeda/jembatan-garuda.png",
      "/images/bappeda/satu-data.jpg",
    ],
    caption: `🚢 Selamat Hari Perhubungan Nasional — Menghubungkan Nusantara, Memajukan Halmahera Utara!\n\nKonektivitas antarpulau dan ketersediaan akses logistik yang merata merupakan kunci akselerasi ekonomi daerah kita. BAPPEDA Halut terus mengawal perwujudan simpul transportasi darat dan laut terintegrasi guna menekan disparitas harga kebutuhan pokok dan membuka akses pasar bagi komoditas unggulan petani serta nelayan.\n\nSinergi kuat antara pemerintah pusat dan daerah terus kita dorong untuk kemajuan transportasi publik yang aman dan nyaman.\n\n#HariPerhubungan #KonektivitasHalut #BappedaHalut #InfrastrukturDaerah`,
    likesCount: 215,
    postUrl: "https://www.instagram.com/bappeda_halut",
  },
];
