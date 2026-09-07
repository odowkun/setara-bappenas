<?php

namespace App\Jobs;

use App\Models\ProyekDetail;
use App\Services\EsriGisService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncEsriProjectJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [10, 30, 60];

    public ProyekDetail $proyek;

    public string $action;

    /**
     * Create a new job instance.
     */
    public function __construct(ProyekDetail $proyek, string $action = 'add')
    {
        $this->proyek = $proyek;
        $this->action = $action;
    }

    /**
     * Execute the job.
     */
    public function handle(EsriGisService $esriService): void
    {
        Log::info("Starting SyncEsriProjectJob for Project ID #{$this->proyek->id} [{$this->action}]");

        try {
            if ($this->action === 'add' || ($this->action === 'update' && ! $this->proyek->esri_objectid)) {
                $response = $esriService->addFeature([
                    'kode_proyek' => $this->proyek->kode_proyek,
                    'nama_proyek' => $this->proyek->nama_proyek,
                    'bidang' => $this->proyek->bidang,
                    'latitude' => $this->proyek->latitude,
                    'longitude' => $this->proyek->longitude,
                    'pagu_anggaran' => $this->proyek->pagu_anggaran,
                    'persentase_progres' => $this->proyek->persentase_progres,
                    'status_progres' => $this->proyek->status_progres,
                ]);

                if (($response['success'] ?? false) && isset($response['objectId'])) {
                    $this->proyek->update([
                        'esri_objectid' => $response['objectId'],
                        'esri_sync_status' => 'synced',
                        'esri_synced_at' => now(),
                        'esri_last_error' => null,
                    ]);
                    Log::info("SyncEsriProjectJob ADD success for Project ID #{$this->proyek->id}, OBJECTID: {$response['objectId']}");
                } else {
                    $errorMsg = $response['message'] ?? 'ESRI FeatureServer addFeature failed';
                    $this->proyek->update([
                        'esri_sync_status' => 'failed',
                        'esri_last_error' => $errorMsg,
                    ]);
                    Log::warning("SyncEsriProjectJob ADD failed for Project ID #{$this->proyek->id}: {$errorMsg}");
                }
            } elseif ($this->action === 'update' && $this->proyek->esri_objectid) {
                $response = $esriService->updateFeature((int) $this->proyek->esri_objectid, [
                    'persentase_progres' => $this->proyek->persentase_progres,
                    'status_progres' => $this->proyek->status_progres,
                    'realisasi_anggaran' => (float) $this->proyek->realisasi_anggaran,
                ]);

                if ($response['success'] ?? false) {
                    $this->proyek->update([
                        'esri_sync_status' => 'synced',
                        'esri_synced_at' => now(),
                        'esri_last_error' => null,
                    ]);
                    Log::info("SyncEsriProjectJob UPDATE success for Project ID #{$this->proyek->id}");
                } else {
                    $errorMsg = $response['message'] ?? 'ESRI FeatureServer updateFeature failed';
                    $this->proyek->update([
                        'esri_sync_status' => 'failed',
                        'esri_last_error' => $errorMsg,
                    ]);
                    Log::warning("SyncEsriProjectJob UPDATE failed for Project ID #{$this->proyek->id}: {$errorMsg}");
                }
            } elseif ($this->action === 'delete' && $this->proyek->esri_objectid) {
                $esriService->deleteFeature((int) $this->proyek->esri_objectid);
            }
        } catch (\Throwable $e) {
            $this->proyek->update([
                'esri_sync_status' => 'failed',
                'esri_last_error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        $this->proyek->update([
            'esri_sync_status' => 'failed',
            'esri_last_error' => 'Exhausted 3 retries: '.$exception->getMessage(),
        ]);
    }
}
