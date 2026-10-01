<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kritik;
use Illuminate\Http\Request;

class KritikController extends Controller
{
    public function index(Request $request)
    {
        $query = Kritik::query()->latest();

        if ($request->has('visibility')) {
            if ($request->visibility === 'hidden') {
                $query->where('is_hidden', true);
            } elseif ($request->visibility === 'visible') {
                $query->where('is_hidden', false);
            }
        }

        $kritiks = $query->get();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $kritiks,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'telepon' => 'nullable|string|max:30',
            'skpd_tujuan' => 'nullable|string|max:255',
            'subjek' => 'required|string|max:255',
            'pesan' => 'required|string|max:5000',
        ]);

        $kritik = Kritik::query()->create([
            'nama' => $request->nama,
            'email' => $request->email,
            'telepon' => $request->telepon,
            'skpd_tujuan' => $request->skpd_tujuan ?? 'BAPPEDA Halmahera Utara',
            'subjek' => $request->subjek,
            'pesan' => $request->pesan,
            'status' => 'Menunggu Tanggapan',
            'catatan_balasan' => null,
            'is_hidden' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'code' => 201,
            'message' => 'Kritik & Saran Anda berhasil disampaikan ke BAPPEDA.',
            'data' => [
                'id' => $kritik->id,
                'status' => 'Menunggu Tanggapan',
            ],
        ], 201);
    }

    public function publicFeed()
    {
        $kritiks = Kritik::query()
            ->where('is_hidden', false)
            ->latest()
            ->take(100)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'nama' => $this->maskName($item->nama),
                    'skpd_tujuan' => $item->skpd_tujuan,
                    'subjek' => $item->subjek,
                    'pesan' => $item->pesan,
                    'status' => $item->status,
                    'catatan_balasan' => $item->catatan_balasan,
                    'dijawab_oleh' => $item->dijawab_oleh,
                    'tgl_dijawab' => $item->tgl_dijawab ? $item->tgl_dijawab->toISOString() : null,
                    'created_at' => $item->created_at ? $item->created_at->toISOString() : null,
                ];
            });

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'data' => $kritiks,
        ]);
    }

    private function maskName(?string $name): string
    {
        if (empty($name)) {
            return 'Warga (***)';
        }

        $parts = preg_split('/\s+/', trim($name));
        $maskedParts = array_map(function ($part) {
            $len = mb_strlen($part);
            if ($len <= 1) {
                return $part . '***';
            }
            return mb_substr($part, 0, 1) . '***';
        }, $parts);

        return implode(' ', $maskedParts);
    }

    public function updateTanggapan(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:Menunggu Tanggapan,Dalam Proses,Dalam Proses Tindak Lanjut,Sudah Ditanggapi,Ditutup',
            'catatan_balasan' => 'nullable|string|max:5000',
            'dijawab_oleh' => 'nullable|string|max:255',
            'is_hidden' => 'nullable|boolean',
        ]);

        $item = Kritik::query()->findOrFail($id);
        
        $currentUser = auth()->user();
        $defaultResponder = $currentUser 
            ? ($currentUser->name . ($currentUser->role ? ' (' . ucfirst($currentUser->role) . ')' : ''))
            : 'Admin BAPPEDA Halut';

        $payload = [
            'status' => $request->status,
            'catatan_balasan' => $request->catatan_balasan,
            'dijawab_oleh' => $request->filled('dijawab_oleh') ? $request->dijawab_oleh : ($item->dijawab_oleh ?? $defaultResponder),
            'tgl_dijawab' => now(),
        ];

        if ($request->has('is_hidden')) {
            $payload['is_hidden'] = $request->boolean('is_hidden');
        }

        $item->update($payload);

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Tanggapan Kritik & Saran berhasil disimpan',
            'data' => $item->fresh(),
        ]);
    }

    public function exportExcel(Request $request)
    {
        $query = Kritik::query()->latest();

        if ($request->has('visibility')) {
            if ($request->visibility === 'hidden') {
                $query->where('is_hidden', true);
            } elseif ($request->visibility === 'visible') {
                $query->where('is_hidden', false);
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $items = $query->get();

        if ($request->filled('search')) {
            $search = strtolower(trim($request->search));
            $items = $items->filter(function ($k) use ($search) {
                return str_contains(strtolower($k->nama ?? ''), $search)
                    || str_contains(strtolower($k->subjek ?? ''), $search)
                    || str_contains(strtolower($k->pesan ?? ''), $search)
                    || str_contains(strtolower($k->skpd_tujuan ?? ''), $search)
                    || str_contains(strtolower($k->dijawab_oleh ?? ''), $search);
            });
        }

        $escape = function ($str) {
            return htmlspecialchars((string) ($str ?? '-'), ENT_QUOTES | ENT_XML1, 'UTF-8');
        };

        $filename = 'Rekapitulasi_Kritik_Saran_BAPPEDA_HALUT_' . now()->format('Ymd_His') . '.xls';

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\r\n";
        $xml .= '<?mso-application progid="Excel.Sheet"?>' . "\r\n";
        $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"' . "\r\n";
        $xml .= ' xmlns:o="urn:schemas-microsoft-com:office:office"' . "\r\n";
        $xml .= ' xmlns:x="urn:schemas-microsoft-com:office:excel"' . "\r\n";
        $xml .= ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"' . "\r\n";
        $xml .= ' xmlns:html="http://www.w3.org/TR/REC-html40">' . "\r\n";

        // Styles
        $xml .= ' <Styles>' . "\r\n";
        $xml .= '  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top"/><Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/></Style>' . "\r\n";
        $xml .= '  <Style ss:ID="Title1"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#1E3A8A"/></Style>' . "\r\n";
        $xml .= '  <Style ss:ID="Title2"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#0F172A"/></Style>' . "\r\n";
        $xml .= '  <Style ss:ID="Title3"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#1E3A8A"/></Style>' . "\r\n";
        $xml .= '  <Style ss:ID="Meta"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="9" ss:Italic="1" ss:Color="#64748B"/></Style>' . "\r\n";

        $xml .= '  <Style ss:ID="HeaderCol">' . "\r\n";
        $xml .= '    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>' . "\r\n";
        $xml .= '    <Borders>' . "\r\n";
        $xml .= '      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>' . "\r\n";
        $xml .= '      <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>' . "\r\n";
        $xml .= '      <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>' . "\r\n";
        $xml .= '      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>' . "\r\n";
        $xml .= '    </Borders>' . "\r\n";
        $xml .= '    <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>' . "\r\n";
        $xml .= '    <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>' . "\r\n";
        $xml .= '  </Style>' . "\r\n";

        $xml .= '  <Style ss:ID="CellLeft">' . "\r\n";
        $xml .= '    <Alignment ss:Horizontal="Left" ss:Vertical="Top" ss:WrapText="1"/>' . "\r\n";
        $xml .= '    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders>' . "\r\n";
        $xml .= '    <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/>' . "\r\n";
        $xml .= '  </Style>' . "\r\n";

        $xml .= '  <Style ss:ID="CellLeftZebra">' . "\r\n";
        $xml .= '    <Alignment ss:Horizontal="Left" ss:Vertical="Top" ss:WrapText="1"/>' . "\r\n";
        $xml .= '    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders>' . "\r\n";
        $xml .= '    <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/>' . "\r\n";
        $xml .= '    <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>' . "\r\n";
        $xml .= '  </Style>' . "\r\n";

        $xml .= '  <Style ss:ID="CellCenter">' . "\r\n";
        $xml .= '    <Alignment ss:Horizontal="Center" ss:Vertical="Top" ss:WrapText="1"/>' . "\r\n";
        $xml .= '    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders>' . "\r\n";
        $xml .= '    <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/>' . "\r\n";
        $xml .= '  </Style>' . "\r\n";

        $xml .= '  <Style ss:ID="CellCenterZebra">' . "\r\n";
        $xml .= '    <Alignment ss:Horizontal="Center" ss:Vertical="Top" ss:WrapText="1"/>' . "\r\n";
        $xml .= '    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders>' . "\r\n";
        $xml .= '    <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/>' . "\r\n";
        $xml .= '    <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>' . "\r\n";
        $xml .= '  </Style>' . "\r\n";

        $xml .= '  <Style ss:ID="BadgeDone">' . "\r\n";
        $xml .= '    <Alignment ss:Horizontal="Center" ss:Vertical="Top" ss:WrapText="1"/>' . "\r\n";
        $xml .= '    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders>' . "\r\n";
        $xml .= '    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#065F46"/>' . "\r\n";
        $xml .= '    <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>' . "\r\n";
        $xml .= '  </Style>' . "\r\n";

        $xml .= '  <Style ss:ID="BadgeProcess">' . "\r\n";
        $xml .= '    <Alignment ss:Horizontal="Center" ss:Vertical="Top" ss:WrapText="1"/>' . "\r\n";
        $xml .= '    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders>' . "\r\n";
        $xml .= '    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#0369A1"/>' . "\r\n";
        $xml .= '    <Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/>' . "\r\n";
        $xml .= '  </Style>' . "\r\n";

        $xml .= '  <Style ss:ID="BadgePending">' . "\r\n";
        $xml .= '    <Alignment ss:Horizontal="Center" ss:Vertical="Top" ss:WrapText="1"/>' . "\r\n";
        $xml .= '    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders>' . "\r\n";
        $xml .= '    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#92400E"/>' . "\r\n";
        $xml .= '    <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>' . "\r\n";
        $xml .= '  </Style>' . "\r\n";

        $xml .= ' </Styles>' . "\r\n";

        // Worksheet
        $xml .= ' <Worksheet ss:Name="Rekapitulasi Masukan">' . "\r\n";
        $xml .= '  <Table ss:DefaultColumnWidth="60" ss:DefaultRowHeight="20">' . "\r\n";

        // Columns definition
        $xml .= '   <Column ss:Width="35"/>' . "\r\n"; // No
        $xml .= '   <Column ss:Width="105"/>' . "\r\n"; // Tanggal Masuk
        $xml .= '   <Column ss:Width="135"/>' . "\r\n"; // Nama Pengirim
        $xml .= '   <Column ss:Width="150"/>' . "\r\n"; // Email
        $xml .= '   <Column ss:Width="110"/>' . "\r\n"; // No. Telepon
        $xml .= '   <Column ss:Width="175"/>' . "\r\n"; // Unit SKPD Tujuan
        $xml .= '   <Column ss:Width="170"/>' . "\r\n"; // Subjek
        $xml .= '   <Column ss:Width="260"/>' . "\r\n"; // Isi Kritik & Saran
        $xml .= '   <Column ss:Width="130"/>' . "\r\n"; // Status
        $xml .= '   <Column ss:Width="160"/>' . "\r\n"; // Petugas Penjawab
        $xml .= '   <Column ss:Width="260"/>' . "\r\n"; // Tanggapan Resmi
        $xml .= '   <Column ss:Width="105"/>' . "\r\n"; // Tanggal Ditanggapi
        $xml .= '   <Column ss:Width="120"/>' . "\r\n"; // Visibilitas

        // Title Rows
        $xml .= '   <Row ss:Height="24">' . "\r\n";
        $xml .= '    <Cell ss:MergeAcross="12" ss:StyleID="Title1"><Data ss:Type="String">PEMERINTAH KABUPATEN HALMAHERA UTARA</Data></Cell>' . "\r\n";
        $xml .= '   </Row>' . "\r\n";
        $xml .= '   <Row ss:Height="20">' . "\r\n";
        $xml .= '    <Cell ss:MergeAcross="12" ss:StyleID="Title2"><Data ss:Type="String">BADAN PERENCANAAN PEMBANGUNAN DAERAH (BAPPEDA)</Data></Cell>' . "\r\n";
        $xml .= '   </Row>' . "\r\n";
        $xml .= '   <Row ss:Height="22">' . "\r\n";
        $xml .= '    <Cell ss:MergeAcross="12" ss:StyleID="Title3"><Data ss:Type="String">REKAPITULASI LAPORAN KRITIK, SARAN &amp; ASPIRASI MASYARAKAT</Data></Cell>' . "\r\n";
        $xml .= '   </Row>' . "\r\n";
        $xml .= '   <Row ss:Height="18">' . "\r\n";
        $metaText = 'Diekspor pada: ' . now()->translatedFormat('d F Y, H:i') . ' WIT | Total Data: ' . $items->count() . ' Pesan';
        $xml .= '    <Cell ss:MergeAcross="12" ss:StyleID="Meta"><Data ss:Type="String">' . $escape($metaText) . '</Data></Cell>' . "\r\n";
        $xml .= '   </Row>' . "\r\n";
        $xml .= '   <Row ss:Height="10"/>' . "\r\n"; // Empty row

        // Table Header
        $xml .= '   <Row ss:Height="30">' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">NO</Data></Cell>' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">TANGGAL MASUK</Data></Cell>' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">NAMA PENGIRIM</Data></Cell>' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">EMAIL</Data></Cell>' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">NO. TELEPON / WA</Data></Cell>' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">UNIT SKPD TUJUAN (PENANGGUNG JAWAB)</Data></Cell>' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">SUBJEK MASUKAN</Data></Cell>' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">ISI PESAN KRITIK &amp; SARAN</Data></Cell>' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">STATUS TINDAK LANJUT</Data></Cell>' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">PETUGAS / PEJABAT PENJAWAB</Data></Cell>' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">ISI TANGGAPAN / JAWABAN RESMI</Data></Cell>' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">TANGGAL DIJAWAB</Data></Cell>' . "\r\n";
        $xml .= '    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">VISIBILITAS PUBLIK</Data></Cell>' . "\r\n";
        $xml .= '   </Row>' . "\r\n";

        // Data Rows
        $no = 1;
        foreach ($items as $item) {
            $isZebra = ($no % 2 === 0);
            $styleLeft = $isZebra ? 'CellLeftZebra' : 'CellLeft';
            $styleCenter = $isZebra ? 'CellCenterZebra' : 'CellCenter';

            $statusStyle = 'CellCenter';
            if ($item->status === 'Sudah Ditanggapi') {
                $statusStyle = 'BadgeDone';
            } elseif ($item->status === 'Dalam Proses' || $item->status === 'Dalam Proses Tindak Lanjut') {
                $statusStyle = 'BadgeProcess';
            } else {
                $statusStyle = 'BadgePending';
            }

            $visibilitasLabel = $item->is_hidden ? 'Disembunyikan (SARA/Spam)' : 'Tayang Publik';
            $tglMasuk = $item->created_at ? $item->created_at->format('d/m/Y H:i') : '-';
            $tglJawab = $item->tgl_dijawab ? \Carbon\Carbon::parse($item->tgl_dijawab)->format('d/m/Y H:i') : ($item->catatan_balasan ? ($item->updated_at ? $item->updated_at->format('d/m/Y H:i') : '-') : '-');
            $penjawab = $item->dijawab_oleh ?? ($item->catatan_balasan ? 'Admin BAPPEDA Halut' : 'Menunggu Respons ' . ($item->skpd_tujuan ?? 'SKPD'));

            $xml .= '   <Row ss:AutoFitHeight="1">' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $styleCenter . '"><Data ss:Type="Number">' . $no . '</Data></Cell>' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $styleCenter . '"><Data ss:Type="String">' . $escape($tglMasuk) . '</Data></Cell>' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $styleLeft . '"><Data ss:Type="String">' . $escape($item->nama) . '</Data></Cell>' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $styleLeft . '"><Data ss:Type="String">' . $escape($item->email) . '</Data></Cell>' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $styleCenter . '"><Data ss:Type="String">' . $escape($item->telepon) . '</Data></Cell>' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $styleLeft . '"><Data ss:Type="String">' . $escape($item->skpd_tujuan) . '</Data></Cell>' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $styleLeft . '"><Data ss:Type="String">' . $escape($item->subjek) . '</Data></Cell>' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $styleLeft . '"><Data ss:Type="String">' . $escape($item->pesan) . '</Data></Cell>' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $statusStyle . '"><Data ss:Type="String">' . $escape($item->status) . '</Data></Cell>' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $styleLeft . '"><Data ss:Type="String">' . $escape($penjawab) . '</Data></Cell>' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $styleLeft . '"><Data ss:Type="String">' . $escape($item->catatan_balasan ?? '(Belum ada tanggapan)') . '</Data></Cell>' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $styleCenter . '"><Data ss:Type="String">' . $escape($tglJawab) . '</Data></Cell>' . "\r\n";
            $xml .= '    <Cell ss:StyleID="' . $styleCenter . '"><Data ss:Type="String">' . $escape($visibilitasLabel) . '</Data></Cell>' . "\r\n";
            $xml .= '   </Row>' . "\r\n";

            $no++;
        }

        $xml .= '  </Table>' . "\r\n";
        $xml .= ' </Worksheet>' . "\r\n";
        $xml .= '</Workbook>';

        return response($xml, 200, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ]);
    }

    public function toggleHide(Request $request, $id)
    {
        $item = Kritik::query()->findOrFail($id);

        if ($request->has('is_hidden')) {
            $item->is_hidden = $request->boolean('is_hidden');
        } else {
            $item->is_hidden = !$item->is_hidden;
        }

        $item->save();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => $item->is_hidden
                ? 'Pesan masukan berhasil disembunyikan dari publik (Filter SARA/Spam).'
                : 'Pesan masukan berhasil ditampilkan kembali ke publik.',
            'data' => $item->fresh(),
        ]);
    }

    public function destroy($id)
    {
        $item = Kritik::query()->findOrFail($id);
        $item->delete();

        return response()->json([
            'status' => 'success',
            'code' => 200,
            'message' => 'Pesan kritik & saran berhasil dihapus.',
        ]);
    }
}
