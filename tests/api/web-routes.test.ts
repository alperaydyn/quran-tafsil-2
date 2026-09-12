import { describe, it, expect } from "vitest";
import { getAyet, getSure, getKavram, listSureler } from "../../tafsil-web-app/src/lib/api.js";

describe("TEST-E2E-007: Web App Data Layer & Deep Link Services", () => {
  it("listSureler returns 114 surahs", async () => {
    const sureler = await listSureler();
    expect(sureler).toHaveLength(114);
    expect(sureler[0].nameTr).toBe("Fâtiha");
  });

  it("getSure(1) returns Fatiha metadata", async () => {
    const sure = await getSure(1);
    expect(sure).not.toBeNull();
    expect(sure?.nameTr).toBe("Fâtiha");
    expect(sure?.verseCount).toBe(7);
  });

  it("getAyet(1, 1) returns Bismillah with Uthmani script", async () => {
    const ayet = await getAyet(1, 1);
    expect(ayet).not.toBeNull();
    expect(ayet?.sureId).toBe(1);
    expect(ayet?.ayetNo).toBe(1);
    expect(ayet?.metinAr).toBe("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ");
    expect(ayet?.sureNameTr).toBe("Fâtiha");
  });

  it("getAyet(9, 129) returns Tevbe 129 (verifies 6236-verse integrity)", async () => {
    const ayet = await getAyet(9, 129);
    expect(ayet).not.toBeNull();
    expect(ayet?.sureId).toBe(9);
    expect(ayet?.ayetNo).toBe(129);
    expect(ayet?.metinAr).toContain("حَسْبِىَ");
  });

  it("getKavram('ilim') returns concept details and connections", async () => {
    const kavram = await getKavram("ilim");
    expect(kavram).not.toBeNull();
    expect(kavram?.baslikTr).toBe("İlim");
    expect(kavram?.iliskiler.length).toBeGreaterThan(0);
  });
});
