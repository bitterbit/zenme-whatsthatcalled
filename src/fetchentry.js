import wikiPage from '../third_party/wikipage'
import han from '../third_party/han.js'

export default async function getEntry(engTitle) {
    const page = wikiPage(engTitle);
    const lang = await page.lang("zh");
    const images = await page.images();
    const pinyin = han(lang.title).map(ch => ch[0]).join(" ");

    return {
        title: lang.title,
        subtitle: pinyin,
        img: images[0]
    };

    // throw new Error("...");
}