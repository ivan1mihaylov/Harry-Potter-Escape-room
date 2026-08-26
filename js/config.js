/* ============================================================
   config.js — външни изображения (Wikimedia Commons, свободни
   лицензи). Всяко има CSS резервен вариант, ако не се зареди.
   ============================================================ */
const C = 'https://upload.wikimedia.org/wikipedia/commons';

export const IMG = {
  stoneWall:  `${C}/thumb/6/66/Old_stone_brick_wall.jpg/1920px-Old_stone_brick_wall.jpg`,
  oldWall:    `${C}/thumb/8/84/Old_wall_texture.jpg/1920px-Old_wall_texture.jpg`,
  castle:     `${C}/thumb/b/b6/L%C3%BCdinghausen%2C_Burg_Vischering_--_2014_--_5492.jpg/1920px-L%C3%BCdinghausen%2C_Burg_Vischering_--_2014_--_5492.jpg`,
  library:    `${C}/thumb/5/5a/Dublin_Old_Library_Trinity_College_05.jpg/1920px-Dublin_Old_Library_Trinity_College_05.jpg`,
  library2:   `${C}/thumb/e/e0/Old_Library_at_Trinity_College_Dublin.jpg/1920px-Old_Library_at_Trinity_College_Dublin.jpg`,
  candles:    `${C}/thumb/7/7d/Lighted_candles_on_dark_background_13.jpg/1920px-Lighted_candles_on_dark_background_13.jpg`,
  candles2:   `${C}/thumb/b/b5/Lighted_candles_on_dark_background_16.jpg/1920px-Lighted_candles_on_dark_background_16.jpg`,
  gold:       `${C}/thumb/5/5c/Golden_treasure_of_Kosice%2C_detail_of_the_exposition.jpg/1920px-Golden_treasure_of_Kosice%2C_detail_of_the_exposition.jpg`,
  gold2:      `${C}/thumb/f/f5/Coins_from_Hungary_in_the_Golden_treasure_of_Kosice.jpg/1920px-Coins_from_Hungary_in_the_Golden_treasure_of_Kosice.jpg`,
  mirror:     `${C}/thumb/5/5a/Golden_mirror_%28France%29.jpg/1920px-Golden_mirror_%28France%29.jpg`,
  snake:      `${C}/thumb/3/35/Snake_Eye_-_Flickr_-_Care_SMC.jpg/1920px-Snake_Eye_-_Flickr_-_Care_SMC.jpg`,
  snake2:     `${C}/thumb/7/77/A_green_snake_coiling_a_leaf_%28Unsplash%29.jpg/1920px-A_green_snake_coiling_a_leaf_%28Unsplash%29.jpg`,
  nightSky:   `${C}/thumb/f/f0/Night_Sky_Stars_Trees_02.jpg/1920px-Night_Sky_Stars_Trees_02.jpg`,
  nightSky2:  `${C}/thumb/b/b4/ALMA_and_a_Starry_Night.jpg/1920px-ALMA_and_a_Starry_Night.jpg`,
};

/* фонова снимка с меко избледняване; ако линкът умре — нищо не се чупи */
export function photo(url, opacity = 0.16) {
  return `<img class="bg-photo" src="${url}" alt="" loading="lazy" decoding="async"
     style="opacity:0;transition:opacity 1.2s"
     onload="this.style.opacity='${opacity}'" onerror="this.remove()">`;
}
