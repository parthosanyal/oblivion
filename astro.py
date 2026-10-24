"""Vedic (sidereal, Lahiri) astrology engine.

Two calculation back-ends:
  * Swiss Ephemeris via `pyswisseph` (accurate to arc-seconds) - used if installed.
  * A built-in pure-Python approximation (Meeus Sun/Moon series, Standish
    planetary elements) - used automatically if pyswisseph is missing.
    Good for rashi/lagna in most cases, but nakshatra-pada and dasha dates
    can be off near boundaries. `pip install pyswisseph` for precision.
"""
import math
from datetime import datetime, timedelta, timezone, date as date_cls
from zoneinfo import ZoneInfo

try:
    import swisseph as swe
    HAVE_SWE = True
except Exception:  # ImportError or broken wheel
    swe = None
    HAVE_SWE = False

ENGINE = "swisseph" if HAVE_SWE else "builtin-approx"

# ----------------------------------------------------------------- constants
SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra",
         "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
SIGNS_SKT = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula",
             "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena"]
SIGN_LORDS = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus",
              "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"]
NAKSHATRAS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
              "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
              "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
              "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
              "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
              "Uttara Bhadrapada", "Revati"]
DASHA_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter",
               "Saturn", "Mercury"]
DASHA_YEARS = {"Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
               "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17}
YEAR_DAYS = 365.25
NAK_LEN = 360.0 / 27

PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
           "Rahu", "Ketu"]
ABBR = {"Sun": "Su", "Moon": "Mo", "Mars": "Ma", "Mercury": "Me",
        "Jupiter": "Ju", "Venus": "Ve", "Saturn": "Sa", "Rahu": "Ra",
        "Ketu": "Ke", "Ascendant": "As"}

EXALT = {"Sun": (0, 10), "Moon": (1, 3), "Mars": (9, 28), "Mercury": (5, 15),
         "Jupiter": (3, 5), "Venus": (11, 27), "Saturn": (6, 20)}
OWN = {"Sun": [4], "Moon": [3], "Mars": [0, 7], "Mercury": [2, 5],
       "Jupiter": [8, 11], "Venus": [1, 6], "Saturn": [9, 10]}

TITHIS = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
          "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
          "Trayodashi", "Chaturdashi"]
YOGAS = ["Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
         "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata",
         "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha",
         "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra",
         "Vaidhriti"]
MOVABLE_KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija",
                   "Vishti (Bhadra)"]
VARAS = ["Somavara (Mon)", "Mangalavara (Tue)", "Budhavara (Wed)",
         "Guruvara (Thu)", "Shukravara (Fri)", "Shanivara (Sat)",
         "Ravivara (Sun)"]
VARA_LORDS = ["Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Sun"]


# ------------------------------------------------------------------- helpers
def norm(x):
    return x % 360.0


def norm180(x):
    return ((x + 180.0) % 360.0) - 180.0


def sind(x): return math.sin(math.radians(x))
def cosd(x): return math.cos(math.radians(x))


def julian_day(dt_utc):
    y, m = dt_utc.year, dt_utc.month
    d = dt_utc.day + (dt_utc.hour + (dt_utc.minute +
        (dt_utc.second + dt_utc.microsecond / 1e6) / 60.0) / 60.0) / 24.0
    if m <= 2:
        y -= 1
        m += 12
    a = y // 100
    b = 2 - a + a // 4
    return (math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1))
            + d + b - 1524.5)


def delta_t(year):
    """TT - UT in seconds (Espenak & Meeus polynomials)."""
    y = year
    if 2005 <= y < 2050:
        t = y - 2000
        return 62.92 + 0.32217 * t + 0.005589 * t * t
    if 1986 <= y < 2005:
        t = y - 2000
        return (63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3
                + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5)
    if 1961 <= y < 1986:
        t = y - 1975
        return 45.45 + 1.067 * t - t * t / 260 - t ** 3 / 718
    if 1941 <= y < 1961:
        t = y - 1950
        return 29.07 + 0.407 * t - t * t / 233 + t ** 3 / 2547
    if 1920 <= y < 1941:
        t = y - 1920
        return 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t ** 3
    if 1900 <= y < 1920:
        t = y - 1900
        return (-2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t ** 3
                - 0.000197 * t ** 4)
    if 2050 <= y <= 2150:
        return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y)
    u = (y - 1820) / 100
    return -20 + 32 * u * u


# ----------------------------------------------------------------- ayanamsa
_AYAN_T0_JD = 2435553.5          # 1956-03-21 (Swiss Ephemeris Lahiri reference)
_AYAN_T0 = 23.245524743


def _precession_long(T):
    """General precession in longitude from J2000, degrees (T in Julian centuries)."""
    return (5028.796195 * T + 1.1054348 * T * T) / 3600.0


def lahiri_ayanamsa(jd_tt):
    T = (jd_tt - 2451545.0) / 36525.0
    T0 = (_AYAN_T0_JD - 2451545.0) / 36525.0
    return _AYAN_T0 + _precession_long(T) - _precession_long(T0)


AYAN_J2000 = lahiri_ayanamsa(2451545.0)


# --------------------------------------------------------------- Sun (Meeus 25)
def sun_tropical(jd_tt):
    """Apparent-ish tropical longitude (mean equinox of date, aberration
    applied, nutation omitted) and distance in AU."""
    T = (jd_tt - 2451545.0) / 36525.0
    L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
    M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
    e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T
    C = ((1.914602 - 0.004817 * T - 0.000014 * T * T) * sind(M)
         + (0.019993 - 0.000101 * T) * sind(2 * M) + 0.000289 * sind(3 * M))
    true_lon = L0 + C
    nu = M + C
    R = 1.000001018 * (1 - e * e) / (1 + e * cosd(nu))
    return norm(true_lon - 0.00569), R, norm(L0)


# -------------------------------------------------------------- Moon (Meeus 47)
# (D, M, M', F, coefficient of sin in 1e-6 degrees)
_MOON_LON = [
    (0, 0, 1, 0, 6288774), (2, 0, -1, 0, 1274027), (2, 0, 0, 0, 658314),
    (0, 0, 2, 0, 213618), (0, 1, 0, 0, -185116), (0, 0, 0, 2, -114332),
    (2, 0, -2, 0, 58793), (2, -1, -1, 0, 57066), (2, 0, 1, 0, 53322),
    (2, -1, 0, 0, 45758), (0, 1, -1, 0, -40923), (1, 0, 0, 0, -34720),
    (0, 1, 1, 0, -30383), (2, 0, 0, -2, 15327), (0, 0, 1, 2, -12528),
    (0, 0, 1, -2, 10980), (4, 0, -1, 0, 10675), (0, 0, 3, 0, 10034),
    (4, 0, -2, 0, 8548), (2, 1, -1, 0, -7888), (2, 1, 0, 0, -6766),
    (1, 0, -1, 0, -5163), (1, 1, 0, 0, 4987), (2, -1, 1, 0, 4036),
    (2, 0, 2, 0, 3994), (4, 0, 0, 0, 3861), (2, 0, -3, 0, 3665),
    (0, 1, -2, 0, -2689), (2, 0, -1, 2, -2602), (2, -1, -2, 0, 2390),
    (1, 0, 1, 0, -2348), (2, -2, 0, 0, 2236), (0, 1, 2, 0, -2120),
    (0, 2, 0, 0, -2069), (2, -2, -1, 0, 2048), (2, 0, 1, -2, -1773),
    (2, 0, 0, 2, -1595), (4, -1, -1, 0, 1215), (0, 0, 2, 2, -1110),
    (3, 0, -1, 0, -892), (2, 1, 1, 0, -810), (4, -1, -2, 0, 759),
    (0, 2, -1, 0, -713), (2, 2, -1, 0, -700), (2, 1, -2, 0, 691),
    (2, -1, 0, -2, 596), (4, 0, 1, 0, 549), (0, 0, 4, 0, 537),
    (4, -1, 0, 0, 520), (1, 0, -2, 0, -487), (2, 1, 0, -2, -399),
    (0, 0, 2, -2, -381), (1, 1, 1, 0, 351), (3, 0, -2, 0, -340),
    (4, 0, -3, 0, 330), (2, -1, 2, 0, 327), (0, 2, 1, 0, -323),
    (1, 1, -1, 0, 299), (2, 0, 3, 0, 294),
]


def moon_tropical(jd_tt):
    T = (jd_tt - 2451545.0) / 36525.0
    Lp = (218.3164477 + 481267.88123421 * T - 0.0015786 * T ** 2
          + T ** 3 / 538841 - T ** 4 / 65194000)
    D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T ** 2
         + T ** 3 / 545868 - T ** 4 / 113065000)
    M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T ** 2 + T ** 3 / 24490000
    Mp = (134.9633964 + 477198.8675055 * T + 0.0087414 * T ** 2
          + T ** 3 / 69699 - T ** 4 / 14712000)
    F = (93.2720950 + 483202.0175233 * T - 0.0036539 * T ** 2
         - T ** 3 / 3526000 + T ** 4 / 863310000)
    A1 = 119.75 + 131.849 * T
    A2 = 53.09 + 479264.290 * T
    E = 1 - 0.002516 * T - 0.0000074 * T * T
    s = 0.0
    for d, m, mp, f, c in _MOON_LON:
        arg = d * D + m * M + mp * Mp + f * F
        s += c * (E ** abs(m)) * sind(arg)
    s += 3958 * sind(A1) + 1962 * sind(Lp - F) + 318 * sind(A2)
    return norm(Lp + s / 1e6)


def mean_node_tropical(jd_tt):
    T = (jd_tt - 2451545.0) / 36525.0
    om = (125.0445479 - 1934.1362891 * T + 0.0020754 * T * T
          + T ** 3 / 467441 - T ** 4 / 60616000)
    return norm(om)


# ------------------------------------------- planets (Standish, valid 1800-2050)
# a, da, e, de, I, dI, L, dL, long.peri, dlp, long.node, dln   (per century)
_ELEMENTS = {
    "Mercury": (0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902,
                -0.00594749, 252.25032350, 149472.67411175, 77.45779628,
                0.16047689, 48.33076593, -0.12534081),
    "Venus": (0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605,
              -0.00078890, 181.97909950, 58517.81538729, 131.60246718,
              0.00268329, 76.67984255, -0.27769418),
    "Earth": (1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531,
              -0.01294668, 100.46457166, 35999.37244981, 102.93768193,
              0.32327364, 0.0, 0.0),
    "Mars": (1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142,
             -0.00813131, -4.55343205, 19140.30268499, -23.94362959,
             0.44441088, 49.55953891, -0.29257343),
    "Jupiter": (5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695,
                -0.00183714, 34.39644051, 3034.74612775, 14.72847983,
                0.21252668, 100.47390909, 0.20469106),
    "Saturn": (9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187,
               0.00193609, 49.95424423, 1222.49362201, 92.59887831,
               -0.41897216, 113.66242448, -0.28867794),
}


def _helio_xyz(body, T):
    el = _ELEMENTS[body]
    a = el[0] + el[1] * T
    e = el[2] + el[3] * T
    I = el[4] + el[5] * T
    L = el[6] + el[7] * T
    wp = el[8] + el[9] * T
    Om = el[10] + el[11] * T
    w = wp - Om
    M = math.radians(norm180(L - wp))
    E = M + e * math.sin(M)
    for _ in range(30):
        dE = (M - (E - e * math.sin(E))) / (1 - e * math.cos(E))
        E += dE
        if abs(dE) < 1e-10:
            break
    xp = a * (math.cos(E) - e)
    yp = a * math.sqrt(1 - e * e) * math.sin(E)
    cw, sw = cosd(w), sind(w)
    cO, sO = cosd(Om), sind(Om)
    cI, sI = cosd(I), sind(I)
    x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp
    y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp
    z = (sw * sI) * xp + (cw * sI) * yp
    return x, y, z


def planet_sidereal_builtin(body, jd_tt):
    T = (jd_tt - 2451545.0) / 36525.0
    ex, ey, ez = _helio_xyz("Earth", T)
    tau = 0.0
    dx = dy = 0.0
    for _ in range(3):  # light-time iteration
        px, py, pz = _helio_xyz(body, T - tau / 36525.0)
        dx, dy = px - ex, py - ey
        dist = math.sqrt(dx * dx + dy * dy + (pz - ez) ** 2)
        tau = 0.0057755183 * dist
    lon_j2000 = norm(math.degrees(math.atan2(dy, dx)))
    return norm(lon_j2000 - AYAN_J2000)


# ------------------------------------------------------------ position facade
def _swe_lon(body, jd_ut):
    flags = swe.FLG_MOSEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED
    res = swe.calc_ut(jd_ut, body, flags)
    xx = res[0] if isinstance(res[0], (tuple, list)) else res
    return norm(xx[0]), xx[3]


def sidereal_longitudes(jd_ut, jd_tt):
    """Return {planet: (sidereal_lon, speed_deg_per_day)}."""
    out = {}
    if HAVE_SWE:
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        ids = {"Sun": swe.SUN, "Moon": swe.MOON, "Mars": swe.MARS,
               "Mercury": swe.MERCURY, "Jupiter": swe.JUPITER,
               "Venus": swe.VENUS, "Saturn": swe.SATURN}
        for name, pid in ids.items():
            out[name] = _swe_lon(pid, jd_ut)
        rlon, rspd = _swe_lon(swe.MEAN_NODE, jd_ut)
        out["Rahu"] = (rlon, rspd)
        out["Ketu"] = (norm(rlon + 180.0), rspd)
        return out

    def lon_at(name, jdt):
        ay = lahiri_ayanamsa(jdt)
        if name == "Sun":
            return norm(sun_tropical(jdt)[0] - ay)
        if name == "Moon":
            return norm(moon_tropical(jdt) - ay)
        if name == "Rahu":
            return norm(mean_node_tropical(jdt) - ay)
        if name == "Ketu":
            return norm(mean_node_tropical(jdt) + 180.0 - ay)
        return planet_sidereal_builtin(name, jdt)

    for name in PLANETS:
        lon = lon_at(name, jd_tt)
        spd = norm180(lon_at(name, jd_tt + 0.5) - lon_at(name, jd_tt - 0.5))
        out[name] = (lon, spd)
    return out


def obliquity(jd_tt):
    T = (jd_tt - 2451545.0) / 36525.0
    return 23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T ** 3


def ascendant_sidereal(jd_ut, jd_tt, lat, lon):
    T = (jd_ut - 2451545.0) / 36525.0
    gmst = norm(280.46061837 + 360.98564736629 * (jd_ut - 2451545.0)
                + 0.000387933 * T * T - T ** 3 / 38710000.0)
    theta = norm(gmst + lon)
    eps = obliquity(jd_tt)
    asc = math.degrees(math.atan2(
        cosd(theta),
        -(sind(theta) * cosd(eps) + math.tan(math.radians(lat)) * sind(eps))))
    asc = norm(asc)
    if HAVE_SWE:
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        ay = swe.get_ayanamsa_ut(jd_ut)
    else:
        ay = lahiri_ayanamsa(jd_tt)
    return norm(asc - ay), ay


# --------------------------------------------------------- sunrise / sunset
def sun_events(local_date, lat, lon, tz):
    """Approximate sunrise/sunset (aware datetimes in tz) or (None, None)."""
    noon_mean = (datetime(local_date.year, local_date.month, local_date.day, 12,
                          tzinfo=timezone.utc) - timedelta(hours=lon / 15.0))
    for _ in range(2):
        jd = julian_day(noon_mean)
        jd_tt = jd + delta_t(noon_mean.year) / 86400.0
        lam, _, L0 = sun_tropical(jd_tt)
        eps = obliquity(jd_tt)
        ra = norm(math.degrees(math.atan2(cosd(eps) * sind(lam), cosd(lam))))
        dec = math.degrees(math.asin(sind(eps) * sind(lam)))
        eot = norm180(L0 - ra)  # degrees (4 min per degree)
        cosH = ((sind(-0.8333) - sind(lat) * sind(dec)) /
                (cosd(lat) * cosd(dec)))
        if abs(cosH) > 1:
            return None, None
        H0 = math.degrees(math.acos(cosH))
        noon_true = noon_mean - timedelta(days=eot / 360.0)
        rise = noon_true - timedelta(days=H0 / 360.0)
        sett = noon_true + timedelta(days=H0 / 360.0)
        noon_mean = noon_true
    return rise.astimezone(tz), sett.astimezone(tz)


# ------------------------------------------------------------- derived data
def sign_of(lon):
    return int(lon // 30) % 12


def nakshatra_of(lon):
    idx = int(lon // NAK_LEN) % 27
    pada = int((lon % NAK_LEN) // (NAK_LEN / 4)) + 1
    return idx, pada


def navamsa_sign(lon):
    s = sign_of(lon)
    part = int((lon % 30.0) // (30.0 / 9))
    return (s * 9 + part) % 12


def dignity(name, lon):
    if name not in EXALT:
        return ""
    s = sign_of(lon)
    if s == EXALT[name][0]:
        return "Exalted"
    if s == (EXALT[name][0] + 6) % 12:
        return "Debilitated"
    if s in OWN[name]:
        return "Own sign"
    return ""


def fmt_dms(deg):
    d = int(deg)
    m = int((deg - d) * 60)
    s = int(round(((deg - d) * 60 - m) * 60))
    if s == 60:
        s = 0
        m += 1
    if m == 60:
        m = 0
        d += 1
    return f"{d}°{m:02d}'{s:02d}\""


def describe_point(name, lon, speed, lagna_sign):
    s = sign_of(lon)
    nak, pada = nakshatra_of(lon)
    retro = (name in ("Rahu", "Ketu")) or (speed < 0)
    return {
        "name": name, "abbr": ABBR[name], "lon": round(lon, 5),
        "sign": s, "sign_name": SIGNS[s], "sign_skt": SIGNS_SKT[s],
        "sign_lord": SIGN_LORDS[s], "deg": round(lon % 30, 5),
        "dms": fmt_dms(lon % 30), "nakshatra": NAKSHATRAS[nak],
        "nak_index": nak, "pada": pada, "nak_lord": DASHA_ORDER[nak % 9],
        "retro": retro, "speed": round(speed, 4),
        "house": ((s - lagna_sign) % 12) + 1,
        "dignity": dignity(name, lon),
        "navamsa": navamsa_sign(lon),
    }


def vimshottari(moon_lon, birth_utc, now_utc):
    idx = int(moon_lon // NAK_LEN) % 27
    frac = (moon_lon % NAK_LEN) / NAK_LEN
    first = DASHA_ORDER[idx % 9]
    elapsed_years = frac * DASHA_YEARS[first]
    start = birth_utc - timedelta(days=elapsed_years * YEAR_DAYS)
    i0 = DASHA_ORDER.index(first)
    mds = []
    cursor = start
    for k in range(9):
        lord = DASHA_ORDER[(i0 + k) % 9]
        yrs = DASHA_YEARS[lord]
        md_end = cursor + timedelta(days=yrs * YEAR_DAYS)
        ads = []
        a_cursor = cursor
        for j in range(9):
            al = DASHA_ORDER[(DASHA_ORDER.index(lord) + j) % 9]
            ad_days = yrs * DASHA_YEARS[al] / 120.0 * YEAR_DAYS
            a_end = a_cursor + timedelta(days=ad_days)
            ads.append({"lord": al, "start": a_cursor.date().isoformat(),
                        "end": a_end.date().isoformat(),
                        "current": a_cursor <= now_utc < a_end})
            a_cursor = a_end
        mds.append({"lord": lord, "years": yrs,
                    "start": cursor.date().isoformat(),
                    "end": md_end.date().isoformat(),
                    "current": cursor <= now_utc < md_end,
                    "antardashas": ads})
        cursor = md_end
    return {
        "balance_at_birth": {"lord": first,
                             "years": round(DASHA_YEARS[first] - elapsed_years, 3)},
        "mahadashas": mds,
    }


def panchang(sun_lon, moon_lon, local_dt, lat, lon, tz):
    elong = norm(moon_lon - sun_lon)
    tnum = int(elong // 12) + 1
    paksha = "Shukla" if tnum <= 15 else "Krishna"
    k = (tnum - 1) % 15
    if k == 14:
        tname = "Purnima" if tnum == 15 else "Amavasya"
    else:
        tname = TITHIS[k]
    yoga_idx = int(norm(sun_lon + moon_lon) // NAK_LEN) % 27
    kidx = int(elong // 6)  # 0..59
    if kidx == 0:
        karana = "Kimstughna"
    elif kidx >= 57:
        karana = ["Shakuni", "Chatushpada", "Naga"][kidx - 57]
    else:
        karana = MOVABLE_KARANAS[(kidx - 1) % 7]
    rise, sett = sun_events(local_dt.date(), lat, lon, tz)
    vara_date = local_dt.date()
    before_sunrise = rise is not None and local_dt < rise
    if before_sunrise:
        vara_date = vara_date - timedelta(days=1)
    wd = vara_date.weekday()
    return {
        "tithi": f"{paksha} {tname}", "tithi_number": tnum,
        "yoga": YOGAS[yoga_idx], "karana": karana,
        "vara": VARAS[wd], "vara_lord": VARA_LORDS[wd],
        "vara_note": ("Born before sunrise - counted as the previous Vedic day"
                      if before_sunrise else ""),
        "sunrise": rise.strftime("%H:%M") if rise else "-",
        "sunset": sett.strftime("%H:%M") if sett else "-",
    }


# ---------------------------------------------------------------- main entry
def compute_chart(date_str, time_str, lat, lon, tz_name, name=""):
    tz = ZoneInfo(tz_name)
    y, mo, d = (int(p) for p in date_str.split("-"))
    parts = time_str.split(":")
    hh, mm = int(parts[0]), int(parts[1])
    ss = int(parts[2]) if len(parts) > 2 else 0
    local_dt = datetime(y, mo, d, hh, mm, ss, tzinfo=tz)
    birth_utc = local_dt.astimezone(timezone.utc)
    now_utc = datetime.now(timezone.utc)

    warnings = []
    if not HAVE_SWE and not (1800 <= y <= 2050):
        warnings.append("Built-in engine is only valid for 1800-2050; "
                        "install pyswisseph for other years.")

    def jds(dt):
        jd_ut = julian_day(dt)
        return jd_ut, jd_ut + delta_t(dt.year + (dt.month - 0.5) / 12) / 86400.0

    jd_ut, jd_tt = jds(birth_utc)
    pos = sidereal_longitudes(jd_ut, jd_tt)
    asc_lon, ayan = ascendant_sidereal(jd_ut, jd_tt, lat, lon)
    lagna = sign_of(asc_lon)

    grahas = [describe_point(n, *pos[n], lagna) for n in PLANETS]
    asc = describe_point("Ascendant", asc_lon, 0.0, lagna)
    asc["house"] = 1

    d1 = [[] for _ in range(12)]
    d9 = [[] for _ in range(12)]
    for g in grahas:
        d1[g["sign"]].append({"abbr": g["abbr"], "retro": g["retro"]})
        d9[g["navamsa"]].append({"abbr": g["abbr"], "retro": g["retro"]})
    nav_lagna = navamsa_sign(asc_lon)

    moon = pos["Moon"][0]
    sun = pos["Sun"][0]

    # transits (now)
    jd_ut_n, jd_tt_n = jds(now_utc)
    tpos = sidereal_longitudes(jd_ut_n, jd_tt_n)
    moon_sign = sign_of(moon)
    transits = []
    for n in PLANETS:
        tl, ts = tpos[n]
        p = describe_point(n, tl, ts, lagna)
        p["house_from_moon"] = ((p["sign"] - moon_sign) % 12) + 1
        transits.append(p)
    sat_from_moon = ((sign_of(tpos["Saturn"][0]) - moon_sign) % 12) + 1
    sade_sati = sat_from_moon in (12, 1, 2)
    sade_phase = {12: "rising phase (Saturn in 12th from Moon)",
                  1: "peak phase (Saturn over natal Moon sign)",
                  2: "setting phase (Saturn in 2nd from Moon)"}.get(sat_from_moon, "")

    return {
        "engine": ENGINE,
        "warnings": warnings,
        "input": {"name": name, "date": date_str, "time": time_str,
                  "lat": lat, "lon": lon, "tz": tz_name,
                  "utc": birth_utc.strftime("%Y-%m-%d %H:%M:%S UTC"),
                  "utc_offset": local_dt.strftime("%z")},
        "ayanamsa": {"name": "Lahiri (Chitrapaksha)", "value": round(ayan, 5),
                     "dms": fmt_dms(ayan)},
        "ascendant": asc,
        "planets": grahas,
        "charts": {"d1": {"lagna": lagna, "signs": d1},
                   "d9": {"lagna": nav_lagna, "signs": d9}},
        "dasha": vimshottari(moon, birth_utc, now_utc),
        "panchang": panchang(sun, moon, local_dt, lat, lon, tz),
        "transits": {"as_of": now_utc.strftime("%Y-%m-%d %H:%M UTC"),
                     "planets": transits,
                     "sade_sati": {"active": sade_sati, "phase": sade_phase,
                                   "saturn_from_moon": sat_from_moon}},
        "signs": SIGNS, "signs_skt": SIGNS_SKT,
    }
