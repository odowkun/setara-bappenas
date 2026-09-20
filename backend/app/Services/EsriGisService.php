<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EsriGisService
{
    private ?string $featureServiceUrl;

    private ?string $geoprocessingUrl;

    public function __construct()
    {
        $featureUrl = config('services.esri.feature_service_url');
        $geoUrl = config('services.esri.geoprocessing_url');

        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('geo_settings')) {
                $dbSetting = \Illuminate\Support\Facades\DB::table('geo_settings')->first();
                if ($dbSetting) {
                    if (! empty($dbSetting->esri_feature_service_url)) {
                        $featureUrl = $dbSetting->esri_feature_service_url;
                    }
                    if (! empty($dbSetting->esri_geoprocessing_url)) {
                        $geoUrl = $dbSetting->esri_geoprocessing_url;
                    }
                }
            }
        } catch (\Throwable $e) {
            // Fallback to config
        }

        $this->featureServiceUrl = $featureUrl;
        $this->geoprocessingUrl = $geoUrl;
    }

    public function isConfigured(): bool
    {
        return ! empty($this->featureServiceUrl) && ! str_contains($this->featureServiceUrl, 'dummy');
    }

    public function addFeature(array $project): array
    {
        if (! $this->isConfigured()) {
            return $this->notConfigured();
        }

        $payload = [
            'f' => 'json',
            'features' => json_encode([[
                'geometry' => [
                    'x' => (float) $project['longitude'],
                    'y' => (float) $project['latitude'],
                    'spatialReference' => ['wkid' => 4326],
                ],
                'attributes' => [
                    'kode_proyek' => $project['kode_proyek'],
                    'nama_proyek' => $project['nama_proyek'],
                    'bidang' => $project['bidang'] ?? 'infrastruktur',
                    'pagu_anggaran' => (float) ($project['pagu_anggaran'] ?? 0),
                    'persentase_progres' => (int) ($project['persentase_progres'] ?? 0),
                    'status_progres' => $project['status_progres'] ?? 'belum_mulai',
                ],
            ]]),
        ];

        try {
            $response = Http::asForm()->timeout(10)
                ->post(rtrim($this->featureServiceUrl, '/').'/addFeatures', $payload);
            $json = $response->json();
            $objectId = $json['addResults'][0]['objectId'] ?? null;
            if ($response->successful() && $objectId) {
                return ['success' => true, 'objectId' => $objectId, 'raw' => $json];
            }

            return $this->failed('ESRI menolak penambahan feature.', $json);
        } catch (\Throwable $exception) {
            return $this->exceptionResult('addFeatures', $exception);
        }
    }

    public function updateFeature(int $objectId, array $attributes): array
    {
        if (! $this->isConfigured()) {
            return $this->notConfigured();
        }

        try {
            $response = Http::asForm()->timeout(10)
                ->post(rtrim($this->featureServiceUrl, '/').'/updateFeatures', [
                    'f' => 'json',
                    'features' => json_encode([[
                        'attributes' => array_merge(['OBJECTID' => $objectId], $attributes),
                    ]]),
                ]);
            $json = $response->json();
            $success = (bool) ($json['updateResults'][0]['success'] ?? false);

            return $success
                ? ['success' => true, 'raw' => $json]
                : $this->failed('ESRI menolak pembaruan feature.', $json);
        } catch (\Throwable $exception) {
            return $this->exceptionResult('updateFeatures', $exception);
        }
    }

    public function deleteFeature(int $objectId): array
    {
        if (! $this->isConfigured()) {
            return $this->notConfigured();
        }

        try {
            $response = Http::asForm()->timeout(10)
                ->post(rtrim($this->featureServiceUrl, '/').'/deleteFeatures', [
                    'f' => 'json',
                    'objectIds' => $objectId,
                ]);
            $json = $response->json();
            $success = (bool) ($json['deleteResults'][0]['success'] ?? false);

            return $success
                ? ['success' => true, 'raw' => $json]
                : $this->failed('ESRI menolak penghapusan feature.', $json);
        } catch (\Throwable $exception) {
            return $this->exceptionResult('deleteFeatures', $exception);
        }
    }

    public function addAttachment(int $objectId, string $filePath, string $originalName): array
    {
        if (! $this->featureServiceUrl) {
            return $this->notConfigured();
        }

        try {
            $response = Http::timeout(30)
                ->attach('attachment', file_get_contents($filePath), $originalName)
                ->post(rtrim($this->featureServiceUrl, '/')."/{$objectId}/addAttachment", ['f' => 'json']);
            $json = $response->json();
            $attachmentId = $json['addAttachmentResult']['objectId'] ?? null;

            return ($response->successful() && $attachmentId)
                ? ['success' => true, 'attachmentId' => $attachmentId, 'raw' => $json]
                : $this->failed('ESRI menolak lampiran feature.', $json);
        } catch (\Throwable $exception) {
            return $this->exceptionResult('addAttachment', $exception);
        }
    }

    public function executeBuffer(float $lat, float $lng, float $radiusMeters): array
    {
        if ($this->geoprocessingUrl) {
            try {
                $response = Http::asForm()->timeout(15)
                    ->post(rtrim($this->geoprocessingUrl, '/').'/execute', [
                        'f' => 'json',
                        'Input_Features' => json_encode([
                            'type' => 'FeatureCollection',
                            'features' => [[
                                'type' => 'Feature',
                                'geometry' => [
                                    'type' => 'Point',
                                    'coordinates' => [$lng, $lat],
                                ],
                            ]],
                        ]),
                        'Distance' => "{$radiusMeters} Meters",
                    ]);

                if ($response->successful() && $response->json('results')) {
                    return [
                        'success' => true,
                        'source' => 'esri',
                        'geojson' => $response->json(),
                    ];
                }
            } catch (\Throwable $exception) {
                Log::warning('ESRI execute buffer gagal; memakai kalkulasi lokal yang transparan.', [
                    'exception' => $exception->getMessage(),
                ]);
            }
        }

        return [
            'success' => true,
            'source' => 'local_calculation',
            'geojson' => $this->calculateBuffer($lat, $lng, $radiusMeters),
        ];
    }

    private function calculateBuffer(float $lat, float $lng, float $radiusMeters): array
    {
        $coordinates = [];
        $earthRadius = 6378137;
        $latitudeDelta = $radiusMeters / $earthRadius;
        $longitudeDelta = $radiusMeters / ($earthRadius * cos(deg2rad($lat)));

        for ($index = 0; $index <= 64; $index++) {
            $theta = ($index / 64) * 2 * M_PI;
            $coordinates[] = [
                $lng + rad2deg($longitudeDelta * cos($theta)),
                $lat + rad2deg($latitudeDelta * sin($theta)),
            ];
        }

        return [
            'type' => 'FeatureCollection',
            'features' => [[
                'type' => 'Feature',
                'properties' => [
                    'radius_meters' => $radiusMeters,
                    'center' => [$lng, $lat],
                    'calculation' => 'geodesic_approximation',
                ],
                'geometry' => [
                    'type' => 'Polygon',
                    'coordinates' => [$coordinates],
                ],
            ]],
        ];
    }

    private function notConfigured(): array
    {
        return [
            'success' => false,
            'message' => 'Integrasi ESRI belum dikonfigurasi; database tetap menjadi sumber resmi.',
        ];
    }

    private function failed(string $message, mixed $raw = null): array
    {
        return ['success' => false, 'message' => $message, 'raw' => $raw];
    }

    private function exceptionResult(string $operation, \Throwable $exception): array
    {
        Log::warning("ESRI {$operation} gagal.", ['exception' => $exception->getMessage()]);

        return [
            'success' => false,
            'message' => "Sinkronisasi ESRI {$operation} gagal; tidak ada ID palsu yang dibuat.",
        ];
    }
}
