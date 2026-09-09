def test_promo_toggle():
    for html_path in ["index.html", "public/index.html"]:
        with open(html_path, "r", encoding="utf-8") as f:
            c = f.read()
        assert 'id="btnOpenPromoVideoNav"' in c, f"Missing btnOpenPromoVideoNav in {html_path}"
        assert 'id="btnTogglePromoVideo"' in c, f"Missing btnTogglePromoVideo in {html_path}"
        assert 'id="badgePromoStatus"' in c, f"Missing badgePromoStatus in {html_path}"
        print(f"✅ HTML elements verified in {html_path}")

    for js_path in ["js/app.js", "public/js/app.js"]:
        with open(js_path, "r", encoding="utf-8") as f:
            c = f.read()
        assert 'isPromoVideoEnabled' in c, f"Missing isPromoVideoEnabled in {js_path}"
        assert 'togglePromoVideoMaster' in c, f"Missing togglePromoVideoMaster in {js_path}"
        assert 'updatePromoVideoUI' in c, f"Missing updatePromoVideoUI in {js_path}"
        print(f"✅ JS methods verified in {js_path}")

test_promo_toggle()
print("\nALL PROMO VIDEO TOGGLE VERIFICATIONS PASSED SUCCESSFULLY!")
