<?php

namespace App\Services;

use App\Models\Agenda;
use App\Models\Announcement;
use App\Models\Document;
use App\Models\Galeri;
use App\Models\News;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OfficialPublicationService
{
    public function update(Model $content, bool $published, User $actor): Model
    {
        if ($published) {
            $this->assertPublishable($content);
        }

        $content->forceFill([
            $content instanceof Document ? 'is_public' : 'is_published' => $published,
            'published_at' => $published ? now() : null,
            'published_by_user_id' => $published ? $actor->id : null,
        ])->save();

        return $content->fresh();
    }

    private function assertPublishable(Model $content): void
    {
        $message = match (true) {
            $content instanceof News && blank($content->content) => 'Berita belum mempunyai isi dan tidak dapat diterbitkan.',
            $content instanceof Agenda && (
                blank($content->title)
                || blank($content->start_at)
                || blank($content->end_at)
                || blank($content->agenda_category_id)
            ) => 'Agenda belum lengkap dan tidak dapat diterbitkan.',
            $content instanceof Announcement && (
                blank($content->title)
                || blank($content->announcement_type_id)
                || (blank($content->content) && blank($content->file_path))
            ) => 'Pengumuman memerlukan isi atau lampiran sebelum diterbitkan.',
            $content instanceof Galeri && (
                blank($content->title)
                || blank($content->event_date)
                || blank($content->cover_image)
                || empty($content->media)
            ) => 'Galeri memerlukan judul, tanggal, sampul, dan media sebelum diterbitkan.',
            $content instanceof Document => $this->documentPublicationError($content),
            default => null,
        };

        if ($message !== null) {
            throw ValidationException::withMessages([
                'publication' => $message,
            ]);
        }
    }

    private function documentPublicationError(Document $document): ?string
    {
        $document->load('currentVersion');
        $version = $document->currentVersion;

        return match (true) {
            blank($document->title) || blank($document->jenis) =>
                'Metadata dokumen belum lengkap dan tidak dapat diterbitkan.',
            $document->classification !== 'public' =>
                'Hanya dokumen dengan klasifikasi publik yang dapat diterbitkan.',
            $document->governance_status !== 'approved' =>
                'Dokumen harus melewati review dan persetujuan resmi sebelum diterbitkan.',
            $document->storage_status !== 'private' =>
                'Berkas lama harus dimigrasikan ke storage privat sebelum diterbitkan.',
            $version === null || $version->status !== 'approved' =>
                'Versi aktif yang disetujui belum tersedia.',
            $version->integrity_status !== 'valid' =>
                'Checksum versi aktif belum valid.',
            blank($version->file_path)
                || ! Storage::disk('local')->exists($version->file_path) =>
                'Berkas versi aktif tidak ditemukan pada storage privat.',
            hash_file(
                'sha256',
                Storage::disk('local')->path($version->file_path)
            ) !== $version->checksum_sha256 =>
                'Checksum berkas berubah. Dokumen ditahan dari publikasi.',
            default => null,
        };
    }
}
