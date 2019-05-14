import wikiPage from '../third_party/wikipage'
import han from '../third_party/han.js'

export default async function getEntry(engTitle) {
    let page, lang;
    try {
        page = wikiPage(engTitle);
    } catch {
        throw new Error("Could not find page \"" + engTitle + "\"");
    }
    
    try {
        lang = await page.lang("zh");
    } catch {
        throw new Error("Page \""+engTitle + "\" has no translation to chinese");
    }
    
    const pinyin = han(lang.title).map(ch => ch[0]).join(" ");

    return {
        origin: page.getTitle(),
        title: lang.title,
        subtitle: pinyin,
        img: "https://logo.clearbit.com/"+engTitle+".com?size=200"
    };

    // throw new Error("...");
}