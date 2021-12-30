(SVGPathElement.prototype.getPathData && SVGPathElement.prototype.setPathData) ||
    (function () {
        var e = {
                Z: "Z",
                M: "M",
                L: "L",
                C: "C",
                Q: "Q",
                A: "A",
                H: "H",
                V: "V",
                S: "S",
                T: "T",
                z: "Z",
                m: "m",
                l: "l",
                c: "c",
                q: "q",
                a: "a",
                h: "h",
                v: "v",
                s: "s",
                t: "t",
            },
            t = function (e) {
                (this._string = e),
                    (this._currentIndex = 0),
                    (this._endIndex = this._string.length),
                    (this._prevCommand = null),
                    this._skipOptionalSpaces();
            },
            s = -1 !== window.navigator.userAgent.indexOf("MSIE ");
        t.prototype = {
            parseSegment: function () {
                var t = this._string[this._currentIndex],
                    s = e[t] ? e[t] : null;
                if (null === s) {
                    if (null === this._prevCommand) return null;
                    if (
                        null ===
                        (s =
                            ("+" === t || "-" === t || "." === t || (t >= "0" && t <= "9")) &&
                            "Z" !== this._prevCommand
                                ? "M" === this._prevCommand
                                    ? "L"
                                    : "m" === this._prevCommand
                                    ? "l"
                                    : this._prevCommand
                                : null)
                    )
                        return null;
                } else this._currentIndex += 1;
                this._prevCommand = s;
                var a = null,
                    r = s.toUpperCase();
                return (
                    "H" === r || "V" === r
                        ? (a = [this._parseNumber()])
                        : "M" === r || "L" === r || "T" === r
                        ? (a = [this._parseNumber(), this._parseNumber()])
                        : "S" === r || "Q" === r
                        ? (a = [
                              this._parseNumber(),
                              this._parseNumber(),
                              this._parseNumber(),
                              this._parseNumber(),
                          ])
                        : "C" === r
                        ? (a = [
                              this._parseNumber(),
                              this._parseNumber(),
                              this._parseNumber(),
                              this._parseNumber(),
                              this._parseNumber(),
                              this._parseNumber(),
                          ])
                        : "A" === r
                        ? (a = [
                              this._parseNumber(),
                              this._parseNumber(),
                              this._parseNumber(),
                              this._parseArcFlag(),
                              this._parseArcFlag(),
                              this._parseNumber(),
                              this._parseNumber(),
                          ])
                        : "Z" === r && (this._skipOptionalSpaces(), (a = [])),
                    null === a || a.indexOf(null) >= 0 ? null : { type: s, values: a }
                );
            },
            hasMoreData: function () {
                return this._currentIndex < this._endIndex;
            },
            peekSegmentType: function () {
                var t = this._string[this._currentIndex];
                return e[t] ? e[t] : null;
            },
            initialCommandIsMoveTo: function () {
                if (!this.hasMoreData()) return !0;
                var e = this.peekSegmentType();
                return "M" === e || "m" === e;
            },
            _isCurrentSpace: function () {
                var e = this._string[this._currentIndex];
                return (
                    e <= " " && (" " === e || "\n" === e || "\t" === e || "\r" === e || "\f" === e)
                );
            },
            _skipOptionalSpaces: function () {
                for (; this._currentIndex < this._endIndex && this._isCurrentSpace(); )
                    this._currentIndex += 1;
                return this._currentIndex < this._endIndex;
            },
            _skipOptionalSpacesOrDelimiter: function () {
                return (
                    !(
                        this._currentIndex < this._endIndex &&
                        !this._isCurrentSpace() &&
                        "," !== this._string[this._currentIndex]
                    ) &&
                    (this._skipOptionalSpaces() &&
                        this._currentIndex < this._endIndex &&
                        "," === this._string[this._currentIndex] &&
                        ((this._currentIndex += 1), this._skipOptionalSpaces()),
                    this._currentIndex < this._endIndex)
                );
            },
            _parseNumber: function () {
                var e = 0,
                    t = 0,
                    s = 1,
                    a = 0,
                    r = 1,
                    n = 1,
                    u = this._currentIndex;
                if (
                    (this._skipOptionalSpaces(),
                    this._currentIndex < this._endIndex && "+" === this._string[this._currentIndex]
                        ? (this._currentIndex += 1)
                        : this._currentIndex < this._endIndex &&
                          "-" === this._string[this._currentIndex] &&
                          ((this._currentIndex += 1), (r = -1)),
                    this._currentIndex === this._endIndex ||
                        ((this._string[this._currentIndex] < "0" ||
                            this._string[this._currentIndex] > "9") &&
                            "." !== this._string[this._currentIndex]))
                )
                    return null;
                for (
                    var i = this._currentIndex;
                    this._currentIndex < this._endIndex &&
                    this._string[this._currentIndex] >= "0" &&
                    this._string[this._currentIndex] <= "9";

                )
                    this._currentIndex += 1;
                if (this._currentIndex !== i)
                    for (var l = this._currentIndex - 1, h = 1; l >= i; )
                        (t += h * (this._string[l] - "0")), (l -= 1), (h *= 10);
                if (
                    this._currentIndex < this._endIndex &&
                    "." === this._string[this._currentIndex]
                ) {
                    if (
                        ((this._currentIndex += 1),
                        this._currentIndex >= this._endIndex ||
                            this._string[this._currentIndex] < "0" ||
                            this._string[this._currentIndex] > "9")
                    )
                        return null;
                    for (
                        ;
                        this._currentIndex < this._endIndex &&
                        this._string[this._currentIndex] >= "0" &&
                        this._string[this._currentIndex] <= "9";

                    )
                        (s *= 10),
                            (a += (this._string.charAt(this._currentIndex) - "0") / s),
                            (this._currentIndex += 1);
                }
                if (
                    this._currentIndex !== u &&
                    this._currentIndex + 1 < this._endIndex &&
                    ("e" === this._string[this._currentIndex] ||
                        "E" === this._string[this._currentIndex]) &&
                    "x" !== this._string[this._currentIndex + 1] &&
                    "m" !== this._string[this._currentIndex + 1]
                ) {
                    if (
                        ((this._currentIndex += 1),
                        "+" === this._string[this._currentIndex]
                            ? (this._currentIndex += 1)
                            : "-" === this._string[this._currentIndex] &&
                              ((this._currentIndex += 1), (n = -1)),
                        this._currentIndex >= this._endIndex ||
                            this._string[this._currentIndex] < "0" ||
                            this._string[this._currentIndex] > "9")
                    )
                        return null;
                    for (
                        ;
                        this._currentIndex < this._endIndex &&
                        this._string[this._currentIndex] >= "0" &&
                        this._string[this._currentIndex] <= "9";

                    )
                        (e *= 10),
                            (e += this._string[this._currentIndex] - "0"),
                            (this._currentIndex += 1);
                }
                var v = t + a;
                return (
                    (v *= r),
                    e && (v *= Math.pow(10, n * e)),
                    u === this._currentIndex ? null : (this._skipOptionalSpacesOrDelimiter(), v)
                );
            },
            _parseArcFlag: function () {
                if (this._currentIndex >= this._endIndex) return null;
                var e = null,
                    t = this._string[this._currentIndex];
                if (((this._currentIndex += 1), "0" === t)) e = 0;
                else {
                    if ("1" !== t) return null;
                    e = 1;
                }
                return this._skipOptionalSpacesOrDelimiter(), e;
            },
        };
        var a = function (e) {
                if (!e || 0 === e.length) return [];
                var s = new t(e),
                    a = [];
                if (s.initialCommandIsMoveTo())
                    for (; s.hasMoreData(); ) {
                        var r = s.parseSegment();
                        if (null === r) break;
                        a.push(r);
                    }
                return a;
            },
            r = SVGPathElement.prototype.setAttribute,
            n = SVGPathElement.prototype.removeAttribute,
            u = window.Symbol ? Symbol() : "__cachedPathData",
            i = window.Symbol ? Symbol() : "__cachedNormalizedPathData",
            l = function (e, t, s, a, r, n, u, i, h, v) {
                var p,
                    _,
                    c,
                    o,
                    d,
                    y = function (e, t, s) {
                        return {
                            x: e * Math.cos(s) - t * Math.sin(s),
                            y: e * Math.sin(s) + t * Math.cos(s),
                        };
                    },
                    x = ((p = u), (Math.PI * p) / 180),
                    I = [];
                if (v) (_ = v[0]), (c = v[1]), (o = v[2]), (d = v[3]);
                else {
                    var f = y(e, t, -x);
                    (e = f.x), (t = f.y);
                    var m = y(s, a, -x),
                        g = (e - (s = m.x)) / 2,
                        b = (t - (a = m.y)) / 2,
                        M = (g * g) / (r * r) + (b * b) / (n * n);
                    M > 1 && ((r *= M = Math.sqrt(M)), (n *= M));
                    var S = r * r,
                        V = n * n,
                        A = S * V - S * b * b - V * g * g,
                        P = S * b * b + V * g * g,
                        C = (i === h ? -1 : 1) * Math.sqrt(Math.abs(A / P));
                    (o = (C * r * b) / n + (e + s) / 2),
                        (d = (C * -n * g) / r + (t + a) / 2),
                        (_ = Math.asin(parseFloat(((t - d) / n).toFixed(9)))),
                        (c = Math.asin(parseFloat(((a - d) / n).toFixed(9)))),
                        e < o && (_ = Math.PI - _),
                        s < o && (c = Math.PI - c),
                        _ < 0 && (_ = 2 * Math.PI + _),
                        c < 0 && (c = 2 * Math.PI + c),
                        h && _ > c && (_ -= 2 * Math.PI),
                        !h && c > _ && (c -= 2 * Math.PI);
                }
                var E = c - _;
                if (Math.abs(E) > (120 * Math.PI) / 180) {
                    var N = c,
                        D = s,
                        O = a;
                    (c =
                        h && c > _
                            ? _ + ((120 * Math.PI) / 180) * 1
                            : _ + ((120 * Math.PI) / 180) * -1),
                        (s = o + r * Math.cos(c)),
                        (a = d + n * Math.sin(c)),
                        (I = l(s, a, D, O, r, n, u, 0, h, [c, N, o, d]));
                }
                E = c - _;
                var L = Math.cos(_),
                    G = Math.sin(_),
                    k = Math.cos(c),
                    T = Math.sin(c),
                    Z = Math.tan(E / 4),
                    w = (4 / 3) * r * Z,
                    H = (4 / 3) * n * Z,
                    Q = [e, t],
                    z = [e + w * G, t - H * L],
                    F = [s + w * T, a - H * k],
                    q = [s, a];
                if (((z[0] = 2 * Q[0] - z[0]), (z[1] = 2 * Q[1] - z[1]), v))
                    return [z, F, q].concat(I);
                I = [z, F, q].concat(I);
                for (var j = [], R = 0; R < I.length; R += 3) {
                    (r = y(I[R][0], I[R][1], x)), (n = y(I[R + 1][0], I[R + 1][1], x));
                    var U = y(I[R + 2][0], I[R + 2][1], x);
                    j.push([r.x, r.y, n.x, n.y, U.x, U.y]);
                }
                return j;
            },
            h = function (e) {
                return e.map(function (e) {
                    return { type: e.type, values: Array.prototype.slice.call(e.values) };
                });
            },
            v = function (e) {
                var t = [],
                    s = null,
                    a = null,
                    r = null,
                    n = null,
                    u = null,
                    i = null,
                    h = null;
                return (
                    e.forEach(function (e) {
                        if ("M" === e.type) {
                            var v = e.values[0],
                                p = e.values[1];
                            t.push({ type: "M", values: [v, p] }),
                                (i = v),
                                (h = p),
                                (n = v),
                                (u = p);
                        } else if ("C" === e.type) {
                            var _ = e.values[0],
                                c = e.values[1],
                                o = e.values[2],
                                d = e.values[3];
                            (v = e.values[4]), (p = e.values[5]);
                            t.push({ type: "C", values: [_, c, o, d, v, p] }),
                                (a = o),
                                (r = d),
                                (n = v),
                                (u = p);
                        } else if ("L" === e.type) {
                            (v = e.values[0]), (p = e.values[1]);
                            t.push({ type: "L", values: [v, p] }), (n = v), (u = p);
                        } else if ("H" === e.type) {
                            v = e.values[0];
                            t.push({ type: "L", values: [v, u] }), (n = v);
                        } else if ("V" === e.type) {
                            p = e.values[0];
                            t.push({ type: "L", values: [n, p] }), (u = p);
                        } else if ("S" === e.type) {
                            (o = e.values[0]),
                                (d = e.values[1]),
                                (v = e.values[2]),
                                (p = e.values[3]);
                            "C" === s || "S" === s
                                ? ((y = n + (n - a)), (x = u + (u - r)))
                                : ((y = n), (x = u)),
                                t.push({ type: "C", values: [y, x, o, d, v, p] }),
                                (a = o),
                                (r = d),
                                (n = v),
                                (u = p);
                        } else if ("T" === e.type) {
                            (v = e.values[0]), (p = e.values[1]);
                            "Q" === s || "T" === s
                                ? ((_ = n + (n - a)), (c = u + (u - r)))
                                : ((_ = n), (c = u));
                            var y = n + (2 * (_ - n)) / 3,
                                x = u + (2 * (c - u)) / 3,
                                I = v + (2 * (_ - v)) / 3,
                                f = p + (2 * (c - p)) / 3;
                            t.push({ type: "C", values: [y, x, I, f, v, p] }),
                                (a = _),
                                (r = c),
                                (n = v),
                                (u = p);
                        } else if ("Q" === e.type) {
                            (_ = e.values[0]),
                                (c = e.values[1]),
                                (v = e.values[2]),
                                (p = e.values[3]),
                                (y = n + (2 * (_ - n)) / 3),
                                (x = u + (2 * (c - u)) / 3),
                                (I = v + (2 * (_ - v)) / 3),
                                (f = p + (2 * (c - p)) / 3);
                            t.push({ type: "C", values: [y, x, I, f, v, p] }),
                                (a = _),
                                (r = c),
                                (n = v),
                                (u = p);
                        } else if ("A" === e.type) {
                            var m = Math.abs(e.values[0]),
                                g = Math.abs(e.values[1]),
                                b = e.values[2],
                                M = e.values[3],
                                S = e.values[4];
                            (v = e.values[5]), (p = e.values[6]);
                            if (0 === m || 0 === g)
                                t.push({ type: "C", values: [n, u, v, p, v, p] }), (n = v), (u = p);
                            else if (n !== v || u !== p)
                                l(n, u, v, p, m, g, b, M, S).forEach(function (e) {
                                    t.push({ type: "C", values: e });
                                }),
                                    (n = v),
                                    (u = p);
                        } else "Z" === e.type && (t.push(e), (n = i), (u = h));
                        s = e.type;
                    }),
                    t
                );
            };
        (SVGPathElement.prototype.setAttribute = function (e, t) {
            "d" === e && ((this[u] = null), (this[i] = null)), r.call(this, e, t);
        }),
            (SVGPathElement.prototype.removeAttribute = function (e, t) {
                "d" === e && ((this[u] = null), (this[i] = null)), n.call(this, e);
            }),
            (SVGPathElement.prototype.getPathData = function (e) {
                if (e && e.normalize) {
                    if (this[i]) return h(this[i]);
                    this[u]
                        ? (_ = h(this[u]))
                        : ((_ = a(this.getAttribute("d") || "")), (this[u] = h(_)));
                    var t = v(
                        ((s = []),
                        (r = null),
                        (n = null),
                        (l = null),
                        (p = null),
                        _.forEach(function (e) {
                            var t = e.type;
                            if ("M" === t) {
                                var a = e.values[0],
                                    u = e.values[1];
                                s.push({ type: "M", values: [a, u] }),
                                    (l = a),
                                    (p = u),
                                    (r = a),
                                    (n = u);
                            } else if ("m" === t)
                                (a = r + e.values[0]),
                                    (u = n + e.values[1]),
                                    s.push({ type: "M", values: [a, u] }),
                                    (l = a),
                                    (p = u),
                                    (r = a),
                                    (n = u);
                            else if ("L" === t)
                                (a = e.values[0]),
                                    (u = e.values[1]),
                                    s.push({ type: "L", values: [a, u] }),
                                    (r = a),
                                    (n = u);
                            else if ("l" === t)
                                (a = r + e.values[0]),
                                    (u = n + e.values[1]),
                                    s.push({ type: "L", values: [a, u] }),
                                    (r = a),
                                    (n = u);
                            else if ("C" === t) {
                                var i = e.values[0],
                                    h = e.values[1],
                                    v = e.values[2],
                                    _ = e.values[3];
                                (a = e.values[4]),
                                    (u = e.values[5]),
                                    s.push({ type: "C", values: [i, h, v, _, a, u] }),
                                    (r = a),
                                    (n = u);
                            } else
                                "c" === t
                                    ? ((i = r + e.values[0]),
                                      (h = n + e.values[1]),
                                      (v = r + e.values[2]),
                                      (_ = n + e.values[3]),
                                      (a = r + e.values[4]),
                                      (u = n + e.values[5]),
                                      s.push({ type: "C", values: [i, h, v, _, a, u] }),
                                      (r = a),
                                      (n = u))
                                    : "Q" === t
                                    ? ((i = e.values[0]),
                                      (h = e.values[1]),
                                      (a = e.values[2]),
                                      (u = e.values[3]),
                                      s.push({ type: "Q", values: [i, h, a, u] }),
                                      (r = a),
                                      (n = u))
                                    : "q" === t
                                    ? ((i = r + e.values[0]),
                                      (h = n + e.values[1]),
                                      (a = r + e.values[2]),
                                      (u = n + e.values[3]),
                                      s.push({ type: "Q", values: [i, h, a, u] }),
                                      (r = a),
                                      (n = u))
                                    : "A" === t
                                    ? ((a = e.values[5]),
                                      (u = e.values[6]),
                                      s.push({
                                          type: "A",
                                          values: [
                                              e.values[0],
                                              e.values[1],
                                              e.values[2],
                                              e.values[3],
                                              e.values[4],
                                              a,
                                              u,
                                          ],
                                      }),
                                      (r = a),
                                      (n = u))
                                    : "a" === t
                                    ? ((a = r + e.values[5]),
                                      (u = n + e.values[6]),
                                      s.push({
                                          type: "A",
                                          values: [
                                              e.values[0],
                                              e.values[1],
                                              e.values[2],
                                              e.values[3],
                                              e.values[4],
                                              a,
                                              u,
                                          ],
                                      }),
                                      (r = a),
                                      (n = u))
                                    : "H" === t
                                    ? ((a = e.values[0]),
                                      s.push({ type: "H", values: [a] }),
                                      (r = a))
                                    : "h" === t
                                    ? ((a = r + e.values[0]),
                                      s.push({ type: "H", values: [a] }),
                                      (r = a))
                                    : "V" === t
                                    ? ((u = e.values[0]),
                                      s.push({ type: "V", values: [u] }),
                                      (n = u))
                                    : "v" === t
                                    ? ((u = n + e.values[0]),
                                      s.push({ type: "V", values: [u] }),
                                      (n = u))
                                    : "S" === t
                                    ? ((v = e.values[0]),
                                      (_ = e.values[1]),
                                      (a = e.values[2]),
                                      (u = e.values[3]),
                                      s.push({ type: "S", values: [v, _, a, u] }),
                                      (r = a),
                                      (n = u))
                                    : "s" === t
                                    ? ((v = r + e.values[0]),
                                      (_ = n + e.values[1]),
                                      (a = r + e.values[2]),
                                      (u = n + e.values[3]),
                                      s.push({ type: "S", values: [v, _, a, u] }),
                                      (r = a),
                                      (n = u))
                                    : "T" === t
                                    ? ((a = e.values[0]),
                                      (u = e.values[1]),
                                      s.push({ type: "T", values: [a, u] }),
                                      (r = a),
                                      (n = u))
                                    : "t" === t
                                    ? ((a = r + e.values[0]),
                                      (u = n + e.values[1]),
                                      s.push({ type: "T", values: [a, u] }),
                                      (r = a),
                                      (n = u))
                                    : ("Z" !== t && "z" !== t) ||
                                      (s.push({ type: "Z", values: [] }), (r = l), (n = p));
                        }),
                        s)
                    );
                    return (this[i] = h(t)), t;
                }
                if (this[u]) return h(this[u]);
                var s,
                    r,
                    n,
                    l,
                    p,
                    _ = a(this.getAttribute("d") || "");
                return (this[u] = h(_)), _;
            }),
            (SVGPathElement.prototype.setPathData = function (e) {
                if (0 === e.length) s ? this.setAttribute("d", "") : this.removeAttribute("d");
                else {
                    for (var t = "", a = 0, r = e.length; a < r; a += 1) {
                        var n = e[a];
                        a > 0 && (t += " "),
                            (t += n.type),
                            n.values && n.values.length > 0 && (t += " " + n.values.join(" "));
                    }
                    this.setAttribute("d", t);
                }
            }),
            (SVGRectElement.prototype.getPathData = function (e) {
                var t = this.x.baseVal.value,
                    s = this.y.baseVal.value,
                    a = this.width.baseVal.value,
                    r = this.height.baseVal.value,
                    n = this.hasAttribute("rx") ? this.rx.baseVal.value : this.ry.baseVal.value,
                    u = this.hasAttribute("ry") ? this.ry.baseVal.value : this.rx.baseVal.value;
                n > a / 2 && (n = a / 2), u > r / 2 && (u = r / 2);
                var i = [
                    { type: "M", values: [t + n, s] },
                    { type: "H", values: [t + a - n] },
                    { type: "A", values: [n, u, 0, 0, 1, t + a, s + u] },
                    { type: "V", values: [s + r - u] },
                    { type: "A", values: [n, u, 0, 0, 1, t + a - n, s + r] },
                    { type: "H", values: [t + n] },
                    { type: "A", values: [n, u, 0, 0, 1, t, s + r - u] },
                    { type: "V", values: [s + u] },
                    { type: "A", values: [n, u, 0, 0, 1, t + n, s] },
                    { type: "Z", values: [] },
                ];
                return (
                    (i = i.filter(function (e) {
                        return "A" !== e.type || (0 !== e.values[0] && 0 !== e.values[1]);
                    })),
                    e && !0 === e.normalize && (i = v(i)),
                    i
                );
            }),
            (SVGCircleElement.prototype.getPathData = function (e) {
                var t = this.cx.baseVal.value,
                    s = this.cy.baseVal.value,
                    a = this.r.baseVal.value,
                    r = [
                        { type: "M", values: [t + a, s] },
                        { type: "A", values: [a, a, 0, 0, 1, t, s + a] },
                        { type: "A", values: [a, a, 0, 0, 1, t - a, s] },
                        { type: "A", values: [a, a, 0, 0, 1, t, s - a] },
                        { type: "A", values: [a, a, 0, 0, 1, t + a, s] },
                        { type: "Z", values: [] },
                    ];
                return e && !0 === e.normalize && (r = v(r)), r;
            }),
            (SVGEllipseElement.prototype.getPathData = function (e) {
                var t = this.cx.baseVal.value,
                    s = this.cy.baseVal.value,
                    a = this.rx.baseVal.value,
                    r = this.ry.baseVal.value,
                    n = [
                        { type: "M", values: [t + a, s] },
                        { type: "A", values: [a, r, 0, 0, 1, t, s + r] },
                        { type: "A", values: [a, r, 0, 0, 1, t - a, s] },
                        { type: "A", values: [a, r, 0, 0, 1, t, s - r] },
                        { type: "A", values: [a, r, 0, 0, 1, t + a, s] },
                        { type: "Z", values: [] },
                    ];
                return e && !0 === e.normalize && (n = v(n)), n;
            }),
            (SVGLineElement.prototype.getPathData = function () {
                return [
                    { type: "M", values: [this.x1.baseVal.value, this.y1.baseVal.value] },
                    { type: "L", values: [this.x2.baseVal.value, this.y2.baseVal.value] },
                ];
            }),
            (SVGPolylineElement.prototype.getPathData = function () {
                for (var e = [], t = 0; t < this.points.numberOfItems; t += 1) {
                    var s = this.points.getItem(t);
                    e.push({ type: 0 === t ? "M" : "L", values: [s.x, s.y] });
                }
                return e;
            }),
            (SVGPolygonElement.prototype.getPathData = function () {
                for (var e = [], t = 0; t < this.points.numberOfItems; t += 1) {
                    var s = this.points.getItem(t);
                    e.push({ type: 0 === t ? "M" : "L", values: [s.x, s.y] });
                }
                return e.push({ type: "Z", values: [] }), e;
            });
    })();
