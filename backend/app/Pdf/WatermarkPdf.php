<?php

namespace App\Pdf;

use setasign\Fpdi\Fpdi;

class WatermarkPdf extends Fpdi
{
    protected array $extendedGraphicStates = [];

    protected float $rotationAngle = 0;

    public function setAlpha(float $alpha, string $blendMode = 'Normal'): void
    {
        $alpha = max(0, min(1, $alpha));
        $stateNumber = count($this->extendedGraphicStates) + 1;

        $this->extendedGraphicStates[$stateNumber] = [
            'parameters' => [
                'ca' => $alpha,
                'CA' => $alpha,
                'BM' => '/'.$blendMode,
            ],
        ];

        $this->_out(sprintf('/GS%d gs', $stateNumber));
    }

    public function rotate(float $angle, float $x, float $y): void
    {
        if ($this->rotationAngle !== 0.0) {
            $this->_out('Q');
        }

        $this->rotationAngle = $angle;

        if ($angle === 0.0) {
            return;
        }

        $angleInRadians = $angle * M_PI / 180;
        $cosine = cos($angleInRadians);
        $sine = sin($angleInRadians);
        $scaledX = $x * $this->k;
        $scaledY = ($this->h - $y) * $this->k;

        $this->_out(sprintf(
            'q %.5F %.5F %.5F %.5F %.2F %.2F cm 1 0 0 1 %.2F %.2F cm',
            $cosine,
            $sine,
            -$sine,
            $cosine,
            $scaledX,
            $scaledY,
            -$scaledX,
            -$scaledY
        ));
    }

    protected function _endpage()
    {
        if ($this->rotationAngle !== 0.0) {
            $this->rotationAngle = 0;
            $this->_out('Q');
        }

        parent::_endpage();
    }

    protected function _putresources()
    {
        $this->putExtendedGraphicStates();
        parent::_putresources();
    }

    protected function _putresourcedict()
    {
        parent::_putresourcedict();

        if ($this->extendedGraphicStates === []) {
            return;
        }

        $this->_put('/ExtGState <<');
        foreach ($this->extendedGraphicStates as $stateNumber => $state) {
            $this->_put(sprintf('/GS%d %d 0 R', $stateNumber, $state['object_number']));
        }
        $this->_put('>>');
    }

    protected function _enddoc()
    {
        if ($this->extendedGraphicStates !== [] && $this->PDFVersion < '1.4') {
            $this->PDFVersion = '1.4';
        }

        parent::_enddoc();
    }

    private function putExtendedGraphicStates(): void
    {
        foreach ($this->extendedGraphicStates as $stateNumber => $state) {
            $this->_newobj();
            $this->extendedGraphicStates[$stateNumber]['object_number'] = $this->n;
            $this->_put('<</Type /ExtGState');

            foreach ($state['parameters'] as $key => $value) {
                $this->_put('/'.$key.' '.$value);
            }

            $this->_put('>>');
            $this->_put('endobj');
        }
    }
}
