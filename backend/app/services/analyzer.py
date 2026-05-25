import re
import hashlib
from typing import Tuple, Optional, List

# Расширенный словарь регионов с весами
REGION_KEYWORDS = {
    "Москва": (["москв", "мкад", "подмосковье", "новая москва", "тушино", "чертаново"], 55.7558, 37.6173),
    "Московская область": (["московская област", "подольск", "люберцы", "красногорск", "мытищи", "одинцов", "солнечногорск", "раменск", "балаших", "химки", "королев", "щёлков"], 55.7558, 37.6173),
    "Санкт-Петербург": (["санкт-петербург", "спб", "питер", "ленинград", "петербург"], 59.9343, 30.3351),
    "Ленинградская область": (["ленинградская област", "всеволожск", "гатчин", "выборг"], 59.9343, 30.3351),
    "Белгородская область": (["белгород", "белгородск", "шебекин", "староосколь", "губкин", "валуйк"], 50.5997, 36.5986),
    "Курская область": (["курск", "курска", "курской", "курян", "железногорск"], 51.7373, 36.1874),
    "Воронежская область": (["воронеж", "воронежск", "россош"], 51.6720, 39.1843),
    "Краснодарский край": (["краснодар", "кубан", "сочи", "новороссийск", "анап", "геленджик", "туапс", "армавир", "тимашевск"], 45.0355, 38.9753),
    "Ростовская область": (["ростов", "ростовск", "таганрог", "шахт", "батайск", "новочеркасск", "волгодонск"], 47.2357, 39.7015),
    "Брянская область": (["брянск", "брянской", "клинц", "новозыбков", "стародуб"], 53.2434, 34.3637),
    "Калужская область": (["калужск", "калуг", "обнинск"], 54.5138, 36.2615),
    "Смоленская область": (["смоленск", "смоленской", "вязьм"], 54.7826, 32.0453),
    "Тверская область": (["тверск", "твер", "ржев", "торжок"], 56.8587, 35.9176),
    "Нижегородская область": (["нижегород", "нижний новгород", "арзамас", "бор"], 56.3269, 44.0059),
    "Татарстан": (["татарстан", "казан", "набережные челны", "нижнекамск", "альметьевск"], 55.7961, 49.1064),
    "Самарская область": (["самар", "самарск", "тольятти", "сызран"], 53.1956, 50.1062),
    "Саратовская область": (["саратов", "саратовск", "энгельс", "балаков"], 51.5336, 46.0343),
    "Волгоградская область": (["волгоград", "волгоградск", "волжск"], 48.7080, 44.5133),
    "Крым": (["крым", "симферополь", "севастополь", "керич", "феодоси", "евпатор", "ялт"], 44.9482, 34.1003),
    "Астраханская область": (["астрахан", "астраханск"], 46.3497, 48.0408),
    "Пензенская область": (["пенз", "пензенск"], 53.1959, 45.0184),
    "Ульяновская область": (["ульяновск", "ульяновск"], 54.3142, 48.4031),
    "Челябинская область": (["челябинск", "челябинск", "магнитогорск", "миасс"], 55.1644, 61.4368),
    "Свердловская область": (["екатеринбург", "свердловск", "нижний тагил"], 56.8389, 60.6057),
    "Башкортостан": (["башкортостан", "башкир", "уф"], 54.7388, 55.9721),
    "Пермский край": (["перм", "пермск"], 58.0105, 56.2502),
    "Кировская область": (["киров", "кировск"], 58.5966, 49.6601),
    "Липецкая область": (["липецк", "липецк"], 52.6032, 39.5992),
    "Тамбовская область": (["тамбов", "тамбовск"], 52.7317, 41.4433),
    "Тульская область": (["тул", "тульск", "новомосковск"], 54.1961, 37.6182),
    "Рязанская область": (["рязан", "рязанск"], 54.6269, 39.6916),
    "Владимирская область": (["владимирск", "владимир"], 56.1291, 40.4466),
    "Ивановская область": (["иванов", "ивановск"], 56.9997, 40.9736),
    "Ярославская область": (["ярослав", "ярославск", "рыбинск"], 57.6261, 39.8845),
    "Костромская область": (["костром", "костромск"], 57.7679, 40.9269),
    "Вологодская область": (["вологодск", "вологд", "череповец"], 59.2181, 39.8886),
    "Архангельская область": (["архангельск", "архангельск"], 64.5399, 40.5168),
    "Мурманская область": (["мурманск", "мурманск"], 68.9585, 33.0827),
    "Орловская область": (["орловск", "орёл", "орле"], 52.9701, 36.0633),
    "Псковская область": (["псков", "псковск"], 57.8136, 28.3496),
    "Новгородская область": (["новгород", "великий новгород"], 58.5228, 31.2750),
    "Калининградская область": (["калининград", "калининградск"], 54.7104, 20.4522),
    "Удмуртия": (["удмурт", "ижевск"], 56.8528, 53.2044),
    "Чувашия": (["чуваш", "чебоксар"], 56.1322, 47.2519),
    "Марий Эл": (["марий эл", "йошкар"], 56.6344, 47.8998),
    "Мордовия": (["мордов", "саранск"], 54.1867, 45.1838),
}

# Расширенные ключевые слова типов событий с весами
EVENT_TYPE_KEYWORDS = {
    "drone_sighting": {
        "keywords": ["беспилотник", "бпла", "дрон", "квадрокоптер", "беспилотный", "беспилотника", "дронов", "дроны", "коптер", "fpv"],
        "weight": 0.8,
    },
    "explosion": {
        "keywords": ["взрыв", "хлопок", "громк", "детонац", "взорвал", "взлетел на воздух", "бах", "грохот", "звук взрыва"],
        "weight": 0.9,
    },
    "air_defense": {
        "keywords": ["пво", "противовоздушн", "зрк", "зенит", "перехват"],
        "weight": 0.8,
    },
    "missile_danger": {
        "keywords": ["ракетная опасность", "ракетный удар", "баллистическ", "ракетная атак"],
        "weight": 0.9,
    },
    "missile_danger_cleared": {
        "keywords": ["снятие ракетн", "отбой ракетн", "отмена ракетн", "ракетная опасность отмен"],
        "weight": 0.95,
    },
    "unconfirmed": {
        "keywords": ["сообщ", "информац", "по предварительн", "по данным", "поступа", "неизвест"],
        "weight": 0.1,
    },
}

# Ключевые слова для определения достоверности
CONFIDENCE_BOOST = [
    "официально", "подтвержден", "мчс", "губернатор", "минобороны",
    "пресс-служба", "администраци", "правительств", "департамент",
    "источник в", "данным", "сообщили", "заявил", "подтвердил",
    "срочно", "экстренно", "внимание", "важная информация",
    "видео", "фото", "доказательств", "свидетель",
]

CONFIDENCE_PENALTY = [
    "возможно", "вроде", "говорят", "слух", "якобы", "неподтвержден",
    "по слухам", "рассказывают", "пишут", "кажется", "наверное",
    "может быть", "в соцсетях пишут", "неизвестно",
]

SPAM_PATTERNS = [
    r"реклам", r"купить", r"продаж", r"подпишись", r"репост",
    r"заработ", r"перейди по ссылк",
]


def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text


def compute_text_hash(text: str) -> str:
    normalized = normalize_text(text)
    return hashlib.sha256(normalized.encode()).hexdigest()


def analyze_message(text: str) -> dict:
    text_lower = text.lower()
    is_spam = any(re.search(p, text_lower) for p in SPAM_PATTERNS)

    region, region_coords = detect_region(text_lower)
    event_type = detect_event_type(text_lower)
    confidence = calculate_confidence(text, event_type, is_spam)
    coords = extract_coordinates(text)
    text_hash = compute_text_hash(text)

    if not coords[0] and region_coords:
        coords = region_coords

    return {
        "region": region,
        "event_type": event_type,
        "confidence_score": confidence,
        "lat": coords[0],
        "lng": coords[1],
        "text_hash": text_hash,
        "is_spam": is_spam,
    }


def detect_region(text: str) -> Tuple[Optional[str], Optional[Tuple[float, float]]]:
    text_lower = normalize_text(text)
    best_region = None
    best_coords = None
    best_len = 0

    for region, (keywords, lat, lng) in REGION_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                if len(kw) > best_len:
                    best_region = region
                    best_coords = (lat, lng)
                    best_len = len(kw)

    return best_region, best_coords


def detect_event_type(text: str) -> str:
    text_lower = text.lower()
    scores = {}

    for event_type, data in EVENT_TYPE_KEYWORDS.items():
        score = 0
        for kw in data["keywords"]:
            count = text_lower.count(kw)
            score += count * data["weight"]
        if score > 0:
            scores[event_type] = score

    if not scores:
        return "unconfirmed"

    return max(scores, key=scores.get)


def calculate_confidence(text: str, event_type: str, is_spam: bool = False) -> float:
    if is_spam:
        return 0.0

    text_lower = text.lower()
    score = 0.3

    if event_type != "unconfirmed":
        score += 0.25

    boost_count = sum(1 for w in CONFIDENCE_BOOST if w in text_lower)
    score += min(boost_count * 0.1, 0.25)

    penalty_count = sum(1 for w in CONFIDENCE_PENALTY if w in text_lower)
    score -= min(penalty_count * 0.1, 0.3)

    if extract_coordinates(text)[0] is not None:
        score += 0.1

    # Length bonus (longer messages tend to be more detailed)
    if len(text) > 200:
        score += 0.05
    if len(text) > 500:
        score += 0.05

    return max(0.0, min(1.0, round(score, 2)))


def extract_coordinates(text: str) -> Tuple[Optional[float], Optional[float]]:
    patterns = [
        r"(\d{2}\.\d+)\s*[,;:\s]+\s*(\d{2}\.\d+)",
        r"(\d{2})[°\s]\s*(\d{2})[′']\s*([\d.]+)[″\"]?\s*[NSЮ]\s*(\d{2})[°\s]\s*(\d{2})[′']\s*([\d.]+)[″\"]?\s*[EWВЗ]",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                if len(match.groups()) == 2:
                    lat = float(match.group(1))
                    lng = float(match.group(2))
                else:
                    lat = float(match.group(1)) + float(match.group(2)) / 60
                    lng = float(match.group(4)) + float(match.group(5)) / 60

                if 40 <= lat <= 70 and 20 <= lng <= 180:
                    return (round(lat, 4), round(lng, 4))
            except ValueError:
                pass
    return (None, None)


def find_duplicates(events: List[dict], threshold: float = 0.85) -> List[int]:
    duplicates = []
    seen_hashes = {}
    for i, event in enumerate(events):
        h = event.get("text_hash")
        if h and h in seen_hashes:
            duplicates.append(i)
        elif h:
            seen_hashes[h] = i
    return duplicates
