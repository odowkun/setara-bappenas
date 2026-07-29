<?php

namespace Database\Seeders;

use App\Models\Pejabat;
use Illuminate\Database\Seeder;

class PejabatSeeder extends Seeder
{
    public function run(): void
    {
        Pejabat::truncate();

        $data = [
            // Root
            [
                'node_id' => 'node-kepala',
                'parent_id' => null,
                'name' => 'Dr. Jan W. N. Papilaya, M.Si',
                'position' => 'KEPALA BADAN',
                'nip' => '197204121998031004',
                'avatar' => '/images/bappeda/pejabat-1.jpg',
                'order_index' => 1,
            ],
            // Sekretaris & Subag
            [
                'node_id' => 'node-sekretaris',
                'parent_id' => 'node-kepala',
                'name' => 'Siti Rahmawati, S.STP',
                'position' => 'SEKRETARIS',
                'nip' => '198509152009022003',
                'avatar' => '/images/bappeda/pejabat-2.jpg',
                'order_index' => 2,
            ],
            [
                'node_id' => 'subag-1',
                'parent_id' => 'node-sekretaris',
                'name' => 'Maria S. Lesnussa, S.Kom',
                'position' => 'SUBAG PERENCANAAN & EVALUASI',
                'nip' => '199208202018022001',
                'avatar' => null,
                'order_index' => 3,
            ],
            [
                'node_id' => 'subag-2',
                'parent_id' => 'node-sekretaris',
                'name' => 'Fahri Abdullah, S.E.',
                'position' => 'SUBAG KEUANGAN',
                'nip' => '199003122015031002',
                'avatar' => null,
                'order_index' => 4,
            ],
            [
                'node_id' => 'subag-3',
                'parent_id' => 'node-sekretaris',
                'name' => 'Agus Supriyanto, S.Sos',
                'position' => 'SUBAG UMUM DAN KEPEGAWAIAN',
                'nip' => '198704152011011004',
                'avatar' => null,
                'order_index' => 5,
            ],
            // Bidang Sosbud
            [
                'node_id' => 'bidang-sosbud',
                'parent_id' => 'node-kepala',
                'name' => 'Dr. Samuel Tani, M.Pd',
                'position' => 'BIDANG PEMBANGUNAN MANUSIA DAN MASYARAKAT',
                'nip' => '198305142008011005',
                'avatar' => null,
                'order_index' => 6,
            ],
            [
                'node_id' => 'subid-sos-1',
                'parent_id' => 'bidang-sosbud',
                'name' => 'Yohanes L., S.Pd',
                'position' => 'SUBID PEMBANGUNAN SUMBERDAYA MANUSIA',
                'nip' => '199102142016021001',
                'avatar' => null,
                'order_index' => 7,
            ],
            [
                'node_id' => 'subid-sos-2',
                'parent_id' => 'bidang-sosbud',
                'name' => 'Rina Kartika, S.Sos',
                'position' => 'SUBID PEMBANGUNAN KETAHANAN MASYARAKAT',
                'nip' => '199307182019032002',
                'avatar' => null,
                'order_index' => 8,
            ],
            [
                'node_id' => 'subid-sos-3',
                'parent_id' => 'bidang-sosbud',
                'name' => 'Benny W., S.IP',
                'position' => 'SUBID PEMBANGUNAN SUMBERDAYA APARATUR PERANGKAT DAERAH',
                'nip' => '198912052014021003',
                'avatar' => null,
                'order_index' => 9,
            ],
            // Bidang Ekonomi
            [
                'node_id' => 'bidang-ekonomi',
                'parent_id' => 'node-kepala',
                'name' => 'Nurfadilah, S.E.',
                'position' => 'BIDANG EKONOMI DAN SUMBERDAYA ALAM',
                'nip' => '198811052012012001',
                'avatar' => null,
                'order_index' => 10,
            ],
            [
                'node_id' => 'subid-eko-1',
                'parent_id' => 'bidang-ekonomi',
                'name' => 'Hendra Wijaya, S.E.',
                'position' => 'SUBID EKONOMI',
                'nip' => '199201102017011002',
                'avatar' => null,
                'order_index' => 11,
            ],
            [
                'node_id' => 'subid-eko-2',
                'parent_id' => 'bidang-ekonomi',
                'name' => 'Dewi Lestari, S.A.P',
                'position' => 'SUBID KEUANGAN DAERAH',
                'nip' => '199405222019022004',
                'avatar' => null,
                'order_index' => 12,
            ],
            [
                'node_id' => 'subid-eko-3',
                'parent_id' => 'bidang-ekonomi',
                'name' => 'Irfan Mansur, S.Hut',
                'position' => 'SUBID SUMBERDAYA ALAM',
                'nip' => '199009122015031005',
                'avatar' => null,
                'order_index' => 13,
            ],
            // Bidang Infrastruktur
            [
                'node_id' => 'bidang-infrastruktur',
                'parent_id' => 'node-kepala',
                'name' => 'Ir. Hendra Kusuma',
                'position' => 'BIDANG INFRASTRUKTUR DAN PENGEMBANGAN WILAYAH',
                'nip' => '198103202006041002',
                'avatar' => null,
                'order_index' => 14,
            ],
            [
                'node_id' => 'subid-infra-1',
                'parent_id' => 'bidang-infrastruktur',
                'name' => 'Rizal Pratama, S.T.',
                'position' => 'SUBID INFRAS DAN PENGEMBANGAN WILAYAH',
                'nip' => '198904122014031001',
                'avatar' => null,
                'order_index' => 15,
            ],
            [
                'node_id' => 'subid-infra-2',
                'parent_id' => 'bidang-infrastruktur',
                'name' => 'Eko Prasetyo, S.Kom',
                'position' => 'SUBID TEKNOLOGI INFORMASI PEMBANGUNAN DAERAH',
                'nip' => '199310082018021003',
                'avatar' => null,
                'order_index' => 16,
            ],
            [
                'node_id' => 'subid-infra-3',
                'parent_id' => 'bidang-infrastruktur',
                'name' => 'Andi Saputra, S.T.',
                'position' => 'SUBID KECAMATAN & DESA',
                'nip' => '199106252016011002',
                'avatar' => null,
                'order_index' => 17,
            ],
            // Bidang Renval
            [
                'node_id' => 'bidang-renval',
                'parent_id' => 'node-kepala',
                'name' => 'Viktorianus P., S.T.',
                'position' => 'BIDANG PENGENDALIAN, EVALUASI DAN PELAPORAN',
                'nip' => '198607102010041003',
                'avatar' => null,
                'order_index' => 18,
            ],
            [
                'node_id' => 'subid-renval-1',
                'parent_id' => 'bidang-renval',
                'name' => 'Sri Mulyani, S.Stat',
                'position' => 'SUBID MONEV & PELAPORAN BID PEMBANGUNAN MANUSIA & MASY.',
                'nip' => '199203152017022001',
                'avatar' => null,
                'order_index' => 19,
            ],
            [
                'node_id' => 'subid-renval-2',
                'parent_id' => 'bidang-renval',
                'name' => 'Lukman Hakim, S.E.',
                'position' => 'SUBID MONEV & PELAPORAN BID EKONOMI & SDA',
                'nip' => '199011202015031004',
                'avatar' => null,
                'order_index' => 20,
            ],
            [
                'node_id' => 'subid-renval-3',
                'parent_id' => 'bidang-renval',
                'name' => 'Diana Putri, S.T.',
                'position' => 'SUBID MONEV & PELAPORAN BID INFRASTRUKTUR & PENGEMBANGAN WILAYAH',
                'nip' => '199408042019022003',
                'avatar' => null,
                'order_index' => 21,
            ],
        ];

        foreach ($data as $item) {
            Pejabat::create($item);
        }
    }
}
