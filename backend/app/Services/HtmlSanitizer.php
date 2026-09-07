<?php

namespace App\Services;

use DOMDocument;
use DOMElement;
use DOMNode;

class HtmlSanitizer
{
    /**
     * Tags required by the dashboard rich-text editor and public readers.
     *
     * @var array<int, string>
     */
    private const ALLOWED_TAGS = [
        'a',
        'b',
        'blockquote',
        'br',
        'code',
        'div',
        'em',
        'figcaption',
        'figure',
        'h2',
        'h3',
        'h4',
        'hr',
        'i',
        'img',
        'li',
        'mark',
        'ol',
        'p',
        'pre',
        's',
        'span',
        'strong',
        'sub',
        'sup',
        'table',
        'tbody',
        'td',
        'th',
        'thead',
        'tr',
        'u',
        'ul',
    ];

    /**
     * Elements whose contents must not survive sanitization.
     *
     * @var array<int, string>
     */
    private const DROP_WITH_CONTENT = [
        'applet',
        'embed',
        'iframe',
        'noscript',
        'object',
        'script',
        'style',
        'template',
    ];

    public function sanitize(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return $html;
        }

        $dom = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $dom->loadHTML(
            '<?xml encoding="UTF-8"><div id="bappeda-sanitizer-root">'.$html.'</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = $dom->getElementById('bappeda-sanitizer-root');
        if (! $root instanceof DOMElement) {
            return '';
        }

        foreach ($this->childrenOf($root) as $child) {
            $this->sanitizeNode($child);
        }

        $safeHtml = '';
        foreach ($this->childrenOf($root) as $child) {
            $safeHtml .= $dom->saveHTML($child);
        }

        return trim($safeHtml);
    }

    private function sanitizeNode(DOMNode $node): void
    {
        if (! $node instanceof DOMElement) {
            return;
        }

        $tag = strtolower($node->tagName);
        if (in_array($tag, self::DROP_WITH_CONTENT, true)) {
            $node->parentNode?->removeChild($node);

            return;
        }

        foreach ($this->childrenOf($node) as $child) {
            $this->sanitizeNode($child);
        }

        if (! in_array($tag, self::ALLOWED_TAGS, true)) {
            $this->unwrap($node);

            return;
        }

        foreach (iterator_to_array($node->attributes ?? []) as $attribute) {
            $name = strtolower($attribute->name);
            if (! $this->attributeIsAllowed($tag, $name, $attribute->value)) {
                $node->removeAttribute($attribute->name);
            }
        }

        if ($tag === 'a' && $node->getAttribute('target') === '_blank') {
            $node->setAttribute('rel', 'noopener noreferrer');
        }

        if ($node->hasAttribute('style')) {
            preg_match('/(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*(?:;|$)/i', $node->getAttribute('style'), $matches);
            if (isset($matches[1])) {
                $node->setAttribute('style', 'text-align: '.strtolower($matches[1]).';');
            } else {
                $node->removeAttribute('style');
            }
        }
    }

    private function attributeIsAllowed(string $tag, string $name, string $value): bool
    {
        if ($name === 'class' || $name === 'style') {
            return true;
        }

        if ($tag === 'a' && $name === 'href') {
            return $this->urlIsSafe($value, ['http', 'https', 'mailto']);
        }

        if ($tag === 'a' && $name === 'target') {
            return in_array($value, ['_blank', '_self'], true);
        }

        if ($tag === 'a' && $name === 'rel') {
            return true;
        }

        if ($tag === 'img' && $name === 'src') {
            return $this->urlIsSafe($value, ['http', 'https']);
        }

        if ($tag === 'img' && in_array($name, ['alt', 'title', 'width', 'height'], true)) {
            return true;
        }

        return in_array($tag, ['td', 'th'], true)
            && in_array($name, ['colspan', 'rowspan'], true)
            && ctype_digit($value);
    }

    /**
     * @param  array<int, string>  $schemes
     */
    private function urlIsSafe(string $value, array $schemes): bool
    {
        $value = trim(html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        if ($value === '' || str_starts_with($value, '/') || str_starts_with($value, '#')) {
            return true;
        }

        $scheme = parse_url($value, PHP_URL_SCHEME);

        return is_string($scheme) && in_array(strtolower($scheme), $schemes, true);
    }

    /**
     * @return array<int, DOMNode>
     */
    private function childrenOf(DOMNode $node): array
    {
        return iterator_to_array($node->childNodes);
    }

    private function unwrap(DOMElement $element): void
    {
        $parent = $element->parentNode;
        if ($parent === null) {
            return;
        }

        while ($element->firstChild !== null) {
            $parent->insertBefore($element->firstChild, $element);
        }

        $parent->removeChild($element);
    }
}
