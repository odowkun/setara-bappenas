<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agenda;
use App\Services\OfficialPublicationService;
use Illuminate\Http\Request;

class AgendaController extends Controller
{
    public function __construct(
        private readonly OfficialPublicationService $publicationService
    ) {}

    public function index(Request $request)
    {
        $query = Agenda::query()->with('category')->where('is_published', true);
        $this->applyFilters($query, $request);

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('start_at')->get(),
        ]);
    }

    public function adminIndex(Request $request)
    {
        $query = Agenda::query()->with('category');
        $this->applyFilters($query, $request);

        return response()->json([
            'success' => true,
            'data' => $query->orderByDesc('start_at')->get(),
        ]);
    }

    public function show(Agenda $agenda)
    {
        return response()->json([
            'success' => true,
            'data' => $agenda->load('category'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateAgenda($request);
        $publish = (bool) ($validated['is_published'] ?? false);
        unset($validated['is_published']);
        $validated['created_by_user_id'] = $request->user()->id;
        $validated['is_published'] = false;

        $agenda = Agenda::create($validated);
        if ($publish) {
            $agenda = $this->publicationService->update($agenda, true, $request->user());
        }

        return response()->json([
            'success' => true,
            'message' => 'Agenda berhasil disimpan ke database.',
            'data' => $agenda->load('category'),
        ], 201);
    }

    public function update(Request $request, Agenda $agenda)
    {
        $validated = $this->validateAgenda($request, true);
        $publicationChanged = array_key_exists('is_published', $validated);
        $publish = (bool) ($validated['is_published'] ?? false);
        unset($validated['is_published']);

        $agenda->update($validated);
        if ($publicationChanged) {
            $agenda = $this->publicationService->update($agenda, $publish, $request->user());
        }

        return response()->json([
            'success' => true,
            'message' => 'Agenda berhasil diperbarui di database.',
            'data' => $agenda->fresh('category'),
        ]);
    }

    public function updatePublication(Request $request, Agenda $agenda)
    {
        $validated = $request->validate([
            'is_published' => 'required|boolean',
        ]);
        $agenda = $this->publicationService->update(
            $agenda,
            $validated['is_published'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => $agenda->is_published
                ? 'Agenda berhasil diterbitkan.'
                : 'Agenda ditarik menjadi draf.',
            'data' => $agenda->load('category'),
        ]);
    }

    public function destroy(Agenda $agenda)
    {
        $agenda->delete();

        return response()->json([
            'success' => true,
            'message' => 'Agenda berhasil dihapus dari database.',
        ]);
    }

    private function validateAgenda(Request $request, bool $updating = false): array
    {
        $required = $updating ? 'sometimes|required' : 'required';

        return $request->validate([
            'agenda_category_id' => "{$required}|integer|exists:agenda_categories,id",
            'title' => "{$required}|string|max:255",
            'start_at' => "{$required}|date",
            'end_at' => "{$required}|date|after_or_equal:start_at",
            'location' => 'nullable|string|max:255',
            'organizer' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:10000',
            'color' => 'nullable|string|max:50',
            'map_url' => 'nullable|url|max:2048',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_published' => 'sometimes|boolean',
        ]);
    }

    private function applyFilters($query, Request $request): void
    {
        if ($request->filled('category_id')) {
            $query->where('agenda_category_id', $request->integer('category_id'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->limit(100)->toString();
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('organizer', 'like', "%{$search}%");
            });
        }
    }
}
