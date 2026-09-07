<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->getRoleNames()->first() ?? $this->role,
            'bidang' => $this->bidang,
            'nip' => $this->nip,
            'jabatan' => $this->jabatan,
            'permissions' => $this->getAllPermissions()
                ->pluck('name')
                ->sort()
                ->values(),
            'allowedDocumentPermissions' => $this->allowed_document_permissions ?? [],
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
