import L from "leaflet";

/**
 * Global Leaflet Defensive Monkey-Patch
 * Prevents "Cannot read properties of undefined (reading 'classList')" crashes
 * during map unmounting, pan transitions, zoom operations, or fast page transitions in Next.js.
 */
if (typeof window !== "undefined" && L) {
  // 1. Fix default marker icon asset URLs in Next.js Webpack bundler
  try {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  } catch (err) {
    console.warn("Leaflet default icon patch warning:", err);
  }

  // 2. Patch DomUtil methods against undefined/null element access
  if (L.DomUtil) {
    const origAddClass = L.DomUtil.addClass;
    const origRemoveClass = L.DomUtil.removeClass;
    const origHasClass = L.DomUtil.hasClass;
    const origSetClass = L.DomUtil.setClass;

    L.DomUtil.addClass = function (el: any, name: string) {
      if (!el || !el.classList) return;
      return origAddClass.call(this, el, name);
    };

    L.DomUtil.removeClass = function (el: any, name: string) {
      if (!el || !el.classList) return;
      return origRemoveClass.call(this, el, name);
    };

    L.DomUtil.hasClass = function (el: any, name: string) {
      if (!el || !el.classList) return false;
      return origHasClass.call(this, el, name);
    };

    if (origSetClass) {
      L.DomUtil.setClass = function (el: any, name: string) {
        if (!el) return;
        return origSetClass.call(this, el, name);
      };
    }
  }

  // 3. Patch Map.prototype._onPanTransitionEnd
  // When a map is being removed or unmounted while panning, _onPanTransitionEnd
  // calls internal `removeClass(this._mapPane, 'leaflet-pan-anim')`.
  // Leaflet's internal removeClass checks `if (el.classList !== undefined)`.
  // When `map.remove()` runs, `this._mapPane` is deleted, throwing:
  // "Cannot read properties of undefined (reading 'classList')".
  if (L.Map && L.Map.prototype) {
    const origPanTransitionEnd = (L.Map.prototype as any)._onPanTransitionEnd;
    if (origPanTransitionEnd) {
      (L.Map.prototype as any)._onPanTransitionEnd = function () {
        if (!this || !this._mapPane) {
          try {
            this.fire("moveend");
          } catch {}
          return;
        }
        return origPanTransitionEnd.call(this);
      };
    }

    const origStop = (L.Map.prototype as any)._stop;
    if (origStop) {
      (L.Map.prototype as any)._stop = function () {
        try {
          if (this._panAnim) {
            this._panAnim.stop();
          }
        } catch {}
        return origStop.call(this);
      };
    }
  }

  // 4. Patch Control.Zoom._updateDisabled
  if ((L.Control as any)?.Zoom?.prototype) {
    const origUpdateDisabled = (L.Control as any).Zoom.prototype._updateDisabled;
    if (origUpdateDisabled) {
      (L.Control as any).Zoom.prototype._updateDisabled = function () {
        if (!this._zoomInButton || !this._zoomOutButton || !this._map) return;
        return origUpdateDisabled.call(this);
      };
    }
  }
}

export default L;
