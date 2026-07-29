import halutOfficialBpsBoundary from "@/data/halut-boundary.json";

function isPointInPolygonRing(point: [number, number], vs: [number, number][]) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInsideOfficialHalutBoundary(lat: number, lng: number): boolean {
  const point: [number, number] = [lng, lat];
  for (const feature of halutOfficialBpsBoundary.features) {
    const geom = feature.geometry as any;
    if (geom.type === "MultiPolygon") {
      for (const polygon of geom.coordinates) {
        for (const ring of polygon) {
          if (isPointInPolygonRing(point, ring)) {
            return true;
          }
        }
      }
    } else if (geom.type === "Polygon") {
      for (const ring of geom.coordinates) {
        if (isPointInPolygonRing(point, ring)) {
          return true;
        }
      }
    }
  }
  return false;
}

export interface DesaItem {
  name: string;
  lat: number;
  lng: number;
}

export interface KecamatanItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  desas: DesaItem[];
}

export const KECAMATAN_HALUT_DATA: KecamatanItem[] = [
  {
    id: "tobelo",
    name: "Tobelo",
    lat: 1.7289,
    lng: 128.0054,
    desas: [
      { name: "Gamsungi", lat: 1.7295, lng: 128.0062 },
      { name: "Wosia", lat: 1.7350, lng: 128.0080 },
      { name: "Rawamangun", lat: 1.7210, lng: 128.0020 },
      { name: "Tagalaya", lat: 1.7410, lng: 128.0210 },
      { name: "Gura", lat: 1.7250, lng: 128.0010 },
      { name: "MKCM", lat: 1.7180, lng: 127.9950 },
      { name: "Kakara B", lat: 1.7510, lng: 128.0310 },
      { name: "Popilo", lat: 1.7620, lng: 128.0150 },
      { name: "Popilo Utara", lat: 1.7710, lng: 128.0180 },
    ],
  },
  {
    id: "tobelo_utara",
    name: "Tobelo Utara",
    lat: 1.8120,
    lng: 127.9680,
    desas: [
      { name: "Luari", lat: 1.8020, lng: 127.9780 },
      { name: "Gorua", lat: 1.8150, lng: 127.9720 },
      { name: "Gorua Selatan", lat: 1.8100, lng: 127.9740 },
      { name: "Pacao", lat: 1.8350, lng: 127.9580 },
      { name: "Ruko", lat: 1.8480, lng: 127.9450 },
      { name: "Tolonuo", lat: 1.8580, lng: 127.9950 },
      { name: "Dim-Dim", lat: 1.8680, lng: 127.9350 },
    ],
  },
  {
    id: "tobelo_selatan",
    name: "Tobelo Selatan",
    lat: 1.6251,
    lng: 128.0125,
    desas: [
      { name: "Kakara", lat: 1.6510, lng: 128.0310 },
      { name: "Pitu", lat: 1.6350, lng: 128.0150 },
      { name: "Efi-Efi", lat: 1.6210, lng: 128.0110 },
      { name: "Tioua", lat: 1.6150, lng: 128.0050 },
      { name: "Gamhoku", lat: 1.6050, lng: 127.9950 },
      { name: "Paca", lat: 1.5950, lng: 127.9850 },
    ],
  },
  {
    id: "tobelo_tengah",
    name: "Tobelo Tengah",
    lat: 1.7012,
    lng: 127.9856,
    desas: [
      { name: "WKO", lat: 1.7050, lng: 127.9880 },
      { name: "Tanjung Niara", lat: 1.7110, lng: 127.9920 },
      { name: "Kaliamang", lat: 1.6950, lng: 127.9780 },
      { name: "Pura", lat: 1.6880, lng: 127.9710 },
    ],
  },
  {
    id: "tobelo_timur",
    name: "Tobelo Timur",
    lat: 1.7145,
    lng: 128.0623,
    desas: [
      { name: "Metelnap", lat: 1.7180, lng: 128.0650 },
      { name: "Yaro", lat: 1.7220, lng: 128.0710 },
      { name: "Mawea", lat: 1.7100, lng: 128.0580 },
      { name: "Wohia", lat: 1.7020, lng: 128.0510 },
    ],
  },
  {
    id: "galela",
    name: "Galela",
    lat: 1.8378,
    lng: 127.8189,
    desas: [
      { name: "Soakonora", lat: 1.8410, lng: 127.8210 },
      { name: "Towara", lat: 1.8520, lng: 127.8310 },
      { name: "Duma", lat: 1.8210, lng: 127.7950 },
      { name: "Pune", lat: 1.8310, lng: 127.8110 },
      { name: "Mamuya", lat: 1.8650, lng: 127.8450 },
    ],
  },
  {
    id: "galela_utara",
    name: "Galela Utara",
    lat: 1.9567,
    lng: 127.7654,
    desas: [
      { name: "Salimuli", lat: 1.9610, lng: 127.7710 },
      { name: "Dorume", lat: 1.9720, lng: 127.7810 },
      { name: "Baramu", lat: 1.9450, lng: 127.7550 },
    ],
  },
  {
    id: "galela_selatan",
    name: "Galela Selatan",
    lat: 1.7823,
    lng: 127.8543,
    desas: [
      { name: "Igobula", lat: 1.7850, lng: 127.8580 },
      { name: "Soagimalaha", lat: 1.7780, lng: 127.8480 },
    ],
  },
  {
    id: "galela_barat",
    name: "Galela Barat",
    lat: 1.8156,
    lng: 127.7845,
    desas: [
      { name: "Dokulamo", lat: 1.8180, lng: 127.7880 },
      { name: "Roko", lat: 1.8110, lng: 127.7780 },
    ],
  },
  {
    id: "kao",
    name: "Kao",
    lat: 1.3412,
    lng: 127.9012,
    desas: [
      { name: "Kao", lat: 1.3450, lng: 127.9050 },
      { name: "Popon", lat: 1.3510, lng: 127.9110 },
      { name: "Biang", lat: 1.3320, lng: 127.8920 },
    ],
  },
  {
    id: "kao_utara",
    name: "Kao Utara",
    lat: 1.4523,
    lng: 127.8856,
    desas: [
      { name: "Bori", lat: 1.4550, lng: 127.8890 },
      { name: "Darume", lat: 1.4480, lng: 127.8790 },
    ],
  },
  {
    id: "kao_teluk",
    name: "Kao Teluk",
    lat: 1.2543,
    lng: 127.9345,
    desas: [
      { name: "Dum-Dum", lat: 1.2580, lng: 127.9380 },
      { name: "Pasir Putih", lat: 1.2490, lng: 127.9280 },
    ],
  },
  {
    id: "kao_barat",
    name: "Kao Barat",
    lat: 1.3789,
    lng: 127.8123,
    desas: [
      { name: "Pitago", lat: 1.3820, lng: 127.8160 },
      { name: "Kusuri", lat: 1.3720, lng: 127.8050 },
    ],
  },
  {
    id: "malifut",
    name: "Malifut",
    lat: 1.1567,
    lng: 127.7856,
    desas: [
      { name: "Samsuma", lat: 1.1610, lng: 127.7890 },
      { name: "Tahane", lat: 1.1510, lng: 127.7790 },
      { name: "Malifut", lat: 1.1450, lng: 127.7690 },
    ],
  },
  {
    id: "loloda_utara",
    name: "Loloda Utara",
    lat: 2.1234,
    lng: 127.7123,
    desas: [
      { name: "Dapa", lat: 2.1280, lng: 127.7160 },
      { name: "Asimiro", lat: 2.1180, lng: 127.7050 },
    ],
  },
  {
    id: "loloda_kepulauan",
    name: "Loloda Kepulauan",
    lat: 2.2156,
    lng: 127.6543,
    desas: [
      { name: "Dama", lat: 2.2190, lng: 127.6580 },
      { name: "Dedeta", lat: 2.2090, lng: 127.6480 },
    ],
  },
];

export const halutRegionService = {
  getKecamatanList: () => KECAMATAN_HALUT_DATA,
  
  getKecamatanByName: (name: string) => {
    return KECAMATAN_HALUT_DATA.find(
      (k) => k.name.toLowerCase() === name.toLowerCase()
    );
  },

  getDesaListByKecamatan: (kecamatanName: string) => {
    const kec = KECAMATAN_HALUT_DATA.find(
      (k) => k.name.toLowerCase() === kecamatanName.toLowerCase()
    );
    return kec ? kec.desas : [];
  },

  findRegionByCoords: (lat: number, lng: number): { kecamatan: string; desa: string; distanceKm: number; isWithinHalut: boolean } => {
    let closestKec = "";
    let closestDesa = "";
    let minDistance = Infinity;

    const toRad = (x: number) => (x * Math.PI) / 180;

    KECAMATAN_HALUT_DATA.forEach((kec) => {
      const dLatKec = toRad(kec.lat - lat);
      const dLngKec = toRad(kec.lng - lng);
      const aKec =
        Math.sin(dLatKec / 2) * Math.sin(dLatKec / 2) +
        Math.cos(toRad(lat)) * Math.cos(toRad(kec.lat)) * Math.sin(dLngKec / 2) * Math.sin(dLngKec / 2);
      const cKec = 2 * Math.atan2(Math.sqrt(aKec), Math.sqrt(1 - aKec));
      const distKec = 6371 * cKec;

      if (distKec < minDistance) {
        minDistance = distKec;
        closestKec = kec.name;
        closestDesa = kec.desas.length > 0 ? kec.desas[0].name : "";
      }

      kec.desas.forEach((desa) => {
        const dLatDesa = toRad(desa.lat - lat);
        const dLngDesa = toRad(desa.lng - lng);
        const aDesa =
          Math.sin(dLatDesa / 2) * Math.sin(dLatDesa / 2) +
          Math.cos(toRad(lat)) * Math.cos(toRad(desa.lat)) * Math.sin(dLngDesa / 2) * Math.sin(dLngDesa / 2);
        const cDesa = 2 * Math.atan2(Math.sqrt(aDesa), Math.sqrt(1 - aDesa));
        const distDesa = 6371 * cDesa;

        if (distDesa < minDistance) {
          minDistance = distDesa;
          closestKec = kec.name;
          closestDesa = desa.name;
        }
      });
    });

    const isWithinHalut = isPointInsideOfficialHalutBoundary(lat, lng) || minDistance <= 25;

    return {
      kecamatan: isWithinHalut ? closestKec : "",
      desa: isWithinHalut ? closestDesa : "",
      distanceKm: parseFloat(minDistance.toFixed(2)),
      isWithinHalut,
    };
  },
};
