<?php

namespace Tests\Feature;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;
use Tests\TestCase;

class DatabaseSourceOfTruthTest extends TestCase
{
    /**
     * Browser storage may hold auth/accessibility/upload-resume state, but never
     * official BAPPEDA domain records.
     */
    public function test_official_domain_records_are_not_stored_in_browser_storage(): void
    {
        $forbiddenStorageKeys = [
            'bappeda_agendas',
            'bappeda_agenda_categories',
            'bappeda_announcement_types',
            'bappeda_news_categories',
            'bappeda_survey_questions',
            'bappeda_survey_services',
            'bappeda_public_proyek_details',
            'halut_geoprocessing_history',
        ];

        foreach ($forbiddenStorageKeys as $storageKey) {
            $this->assertSame(
                [],
                $this->frontendFilesContaining($storageKey),
                "Data resmi `{$storageKey}` masih memakai browser storage."
            );
        }
    }

    public function test_esri_failures_do_not_create_mock_official_records(): void
    {
        $service = file_get_contents(app_path('Services/EsriGisService.php'));
        $this->assertIsString($service);
        $this->assertStringNotContainsString("'is_mock' => true", $service);
        $this->assertStringNotContainsString('/mock/arcgis/', $service);
        $this->assertStringNotContainsString('rand(1000, 9999)', $service);
    }

    public function test_public_content_does_not_fall_back_to_mock_records(): void
    {
        foreach ([
            'mockArticle',
            'INITIAL_MOCK_GEOPROCESSING_ANALYSES',
            'using seeded news',
            'Demo fallback mock',
        ] as $forbiddenPattern) {
            $this->assertSame(
                [],
                $this->frontendFilesContaining($forbiddenPattern),
                "Frontend masih mempunyai fallback record palsu: {$forbiddenPattern}"
            );
        }
    }

    /**
     * @return array<int, string>
     */
    private function frontendFilesContaining(string $needle): array
    {
        $matches = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(base_path('../frontend/src'))
        );

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            if (
                ! $file->isFile()
                || ! in_array($file->getExtension(), ['ts', 'tsx'], true)
            ) {
                continue;
            }

            $contents = file_get_contents($file->getPathname());
            if (is_string($contents) && str_contains($contents, $needle)) {
                $matches[] = str_replace(
                    base_path('../frontend/src/'),
                    '',
                    $file->getPathname()
                );
            }
        }

        sort($matches);

        return $matches;
    }
}
