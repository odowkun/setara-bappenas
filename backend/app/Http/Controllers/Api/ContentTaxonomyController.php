<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AgendaCategory;
use App\Models\AnnouncementType;
use App\Models\News;
use App\Models\NewsCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ContentTaxonomyController extends Controller
{
    public function agendaCategories()
    {
        return $this->success(
            AgendaCategory::query()->where('is_active', true)->orderBy('name')->get()
        );
    }

    public function storeAgendaCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:agenda_categories,name',
            'color' => 'nullable|string|max:50',
        ]);

        return $this->created(AgendaCategory::create($validated));
    }

    public function destroyAgendaCategory(AgendaCategory $agendaCategory)
    {
        if ($agendaCategory->agendas()->exists()) {
            $agendaCategory->update(['is_active' => false]);

            return $this->success($agendaCategory, 'Kategori dinonaktifkan karena sudah dipakai agenda.');
        }
        $agendaCategory->delete();

        return $this->success(null, 'Kategori agenda dihapus.');
    }

    public function announcementTypes()
    {
        return $this->success(
            AnnouncementType::query()->where('is_active', true)->orderBy('name')->get()
        );
    }

    public function storeAnnouncementType(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:announcement_types,name',
        ]);

        return $this->created(AnnouncementType::create($validated));
    }

    public function destroyAnnouncementType(AnnouncementType $announcementType)
    {
        if ($announcementType->announcements()->exists()) {
            $announcementType->update(['is_active' => false]);

            return $this->success($announcementType, 'Tipe dinonaktifkan karena sudah dipakai pengumuman.');
        }
        $announcementType->delete();

        return $this->success(null, 'Tipe pengumuman dihapus.');
    }

    public function newsCategories()
    {
        return $this->success(
            NewsCategory::query()->where('is_active', true)->orderBy('name')->get()
        );
    }

    public function storeNewsCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:news_categories,name',
        ]);
        $slug = Str::slug($validated['name']);
        if (NewsCategory::query()->where('slug', $slug)->exists()) {
            throw ValidationException::withMessages(['name' => 'Slug kategori sudah digunakan.']);
        }

        return $this->created(NewsCategory::create([
            'name' => $validated['name'],
            'slug' => $slug,
        ]));
    }

    public function destroyNewsCategory(NewsCategory $newsCategory)
    {
        if (News::query()->where('category', $newsCategory->name)->exists()) {
            $newsCategory->update(['is_active' => false]);

            return $this->success($newsCategory, 'Kategori dinonaktifkan karena sudah dipakai berita.');
        }
        $newsCategory->delete();

        return $this->success(null, 'Kategori berita dihapus.');
    }

    private function success($data, ?string $message = null)
    {
        return response()->json(array_filter([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], fn ($value) => $value !== null));
    }

    private function created($data)
    {
        return response()->json([
            'success' => true,
            'message' => 'Master data berhasil disimpan ke database.',
            'data' => $data,
        ], 201);
    }
}
