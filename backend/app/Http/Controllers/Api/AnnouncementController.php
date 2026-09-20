<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Services\HtmlSanitizer;
use App\Services\OfficialPublicationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    public function __construct(
        private readonly HtmlSanitizer $htmlSanitizer,
        private readonly OfficialPublicationService $publicationService
    ) {}

    public function index(Request $request)
    {
        $query = Announcement::query()
            ->with('type')
            ->where('is_published', true)
            ->where(function ($builder): void {
                $builder->whereNull('valid_until')
                    ->orWhereDate('valid_until', '>=', today());
            });
        $this->applyFilters($query, $request);

        return response()->json([
            'success' => true,
            'data' => $query->orderByDesc('is_important')->orderByDesc('published_at')->get(),
        ]);
    }

    public function adminIndex(Request $request)
    {
        $query = Announcement::query()->with('type');
        $this->applyFilters($query, $request);

        return response()->json([
            'success' => true,
            'data' => $query->orderByDesc('is_important')->latest()->get(),
        ]);
    }

    public function show(Announcement $announcement)
    {
        return response()->json([
            'success' => true,
            'data' => $announcement->load('type'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateAnnouncement($request);
        $validated = $this->storeAttachment($request, $validated);
        $publish = (bool) ($validated['is_published'] ?? false);
        unset($validated['is_published']);
        $validated['content'] = $this->htmlSanitizer->sanitize($validated['content'] ?? '');
        $validated['created_by_user_id'] = $request->user()->id;
        $validated['is_published'] = false;

        $announcement = Announcement::create($validated);
        if ($publish) {
            $announcement = $this->publicationService->update(
                $announcement,
                true,
                $request->user()
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil disimpan ke database.',
            'data' => $announcement->load('type'),
        ], 201);
    }

    public function update(Request $request, Announcement $announcement)
    {
        $validated = $this->validateAnnouncement($request, true);
        $validated = $this->storeAttachment($request, $validated, $announcement);
        $publicationChanged = array_key_exists('is_published', $validated);
        $publish = (bool) ($validated['is_published'] ?? false);
        unset($validated['is_published']);

        if (array_key_exists('content', $validated)) {
            $validated['content'] = $this->htmlSanitizer->sanitize($validated['content'] ?? '');
        }

        $announcement->update($validated);
        if ($publicationChanged) {
            $announcement = $this->publicationService->update(
                $announcement,
                $publish,
                $request->user()
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil diperbarui di database.',
            'data' => $announcement->fresh('type'),
        ]);
    }

    public function updatePublication(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'is_published' => 'required|boolean',
        ]);
        $announcement = $this->publicationService->update(
            $announcement,
            $validated['is_published'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => $announcement->is_published
                ? 'Pengumuman berhasil diterbitkan.'
                : 'Pengumuman ditarik menjadi draf.',
            'data' => $announcement->load('type'),
        ]);
    }

    public function destroy(Announcement $announcement)
    {
        if ($announcement->file_path) {
            Storage::disk('local')->delete($announcement->file_path);
        }
        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dihapus dari database.',
        ]);
    }

    public function togglePin(Announcement $announcement)
    {
        $announcement->update([
            'is_important' => !$announcement->is_important,
        ]);

        return response()->json([
            'success' => true,
            'message' => $announcement->is_important
                ? 'Pengumuman berhasil disematkan (PIN) sebagai Pengumuman Resmi Daerah.'
                : 'Sematkan (PIN) pengumuman berhasil dilepas.',
            'data' => $announcement->load('type'),
        ]);
    }

    public function attachment(Request $request, Announcement $announcement)
    {
        $user = auth('sanctum')->user();
        $isAdmin = $user && $user->hasAnyRole(['superadmin', 'admin', 'admin_bidang', 'admin_umum']);

        if (!$isAdmin) {
            abort_unless(
                $announcement->is_published
                && ($announcement->valid_until === null || $announcement->valid_until->isToday() || $announcement->valid_until->isFuture()),
                404
            );
        }

        abort_unless(
            $announcement->file_path
            && Storage::disk('local')->exists($announcement->file_path),
            404
        );

        if ($request->boolean('download')) {
            return Storage::disk('local')->download(
                $announcement->file_path,
                $announcement->original_file_name
            );
        }

        return Storage::disk('local')->response(
            $announcement->file_path,
            $announcement->original_file_name,
            [],
            'inline'
        );
    }

    private function validateAnnouncement(Request $request, bool $updating = false): array
    {
        $required = $updating ? 'sometimes|required' : 'required';

        return $request->validate([
            'announcement_type_id' => "{$required}|integer|exists:announcement_types,id",
            'title' => "{$required}|string|max:255",
            'content' => 'nullable|string|max:100000',
            'is_important' => 'sometimes|boolean',
            'valid_until' => 'nullable|date',
            'is_published' => 'sometimes|boolean',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png,webp,mp4,doc,docx|max:51200',
        ]);
    }

    private function storeAttachment(
        Request $request,
        array $validated,
        ?Announcement $announcement = null
    ): array {
        unset($validated['attachment']);
        if (! $request->hasFile('attachment')) {
            return $validated;
        }

        if ($announcement?->file_path) {
            Storage::disk('local')->delete($announcement->file_path);
        }

        $file = $request->file('attachment');
        $path = $file->store('announcements', 'local');
        $validated['file_path'] = $path;
        $validated['original_file_name'] = $file->getClientOriginalName();
        $validated['file_type'] = $file->getClientMimeType();
        $validated['file_size'] = $file->getSize();

        return $validated;
    }

    private function applyFilters($query, Request $request): void
    {
        if ($request->filled('type_id')) {
            $query->where('announcement_type_id', $request->integer('type_id'));
        }
        if ($request->filled('search')) {
            $search = $request->string('search')->limit(100)->toString();
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }
    }
}
