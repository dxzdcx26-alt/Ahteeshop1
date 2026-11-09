#!/usr/bin/env python3
"""Generate a TSX icon module from downloaded Font Awesome Free SVG files (CC BY 4.0)."""
import os
import re

SRC = "/home/z/my-project/public/icons/fa"
OUT = "/home/z/my-project/src/components/site/fa-icons.tsx"

names = {
    "s-magnifying-glass": "magnifying",
    "s-house": "house",
    "s-store": "store",
    "s-wallet": "wallet",
    "s-grip": "grip",
    "s-chevron-down": "chevron",
    "s-moon": "moon",
    "s-sun": "sun",
    "s-bars": "bars",
    "s-users": "users",
    "s-layer-group": "layers",
    "s-box": "box",
    "s-bag-shopping": "bag",
    "s-bullhorn": "bullhorn",
    "s-arrow-right": "arrowRight",
    "s-cart-shopping": "cart",
    "s-crown": "crown",
    "s-gift": "gift",
    "s-phone": "phone",
    "s-dharmachakra": "wheel",
    "s-turn-down-left": "turnDown",
    "s-xmark": "xmark",
    "r-copyright": "copyright",
    "b-facebook": "facebook",
    "b-discord": "discord",
    "s-right-from-bracket": "logout",
    "s-clock-rotate-left": "history",
    "s-shield-halved": "shield",
    "s-circle-user": "circleUser",
}

entries = []
for fname, key in names.items():
    path = os.path.join(SRC, fname + ".svg")
    if not os.path.exists(path):
        print("missing:", fname)
        continue
    svg = open(path).read()
    vb = re.search(r'viewBox="([^"]+)"', svg).group(1)
    d = re.search(r'\bd="([^"]+)"', svg)
    if not d:
        # some brand icons may have multiple paths
        paths = re.findall(r"<path[^>]*\bd=\"([^\"]+)\"", svg)
        dstr = "".join(paths)
    else:
        dstr = d.group(1)
    dstr = dstr.replace("\n", " ").strip()
    entries.append(f'  {key}: {{ vb: "{vb}", d: "{dstr}" }},')

tsx = """// Font Awesome Free icons (CC BY 4.0) — https://fontawesome.com/license/free
// Generated from @fortawesome/fontawesome-free 6.5.2 SVG sources.
import React from "react";

const ICONS: Record<string, { vb: string; d: string }> = {
%s
};

export type FaName = keyof typeof ICONS & string;

export function Fa({
  n,
  size = 16,
  className,
  style,
}: {
  n: FaName;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ic = ICONS[n];
  if (!ic) return null;
  return (
    <svg
      viewBox={ic.vb}
      width={size}
      height={size}
      className={className}
      style={style}
      fill="currentColor"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: `<path d="${ic.d}"/>` }}
    />
  );
}
""" % ("\n".join(entries))

open(OUT, "w").write(tsx)
print("written", OUT, len(tsx), "bytes,", len(entries), "icons")
