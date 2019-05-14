import wikiPage from '../third_party/wikipage'
import han from '../third_party/han.js'

export default async function getEntry(engTitle) {
    const page = wikiPage(engTitle);
    const lang = await page.lang("zh");
    const pinyin = han(lang.title).map(ch => ch[0]).join(" ");

    return {
        origin: page.getTitle(),
        title: lang.title,
        subtitle: pinyin,
        img: "https://logo.clearbit.com/"+engTitle+".com?size=200"
    };

    // throw new Error("...");
}