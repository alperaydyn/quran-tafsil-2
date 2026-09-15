#!/usr/bin/env python3
"""
tafsil.net — DP-010 & DP-011: Quranic Arabic Corpus Morphology Parser & Lexicon Matrix
Parses quranic-corpus-morphology-0.4.txt, maps to Uthmani text, builds frequency matrix,
and outputs lexicon_roots.json & quran_words_morphology.json.
"""

import os
import re
import json
from collections import defaultdict, Counter

BW2AR = {
    'A': 'أ', 'b': 'ب', 't': 'ت', 'v': 'ث', 'j': 'ج', 'H': 'ح', 'x': 'خ',
    'd': 'د', '*': 'ذ', 'r': 'ر', 'z': 'ز', 's': 'س', '$': 'ش', 'S': 'ص',
    'D': 'ض', 'T': 'ط', 'Z': 'ظ', 'E': 'ع', 'g': 'غ', 'f': 'ف', 'q': 'ق',
    'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'h': 'ه', 'w': 'و', 'y': 'ي'
}

AR2TR = {
    'أ': 'e', 'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 's', 'ج': 'c', 'ح': 'h', 'خ': 'h',
    'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 's', 'ص': 's',
    'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'g', 'ف': 'f', 'ق': 'k',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'v', 'y': 'y', 'ي': 'y',
    'ء': 'e', 'ؤ': 'u', 'ئ': 'i'
}

# 20 curated foundational roots from migrations 002 and 006
PREDEFINED_ROOTS = {
    'ع-ل-ق': {'kok_tr': 'alak', 'anlam': 'Tutunmak, asılmak, bağlanmak; yapışkan ve bağlı nesne'},
    'ع-ل-م': {'kok_tr': 'ilm', 'anlam': 'Bilmek, kavramak, hakikatin idrakine varmak, işaret ve alâmet'},
    'ح-ك-م': {'kok_tr': 'hkm', 'anlam': 'Hükmetmek, muhkem kılmak, hikmetle hareket etmek, ifsatı engellemek'},
    'و-ق-ي': {'kok_tr': 'vqy', 'anlam': 'Korumak, sakınmak, sorumluluk bilinciyle perdelenmek (takva)'},
    'أ-م-ن': {'kok_tr': 'emn', 'anlam': 'Güven içinde olmak, emin kılmak, tasdik etmek (iman)'},
    'ص-ل-ح': {'kok_tr': 'slh', 'anlam': 'Düzeltmek, barış içinde olmak, uygun ve hayırlı davranmak (amel-i salih)'},
    'ح-س-ن': {'kok_tr': 'hsn', 'anlam': 'Güzelleştirmek, ihsan etmek, en güzel sûrette yapmak'},
    'ع-د-ل': {'kok_tr': 'adl', 'anlam': 'Dengelemek, eşit kılmak, adaletle davranmak, istikamet'},
    'ظ-ل-م': {'kok_tr': 'zlm', 'anlam': 'Bir şeyi yerinden etmek, haddi aşmak, karanlıkta bırakmak (zulüm)'},
    'ه-د-ي': {'kok_tr': 'hdy', 'anlam': 'Yol göstermek, kılavuzlamak, doğru istikamete iletmek (hidayet)'},
    'ض-ل-ل': {'kok_tr': 'dll', 'anlam': 'Yoldan sapmak, gayeyi kaybetmek (dalalet)'},
    'ر-ح-م': {'kok_tr': 'rhm', 'anlam': 'Esirgemek, koruyup gözetmek, merhamet ve şefkat göstermek'},
    'ن-ف-ق': {'kok_tr': 'nfq', 'anlam': 'Tünel açmak, geçip gitmek, tükenmek; Allah yolunda harcamak (infak)'},
    'ص-ب-ر': {'kok_tr': 'sbr', 'anlam': 'Kendini tutmak, metanet göstermek, zorluklara karşı direnç (sabır)'},
    'ش-ك-ر': {'kok_tr': 'skr', 'anlam': 'Nimetin hakkını teslim etmek, minnet duymak ve mukabelede bulunmak (şükür)'},
    'ح-م-د': {'kok_tr': 'hmd', 'anlam': 'Övmek, hakkını teslim etmek, minnet duymak, kemalatı itiraf etmek'},
    'ر-ب-ب': {'kok_tr': 'rbb', 'anlam': 'Sahiplenmek, tedricen terbiye edip olgunlaştırmak, koruyup gözetmek'},
    'ع-ب-د': {'kok_tr': 'abd', 'anlam': 'Boyun eğmek, kulluk etmek, teslim olmak, ibadetle yönelmek'},
    'ن-ع-م': {'kok_tr': 'nam', 'anlam': 'İyilik, lütuf, refah, hoşa giden ilahi bağış'},
    'ص-ر-ط': {'kok_tr': 'srt', 'anlam': 'Açık, geniş ve dosdoğru cadde/yol'}
}

# Curated definitions for common Quranic roots to provide rich meanings
COMMON_ROOT_MEANINGS = {
    'أ-ل-ه': {'kok_tr': 'Alh', 'anlam': 'İlah olmak, kulluk ve ibadete layık olmak, sığınılmak; Allah'},
    'ق-و-ل': {'kok_tr': 'qwl', 'anlam': 'Söylemek, konuşmak, söz, hitap, beyan ve iddia'},
    'ك-و-ن': {'kok_tr': 'kwn', 'anlam': 'Olmak, var olmak, vücut bulmak (kûn / fe-yekûn)'},
    'أ-ت-ي': {'kok_tr': 'ety', 'anlam': 'Gelmek, getirmek, vuku bulmak, ulaşmak'},
    'ر-أ-ي': {'kok_tr': 'rey', 'anlam': 'Görmek, bakmak, müşahede etmek, idrak ve tefekkür etmek'},
    'ع-ل-و': {'kok_tr': 'alv', 'anlam': 'Yüce ve ali olmak, yükselmek, üstünlük'},
    'ش-ي-أ': {'kok_tr': 'sye', 'anlam': 'Dilemek, irade etmek, var etmek (meşiet)'},
    'ج-ع-ل': {'kok_tr': 'cal', 'anlam': 'Kılmak, yapmak, yaratmak, tayin etmek'},
    'أ-خ-ذ': {'kok_tr': 'ehz', 'anlam': 'Tutmak, almak, yakalamak, cezalandırmak, ahit bağlamak'},
    'ن-ز-ل': {'kok_tr': 'nzl', 'anlam': 'İnmek, indirmek, tenzil, vahyin nüzulü'},
    'خ-ل-ق': {'kok_tr': 'hlk', 'anlam': 'Yaratmak, takdir ve inşa etmek, fıtrat vermek'},
    'أ-ر-ض': {'kok_tr': 'ard', 'anlam': 'Yeryüzü, zemin, mekan'},
    'س-م-و': {'kok_tr': 'smw', 'anlam': 'Yükselmek, gök (sema), isim/ad, unvan'},
    'ك-ف-ر': {'kok_tr': 'kfr', 'anlam': 'Örtmek, nankörlük etmek, hakikati gizleyip inkar etmek (küfür)'},
    'ش-ه-د': {'kok_tr': 'shd', 'anlam': 'Tanıklık etmek, hazır bulunmak, şahitlik, şehadet'},
    'ب-ع-ث': {'kok_tr': 'bas', 'anlam': 'Göndermek, elçi tayin etmek, diriltip ayağa kaldırmak (ba\'s)'},
    'ع-ر-ف': {'kok_tr': 'arf', 'anlam': 'Tanımak, bilmek, marifet, örf ve iyilik'},
    'ح-ي-ي': {'kok_tr': 'hyy', 'anlam': 'Yaşamak, diri kılmak, hayat vermek, haya'},
    'م-و-ت': {'kok_tr': 'mwt', 'anlam': 'Ölmek, canı ayrılmak, fani olmak'},
    'غ-ف-ر': {'kok_tr': 'gfr', 'anlam': 'Korumak, örtmek, bağışlamak ve mağfiret etmek'},
    'ت-و-ب': {'kok_tr': 'twb', 'anlam': 'Dönmek, pişmanlıkla yönelmek, tövbe etmek ve kabul etmek'},
    'ك-ت-ب': {'kok_tr': 'ktb', 'anlam': 'Yazmak, kaydetmek, farz kılmak, kitap'},
    'ق-ر-أ': {'kok_tr': 'kra', 'anlam': 'Toplamak, okumak, tebliğ etmek, Kur\'an'},
    'س-م-ع': {'kok_tr': 'sm', 'anlam': 'İşitmek, duymak, kulak vermek, icabet etmek'},
    'ب-ص-ر': {'kok_tr': 'bsr', 'anlam': 'Görmek, basiret göstermek, idrak etmek'},
    'ف-ك-ر': {'kok_tr': 'fkr', 'anlam': 'Düşünmek, akıl yürütmek, tefekkür etmek'},
    'ع-ق-ل': {'kok_tr': 'akl', 'anlam': 'Bağlamak, kavramak, akletmek, muhakeme etmek'},
    'ق-ل-ب': {'kok_tr': 'qlb', 'anlam': 'Dönmek, evrilmek, kalp, gönül merkezi'},
    'ن-ف-س': {'kok_tr': 'nfs', 'anlam': 'Nefes, nefis, benlik, can, iç varlık'},
    'ر-و-ح': {'kok_tr': 'rwh', 'anlam': 'Ruh, can, ferahlık, rahmet ve ilahi vahiy'},
    'م-ل-ك': {'kok_tr': 'mlk', 'anlam': 'Sahip ve malik olmak, mülk, melek, hükümranlık'},
    'ح-ق-ق': {'kok_tr': 'hkk', 'anlam': 'Hak olmak, kesin ve sabit gerçeklik, adalet ve hikmet'},
    'ب-ط-ل': {'kok_tr': 'btl', 'anlam': 'Boşa gitmek, asılsız ve batıl olmak, hükümsüz kalmak'},
    'ن-و-ر': {'kok_tr': 'nwr', 'anlam': 'Aydınlatmak, ışık saçmak, nur, hidayet parıltısı'},
    'ش-ط-ن': {'kok_tr': 'stn', 'anlam': 'Uzaklaşmak, muhalefet etmek, saptırmak (şeytan)'},
    'ج-ن-ن': {'kok_tr': 'jnn', 'anlam': 'Gizlenmek, örtünmek; cin, cennet, kalp/cenin'},
    'ن-ص-ر': {'kok_tr': 'nsr', 'anlam': 'Yardım etmek, nusret vermek, zafere eriştirmek'},
    'خ-و-ف': {'kok_tr': 'hwf', 'anlam': 'Korkmak, çekinmek, endişe duymak (havf)'},
    'ر-ج-و': {'kok_tr': 'rcw', 'anlam': 'Ummak, ümit etmek, beklemek (reca)'},
    'د-ع-و': {'kok_tr': 'daw', 'anlam': 'Çağırmak, davet etmek, dua ve niyazda bulunmak'}
}

def bw_to_ar_root(root_bw):
    letters = [BW2AR.get(c, c) for c in root_bw]
    return '-'.join(letters)

def ar_root_to_tr(ar_root):
    letters = ar_root.split('-')
    tr_letters = [AR2TR.get(c, c) for c in letters]
    return ''.join(tr_letters)

def get_vezin(pos, verb_form, feats):
    if pos == 'V':
        forms = {
            '(I)': 'Form I (fa\'ala)',
            '(II)': 'Form II (tef\'îl)',
            '(III)': 'Form III (mufâ\'ale)',
            '(IV)': 'Form IV (if\'âl)',
            '(V)': 'Form V (tefe\'\'ul)',
            '(VI)': 'Form VI (tefâ\'ul)',
            '(VII)': 'Form VII (infi\'âl)',
            '(VIII)': 'Form VIII (ifti\'âl)',
            '(IX)': 'Form IX (if\'ilâl)',
            '(X)': 'Form X (istif\'âl)',
            '(XI)': 'Form XI',
            '(XII)': 'Form XII',
        }
        return forms.get(verb_form, 'Form I (fa\'ala)')
    if 'ACT' in feats and 'PCPL' in feats:
        return 'İsm-i Fâil'
    if 'PASS' in feats and 'PCPL' in feats:
        return 'İsm-i Mef\'ûl'
    if 'VN' in feats:
        return 'Masdar'
    if pos == 'PN':
        return 'Özel İsim (alem)'
    if pos == 'ADJ':
        return 'Sıfat'
    if pos == 'N':
        return 'İsim'
    if pos == 'PRON':
        return 'Zamir'
    if pos == 'DEM':
        return 'İşaret İsmi'
    if pos == 'REL':
        return 'İsm-i Mevsûl'
    if pos in ['P', 'CONJ', 'SUB', 'NEG', 'COND', 'INTG', 'REM', 'REST', 'RES', 'EXP', 'INC', 'AMD', 'ANS', 'AVR', 'CAUS', 'CERT', 'CIRC', 'COM', 'EQ', 'EXH', 'EXL', 'FUT', 'IMPV', 'PRP', 'PREV', 'PRO', 'RET', 'SUR', 'VOC']:
        return 'Harf / Edat'
    if pos in ['T', 'LOC']:
        return 'Zarf'
    return 'Kelime'

def load_uthmani_text(file_path):
    print(f"Loading Tanzil Uthmani text from {file_path}...")
    uthmani_map = {}
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('id|'):
                continue
            parts = line.split('|')
            s, a, text = int(parts[1]), int(parts[2]), parts[3].strip()
            raw_words = text.split()
            # Filter out standalone Quranic waqf marks
            words = [w for w in raw_words if not re.match(r'^[\u06D6-\u06DC\u06DF-\u06E4\u06E9]+$', w)]
            # Special case for 37:130 where إِلْ and يَاسِينَ are one token in Corpus
            if s == 37 and a == 130 and len(words) == 4:
                words = [words[0], words[1], words[2] + ' ' + words[3]]
            uthmani_map[(s, a)] = words
    print(f"Loaded {len(uthmani_map)} ayahs from Uthmani text.")
    return uthmani_map

def load_lane_lexicon(file_path):
    if not os.path.exists(file_path):
        print(f"Warning: Lane Lexicon not found at {file_path}")
        return {}
    print(f"Loading Lane's Lexicon from {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    norm = {}
    for k, v in data.items():
        norm[k] = v
        norm[k.replace('ا', 'أ')] = v
        norm[k.replace('أ', 'ا')] = v
        if k.endswith('-و'):
            norm[k[:-1] + 'ي'] = v
            norm[k.replace('ا', 'أ')[:-1] + 'ي'] = v
        elif k.endswith('-ي'):
            norm[k[:-1] + 'و'] = v
            norm[k.replace('ا', 'أ')[:-1] + 'و'] = v
    print(f"Loaded {len(data)} roots from Lane's Lexicon.")
    return norm

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    corpus_file = os.path.join(base_dir, "quranic-corpus-morphology-0.4.txt")
    uthmani_file = os.path.join(base_dir, "uthmani.txt")
    lane_file = os.path.join(base_dir, "data", "lane_lexicon_roots.json")
    output_dir = os.path.join(base_dir, "output")
    os.makedirs(output_dir, exist_ok=True)

    uthmani_words = load_uthmani_text(uthmani_file)
    lane_lexicon = load_lane_lexicon(lane_file)

    print(f"Parsing Quranic Arabic Corpus from {corpus_file}...")
    words_data = {}
    word_segments = defaultdict(list)

    with open(corpus_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or line.startswith('LOCATION'):
                continue
            parts = line.split('\t')
            loc_str = parts[0].strip('()')
            loc = [int(x) for x in loc_str.split(':')]
            s, a, w, seg = loc[0], loc[1], loc[2], loc[3]
            form = parts[1] if len(parts) > 1 else ''
            tag = parts[2] if len(parts) > 2 else ''
            features = parts[3].split('|') if len(parts) > 3 else []
            
            word_key = (s, a, w)
            word_segments[word_key].append({
                'seg': seg,
                'form': form,
                'tag': tag,
                'features': features
            })

    total_words = len(word_segments)
    print(f"Extracted {total_words} words across 6236 ayahs.")

    processed_words = []
    roots_dict = defaultdict(lambda: {
        'count': 0,
        'derivatives': Counter(),
        'lemmas': Counter(),
        'vezin_dist': Counter(),
        'occurrences': []
    })

    for (s, a, w), segs in sorted(word_segments.items()):
        # Find stem segment
        stem = None
        for seg in segs:
            if 'STEM' in seg['features']:
                stem = seg
                break
        if not stem:
            stem = segs[0]

        root_bw = None
        lemma = None
        pos = stem['tag']
        verb_form = None
        extra_feats = []

        for f in stem['features']:
            if f.startswith('ROOT:'):
                root_bw = f.split(':')[1].strip()
            elif f.startswith('LEM:'):
                lemma = f.split(':')[1].strip()
            elif f.startswith('POS:'):
                pos = f.split(':')[1].strip()
            elif f.startswith('(') and f.endswith(')'):
                verb_form = f
            elif f in ['ACT', 'PASS', 'PCPL', 'VN']:
                extra_feats.append(f)

        vezin = get_vezin(pos, verb_form, extra_feats)

        # Get authentic Uthmani word text
        u_list = uthmani_words.get((s, a), [])
        if w - 1 < len(u_list):
            metin_ar = u_list[w - 1]
        else:
            metin_ar = stem['form']

        kok_ar = bw_to_ar_root(root_bw) if root_bw else None
        kok_tr = PREDEFINED_ROOTS[kok_ar]['kok_tr'] if (kok_ar and kok_ar in PREDEFINED_ROOTS) else (ar_root_to_tr(kok_ar) if kok_ar else None)

        word_obj = {
            'sure_id': s,
            'ayet_no': a,
            'kelime_no': w,
            'metin_ar': metin_ar,
            'kok_ar': kok_ar,
            'kok_tr': kok_tr,
            'lemma': lemma,
            'pos': pos,
            'vezin': vezin,
            'features': extra_feats
        }
        processed_words.append(word_obj)

        if kok_ar:
            roots_dict[kok_ar]['count'] += 1
            roots_dict[kok_ar]['derivatives'][metin_ar] += 1
            if lemma:
                roots_dict[kok_ar]['lemmas'][lemma] += 1
            roots_dict[kok_ar]['vezin_dist'][vezin] += 1
            if len(roots_dict[kok_ar]['occurrences']) < 10:
                roots_dict[kok_ar]['occurrences'].append(f"{s}:{a}:{w}")

    print(f"Total unique roots found: {len(roots_dict)}")

    # Build lexicon_roots.json (DP-011)
    lexicon_roots = []
    for kok_ar, rdata in sorted(roots_dict.items(), key=lambda x: x[1]['count'], reverse=True):
        # Determine root meaning & Turkish transliteration
        if kok_ar in PREDEFINED_ROOTS:
            kok_tr = PREDEFINED_ROOTS[kok_ar]['kok_tr']
            anlam = PREDEFINED_ROOTS[kok_ar]['anlam']
        elif kok_ar in COMMON_ROOT_MEANINGS:
            kok_tr = COMMON_ROOT_MEANINGS[kok_ar]['kok_tr']
            anlam = COMMON_ROOT_MEANINGS[kok_ar]['anlam']
        elif kok_ar in lane_lexicon and lane_lexicon[kok_ar]:
            kok_tr = ar_root_to_tr(kok_ar)
            raw_lane = lane_lexicon[kok_ar].replace('\n', ' ').strip()
            clauses = [c.strip() for c in re.split(r'[.;]', raw_lane) if c.strip()]
            anlam = '; '.join(clauses[:3]) if clauses else raw_lane[:120]
        else:
            kok_tr = ar_root_to_tr(kok_ar)
            anlam = f"Kök: {kok_ar} ({kok_tr})"

        # Build derivative list
        turev_list = []
        for deriv_word, cnt in rdata['derivatives'].most_common(20):
            turev_list.append({
                'kelime_ar': deriv_word,
                'gecis_sayisi': cnt
            })

        lexicon_roots.append({
            'kok_ar': kok_ar,
            'kok_tr': kok_tr,
            'anlam_ozeti': anlam,
            'toplam_frekans': rdata['count'],
            'turev_kelimeler': turev_list
        })

    # Save lexicon_roots.json
    lexicon_file = os.path.join(output_dir, "lexicon_roots.json")
    with open(lexicon_file, 'w', encoding='utf-8') as f:
        json.dump(lexicon_roots, f, ensure_ascii=False, indent=2)
    print(f"✓ Saved DP-011 Lexicon Matrix ({len(lexicon_roots)} roots) to {lexicon_file}")

    # Save quran_words_morphology.json
    words_file = os.path.join(output_dir, "quran_words_morphology.json")
    with open(words_file, 'w', encoding='utf-8') as f:
        json.dump(processed_words, f, ensure_ascii=False, indent=2)
    print(f"✓ Saved DP-010 Morphology Words ({len(processed_words)} words) to {words_file}")

    # Print summary
    print("\n--- Summary Statistics ---")
    print(f"Total Words Processed : {len(processed_words)}")
    words_with_root = sum(1 for w in processed_words if w['kok_ar'])
    print(f"Words with Roots      : {words_with_root} ({words_with_root/len(processed_words)*100:.1f}%)")
    print(f"Unique Roots          : {len(lexicon_roots)}")
    print("Top 5 Roots by Frequency:")
    for r in lexicon_roots[:5]:
        print(f"  {r['kok_ar']} ({r['kok_tr']}): {r['toplam_frekans']} occurrences, {len(r['turev_kelimeler'])} derivative forms")

if __name__ == "__main__":
    main()
