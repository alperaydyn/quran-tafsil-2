-- ==============================================================================
-- tafsil.net — Phase 7: Kavram Geçmişi Log Tablosu ve Ezber Oturumu Başlıkları
-- ==============================================================================

-- 1. Kavram Geçmişi (Concept History Log) Tablosu
CREATE TABLE IF NOT EXISTS kavram_gecmisi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kullanici_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    kavram_id INT REFERENCES kavramlar(id) ON DELETE SET NULL,
    kavram_slug VARCHAR(64) NOT NULL,
    kavram_adi VARCHAR(128) NOT NULL,
    incelenme_suresi_sn INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kavram_gecmisi_user ON kavram_gecmisi(kullanici_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kavram_gecmisi_slug ON kavram_gecmisi(kavram_slug);

-- 2. Ezber Oturumları Tablosuna İsim/Başlık Kolonu Ekleme
ALTER TABLE ezber_oturumlari ADD COLUMN IF NOT EXISTS baslik VARCHAR(128);

-- 3. Örnek Kullanıcı için Zengin Okuma ve Çalışma Geçmişi Tohumu
DO $$
DECLARE
    sample_user_id UUID;
    v_rabb_id INT;
    v_hamd_id INT;
    v_rahmet_id INT;
BEGIN
    SELECT id INTO sample_user_id FROM kullanicilar LIMIT 1;
    IF sample_user_id IS NOT NULL THEN
        SELECT id INTO v_rabb_id FROM kavramlar WHERE slug = 'rabb' LIMIT 1;
        SELECT id INTO v_hamd_id FROM kavramlar WHERE slug = 'hamd' LIMIT 1;
        SELECT id INTO v_rahmet_id FROM kavramlar WHERE slug = 'rahmet' LIMIT 1;

        -- Gün 1: Bugün (Fatiha 1-7, Bakara 12-25, 45-67, Kavram: Rab, Ezber Oturumu)
        INSERT INTO okuma_gecmisi (kullanici_id, sure_id, ayet_no, okunma_suresi_sn, okundu_tarihi)
        SELECT sample_user_id, 1, s, 25, NOW() - interval '2 hours'
        FROM generate_series(1, 7) s
        ON CONFLICT DO NOTHING;

        INSERT INTO okuma_gecmisi (kullanici_id, sure_id, ayet_no, okunma_suresi_sn, okundu_tarihi)
        SELECT sample_user_id, 2, s, 30, NOW() - interval '4 hours'
        FROM generate_series(12, 25) s
        ON CONFLICT DO NOTHING;

        INSERT INTO okuma_gecmisi (kullanici_id, sure_id, ayet_no, okunma_suresi_sn, okundu_tarihi)
        SELECT sample_user_id, 2, s, 35, NOW() - interval '3 hours'
        FROM generate_series(45, 67) s
        ON CONFLICT DO NOTHING;

        INSERT INTO kavram_gecmisi (kullanici_id, kavram_id, kavram_slug, kavram_adi, incelenme_suresi_sn, created_at)
        VALUES 
            (sample_user_id, v_rabb_id, 'rabb', 'Rab', 120, NOW() - interval '1 hour'),
            (sample_user_id, v_hamd_id, 'hamd', 'Hamd', 90, NOW() - interval '5 hours');

        INSERT INTO ezber_oturumlari (kullanici_id, sure_id, baslangic_ayet, bitis_ayet, durum, baslik, created_at)
        VALUES 
            (sample_user_id, 1, 1, 7, 'pekistirildi', 'Fatiha (1-7) Ezber Oturumu', NOW() - interval '30 minutes')
        ON CONFLICT DO NOTHING;

        -- Gün 2: Dün (Alak 1-5, Kavram: Rahmet)
        INSERT INTO okuma_gecmisi (kullanici_id, sure_id, ayet_no, okunma_suresi_sn, okundu_tarihi)
        SELECT sample_user_id, 96, s, 40, NOW() - interval '1 day' - interval '3 hours'
        FROM generate_series(1, 5) s
        ON CONFLICT DO NOTHING;

        INSERT INTO kavram_gecmisi (kullanici_id, kavram_id, kavram_slug, kavram_adi, incelenme_suresi_sn, created_at)
        VALUES 
            (sample_user_id, v_rahmet_id, 'rahmet', 'Rahmet', 150, NOW() - interval '1 day' - interval '2 hours');

        INSERT INTO ezber_oturumlari (kullanici_id, sure_id, baslangic_ayet, bitis_ayet, durum, baslik, created_at)
        VALUES 
            (sample_user_id, 96, 1, 5, 'ogreniliyor', 'İlk Vahiy (Alak 1-5) Ezber Oturumu', NOW() - interval '1 day' - interval '1 hour')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
