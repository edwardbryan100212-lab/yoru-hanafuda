# Yoru Hanafuda (夜の花札)

Koi-Koi hanafuda for two players in the browser. Play the computer, or open a room and send a friend the 4-letter code.

- Traditional card art with month kanji labels and hover names in Japanese and English
- Full Koi-Koi rules: brights, animals, ribbons, plains; 五光, 四光, 雨四光, 三光, 花見酒, 月見酒, 猪鹿蝶, 赤短, 青短, タネ, 短冊, カス
- こいこい / 勝負 choice, doubling for 7+ points and for the other player's koi-koi, teshi and kuttsuki
- 3, 6 or 12 month games, match hints, yaku-in-reach panel, quick Japanese phrases
- Online play is peer to peer (WebRTC via the free PeerJS broker). The host's browser runs the game.

No build step. Serve the folder with any static server, for example:

    python3 -m http.server 8000

## Credits

Card art: the traditional-colour (red border) hanafuda set by Louie Mantia on Wikimedia Commons, licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Colours were softened and reds lightened by `tools/soften.py`; the changed card files in `cards/` are shared under the same licence.
